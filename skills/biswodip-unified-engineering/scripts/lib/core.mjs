// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Integration engine: detect → install (clone every upstream repo, install skills, tools) → verify.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PKG_ROOT, IS_WIN, c, log, table, paintStatus, which, run, sleepMs, exists, isDir, readJSON, writeJSON,
  sha256File, hashDir, copyDir, timestamp, readFrontmatter, normalizeRemote, expandHome,
} from './common.mjs';

export const MANIFEST_PATH = path.join(PKG_ROOT, 'integrations', 'manifest.json');
export const SNAPSHOT_ROOT = path.join(PKG_ROOT, 'upstream');
export const SELF_SKILL_NAME = 'biswodip-unified-engineering';
const PROVENANCE = '.biswodip-source.json';
export const TEMPLATES_ROOT = path.join(PKG_ROOT, 'templates', 'claude');
const UPSTREAM_LICENSE = 'UPSTREAM-LICENSE';
const UPSTREAM_NOTICE = 'UPSTREAM-NOTICE';

export function loadManifest() {
  const m = readJSON(MANIFEST_PATH);
  if (!Array.isArray(m.integrations) || !m.integrations.length) throw new Error(`Invalid manifest: ${MANIFEST_PATH}`);
  return m;
}
export function pkgVersion() { return readJSON(path.join(PKG_ROOT, 'package.json'), {}).version || '0.0.0'; }

export function paths(root) {
  const base = path.join(root, '.biswodip');
  return {
    base, upstream: path.join(base, 'upstream'), cache: path.join(base, 'cache'),
    evidence: path.join(base, 'evidence'), lock: path.join(base, 'integrations.lock.json'),
    commandLog: path.join(base, 'evidence', 'commands.log'),
  };
}

export function selectIntegrations(manifest, only) {
  if (!only || !only.length) return manifest.integrations;
  const ids = new Set(only.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean));
  const unknown = [...ids].filter((id) => !manifest.integrations.some((i) => i.id === id));
  if (unknown.length) throw new Error(`Unknown integration id(s): ${unknown.join(', ')}. Known: ${manifest.integrations.map((i) => i.id).join(', ')}`);
  return manifest.integrations.filter((i) => ids.has(i.id));
}

// ---------------------------------------------------------------- git helpers
export function gitInfo(dir) {
  if (!exists(path.join(dir, '.git'))) return null;
  const g = (...a) => run('git', ['-C', dir, ...a], { timeout: 30000 });
  const remote = g('remote', 'get-url', 'origin');
  const head = g('rev-parse', 'HEAD');
  const dirty = g('status', '--porcelain');
  return {
    remote: remote.code === 0 ? remote.stdout.trim() : '',
    commit: head.code === 0 ? head.stdout.trim() : '',
    dirty: dirty.code === 0 && dirty.stdout.trim().length > 0,
  };
}
function gitAvailable() { return Boolean(which('git')); }

function retry(label, attempts, fn) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    last = fn(i);
    if (last.code === 0) return last;
    const wait = Math.min(2000 * 2 ** (i - 1), 15000);
    if (i < attempts) { log.warn(`${label}: attempt ${i}/${attempts} failed (${firstLine(last.stderr)}); retrying in ${wait / 1000}s`); sleepMs(wait); }
  }
  return last;
}
const firstLine = (s) => String(s || '').trim().split('\n').pop()?.slice(0, 160) || 'no output';

// ---------------------------------------------------------------- skill discovery
export function skillDirs(root, { agent = 'claude-code', global = false, manifest }) {
  const m = manifest || loadManifest();
  const target = m.agentSkillDirs[agent];
  if (!target) throw new Error(`Unknown agent "${agent}". Known: ${Object.keys(m.agentSkillDirs).join(', ')}`);
  const resolveDir = (d, isGlobal) => (isGlobal ? expandHome(d) : path.join(root, d));
  const install = resolveDir(global ? target.global : target.project, global);
  const search = [];
  for (const [name, d] of Object.entries(m.agentSkillDirs)) {
    search.push({ agent: name, scope: 'project', dir: resolveDir(d.project, false) });
    search.push({ agent: name, scope: 'global', dir: resolveDir(d.global, true) });
  }
  return { install, search };
}

// Map skill name → [{path, agent, scope}] across every known agent skill directory.
export function indexInstalledSkills(searchDirs) {
  const idx = new Map();
  const seen = new Set();
  for (const s of searchDirs) {
    if (!isDir(s.dir)) continue;
    let real; try { real = fs.realpathSync(s.dir); } catch { continue; }
    if (seen.has(real)) continue; seen.add(real);
    for (const e of fs.readdirSync(s.dir, { withFileTypes: true })) {
      if (!e.isDirectory() && !e.isSymbolicLink()) continue;
      const p = path.join(s.dir, e.name);
      const fm = readFrontmatter(path.join(p, 'SKILL.md'));
      if (!fm) continue;
      const name = fm.name || e.name;
      if (!idx.has(name)) idx.set(name, []);
      idx.get(name).push({ path: p, agent: s.agent, scope: s.scope });
    }
  }
  return idx;
}

// Skills physically present in an upstream checkout: [{name, dir}]
export function upstreamSkills(checkout, skillsRoot) {
  if (!skillsRoot) return [];
  const base = path.join(checkout, skillsRoot);
  if (!isDir(base)) return [];
  const out = [];
  for (const e of fs.readdirSync(base, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const fm = readFrontmatter(path.join(base, e.name, 'SKILL.md'));
    if (fm) out.push({ name: fm.name || e.name, dir: path.join(base, e.name) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function selfSkillSource() {
  const a = path.join(PKG_ROOT, 'skills', SELF_SKILL_NAME);
  if (exists(path.join(a, 'SKILL.md'))) return a;
  if (readFrontmatter(path.join(PKG_ROOT, 'SKILL.md'))?.name === SELF_SKILL_NAME) return PKG_ROOT; // running from an installed skill folder
  return null;
}

/** Every Biswodip skill shipped by this package: [{name, dir}]. */
export function ownSkills() {
  const base = path.join(PKG_ROOT, 'skills');
  if (isDir(base)) {
    const found = [];
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const fm = readFrontmatter(path.join(base, e.name, 'SKILL.md'));
      if (fm?.name) found.push({ name: fm.name, dir: path.join(base, e.name) });
    }
    if (found.length) return found.sort((a, b) => a.name.localeCompare(b.name));
  }
  const self = selfSkillSource();
  return self ? [{ name: readFrontmatter(path.join(self, 'SKILL.md'))?.name || SELF_SKILL_NAME, dir: self }] : [];
}

/**
 * Install the /dip slash commands and the @dip agent into a project (or the user-level dirs).
 * These are what make `/dip`, `/dip:security` … and `@dip` work in any repository.
 */
export function installCommands(root, { global = false, dry = false, update = false, force = false } = {}) {
  const base = global ? expandHome('~/.claude') : path.join(root, '.claude');
  const out = [];
  if (!isDir(TEMPLATES_ROOT)) return out;
  for (const rel of walkFiles(TEMPLATES_ROOT)) {
    const src = path.join(TEMPLATES_ROOT, rel);
    const dst = path.join(base, rel);
    const kind = rel.startsWith('commands') ? (rel.includes('/dip/') ? `/dip:${path.basename(rel, '.md')}` : `/${path.basename(rel, '.md')}`) : `@${path.basename(rel, '.md')}`;
    if (exists(dst)) {
      const same = fs.readFileSync(dst, 'utf8') === fs.readFileSync(src, 'utf8');
      if (same) { out.push({ kind, path: dst, status: 'PRESENT', action: 'identical' }); continue; }
      if (!update && !force) { out.push({ kind, path: dst, status: 'DIFFERS', action: 'kept your version (use --update to replace)' }); continue; }
      if (!dry) fs.renameSync(dst, `${dst}.bak-${timestamp()}`);
    }
    if (dry) { out.push({ kind, path: dst, status: 'DRY', action: 'would install' }); continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    out.push({ kind, path: dst, status: 'INSTALLED', action: 'copied' });
  }
  return out.sort((a, b) => a.kind.localeCompare(b.kind));
}
function walkFiles(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walkFiles(path.join(dir, e.name), r));
    else if (e.isFile()) out.push(r);
  }
  return out;
}

function toolInfo(tool) {
  if (!tool) return null;
  const p = which(tool.command);
  if (!p) return { command: tool.command, found: false };
  const v = run(tool.command, tool.versionArgs || ['--version'], { timeout: 30000 });
  return { command: tool.command, found: true, path: p, version: v.code === 0 ? firstLine(v.stdout || v.stderr) : 'unknown' };
}
export function dockerInfo() {
  if (!which('docker')) return { found: false, running: false };
  const r = run('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 20000 });
  return { found: true, running: r.code === 0, version: r.code === 0 ? r.stdout.trim() : null };
}
function npmDeclared(root, pkg) {
  const pj = readJSON(path.join(root, 'package.json'), null);
  if (!pj) return null;
  return Boolean(pj.dependencies?.[pkg] || pj.devDependencies?.[pkg] || pj.optionalDependencies?.[pkg]);
}

// ---------------------------------------------------------------- DETECT
export function detect(opts) {
  const root = path.resolve(opts.root || '.');
  const manifest = loadManifest();
  const P = paths(root);
  const dirs = skillDirs(root, { agent: opts.agent, global: opts.global, manifest });
  const idx = indexInstalledSkills(dirs.search);
  const lock = readJSON(P.lock, null);
  const records = selectIntegrations(manifest, opts.only).map((it) => {
    const clonePath = path.join(P.upstream, it.dir);
    const gi = gitInfo(clonePath);
    let clone = 'MISSING';
    if (gi) clone = normalizeRemote(gi.remote) === normalizeRemote(it.repo) ? 'PRESENT' : 'CONFLICT';
    else if (exists(path.join(clonePath, PROVENANCE))) clone = 'SNAPSHOT';
    else if (isDir(clonePath)) clone = 'CONFLICT';
    const skills = it.skills.map((s) => ({ name: s, locations: (idx.get(s) || []).map((l) => l.path) }));
    return {
      id: it.id, name: it.name, repo: it.repo,
      clone: { status: clone, path: clonePath, commit: gi?.commit || readJSON(path.join(clonePath, PROVENANCE), {}).commit || null, dirty: gi?.dirty || false },
      snapshot: { available: isDir(path.join(SNAPSHOT_ROOT, it.dir)), commit: it.snapshot?.commit || null },
      skills: { expected: it.skills.length, installed: skills.filter((s) => s.locations.length).length, missing: skills.filter((s) => !s.locations.length).map((s) => s.name), detail: skills },
      tool: toolInfo(it.tool),
      npm: it.tool?.npmPackage ? { package: it.tool.npmPackage, declared: npmDeclared(root, it.tool.npmPackage) } : null,
      lock: lock?.integrations?.find((x) => x.id === it.id) || null,
    };
  });
  const self = { name: SELF_SKILL_NAME, locations: (idx.get(SELF_SKILL_NAME) || []).map((l) => l.path) };
  const env = {
    node: process.versions.node, platform: `${process.platform}-${process.arch}`,
    git: Boolean(which('git')), npx: Boolean(which('npx')), python: Boolean(which('python3') || which('python')),
    uv: Boolean(which('uv')), pipx: Boolean(which('pipx')), docker: dockerInfo(),
    STRIX_LLM: process.env.STRIX_LLM ? 'set' : 'missing', LLM_API_KEY: process.env.LLM_API_KEY ? 'set' : 'missing',
  };
  return { root, installDir: dirs.install, records, self, env, lockFound: Boolean(lock) };
}

export function printDetect(d) {
  log.title(`Integration detection — ${d.root}`);
  table(['INTEGRATION', 'CLONE', 'COMMIT', 'SKILLS', 'TOOL', 'SNAPSHOT'], d.records.map((r) => [
    r.name, paintStatus(r.clone.status), (r.clone.commit || '').slice(0, 12) || '—',
    r.skills.expected ? paintStatus(`${r.skills.installed === r.skills.expected ? 'PRESENT' : r.skills.installed ? 'PARTIAL' : 'MISSING'} ${r.skills.installed}/${r.skills.expected}`) : c.gray('n/a'),
    r.tool ? (r.tool.found ? paintStatus(`PRESENT ${r.tool.version}`) : paintStatus('MISSING')) : c.gray('n/a'),
    r.snapshot.available ? c.green('bundled') : c.gray('none'),
  ]));
  log.raw('');
  log.info(`Biswodip skill: ${d.self.locations.length ? d.self.locations.join(', ') : 'not installed'}`);
  log.info(`Skill install dir: ${d.installDir}`);
  const e = d.env;
  log.info(`node ${e.node} · git ${e.git ? 'yes' : 'NO'} · npx ${e.npx ? 'yes' : 'no'} · uv ${e.uv ? 'yes' : 'no'} · pipx ${e.pipx ? 'yes' : 'no'} · docker ${e.docker.running ? 'running' : e.docker.found ? 'installed, not running' : 'no'}`);
  log.info(`STRIX_LLM ${e.STRIX_LLM} · LLM_API_KEY ${e.LLM_API_KEY} (values never printed)`);
}

// ---------------------------------------------------------------- INSTALL
export function install(opts) {
  const root = path.resolve(opts.root || '.');
  if (!isDir(root)) throw new Error(`Root does not exist: ${root}`);
  const manifest = loadManifest();
  const P = paths(root);
  const dry = Boolean(opts.dryRun);
  const retries = Math.max(1, Number(opts.retries || 3));
  const selected = selectIntegrations(manifest, opts.only);
  const dirs = skillDirs(root, { agent: opts.agent || 'claude-code', global: opts.global, manifest });
  const snapshotRoot = opts.fromSnapshot ? path.resolve(opts.fromSnapshot) : SNAPSHOT_ROOT;
  const offline = Boolean(opts.offline);
  if (!offline && !gitAvailable()) log.warn('git is not on PATH — falling back to bundled snapshots where available.');

  log.title(`Biswodip Goj Unified Engineering v${pkgVersion()} — install${dry ? ' (dry run)' : ''}`);
  log.info(`target: ${root}`);
  log.info(`upstream clones: ${P.upstream}`);
  log.info(`agent skills: ${dirs.install}`);

  if (!dry) {
    fs.mkdirSync(P.upstream, { recursive: true });
    fs.mkdirSync(P.evidence, { recursive: true });
    const gi = path.join(P.base, '.gitignore');
    if (!exists(gi)) fs.writeFileSync(gi, '# Managed by Biswodip Goj Unified Engineering\nupstream/\ncache/\nevidence/strix_runs/\n*.tmp-*\n');
  }

  const records = [];
  for (const it of selected) {
    log.step(c.bold(it.name));
    const rec = { id: it.id, name: it.name, repo: it.repo, license: it.license, required: it.required !== false, actions: [], status: 'PENDING' };
    const dest = path.join(P.upstream, it.dir);
    const cl = ensureClone(it, dest, { ...opts, dry, offline, retries, snapshotRoot, logFile: P.commandLog });
    Object.assign(rec, { location: dest, source: cl.source, commit: cl.commit, cloneStatus: cl.status });
    rec.actions.push(cl.action);
    if (!dry && ['CLONED', 'PRESENT', 'UPDATED', 'PINNED', 'SNAPSHOT'].includes(cl.status)) {
      const v = verifyCheckout(it, dest);
      rec.licenseSha256 = v.licenseSha256; rec.noticeSha256 = v.noticeSha256;
      if (!v.ok) { rec.cloneStatus = 'INVALID'; rec.actions.push(`verification failed: missing ${v.missing.join(', ')}`); }
    }
    rec.version = it.snapshot?.version && cl.commit === it.snapshot.commit ? `${it.snapshot.version} @ ${String(cl.commit).slice(0, 12)}` : (cl.commit ? String(cl.commit).slice(0, 12) : '—');

    // skills
    rec.skills = [];
    if (it.skillsRoot && opts.skills !== false && ['CLONED', 'PRESENT', 'UPDATED', 'PINNED', 'SNAPSHOT'].includes(rec.cloneStatus)) {
      rec.skills = installSkills(it, dest, dirs, { ...opts, dry, commit: cl.commit });
      const n = rec.skills.filter((s) => ['INSTALLED', 'PRESENT', 'UPDATED'].includes(s.status)).length;
      rec.actions.push(`skills ${n}/${rec.skills.length} available in ${dirs.install}`);
      if (opts.useSkillsCli && !dry) rec.actions.push(runSkillsCli(it, opts, P.commandLog));
    } else if (it.skillsRoot && opts.skills === false) rec.actions.push('skills skipped (--no-skills)');
    else if (dry && it.skillsRoot) rec.actions.push('would install skills');

    // tools
    if (it.tool) {
      rec.tool = toolInfo(it.tool);
      if (!rec.tool.found && opts.withTools && !dry) { rec.actions.push(installTool(it, P, opts)); rec.tool = toolInfo(it.tool); }
      else if (!rec.tool.found) rec.actions.push(`${it.tool.command} CLI not installed — run with --with-tools or: ${it.upstreamInstall[0]}`);
      else rec.actions.push(`${it.tool.command} present (${rec.tool.version})`);
      if (it.tool.requiresDocker) { rec.docker = dockerInfo(); if (!rec.docker.running) rec.actions.push('Docker not running — Strix scans BLOCKED until it is'); }
      if (it.tool.npmPackage) {
        const declared = npmDeclared(root, it.tool.npmPackage);
        if (opts.withHeadroomSdk && declared === false && !dry) {
          const r = run(IS_WIN ? 'npm.cmd' : 'npm', ['install', it.tool.npmPackage], { cwd: root, logFile: P.commandLog, timeout: 300000 });
          rec.actions.push(r.code === 0 ? `npm install ${it.tool.npmPackage}: ok` : `npm install ${it.tool.npmPackage}: FAILED (${firstLine(r.stderr)})`);
        } else if (declared) rec.actions.push(`${it.tool.npmPackage} already declared in package.json`);
      }
    }

    rec.status = rec.cloneStatus;
    records.push(rec);
    log.info(`${paintStatus(rec.status)} · ${rec.source || '—'} · ${rec.version}`);
  }

  // The Biswodip skills themselves (router + the phase skills)
  let self = null;
  if (opts.selfSkill !== false && opts.skills !== false) {
    const own = ownSkills();
    if (!own.length) self = [{ name: SELF_SKILL_NAME, status: 'MISSING', note: 'skill source not found in package' }];
    else {
      self = own.map((s) => installOneSkill(s, dirs, { ...opts, dry, provenance: { integration: 'biswodip', version: pkgVersion(), source: path.relative(PKG_ROOT, s.dir) || '.' } }));
      const n = self.filter((s) => ['INSTALLED', 'PRESENT', 'UPDATED', 'DRY'].includes(s.status)).length;
      log.info(`Biswodip skills: ${n}/${self.length} available in ${dirs.install}`);
    }
  }

  // /dip slash commands and the @dip agent
  let commands = [];
  if (opts.commands !== false) {
    commands = installCommands(root, { global: opts.global, dry, update: opts.update, force: opts.force });
    const n = commands.filter((x) => ['INSTALLED', 'PRESENT', 'DRY'].includes(x.status)).length;
    if (commands.length) log.info(`Commands: ${n}/${commands.length} available — ${commands.map((x) => x.kind).join(' ')}`);
  }

  const lock = {
    $comment: 'Generated by Biswodip Goj Unified Engineering. Records INTEGRATION | STATUS | VERSION | SOURCE | LOCATION | ACTION TAKEN.',
    generatedAt: new Date().toISOString(), package: { name: 'biswodip-goj-unified-engineering', version: pkgVersion(), root: PKG_ROOT },
    host: { platform: `${process.platform}-${process.arch}`, node: process.versions.node, user: os.userInfo().username },
    options: { agent: opts.agent || 'claude-code', global: Boolean(opts.global), pinned: Boolean(opts.pinned), offline, update: Boolean(opts.update) },
    skillInstallDir: dirs.install, selfSkill: self, commands, integrations: records,
  };
  if (!dry) writeJSON(P.lock, lock);

  log.title('INTEGRATION RECORD');
  table(['INTEGRATION', 'STATUS', 'VERSION', 'SOURCE', 'LOCATION', 'ACTION TAKEN'], records.map((r) => [
    r.name, paintStatus(r.status), r.version, r.source || '—', path.relative(root, r.location) || '.', r.actions[0] || '',
  ]));
  for (const s of self || []) log.info(`  ${s.name}: ${paintStatus(s.status)} ${s.path || s.note || ''}`);
  for (const r of records) for (const a of r.actions.slice(1)) log.info(`${r.id}: ${a}`);
  if (!dry) log.ok(`lock written: ${P.lock}`);

  if (commands.length && !dry) log.ok(`/dip is ready — try: /dip  ·  /dip:security  ·  @dip`);
  const failed = records.filter((r) => r.required && !['CLONED', 'PRESENT', 'UPDATED', 'PINNED', 'SNAPSHOT', 'DRY'].includes(r.status));
  const toolsMissing = records.filter((r) => r.tool && !r.tool.found);
  if (failed.length) log.err(`${failed.length} required integration(s) failed: ${failed.map((r) => r.id).join(', ')}`);
  else log.ok(`all ${records.length} upstream repositories available${records.some((r) => r.status === 'SNAPSHOT') ? ' (some from bundled snapshot — re-run online to get live clones)' : ''}`);
  if (toolsMissing.length) log.warn(`CLI tools not installed: ${toolsMissing.map((r) => r.tool.command).join(', ')} — related phases will be BLOCKED until installed.`);
  const code = failed.length ? 1 : (opts.strict && toolsMissing.length ? 3 : 0);
  return { code, lock };
}

function ensureClone(it, dest, o) {
  const snapDir = path.join(o.snapshotRoot, it.dir);
  const pinnedCommit = o.pinned ? it.snapshot?.commit : null;
  const g = (args, extra = {}) => run('git', args, { timeout: 15 * 60 * 1000, logFile: o.logFile, ...extra });

  if (exists(dest)) {
    const gi = gitInfo(dest);
    if (gi && normalizeRemote(gi.remote) === normalizeRemote(it.repo)) {
      if (o.dry) return { status: 'DRY', action: 'would keep existing clone', source: 'existing clone', commit: gi.commit };
      if (pinnedCommit && gi.commit !== pinnedCommit && !o.offline) {
        const f = retry(`${it.id} fetch pin`, o.retries, () => g(['-C', dest, 'fetch', '--depth', '1', 'origin', pinnedCommit]));
        if (f.code === 0 && g(['-C', dest, '-c', 'advice.detachedHead=false', 'checkout', '--quiet', pinnedCommit]).code === 0)
          return { status: 'PINNED', action: `pinned to ${pinnedCommit.slice(0, 12)}`, source: 'git clone', commit: pinnedCommit };
        return { status: 'PRESENT', action: `pin failed, kept ${gi.commit.slice(0, 12)}`, source: 'git clone', commit: gi.commit };
      }
      if (o.update && !o.offline) {
        if (gi.dirty) return { status: 'PRESENT', action: 'local changes present — update skipped (not overwriting)', source: 'git clone', commit: gi.commit };
        const f = retry(`${it.id} fetch`, o.retries, () => g(['-C', dest, 'fetch', '--depth', '1', 'origin', 'HEAD']));
        if (f.code === 0) {
          const m = g(['-C', dest, 'reset', '--quiet', '--hard', 'FETCH_HEAD']);
          const now = gitInfo(dest).commit;
          if (m.code === 0) return { status: now === gi.commit ? 'PRESENT' : 'UPDATED', action: now === gi.commit ? 'already up to date' : `updated ${gi.commit.slice(0, 12)} → ${now.slice(0, 12)}`, source: 'git clone', commit: now };
        }
        return { status: 'PRESENT', action: `update failed (${firstLine(f.stderr)}), kept existing`, source: 'git clone', commit: gi.commit };
      }
      return { status: 'PRESENT', action: 'existing clone detected — not reinstalled', source: 'git clone', commit: gi.commit };
    }
    const prov = readJSON(path.join(dest, PROVENANCE), null);
    if (!gi && prov?.integration === it.id && !(o.update && !o.offline)) {
      return { status: 'SNAPSHOT', action: 'existing snapshot copy kept (use --update online to replace with a live clone)', source: 'bundled snapshot', commit: prov.commit };
    }
    if (!o.force && !(prov?.integration === it.id)) {
      return { status: 'CONFLICT', action: `path exists but is ${gi ? `a clone of ${gi.remote}` : 'not a git clone'} — left untouched (use --force to move it aside)`, source: '—', commit: gi?.commit || null };
    }
    if (o.dry) return { status: 'DRY', action: 'would move existing path aside and re-clone', source: '—', commit: null };
    const aside = `${dest}.bak-${timestamp()}`;
    fs.renameSync(dest, aside);
    log.warn(`${it.id}: moved existing ${dest} → ${aside}`);
  }

  if (o.dry) return { status: 'DRY', action: o.offline ? 'would copy bundled snapshot' : `would git clone ${it.repo}`, source: '—', commit: null };

  if (!o.offline && gitAvailable()) {
    const tmp = `${dest}.tmp-${process.pid}`;
    fs.rmSync(tmp, { recursive: true, force: true });
    let r;
    if (pinnedCommit) {
      r = retry(`${it.id} clone (pinned)`, o.retries, () => {
        fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
        const steps = [['init', '--quiet'], ['remote', 'add', 'origin', it.repo], ['fetch', '--depth', '1', 'origin', pinnedCommit], ['-c', 'advice.detachedHead=false', 'checkout', '--quiet', 'FETCH_HEAD']];
        for (const s of steps) { const x = g(['-C', tmp, ...s]); if (x.code !== 0) return x; }
        return { code: 0 };
      });
    } else {
      const depth = o.full ? [] : ['--depth', '1'];
      r = retry(`${it.id} clone`, o.retries, () => { fs.rmSync(tmp, { recursive: true, force: true }); return g(['clone', '--quiet', ...depth, it.repo, tmp]); });
    }
    if (r.code === 0) {
      fs.renameSync(tmp, dest);
      const commit = gitInfo(dest)?.commit;
      return { status: pinnedCommit ? 'PINNED' : 'CLONED', action: `cloned ${it.repo}${pinnedCommit ? ` @ ${pinnedCommit.slice(0, 12)}` : ''}`, source: 'git clone', commit };
    }
    fs.rmSync(tmp, { recursive: true, force: true });
    log.warn(`${it.id}: clone failed after ${o.retries} attempt(s): ${firstLine(r.stderr)}`);
  }

  if (isDir(snapDir)) {
    copyDir(snapDir, dest);
    writeJSON(path.join(dest, PROVENANCE), { integration: it.id, repo: it.repo, commit: it.snapshot?.commit || null, source: 'bundled snapshot', copiedAt: new Date().toISOString(), from: snapDir });
    return { status: 'SNAPSHOT', action: `${o.offline ? 'offline: ' : 'network unavailable: '}copied bundled snapshot @ ${String(it.snapshot?.commit).slice(0, 12)}`, source: 'bundled snapshot', commit: it.snapshot?.commit || null };
  }
  return { status: 'FAILED', action: `could not clone ${it.repo} and no bundled snapshot is available`, source: '—', commit: null };
}

export function verifyCheckout(it, dir) {
  const missing = (it.expectedPaths || []).filter((p) => !exists(path.join(dir, p)));
  const lic = path.join(dir, it.licenseFile || 'LICENSE');
  const notice = it.noticeFile ? path.join(dir, it.noticeFile) : null;
  return {
    ok: missing.length === 0, missing,
    licenseSha256: exists(lic) ? sha256File(lic) : null,
    noticeSha256: notice && exists(notice) ? sha256File(notice) : null,
  };
}

function installSkills(it, checkout, dirs, o) {
  const found = upstreamSkills(checkout, it.skillsRoot);
  const names = new Set(found.map((f) => f.name));
  const res = [];
  for (const s of found) {
    res.push(installOneSkill(s, dirs, { ...o, provenance: { integration: it.id, repo: it.repo, commit: o.commit, upstreamPath: path.relative(checkout, s.dir).split(path.sep).join('/') }, licenseFrom: checkout, it }));
  }
  for (const expected of it.skills) if (!names.has(expected)) res.push({ name: expected, status: 'MISSING', note: 'listed in manifest but not found upstream (renamed or removed upstream?)' });
  for (const f of found) if (!it.skills.includes(f.name)) log.info(`${it.id}: new upstream skill discovered and installed: ${f.name}`);
  return res;
}

function installOneSkill(s, dirs, o) {
  const dst = path.join(dirs.install, s.name);
  const idx = indexInstalledSkills(dirs.search);
  const elsewhere = (idx.get(s.name) || []).filter((l) => path.resolve(l.path) !== path.resolve(dst));
  const meta = new Set([PROVENANCE, UPSTREAM_LICENSE, UPSTREAM_NOTICE]);
  const srcHash = hashDir(s.dir, { exclude: [...meta] }).hash;

  if (exists(dst)) {
    const dstHash = hashDir(dst, { exclude: [...meta] }).hash;
    if (dstHash === srcHash) return { name: s.name, status: 'PRESENT', path: dst, action: 'identical copy already installed' };
    if (!o.update) return { name: s.name, status: 'DIFFERS', path: dst, action: 'installed copy differs from upstream — kept (use --update to replace)' };
    if (o.dry) return { name: s.name, status: 'DRY', path: dst, action: 'would replace with upstream' };
    fs.renameSync(dst, `${dst}.bak-${timestamp()}`);
  } else if (elsewhere.length && !o.force) {
    return { name: s.name, status: 'PRESENT', path: elsewhere[0].path, action: `already installed at ${elsewhere[0].path} (${elsewhere[0].scope}) — not duplicated` };
  }
  if (o.dry) return { name: s.name, status: 'DRY', path: dst, action: 'would install' };
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const skip = new Set(['.git', 'node_modules', 'upstream', '.biswodip', 'dist']);
  if (s.dir === PKG_ROOT) {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(s.dir)) if (!skip.has(e)) fs.cpSync(path.join(s.dir, e), path.join(dst, e), { recursive: true });
  } else copyDir(s.dir, dst);
  if (o.licenseFrom && o.it) {
    const lic = path.join(o.licenseFrom, o.it.licenseFile || 'LICENSE');
    if (exists(lic) && !exists(path.join(dst, 'LICENSE'))) fs.copyFileSync(lic, path.join(dst, UPSTREAM_LICENSE));
    if (o.it.noticeFile && exists(path.join(o.licenseFrom, o.it.noticeFile))) fs.copyFileSync(path.join(o.licenseFrom, o.it.noticeFile), path.join(dst, UPSTREAM_NOTICE));
  }
  writeJSON(path.join(dst, PROVENANCE), { skill: s.name, installedAt: new Date().toISOString(), installedBy: 'biswodip-goj-unified-engineering', ...o.provenance });
  return { name: s.name, status: exists(`${dst}`) ? (o.update ? 'UPDATED' : 'INSTALLED') : 'FAILED', path: dst, action: 'copied from verified checkout' };
}

function runSkillsCli(it, o, logFile) {
  if (!which('npx')) return 'skills CLI: npx not found — used direct copy only';
  const src = it.repo.replace(/\.git$/, '');
  const args = ['-y', 'skills@latest', 'add', src, '-a', o.agent || 'claude-code', '-y', ...(o.global ? ['-g'] : [])];
  const r = run('npx', args, { cwd: o.root, logFile, timeout: 300000 });
  return r.code === 0 ? `skills CLI: ${args.join(' ')} ok` : `skills CLI failed (${firstLine(r.stderr)}) — direct copy remains in place`;
}

function installTool(it, P, o) {
  for (const cand of it.tool.install || []) {
    if (!which(cand.requires)) continue;
    log.step(`installing ${it.tool.command} via ${cand.cmd.join(' ')}`);
    const r = run(cand.cmd[0], cand.cmd.slice(1), { inherit: true, logFile: P.commandLog, timeout: 20 * 60 * 1000 });
    if (r.code === 0 && which(it.tool.command)) return `${it.tool.command} installed via ${cand.requires}`;
  }
  if (it.tool.installerUrl && !IS_WIN && which('curl') && which('bash') && !o.offline) {
    fs.mkdirSync(P.cache, { recursive: true });
    const f = path.join(P.cache, `${it.id}-install.sh`);
    const d = run('curl', ['-fsSL', '--retry', '3', '-o', f, it.tool.installerUrl], { logFile: P.commandLog, timeout: 120000 });
    if (d.code === 0) {
      log.info(`${it.id} installer saved to ${f} (sha256 ${sha256File(f)}) — review it if the environment is sensitive`);
      const r = run('bash', [f], { inherit: true, logFile: P.commandLog, timeout: 20 * 60 * 1000 });
      if (r.code === 0) return `${it.tool.command} installed via upstream installer (${it.tool.installerUrl})`;
    }
  }
  return `${it.tool.command} install FAILED/BLOCKED — install manually: ${it.upstreamInstall.join('  |  ')}`;
}

// ---------------------------------------------------------------- VERIFY (target project)
export function verify(opts) {
  const root = path.resolve(opts.root || '.');
  const P = paths(root);
  const manifest = loadManifest();
  log.title(`Verify integrations — ${root}`);
  const lock = readJSON(P.lock, null);
  if (!lock) { log.err(`No lock file at ${P.lock}. Run install first.`); return { code: 1, results: [] }; }
  const results = [];
  for (const it of selectIntegrations(manifest, opts.only)) {
    const rec = lock.integrations.find((r) => r.id === it.id);
    const checks = [];
    const add = (name, ok, detail = '', level = 'error') => checks.push({ name, ok, detail, level });
    if (!rec) { add('recorded in lock', false, 'not in lock file'); results.push({ id: it.id, name: it.name, checks }); continue; }
    const dir = rec.location;
    add('checkout exists', isDir(dir), dir);
    if (isDir(dir)) {
      const gi = gitInfo(dir);
      if (gi) {
        add('remote matches manifest', normalizeRemote(gi.remote) === normalizeRemote(it.repo), gi.remote);
        add('commit matches lock', gi.commit === rec.commit, `${String(gi.commit).slice(0, 12)} vs ${String(rec.commit).slice(0, 12)}`, 'warn');
        add('no local modifications', !gi.dirty, gi.dirty ? 'working tree has changes' : '', 'warn');
      } else add('source', rec.source === 'bundled snapshot', 'bundled snapshot (not a live clone)', 'warn');
      if (opts.pinned && it.snapshot?.commit) add('commit matches pinned snapshot', rec.commit === it.snapshot.commit, String(rec.commit).slice(0, 12), 'error');
      const v = verifyCheckout(it, dir);
      add('expected upstream files present', v.ok, v.missing.join(', '));
      add('upstream LICENSE present', Boolean(v.licenseSha256), it.licenseFile);
      if (rec.licenseSha256) add('upstream LICENSE unchanged', v.licenseSha256 === rec.licenseSha256, 'sha256 compared with lock');
    }
    for (const s of rec.skills || []) {
      if (s.status === 'MISSING') { add(`skill ${s.name}`, false, s.note || 'missing', 'warn'); continue; }
      const fm = s.path ? readFrontmatter(path.join(s.path, 'SKILL.md')) : null;
      add(`skill ${s.name}`, Boolean(fm && (fm.name || '') === s.name), s.path || '');
    }
    if (it.tool) {
      const t = toolInfo(it.tool);
      add(`${it.tool.command} CLI available`, t.found, t.found ? t.version : 'not installed — dependent phase BLOCKED', 'warn');
      if (it.tool.requiresDocker) { const d = dockerInfo(); add('docker running', d.running, d.running ? d.version : 'Strix cannot run', 'warn'); }
    }
    results.push({ id: it.id, name: it.name, checks });
  }
  for (const cmd of lock.commands || []) {
    if (!cmd.path || cmd.status === 'DRY') continue;
    results.push({ id: 'commands', name: `Command ${cmd.kind}`, checks: [{ name: 'file present', ok: exists(cmd.path), detail: cmd.path, level: 'error' }] });
  }
  for (const s of [].concat(lock.selfSkill || [])) {
    if (!s?.path) continue;
    const fm = readFrontmatter(path.join(s.path, 'SKILL.md'));
    results.push({ id: 'biswodip', name: `Biswodip skill ${s.name}`, checks: [{ name: 'installed + valid frontmatter', ok: fm?.name === s.name, detail: s.path, level: 'error' }] });
  }

  let errors = 0, warns = 0;
  const rows = [];
  for (const r of results) for (const ch of r.checks) {
    const st = ch.ok ? 'VERIFIED' : ch.level === 'warn' ? 'UNVERIFIED' : 'FAILED';
    if (!ch.ok) ch.level === 'warn' ? warns++ : errors++;
    if (!ch.ok || opts.verbose) rows.push([r.name, ch.name, paintStatus(st), ch.detail]);
  }
  if (rows.length) table(['INTEGRATION', 'CHECK', 'STATUS', 'DETAIL'], rows);
  const total = results.reduce((n, r) => n + r.checks.length, 0);
  (errors ? log.err : log.ok)(`${total - errors - warns}/${total} checks VERIFIED · ${warns} UNVERIFIED (warnings) · ${errors} FAILED`);
  const report = { verifiedAt: new Date().toISOString(), root, errors, warnings: warns, results };
  try { writeJSON(path.join(P.evidence, 'integrations-verify.json'), report); } catch { /* read-only target */ }
  return { code: errors ? 1 : (opts.strict && warns ? 3 : 0), report };
}

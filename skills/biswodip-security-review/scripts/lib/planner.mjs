// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// `dip plan`: read the target repository and the goal, keep only the few stack entries and skills that
// matter, and lay the work out in waves of subagents with one owner per area. Deterministic on purpose:
// the same repo and goal give the same plan, and the agent refines it instead of guessing from scratch.

import fs from 'node:fs';
import path from 'node:path';
import { log, table, exists, isDir, readJSON, writeJSON, which, run } from './common.mjs';
import { loadCatalog, llmReadiness } from './llmconfig.mjs';

export const DEFAULT_MAX = 6;

// Goal → this system's own phase skills. The router always loads.
const SKILL_RULES = [
  ['biswodip-security-review', ['security', 'secure', 'harden', 'auth', 'authorization', 'permission', 'vulnerab', 'secret', 'payment', 'webhook', 'audit', 'codex', 'sast', 'cloudflare', 'waf', 'ddos', 'zero-trust']],
  ['biswodip-pentest', ['pentest', 'penetration', 'exploit', 'attack', 'sqlmap', 'sqli', 'sql injection', 'ctf', 'hacking', 'offensive']],
  ['biswodip-design-review', ['design', 'ui', 'ux', 'accessib', 'a11y', 'responsive', 'animation', 'polish', 'landing', 'page', 'screen', 'creative']],
  ['biswodip-release-gate', ['release', 'production ready', 'production-ready', 'ship', 'score', 'grade', 'launch']],
  ['biswodip-handoff', ['handoff', 'hand off', 'continue later', 'new session']],
  ['biswodip-bootstrap', ['setup', 'set up', 'install', 'bootstrap', 'integrations']],
];

// Goal words that pull in an agent even when no single catalog entry matched.
const AGENT_RULES = [
  ['dip-frontend', ['frontend', 'front-end', 'website', 'web app', 'ui', 'page', 'css', 'component', 'landing', 'dashboard']],
  ['dip-mobile', ['android', 'ios', 'mobile', 'apk', 'play store']],
  ['dip-backend', ['api', 'backend', 'server', 'database', 'endpoint', 'data model']],
  ['dip-browser', ['browser', 'scrape', 'crawl', 'automate the web']],
  ['dip-infra', ['deploy', 'kubernetes', 'scale', 'infrastructure', 'workflow automation']],
  ['dip-quality', ['test', 'review', 'refactor', 'bug', 'debug', 'quality']],
];
const BUILD_AGENTS = ['dip-frontend', 'dip-mobile', 'dip-backend', 'dip-browser', 'dip-infra'];

const norm = (s) => ` ${String(s || '').toLowerCase().replace(/[^a-z0-9+#./-]+/g, ' ')} `;
/** Whole-word/phrase match, with a prefix match for stems like "accessib". */
export function goalHits(goal, words) {
  const g = norm(goal);
  return words.filter((w) => { const k = String(w).toLowerCase(); return g.includes(` ${k} `) || g.includes(` ${k}s `) || (k.length >= 6 && g.includes(` ${k}`)); });
}

function readPkg(file) { const j = readJSON(file, null); return j ? { ...j.dependencies, ...j.devDependencies, ...j.peerDependencies } : {}; }

/** What the repository already uses: dependencies (npm + Python), marker files, package manager. */
export function scanProject(root) {
  const deps = new Set();
  const pkgFiles = [path.join(root, 'package.json')];
  for (const ws of ['apps', 'packages', 'services'])
    if (isDir(path.join(root, ws))) for (const d of fs.readdirSync(path.join(root, ws))) pkgFiles.push(path.join(root, ws, d, 'package.json'));
  for (const f of pkgFiles) if (exists(f)) Object.keys(readPkg(f)).forEach((d) => deps.add(d.toLowerCase()));
  for (const f of ['requirements.txt', 'pyproject.toml']) {
    const p = path.join(root, f);
    if (!exists(p)) continue;
    for (const m of fs.readFileSync(p, 'utf8').matchAll(/^\s*["']?([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?\s*(?:[<>=~!;"',]|$)/gm)) deps.add(m[1].toLowerCase());
  }
  const pm = exists(path.join(root, 'pnpm-lock.yaml')) ? 'pnpm' : exists(path.join(root, 'yarn.lock')) ? 'yarn' : exists(path.join(root, 'bun.lockb')) || exists(path.join(root, 'bun.lock')) ? 'bun' : 'npm';
  const frameworks = ['next', 'react', 'vue', 'svelte', '@angular/core', 'astro', 'express', 'fastify', '@nestjs/core', 'django', 'flask', 'fastapi', 'expo', 'react-native'].filter((f) => deps.has(f));
  const langs = [];
  if (exists(path.join(root, 'package.json'))) langs.push('node');
  if (['requirements.txt', 'pyproject.toml', 'setup.py'].some((f) => exists(path.join(root, f)))) langs.push('python');
  return { deps, langs, packageJson: exists(path.join(root, 'package.json')), pm, frameworks, typescript: exists(path.join(root, 'tsconfig.json')) || deps.has('typescript') };
}

/** Score every catalog entry against the goal and the repo. */
export function scoreEntries(catalog, goal, scan, root) {
  return catalog.entries.map((e) => {
    const kw = goalHits(goal, e.signals?.keywords || []).concat(goalHits(goal, [e.id, e.name]));
    const dep = (e.signals?.deps || []).filter((d) => scan.deps.has(d.toLowerCase()));
    const files = (e.signals?.files || []).filter((f) => exists(path.join(root, f)));
    const lang = e.lang && scan.langs?.includes(e.lang) ? 1 : 0;
    return { entry: e, keywords: [...new Set(kw)], deps: dep, files, lang, score: kw.length * 2 + dep.length * 5 + files.length * 3 + lang * 3 };
  });
}

export function buildPlan({ root = '.', goal = '', max = DEFAULT_MAX } = {}, env = process.env) {
  root = path.resolve(root);
  const catalog = loadCatalog();
  const scan = scanProject(root);
  const scored = scoreEntries(catalog, goal, scan, root);

  // Agents the goal asks for, directly or through a matched entry.
  const agents = new Set(AGENT_RULES.filter(([, w]) => goalHits(goal, w).length).map(([a]) => a));
  for (const s of scored) if (s.keywords.length) agents.add(s.entry.agent);
  // Entries count only when the goal names them, or the repo uses them in an area the goal touches.
  // No goal: repository forensics — what the repo already uses.
  // A mobile-only goal drops web-only entries (Motion, Bootstrap…): React Native has its own equivalents.
  const mobileOnly = agents.has('dip-mobile') && !goalHits(goal, ['web', 'website', 'web app', 'browser', 'landing', 'css', 'html', 'frontend', 'front-end']).length;
  const notes = [];
  if (mobileOnly && scored.some((s) => s.entry.platform === 'web' && s.keywords.length)) {
    notes.push('Mobile goal: web-only libraries skipped. Animation → react-native-reanimated (`npx expo install react-native-reanimated`); icons → @expo/vector-icons (ships with Expo).');
    for (const s of scored) if (s.entry.platform === 'web') { s.keywords = []; s.score = 0; }
    if (!scored.some((s) => s.entry.agent === 'dip-frontend' && s.score > 0)) agents.delete('dip-frontend');
  }
  const relevant = scored.filter((s) => (goal.trim() ? s.keywords.length || ((s.deps.length || s.files.length) && agents.has(s.entry.agent)) : s.deps.length || s.files.length));
  const ranked = relevant.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  // One per alternative group (e.g. Crawlee for Node, Scrapling for Python); fallbacks only when the primary is out.
  const seenGroups = new Set();
  const deduped = ranked.filter((s) => { const g = s.entry.group; if (!g) return true; if (seenGroups.has(g)) return false; seenGroups.add(g); return true; });
  const ids = new Set(deduped.map((s) => s.entry.id));
  const chosen = deduped.filter((s) => {
    if (!s.entry.fallbackFor || !ids.has(s.entry.fallbackFor)) return true;
    notes.push(`${s.entry.name} is the fallback if ${s.entry.fallbackFor} cannot run.`);
    return false;
  }).slice(0, Math.max(1, max));
  for (const s of chosen) agents.add(s.entry.agent);
  const vague = (!goal.trim() && !scan.langs.length) || goalHits(goal, ['idea', 'ideas', 'something', 'anything']).length > 0;

  const skills = ['biswodip-unified-engineering', ...SKILL_RULES.filter(([, w]) => goalHits(goal, w).length).map(([s]) => s)];
  if (agents.has('dip-frontend') && !skills.includes('biswodip-design-review')) skills.push('biswodip-design-review');
  if (!skills.includes('biswodip-security-review') && (agents.has('dip-backend') || agents.has('dip-mobile'))) skills.push('biswodip-security-review');
  const external = chosen.filter((s) => ['skill', 'plugin'].includes(s.entry.kind)).map((s) => s.entry.id);

  const toEntry = (s) => ({ id: s.entry.id, name: s.entry.name, kind: s.entry.kind, why: whyOf(s), use: s.entry.use, docs: s.entry.docs || s.entry.repo, inUse: s.deps.length > 0, manual: Boolean(s.entry.manual) });
  const build = BUILD_AGENTS.filter((a) => agents.has(a));
  const waves = [
    { wave: 1, name: 'Plan', parallel: false, agents: [{ agent: 'dip-planner', task: 'Read the repo and this plan. Confirm or cut entries, write acceptance criteria, split the work into tasks with one owner per file area, and flag anything that needs the user.', entries: chosen.filter((s) => s.entry.agent === 'dip-planner').map(toEntry) }] },
    { wave: 2, name: 'Build', parallel: build.length > 1, agents: build.map((a) => ({ agent: a, task: catalog.agents[a], entries: chosen.filter((s) => s.entry.agent === a).map(toEntry) })) },
    { wave: 3, name: 'Verify', parallel: true, agents: [
      { agent: 'dip-quality', task: 'Run the build, types, lint and tests; add missing tests for the changed behaviour; review the diff.', entries: chosen.filter((s) => s.entry.agent === 'dip-quality').map(toEntry) },
      { agent: 'dip', task: `Security review of the changed code with ${skills.includes('biswodip-security-review') ? 'biswodip-security-review' : 'the router laws'}; report a status per control.`, entries: [] },
    ] },
    { wave: 4, name: 'Gate', parallel: false, agents: [{ agent: 'main', task: 'Merge the reports, fix what they found, then run biswodip-release-gate and give one release status.', entries: [] }] },
  ].filter((w) => w.agents.length).map((w, i) => ({ ...w, wave: i + 1 }));

  const installs = chosen.flatMap((s) => installLines(s.entry, scan)).filter((l) => !l.present);
  const llm = llmReadiness(chosen.map((s) => s.entry), env);

  return {
    goal: goal.trim() || '(none — repository forensics)', generatedAt: new Date().toISOString(), root,
    project: { packageManager: scan.pm, frameworks: scan.frameworks, typescript: scan.typescript, hasPackageJson: scan.packageJson },
    notes, vague, ideasFirst: vague ? 'Goal is open-ended: offer 3 concrete options (see app-ideas) and let the user pick before building.' : null,
    skills: [...new Set(skills)], externalSkills: external,
    entries: chosen.map(toEntry), waves, installs, llm,
    skipped: scored.filter((s) => s.score > 0 && !chosen.includes(s)).map((s) => s.entry.id),
  };
}

function whyOf(s) {
  const r = [];
  if (s.deps.length) r.push(`already in use (${s.deps.join(', ')})`);
  if (s.files.length) r.push(`found ${s.files.join(', ')}`);
  if (s.keywords.length) r.push(`goal mentions ${s.keywords.slice(0, 3).map((k) => `"${k}"`).join(', ')}`);
  return r.join('; ');
}

const PM_ADD = { npm: ['install'], pnpm: ['add'], yarn: ['add'], bun: ['add'] };
const PM_DEV = { npm: '--save-dev', pnpm: '-D', yarn: '-D', bun: '-d' };
/** The commands that would install an entry, with `present` when the repo already has it. */
export function installLines(e, scan) {
  const i = e.install || {}, out = [];
  const has = (d) => scan.deps.has(d.toLowerCase().replace(/\[.*$/, ''));
  if (i.npm?.length) out.push({ id: e.id, type: 'npm', cmd: [scan.pm, ...PM_ADD[scan.pm], ...i.npm], present: i.npm.every(has) });
  if (i.npmDev?.length) out.push({ id: e.id, type: 'npm', cmd: [scan.pm, ...PM_ADD[scan.pm], PM_DEV[scan.pm], ...i.npmDev], present: i.npmDev.every(has) });
  if (i.npmGlobal?.length) out.push({ id: e.id, type: 'global', cmd: ['npm', 'install', '-g', ...i.npmGlobal], manual: true });
  if (i.pip?.length) out.push({ id: e.id, type: 'pip', cmd: ['python3', '-m', 'pip', 'install', ...i.pip], present: i.pip.every(has) });
  if (i.skills) out.push({ id: e.id, type: 'skills', cmd: i.skills.split(/\s+/) });
  if (i.plugin) out.push({ id: e.id, type: 'plugin', cmd: [i.plugin], manual: true, note: 'run inside Claude Code' });
  if (i.docker) out.push({ id: e.id, type: 'docker', cmd: [i.docker], manual: true });
  if (i.shell) out.push({ id: e.id, type: 'shell', cmd: [i.shell], manual: true });
  if (e.manual) for (const l of out) l.manual = true;
  return out;
}

export function planMarkdown(p) {
  const L = [`# /dip plan`, '', `**Goal:** ${p.goal}`, '', `Project: ${p.project.packageManager}${p.project.frameworks.length ? ` · ${p.project.frameworks.join(', ')}` : ''}${p.project.typescript ? ' · TypeScript' : ''}`, ''];
  if (p.ideasFirst) L.push(`> ${p.ideasFirst}`, '');
  for (const n of p.notes) L.push(`> ${n}`, '');
  L.push('## Skills to load', '', ...p.skills.map((s) => `- \`${s}\``), ...p.externalSkills.map((s) => `- \`${s}\` (external — install first)`), '');
  L.push('## Stack picked (only what this goal needs)', '', '| Entry | Why | Use |', '|---|---|---|', ...p.entries.map((e) => `| [${e.name}](${e.docs}) | ${e.why} | ${e.use.replace(/\|/g, '\\|')} |`), '');
  L.push('## Waves', '');
  for (const w of p.waves) {
    L.push(`### ${w.wave}. ${w.name}${w.parallel ? ' (parallel)' : ''}`, '');
    for (const a of w.agents) L.push(`- **${a.agent}** — ${a.task}${a.entries.length ? ` Uses: ${a.entries.map((e) => e.id).join(', ')}.` : ''}`);
    L.push('');
  }
  if (p.installs.length) L.push('## Installs', '', '```bash', ...p.installs.map((l) => `${l.manual ? '# manual: ' : ''}${l.cmd.join(' ')}`), '```', '');
  L.push('## LLM gateway', '', p.llm.configured ? `Configured: ${p.llm.profile.provider} · ${p.llm.profile.model} · key ${p.llm.profile.apiKey}` : (p.llm.needs.length ? `**Not configured** — needed by ${p.llm.needs.join(', ')}. Run \`/dip-setapi\`.` : 'Not needed by this plan.'));
  for (const m of p.llm.missing) L.push(`- ${m.id} also needs \`${m.key}\` → \`${m.fix}\``);
  return L.join('\n') + '\n';
}

export function plan(opts) {
  const p = buildPlan(opts);
  const dir = path.join(p.root, '.biswodip');
  if (!opts.dryRun) { writeJSON(path.join(dir, 'plan.json'), p); fs.writeFileSync(path.join(dir, 'PLAN.md'), planMarkdown(p)); }
  if (opts.json) { console.log(JSON.stringify(p, null, 2)); return { code: 0, plan: p }; }
  log.title(`Plan — ${p.goal}`);
  if (p.ideasFirst) log.warn(p.ideasFirst);
  for (const n of p.notes) log.info(n);
  log.info(`skills: ${[...p.skills, ...p.externalSkills].join(', ')}`);
  if (p.entries.length) table(['ENTRY', 'KIND', 'WHY'], p.entries.map((e) => [e.id, e.kind, e.why]));
  else log.info('no catalog entry matched — the router and phase skills cover this goal');
  for (const w of p.waves) log.step(`wave ${w.wave} ${w.name}${w.parallel ? ' (parallel)' : ''}: ${w.agents.map((a) => a.agent).join(', ')}`);
  if (p.llm.needs.length && !p.llm.configured) log.warn(`LLM gateway not configured (needed by ${p.llm.needs.join(', ')}) → /dip-setapi`);
  for (const m of p.llm.missing) log.warn(`${m.id} needs ${m.key} → ${m.fix}`);
  if (!opts.dryRun) log.ok(`written: .biswodip/plan.json · .biswodip/PLAN.md`);
  return { code: 0, plan: p };
}

/** `dip add <ids>`: run the safe installs (project deps, skills); print the manual ones. */
export function addEntries(ids, { root = '.', dryRun = false, logFile } = {}) {
  root = path.resolve(root);
  const catalog = loadCatalog();
  const scan = scanProject(root);
  const want = [].concat(ids).flatMap((s) => String(s).split(',')).filter(Boolean);
  const unknown = want.filter((id) => !catalog.entries.some((e) => e.id === id));
  if (unknown.length) { log.err(`unknown catalog id: ${unknown.join(', ')} — see: dip catalog`); return { code: 2 }; }
  const rows = [];
  let failed = 0;
  for (const e of catalog.entries.filter((x) => want.includes(x.id))) {
    const lines = installLines(e, scan);
    if (!lines.length) rows.push([e.id, 'REFERENCE', e.docs || e.repo]);
    for (const l of lines) {
      const shown = l.cmd.join(' ');
      if (l.present) { rows.push([e.id, 'PRESENT', shown]); continue; }
      if (l.manual) { rows.push([e.id, 'MANUAL', `${shown}${l.note ? ` (${l.note})` : ''}`]); continue; }
      if (l.type === 'npm' && !scan.packageJson) { rows.push([e.id, 'BLOCKED', `no package.json in ${root}`]); failed++; continue; }
      if (!which(l.cmd[0])) { rows.push([e.id, 'BLOCKED', `${l.cmd[0]} not on PATH`]); failed++; continue; }
      if (dryRun) { rows.push([e.id, 'DRY', shown]); continue; }
      const r = run(l.cmd[0], l.cmd.slice(1), { cwd: root, timeout: 15 * 60 * 1000, logFile });
      rows.push([e.id, r.code === 0 ? 'INSTALLED' : 'FAILED', r.code === 0 ? shown : `${shown} → ${(r.stderr || r.stdout).trim().split('\n').pop()}`]);
      if (r.code !== 0) failed++;
    }
  }
  log.title('dip add');
  table(['ENTRY', 'STATUS', 'COMMAND / NOTE'], rows);
  return { code: failed ? 1 : 0, rows };
}

export function printCatalog({ json } = {}) {
  const cat = loadCatalog();
  if (json) { console.log(JSON.stringify(cat, null, 2)); return { code: 0 }; }
  log.title(`Stack catalog — ${cat.entries.length} entries`);
  table(['ID', 'AGENT', 'KIND', 'NEEDS LLM'], cat.entries.map((e) => [e.id, e.agent, e.kind + (e.manual ? ' (manual)' : ''), e.llm ? 'yes' : '']));
  return { code: 0 };
}

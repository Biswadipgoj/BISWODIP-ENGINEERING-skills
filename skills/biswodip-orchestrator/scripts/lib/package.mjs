// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Maintainer tooling: build the installable skill folder, verify the package, refresh upstream snapshots.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PKG_ROOT, c, log, table, paintStatus, which, run, exists, isDir, readJSON, writeJSON, walk, hashDir, copyDir, readFrontmatter, timestamp } from './common.mjs';
import { loadManifest, MANIFEST_PATH, SNAPSHOT_ROOT, SELF_SKILL_NAME, upstreamSkills, verifyCheckout, gitInfo } from './core.mjs';
import { scanText, SECRET_RULES } from './gates.mjs';
import { SKILLS, SKILLS_SRC, ROUTER, buildSkills, SKILL_BUDGET_CHARS } from './skills.mjs';

export const SKILL_OUT = path.join(PKG_ROOT, 'skills', SELF_SKILL_NAME);
export { buildSkills };
export const SNAPSHOT_INDEX = path.join(SNAPSHOT_ROOT, 'SNAPSHOTS.json');
const SKILL_PARTS = ['lifecycle', 'security', 'references', 'reports', 'integrations', 'scripts', 'bin', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md', 'package.json'];

export const REQUIRED_TREE = [
  'MASTER-PROMPT.md', 'README.md', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', 'package.json',
  'upstream/SNAPSHOTS.json', 'upstream/README.md',
  'integrations/manifest.json', 'integrations/taste/README.md', 'integrations/emilkowalski/README.md', 'integrations/headroom/README.md', 'integrations/strix/README.md', 'integrations/no-ai-slop/README.md',
  'integrations/strix/run-local-pentest.sh', 'integrations/strix/run-local-pentest.ps1', 'integrations/strix/pentest-instructions.template.md',
  ...['00-bootstrap', '01-plan', '02-inspect', '03-threat-model', '04-implement', '05-verify', '06-design', '07-performance', '08-security', '09-pentest', '10-fix', '11-adversarial', '12-score', '13-release'].map((f) => `lifecycle/${f}.md`),
  ...['SERVER-AUTHORITY', 'FINANCIAL-SYSTEMS', 'WEBHOOKS', 'AUTHORIZATION', 'DATA-PROTECTION', 'ATTACK-CATALOG'].map((f) => `security/${f}.md`),
  ...['detect-integrations', 'install-integrations', 'verify-integrations', 'run-security-gates'].flatMap((f) => [`scripts/${f}.sh`, `scripts/${f}.ps1`, `scripts/${f}.mjs`]),
  'reports/RELEASE-REPORT-TEMPLATE.md', 'reports/EVIDENCE-MATRIX-TEMPLATE.md', 'reports/FINDING-TEMPLATE.md', 'reports/SECURITY-EXCEPTION-TEMPLATE.md',
  'reports/THREAT-MODEL-TEMPLATE.md', 'reports/AUTHORIZATION-MATRIX-TEMPLATE.md', 'reports/INTEGRATION-RECORD-TEMPLATE.md',
  'references/02-master-shipping-gate.md', 'bin/biswodip.mjs', 'handoff.md', 'reports/HANDOFF-TEMPLATE.md',
  'docs/GITHUB.md', 'docs/CONTEXT-BUDGET.md', 'scripts/lib/skills.mjs', 'scripts/lib/handoff.mjs',
  'START-HERE.md', 'ARCHITECTURE.md', 'install.sh', 'install.ps1',
  'templates/claude/commands/dip.md', 'templates/claude/agents/dip.md', 'templates/claude/commands/dip-setapi.md',
  'integrations/catalog.json', 'scripts/lib/planner.mjs', 'scripts/lib/llmconfig.mjs', 'docs/ORCHESTRATION.md', 'docs/LLM-GATEWAY.md',
  ...['dip-planner', 'dip-frontend', 'dip-mobile', 'dip-backend', 'dip-quality', 'dip-browser', 'dip-infra'].map((a) => `templates/claude/agents/${a}.md`),
  ...['bootstrap', 'security', 'pentest', 'design', 'release', 'handoff', 'plan'].map((n) => `templates/claude/commands/dip/${n}.md`),
  ...SKILLS.flatMap((s) => [`skills/${s.name}/SKILL.md`, `skills-src/${s.name}.md`]),
];

export function frontmatter() {
  const pj = readJSON(path.join(PKG_ROOT, 'package.json'));
  return [
    '---',
    `name: ${SELF_SKILL_NAME}`,
    'description: Biswodip Goj\'s evidence-driven production engineering system. Use when asked to build, fix, harden, review, pentest, audit or release-gate a software repository, or make it secure, production-ready, accessible or well-designed. Runs discover, plan, implement, verify, attack (Strix), fix, regress, score and report with Taste, Emil Kowalski, No AI Slop, Headroom and Strix.',
    'license: Apache-2.0',
    'metadata:',
    '  author: Biswodip Goj',
    `  version: ${pj.version}`,
    `  homepage: ${pj.homepage || 'https://github.com/Biswadipgoj'}`,
    '---',
    '',
  ].join('\n');
}

function buildInto(out) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'SKILL.md'), frontmatter() + fs.readFileSync(path.join(PKG_ROOT, 'MASTER-PROMPT.md'), 'utf8'));
  for (const p of SKILL_PARTS) {
    const src = path.join(PKG_ROOT, p);
    if (!exists(src)) continue;
    if (isDir(src)) copyDir(src, path.join(out, p)); else fs.copyFileSync(src, path.join(out, p));
  }
}

export function buildSkill({ check = false } = {}) {
  if (!check) { buildInto(SKILL_OUT); log.ok(`skill built: ${path.relative(PKG_ROOT, SKILL_OUT)} (${hashDir(SKILL_OUT).files} files)`); return { code: 0 }; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-skill-'));
  try {
    buildInto(tmp);
    const a = hashDir(tmp), b = isDir(SKILL_OUT) ? hashDir(SKILL_OUT) : { hash: 'missing', files: 0 };
    return { code: a.hash === b.hash ? 0 : 1, expected: a, actual: b };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

export function snapshotIndex() {
  const m = loadManifest();
  const entries = m.integrations.map((it) => {
    const dir = path.join(SNAPSHOT_ROOT, it.dir);
    const h = isDir(dir) ? hashDir(dir) : { hash: null, files: 0 };
    return { id: it.id, name: it.name, repo: it.repo, dir: `upstream/${it.dir}`, commit: it.snapshot?.commit, committedAt: it.snapshot?.committedAt, license: it.license, files: h.files, treeSha256: h.hash };
  });
  return { $comment: 'Exact source snapshots of every upstream repository (git archive of the recorded commit, .git removed). Owned by their respective authors; see THIRD-PARTY-NOTICES.md.', generatedAt: new Date().toISOString(), snapshots: entries };
}

// Clone each upstream fresh, replace upstream/<dir> with an exact export, update manifest commits + SNAPSHOTS.json.
export function refreshSnapshots({ only } = {}) {
  if (!which('git')) { log.err('git is required'); return { code: 1 }; }
  const m = loadManifest();
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-refresh-'));
  let failures = 0;
  log.title('Refreshing upstream snapshots');
  for (const it of m.integrations) {
    if (only?.length && !only.includes(it.id)) continue;
    const tmp = path.join(work, it.dir);
    const r = run('git', ['clone', '--quiet', '--depth', '1', it.repo, tmp], { timeout: 15 * 60 * 1000 });
    if (r.code !== 0) { log.err(`${it.id}: clone failed — ${r.stderr.trim().split('\n').pop()}`); failures++; continue; }
    const commit = gitInfo(tmp).commit;
    const date = run('git', ['-C', tmp, 'log', '-1', '--format=%cI']).stdout.trim();
    const v = verifyCheckout(it, tmp);
    if (!v.ok) log.warn(`${it.id}: expected paths missing upstream: ${v.missing.join(', ')} — update manifest.expectedPaths`);
    const found = upstreamSkills(tmp, it.skillsRoot).map((s) => s.name);
    const added = found.filter((s) => !it.skills.includes(s)), removed = it.skills.filter((s) => !found.includes(s));
    if (added.length || removed.length) { log.warn(`${it.id}: skills changed upstream (+${added.join(',') || '—'} / -${removed.join(',') || '—'}) — manifest updated`); it.skills = found; }
    const dest = path.join(SNAPSHOT_ROOT, it.dir);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    const files = run('git', ['-C', tmp, 'ls-files', '-z']).stdout.split('\0').filter(Boolean);
    for (const f of files) {
      const s = path.join(tmp, f), d = path.join(dest, f);
      const st = fs.lstatSync(s, { throwIfNoEntry: false });
      if (!st || st.isSymbolicLink() || !st.isFile()) continue;
      fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d);
    }
    const prev = it.snapshot?.commit;
    it.snapshot = { ...(it.snapshot || {}), commit, committedAt: date };
    const ver = exists(path.join(dest, 'pyproject.toml')) ? (fs.readFileSync(path.join(dest, 'pyproject.toml'), 'utf8').match(/^version\s*=\s*"([^"]+)"/m) || [])[1] : null;
    if (ver) it.snapshot.version = ver;
    log.ok(`${it.id}: ${prev === commit ? 'unchanged' : `${String(prev).slice(0, 12)} → ${commit.slice(0, 12)}`} (${files.length} files)`);
  }
  fs.rmSync(work, { recursive: true, force: true });
  writeJSON(MANIFEST_PATH, m);
  writeJSON(SNAPSHOT_INDEX, snapshotIndex());
  buildSkill();
  return { code: failures ? 1 : 0 };
}

// ---------------------------------------------------------------- verify the package itself
export function verifyPackage({ verbose = false } = {}) {
  const checks = [];
  const add = (group, name, ok, detail = '', level = 'error') => checks.push({ group, name, ok: Boolean(ok), detail, level });
  const P = (...p) => path.join(PKG_ROOT, ...p);
  const read = (p) => (exists(P(p)) ? fs.readFileSync(P(p), 'utf8') : '');
  log.title(`Package self-verification — ${PKG_ROOT}`);

  // 1. Tree
  const missing = REQUIRED_TREE.filter((f) => !exists(P(f)));
  add('structure', `required files (${REQUIRED_TREE.length})`, !missing.length, missing.join(', '));

  // 2. Master prompt
  const mp = read('MASTER-PROMPT.md');
  const secs = [...Array(45).keys()].filter((n) => !new RegExp(`^## ${n}\\. `, 'm').test(mp));
  add('master prompt', 'sections §0–§42 present', !secs.length, secs.length ? `missing §${secs.join(', §')}` : '43 sections');
  for (const term of ['Server Authority', 'Strix', 'Headroom', 'Taste', 'Emil', 'No AI Slop', 'prefers-reduced-motion', 'JWT', 'idempotency', 'RELEASE READY', 'BLOCKED — INSUFFICIENT EVIDENCE', 'Biswodip Goj'])
    if (!mp.toLowerCase().includes(term.toLowerCase())) add('master prompt', `mentions "${term}"`, false);
  const refs = [...new Set([...mp.matchAll(/`((?:references|lifecycle|security|reports|scripts|integrations|docs|bin)\/[A-Za-z0-9_./-]+?)`/g)].map((m) => m[1]))]
    .filter((r) => !r.includes('*') && !r.includes('<'));
  const badRefs = refs.filter((r) => !exists(P(r)));
  add('master prompt', `referenced paths resolve (${refs.length})`, !badRefs.length, badRefs.join(', '));

  // 3. Gate catalogue preserved from v1.2
  const gatesN = (read('references/02-master-shipping-gate.md').match(/^\d+\. \[ \] OPEN — /gm) || []).length;
  add('references', 'v1.2 verification gates preserved (2215)', gatesN === 2215, `${gatesN} gates`);

  // 4. Every skill: built, in sync, valid frontmatter, within context budget
  const sync = buildSkills({ check: true });
  add('skill', `all ${SKILLS.length} skill folders in sync with sources`, sync.code === 0, sync.code ? 'run: node bin/biswodip.mjs build-skill' : 'identical');
  for (const sk of SKILLS) {
    const md = P('skills', sk.name, 'SKILL.md');
    const fm = readFrontmatter(md) || {};
    add('skill', `${sk.name}: frontmatter`, fm.name === sk.name && Boolean(fm.description) && fm.description.length <= 1024 && !/[<>]/.test(fm.description), fm.name || 'missing');
    const size = exists(md) ? fs.statSync(md).size : Infinity;
    add('skill', `${sk.name}: context budget (~${Math.round(size / 4)} tokens)`, size <= SKILL_BUDGET_CHARS, `${size} chars, budget ${SKILL_BUDGET_CHARS}`, 'warn');
    add('skill', `${sk.name}: source body exists`, exists(path.join(SKILLS_SRC, `${sk.name}.md`)), `skills-src/${sk.name}.md`);
  }
  const handoffMd = read('handoff.md');
  add('handoff', 'handoff.md carries the six sections', [1, 2, 3, 4, 5, 6].every((n) => new RegExp(`^##\\s*${n}\\)`, 'm').test(handoffMd)), 'Goal, Current state, Active files, Changes made, Failed attempts, Next steps');

  // 4b. Entry layer: /dip commands and the @dip agent must point at skills that exist
  const cmdFiles = walk(P('templates', 'claude'));
  add('commands', `entry layer present (${cmdFiles.length} files)`, cmdFiles.length >= 8, cmdFiles.join(', ').slice(0, 80));
  for (const rel of cmdFiles) {
    const text = fs.readFileSync(P('templates', 'claude', rel), 'utf8');
    const named = [...text.matchAll(/skills\/(biswodip-[a-z-]+)\//g)].map((m) => m[1]);
    const unknown = [...new Set(named)].filter((n) => !SKILLS.some((s) => s.name === n));
    add('commands', `${rel}: references real skills`, !unknown.length, unknown.join(', '));
    if (rel.startsWith('commands')) add('commands', `${rel}: has a description`, /^description:\s*\S/m.test(text), '');
  }
  add('commands', 'agent frontmatter names dip', /^name:\s*dip$/m.test(read('templates/claude/agents/dip.md')), '@dip');
  for (const rel of cmdFiles.filter((f) => f.startsWith('agents/'))) {
    const fm = readFrontmatter(P('templates', 'claude', rel)) || {};
    add('commands', `${rel}: name matches file, has description`, fm.name === path.basename(rel, '.md') && Boolean(fm.description), fm.name || 'missing');
  }

  // 4c. Stack catalog: unique ids, GitHub repos, owners that exist as agents
  const cat = readJSON(P('integrations', 'catalog.json'), { entries: [], agents: {} });
  const ids = cat.entries.map((e) => e.id);
  add('catalog', `ids unique (${ids.length})`, ids.length && new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i).join(', '));
  const badRepo = cat.entries.filter((e) => !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(e.repo || '')).map((e) => e.id);
  add('catalog', 'every entry has a GitHub repo', !badRepo.length, badRepo.join(', '));
  const noAgent = cat.entries.filter((e) => !cat.agents[e.agent] || !exists(P('templates', 'claude', 'agents', `${e.agent}.md`))).map((e) => `${e.id}→${e.agent}`);
  add('catalog', 'every entry is owned by a shipped agent', !noAgent.length, noAgent.join(', '));
  const badRefs2 = cat.entries.filter((e) => (e.fallbackFor && !ids.includes(e.fallbackFor))).map((e) => e.id);
  add('catalog', 'fallbacks point at real entries', !badRefs2.length, badRefs2.join(', '));

  // 5. Versions agree
  const pj = readJSON(P('package.json'));
  const man = loadManifest();
  add('versions', 'package.json = manifest = CHANGELOG', pj.version === man.packageVersion && read('CHANGELOG.md').includes(`## [${pj.version}]`), `${pj.version} / ${man.packageVersion}`);

  // 6. Every upstream repository bundled, exact, licensed
  const idx = readJSON(SNAPSHOT_INDEX, { snapshots: [] });
  // A "core" distribution ships without the bundled source snapshots; the installer clones
  // every repository instead. The marker file makes that an explicit, documented state.
  const omitted = exists(path.join(SNAPSHOT_ROOT, '.snapshots-omitted'));
  for (const it of man.integrations) {
    const dir = path.join(SNAPSHOT_ROOT, it.dir);
    const e = idx.snapshots.find((s) => s.id === it.id);
    add('upstream', `${it.name}: snapshot present`, isDir(dir),
      isDir(dir) ? `upstream/${it.dir}` : 'omitted in this distribution — installer clones it (no --offline)', omitted ? 'warn' : 'error');
    if (!isDir(dir)) continue;
    const v = verifyCheckout(it, dir);
    add('upstream', `${it.name}: expected files + ${it.license} LICENSE`, v.ok && v.licenseSha256, v.missing.join(', '));
    const h = hashDir(dir);
    add('upstream', `${it.name}: tree hash matches SNAPSHOTS.json`, e && e.treeSha256 === h.hash && e.commit === it.snapshot?.commit, e ? `${h.files} files @ ${String(e.commit).slice(0, 12)}` : 'not indexed');
    const found = upstreamSkills(dir, it.skillsRoot).map((s) => s.name);
    const drift = [...found.filter((s) => !it.skills.includes(s)), ...it.skills.filter((s) => !found.includes(s))];
    add('upstream', `${it.name}: manifest skills match snapshot (${found.length})`, !drift.length, drift.join(', '), 'warn');
    add('notices', `${it.name} credited in THIRD-PARTY-NOTICES.md`, read('THIRD-PARTY-NOTICES.md').includes(it.homepage), it.homepage);
  }

  // 7. Licence under Biswodip Goj
  add('license', 'LICENSE is Apache-2.0', /Apache License\s+Version 2\.0/.test(read('LICENSE')));
  add('license', 'NOTICE names Biswodip Goj', /Copyright \(c\) 2026 Biswodip Goj/.test(read('NOTICE')));
  const own = walk(PKG_ROOT, { ignore: new Set(['.git', 'node_modules', 'upstream', 'skills', 'dist']) }).filter((f) => /\.(mjs|sh|ps1)$/.test(f));
  const noSpdx = own.filter((f) => !/SPDX-License-Identifier: Apache-2\.0/.test(fs.readFileSync(P(f), 'utf8').slice(0, 600)));
  add('license', `SPDX header on every script (${own.length})`, !noSpdx.length, noSpdx.join(', '));

  // 8. Scripts parse
  const nodeBad = own.filter((f) => f.endsWith('.mjs')).filter((f) => run(process.execPath, ['--check', P(f)], { timeout: 30000 }).code !== 0);
  add('scripts', 'node --check all .mjs', !nodeBad.length, nodeBad.join(', '));
  if (which('bash')) {
    const shBad = own.filter((f) => f.endsWith('.sh')).filter((f) => run('bash', ['-n', P(f)], { timeout: 30000 }).code !== 0);
    add('scripts', 'bash -n all .sh', !shBad.length, shBad.join(', '));
  } else add('scripts', 'bash -n all .sh', false, 'bash not available', 'warn');
  const pwsh = which('pwsh') || which('powershell');
  if (pwsh) {
    const psBad = own.filter((f) => f.endsWith('.ps1')).filter((f) => run(pwsh, ['-NoProfile', '-Command', `$e=$null;[void][System.Management.Automation.Language.Parser]::ParseFile('${P(f).replace(/'/g, "''")}',[ref]$null,[ref]$e);if($e.Count){exit 1}`], { timeout: 60000 }).code !== 0);
    add('scripts', 'PowerShell parse all .ps1', !psBad.length, psBad.join(', '));
  } else add('scripts', 'PowerShell parse all .ps1', false, 'pwsh not available here (CI checks on Windows)', 'warn');

  // 9. No secrets in Biswodip-authored files
  const leaks = walk(PKG_ROOT, { ignore: new Set(['.git', 'node_modules', 'upstream', 'skills', 'dist', 'test']) })
    .filter((f) => !/\.(png|jpe?g|gif|webp|zip)$/i.test(f))
    .flatMap((f) => scanText(f, fs.readFileSync(P(f), 'utf8'), SECRET_RULES));
  add('secrets', 'no secret patterns in package', !leaks.length, leaks.map((l) => `${l.file}:${l.line} ${l.rule}`).join(', '));

  // 10. No stray build artefacts
  const stray = walk(PKG_ROOT, { ignore: new Set(['.git', 'node_modules', 'upstream']) }).filter((f) => /\.(tgz|tmp)$|\.tmp-\d+/.test(f));
  add('hygiene', 'no stale tarballs / temp files', !stray.length, stray.join(', '));

  let err = 0, warn = 0;
  const rows = [];
  for (const ch of checks) {
    const st = ch.ok ? 'VERIFIED' : ch.level === 'warn' ? 'UNVERIFIED' : 'FAILED';
    if (!ch.ok) ch.level === 'warn' ? warn++ : err++;
    if (verbose || !ch.ok) rows.push([ch.group, ch.name, paintStatus(st), ch.detail.length > 90 ? ch.detail.slice(0, 87) + '…' : ch.detail]);
  }
  if (rows.length) table(['GROUP', 'CHECK', 'STATUS', 'DETAIL'], rows);
  (err ? log.err : log.ok)(`${checks.length - err - warn}/${checks.length} VERIFIED · ${warn} UNVERIFIED · ${err} FAILED`);
  return { code: err ? 1 : 0, checks };
}

// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Unit tests for the tooling. Run: node --test test/tooling.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PKG_ROOT, which, run, walk, hashDir, readFrontmatter, normalizeRemote, exists } from '../scripts/lib/common.mjs';
import { loadManifest, detect, install, verify, selectIntegrations, upstreamSkills, verifyCheckout, SELF_SKILL_NAME } from '../scripts/lib/core.mjs';
import { isLoopbackHost, checkTarget, strixRun, MODES } from '../scripts/lib/strix.mjs';
import { scanText, SECRET_RULES, RISK_RULES, mask, runGates } from '../scripts/lib/gates.mjs';
import { verifyPackage, buildSkills, REQUIRED_TREE } from '../scripts/lib/package.mjs';
import { SKILLS, SKILL_BUDGET_CHARS, ROUTER, catalogueTable } from '../scripts/lib/skills.mjs';
import { handoff, template, gitFacts, SECTIONS, HANDOFF_FILE } from '../scripts/lib/handoff.mjs';
import { installCommands, TEMPLATES_ROOT } from '../scripts/lib/core.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-test-'));
const manifest = loadManifest();

// ---------------------------------------------------------------- manifest
test('manifest lists all five integrations with a licence, repo and snapshot commit', () => {
  const ids = manifest.integrations.map((i) => i.id);
  assert.deepEqual(ids.sort(), ['emilkowalski', 'headroom', 'no-ai-slop', 'strix', 'taste']);
  for (const it of manifest.integrations) {
    assert.match(it.repo, /^https:\/\/github\.com\/.+\.git$/, `${it.id} repo`);
    assert.match(it.snapshot.commit, /^[0-9a-f]{40}$/, `${it.id} commit`);
    assert.ok(it.license && it.licenseFile, `${it.id} licence metadata`);
    assert.ok(it.expectedPaths.length, `${it.id} expectedPaths`);
  }
});

test('every upstream repository is bundled, licensed and matches its expected paths', () => {
  for (const it of manifest.integrations) {
    const dir = path.join(PKG_ROOT, 'upstream', it.dir);
    assert.ok(exists(dir), `upstream/${it.dir} is bundled`);
    const v = verifyCheckout(it, dir);
    assert.ok(v.ok, `${it.id} expected files present (missing: ${v.missing.join(', ')})`);
    assert.ok(v.licenseSha256, `${it.id} LICENSE present`);
  }
});

test('manifest skill names match the SKILL.md frontmatter in the snapshots', () => {
  for (const it of manifest.integrations) {
    if (!it.skillsRoot) continue;
    const found = upstreamSkills(path.join(PKG_ROOT, 'upstream', it.dir), it.skillsRoot).map((s) => s.name).sort();
    assert.deepEqual(found, [...it.skills].sort(), `${it.id} skills`);
  }
});

test('selectIntegrations filters and rejects unknown ids', () => {
  assert.equal(selectIntegrations(manifest, ['strix']).length, 1);
  assert.equal(selectIntegrations(manifest, ['strix,taste']).length, 2);
  assert.throws(() => selectIntegrations(manifest, ['nope']), /Unknown integration/);
});

// ---------------------------------------------------------------- common
test('normalizeRemote treats ssh, https and .git forms as the same remote', () => {
  const canonical = 'https://github.com/usestrix/strix';
  for (const u of ['https://github.com/usestrix/strix.git', 'git@github.com:usestrix/strix.git', 'https://github.com/usestrix/strix/', 'HTTPS://GitHub.com/usestrix/Strix.git'])
    assert.equal(normalizeRemote(u), canonical, u);
  assert.notEqual(normalizeRemote('https://github.com/evil/strix'), canonical);
});

test('hashDir detects any content change and ignores excluded files', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'a.txt'), 'one');
  fs.mkdirSync(path.join(d, 'sub'));
  fs.writeFileSync(path.join(d, 'sub', 'b.txt'), 'two');
  const base = hashDir(d).hash;
  fs.writeFileSync(path.join(d, 'sub', 'b.txt'), 'three');
  assert.notEqual(hashDir(d).hash, base);
  fs.writeFileSync(path.join(d, 'sub', 'b.txt'), 'two');
  assert.equal(hashDir(d).hash, base);
  fs.writeFileSync(path.join(d, 'meta.json'), '{}');
  assert.equal(hashDir(d, { exclude: ['meta.json'] }).hash, base);
  fs.rmSync(d, { recursive: true, force: true });
});

test('readFrontmatter parses name and description, and tolerates a file without frontmatter', () => {
  const d = tmp();
  const f = path.join(d, 'SKILL.md');
  fs.writeFileSync(f, '---\nname: demo-skill\ndescription: "Does a thing."\n---\n\n# Body\n');
  assert.equal(readFrontmatter(f).name, 'demo-skill');
  assert.equal(readFrontmatter(f).description, 'Does a thing.');
  fs.writeFileSync(f, '# no frontmatter\n');
  assert.deepEqual(readFrontmatter(f), {});
  assert.equal(readFrontmatter(path.join(d, 'missing.md')), null);
  fs.rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------- Strix guard
test('isLoopbackHost accepts loopback only', () => {
  for (const h of ['localhost', 'app.localhost', '127.0.0.1', '127.5.5.5', '::1', 'host.docker.internal']) assert.ok(isLoopbackHost(h), h);
  for (const h of ['example.com', '10.0.0.5', '192.168.1.10', '169.254.169.254', 'staging.internal']) assert.ok(!isLoopbackHost(h), h);
});

test('checkTarget refuses a remote host unless it is declared authorized', () => {
  assert.ok(checkTarget('http://127.0.0.1:3000').ok);
  const refused = checkTarget('https://example.com');
  assert.ok(!refused.ok);
  assert.match(refused.reason, /authorized/i);
  assert.ok(checkTarget('https://staging.example.com', ['staging.example.com']).ok);
  assert.ok(!checkTarget('https://other.example.com', ['staging.example.com']).ok);
  assert.ok(!checkTarget('ftp://127.0.0.1').ok);
  assert.ok(!checkTarget('not a url').ok);
});

test('strixRun refuses an unauthorized target with exit code 6 and runs nothing', () => {
  const d = tmp();
  const r = strixRun({ root: d, targetDir: '.', appUrl: ['https://example.com'], mode: 'quick', budget: 10 });
  assert.equal(r.code, 6);
  assert.equal(r.evidence.status, 'REFUSED');
  assert.ok(!exists(path.join(d, 'strix_runs')));
  fs.rmSync(d, { recursive: true, force: true });
});

test('strixRun rejects an invalid mode and a non-positive budget', () => {
  const d = tmp();
  assert.equal(strixRun({ root: d, mode: 'aggressive', budget: 10 }).code, 6);
  assert.equal(strixRun({ root: d, mode: 'quick', budget: 0 }).code, 6);
  assert.deepEqual(MODES, ['quick', 'standard', 'deep']);
  fs.rmSync(d, { recursive: true, force: true });
});

test('strix dry run reports blocked preconditions instead of pretending to scan', () => {
  const d = tmp();
  const r = strixRun({ root: d, targetDir: '.', appUrl: ['http://127.0.0.1:3000'], mode: 'quick', budget: 5, dryRun: true });
  assert.equal(r.evidence.status, 'DRY');
  assert.equal(r.code, 0);
  fs.rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------- secret scanning
test('secret rules catch real-looking credentials and mask the value', () => {
  const samples = {
    'aws-access-key-id': 'const k = "AKIAIOSFODNN7EXAMPLE";',
    'github-token': 'token: ghp_0123456789abcdefghijklmnopqrstuvwxyz',
    'private-key': '-----BEGIN RSA PRIVATE KEY-----',
    'stripe-live-key': 'STRIPE=sk_live_abcdefghijklmnop1234',
    'anthropic-key': 'key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345"',
    'credential-in-url': 'DATABASE_URL=postgres://app:sup3rs3cretpw@db.internal:5432/prod',
    'jwt': 'auth = eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop',
  };
  for (const [rule, line] of Object.entries(samples)) {
    const hits = scanText('f.js', line, SECRET_RULES);
    assert.ok(hits.some((h) => h.rule === rule), `${rule} not detected`);
    for (const h of hits) assert.ok(!line.includes(h.match) || h.match.length <= 8, `value leaked for ${rule}`);
  }
});

test('placeholders and allow-listed lines do not raise secret findings', () => {
  for (const line of [
    'api_key = "your_api_key_here_placeholder"',
    'const secret = process.env.CLIENT_SECRET',
    'password: "<REPLACE_ME_WITH_REAL>"',
    'DATABASE_URL=postgres://user:${DB_PASSWORD}@localhost:5432/dev',
  ]) assert.equal(scanText('f.js', line, SECRET_RULES).length, 0, line);
  assert.equal(scanText('f.js', 'const k = "AKIAIOSFODNN7EXAMPLE"; // biswodip-allow-secret', SECRET_RULES).length, 0);
});

test('mask never reveals more than four characters', () => {
  assert.equal(mask('short'), '****');
  assert.match(mask('abcdefghijklmnop'), /^abcd…\(16 chars\)$/);
});

test('risk heuristics flag the patterns their rule ids describe', () => {
  const cases = [
    ['token-in-web-storage', 'localStorage.setItem("auth_token", t)'],
    ['public-env-secret', 'const x = process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY'],
    ['tls-verification-disabled', 'const agent = new https.Agent({ rejectUnauthorized: false })'],
    ['dangerous-html-sink', 'el.innerHTML = userInput'],
    ['float-money', 'const total = parseFloat(req.body.amount)'],
    ['client-trusted-authz-field', 'if (req.body.isAdmin) grant()'],
    ['jwt-none-or-no-verify', 'jwt.verify(t, k, { algorithms: ["none"] })'],
  ];
  for (const [rule, line] of cases) {
    const hits = scanText('f.js', line, RISK_RULES, { placeholders: false });
    assert.ok(hits.some((h) => h.rule === rule), `${rule} not flagged: ${line}`);
  }
});

test('gates fail on a committed credential and pass on a clean tree', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'ok.js'), 'export const add = (a, b) => a + b;\n');
  const clean = runGates({ root: d, skipAudit: true, noWrite: true });
  assert.equal(clean.code, 0);
  fs.writeFileSync(path.join(d, 'leak.js'), 'const k = "AKIAIOSFODNN7EXAMPLE";\n');
  const dirty = runGates({ root: d, skipAudit: true, noWrite: true });
  assert.equal(dirty.code, 1);
  assert.ok(dirty.report.secrets.some((s) => s.rule === 'aws-access-key-id'));
  assert.ok(dirty.report.gates.some((g) => g.gate.startsWith('G6') && g.status === 'OPEN'), 'manual gates stay OPEN');
  fs.rmSync(d, { recursive: true, force: true });
});

test('gates skip vendored agent skill directories unless asked', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-test-'));
  fs.mkdirSync(path.join(d, '.claude', 'skills', 'vendored'), { recursive: true });
  fs.writeFileSync(path.join(d, '.claude', 'skills', 'vendored', 'x.js'), 'const k = "AKIAIOSFODNN7EXAMPLE";\n');
  assert.equal(runGates({ root: d, skipAudit: true, noWrite: true }).code, 0);
  assert.equal(runGates({ root: d, skipAudit: true, noWrite: true, includeSkills: true }).code, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

test('gates flag a committed .env file', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, '.env'), 'FOO=bar\n');
  fs.writeFileSync(path.join(d, '.env.example'), 'FOO=\n');
  const r = runGates({ root: d, skipAudit: true, noWrite: true });
  const envHits = r.report.secrets.filter((s) => s.rule === 'env-file-in-repo');
  assert.equal(envHits.length, 1);
  assert.equal(envHits[0].file, '.env');
  fs.rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------- install
test('offline install clones every integration from the snapshot and writes a valid lock', { timeout: 300000 }, () => {
  const d = tmp();
  const res = install({ root: d, offline: true, agent: 'claude-code', skills: true, retries: 1 });
  assert.equal(res.code, 0);
  for (const it of manifest.integrations) {
    const dir = path.join(d, '.biswodip', 'upstream', it.dir);
    assert.ok(exists(dir), `${it.id} cloned`);
    assert.ok(verifyCheckout(it, dir).ok, `${it.id} verified`);
    const rec = res.lock.integrations.find((r) => r.id === it.id);
    assert.equal(rec.status, 'SNAPSHOT');
    assert.equal(rec.commit, it.snapshot.commit);
  }
  // upstream skills are installed with their licence beside them
  const skillDir = path.join(d, '.claude', 'skills');
  assert.ok(exists(path.join(skillDir, 'design-taste-frontend', 'SKILL.md')));
  assert.ok(exists(path.join(skillDir, 'no-ai-slop', 'UPSTREAM-LICENSE')));
  assert.equal(readFrontmatter(path.join(skillDir, SELF_SKILL_NAME, 'SKILL.md')).name, SELF_SKILL_NAME);
  // the skill carries its references with it
  assert.ok(exists(path.join(skillDir, SELF_SKILL_NAME, 'references', '02-master-shipping-gate.md')));
  assert.ok(exists(path.join(d, '.biswodip', '.gitignore')));

  // idempotent: a second run keeps everything and reinstalls nothing
  const again = install({ root: d, offline: true, agent: 'claude-code', retries: 1 });
  assert.equal(again.code, 0);
  for (const rec of again.lock.integrations) assert.equal(rec.status, 'SNAPSHOT');
  assert.ok(again.lock.integrations.every((r) => /kept/.test(r.actions.join(' '))), 'existing copies kept');

  // verify agrees with what install recorded
  assert.equal(verify({ root: d }).code, 0);

  // tampering with an upstream licence is detected
  const lic = path.join(d, '.biswodip', 'upstream', 'strix', 'LICENSE');
  fs.appendFileSync(lic, '\nnot the real licence\n');
  assert.equal(verify({ root: d }).code, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

test('install --dry-run changes nothing on disk', () => {
  const d = tmp();
  const res = install({ root: d, offline: true, dryRun: true, retries: 1 });
  assert.equal(res.code, 0);
  assert.ok(!exists(path.join(d, '.biswodip', 'upstream')));
  assert.ok(!exists(path.join(d, '.claude')));
  fs.rmSync(d, { recursive: true, force: true });
});

test('install refuses to touch a conflicting directory unless forced', () => {
  const d = tmp();
  const clash = path.join(d, '.biswodip', 'upstream', 'strix');
  fs.mkdirSync(clash, { recursive: true });
  fs.writeFileSync(path.join(clash, 'mine.txt'), 'my work');
  const res = install({ root: d, offline: true, only: ['strix'], skills: false, selfSkill: false, retries: 1 });
  assert.equal(res.code, 1);
  assert.equal(res.lock.integrations[0].status, 'CONFLICT');
  assert.ok(exists(path.join(clash, 'mine.txt')), 'existing files are never deleted');
  fs.rmSync(d, { recursive: true, force: true });
});

test('detect reports nothing installed in an empty project and never prints key values', () => {
  const d = tmp();
  const got = detect({ root: d, agent: 'claude-code' });
  assert.equal(got.records.length, 5);
  for (const r of got.records) assert.equal(r.clone.status, 'MISSING');
  assert.equal(got.self.locations.length, 0);
  assert.ok(['set', 'missing'].includes(got.env.LLM_API_KEY));
  assert.ok(!JSON.stringify(got).includes(process.env.LLM_API_KEY || '\u0000never\u0000'));
  fs.rmSync(d, { recursive: true, force: true });
});

test('verify fails cleanly when no lock file exists', () => {
  const d = tmp();
  assert.equal(verify({ root: d }).code, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------- /dip entry layer
test('installCommands puts /dip, the sub-commands and @dip into a project', () => {
  const d = tmp();
  const res = installCommands(d, {});
  const kinds = res.map((r) => r.kind).sort();
  assert.deepEqual(kinds, ['/dip', '/dip-setapi', '/dip:bootstrap', '/dip:design', '/dip:handoff', '/dip:pentest', '/dip:plan', '/dip:release', '/dip:security',
    '@dip', '@dip-backend', '@dip-browser', '@dip-frontend', '@dip-infra', '@dip-mobile', '@dip-planner', '@dip-quality']);
  assert.ok(res.every((r) => r.status === 'INSTALLED'));
  assert.ok(exists(path.join(d, '.claude', 'commands', 'dip.md')));
  assert.ok(exists(path.join(d, '.claude', 'commands', 'dip', 'security.md')));
  assert.ok(exists(path.join(d, '.claude', 'agents', 'dip.md')));
  assert.match(fs.readFileSync(path.join(d, '.claude', 'agents', 'dip.md'), 'utf8'), /^name: dip$/m);

  // idempotent, and a user edit is never clobbered without --update
  assert.ok(installCommands(d, {}).every((r) => r.status === 'PRESENT'));
  const mine = path.join(d, '.claude', 'commands', 'dip.md');
  fs.writeFileSync(mine, '# my own version\n');
  assert.equal(installCommands(d, {}).find((r) => r.kind === '/dip').status, 'DIFFERS');
  assert.equal(fs.readFileSync(mine, 'utf8'), '# my own version\n');
  assert.equal(installCommands(d, { update: true }).find((r) => r.kind === '/dip').status, 'INSTALLED');
  fs.rmSync(d, { recursive: true, force: true });
});

test('a full install wires the entry layer and records it in the lock', { timeout: 300000 }, () => {
  const d = tmp();
  const res = install({ root: d, offline: true, retries: 1 });
  assert.equal(res.code, 0);
  assert.equal(res.lock.commands.length, 8);
  assert.ok(exists(path.join(d, '.claude', 'commands', 'dip.md')));
  assert.equal(verify({ root: d }).code, 0);
  // a deleted command is caught by verify
  fs.rmSync(path.join(d, '.claude', 'commands', 'dip', 'security.md'));
  assert.equal(verify({ root: d }).code, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

test('every /dip command points at a skill the system actually ships', () => {
  for (const rel of walk(TEMPLATES_ROOT)) {
    const text = fs.readFileSync(path.join(TEMPLATES_ROOT, rel), 'utf8');
    for (const m of text.matchAll(/skills\/(biswodip-[a-z-]+)\//g))
      assert.ok(SKILLS.some((s) => s.name === m[1]), `${rel} references unknown skill ${m[1]}`);
  }
});

// ---------------------------------------------------------------- handoff
test('handoff init writes the six sections and update keeps hand-written prose', () => {
  const d = tmp();
  assert.equal(handoff({ root: d, action: 'init', project: 'demo' }).code, 0);
  const file = path.join(d, HANDOFF_FILE);
  let text = fs.readFileSync(file, 'utf8');
  for (const s of SECTIONS) assert.match(text, new RegExp(`^## ${s.n}\\) ${s.title}`, 'm'), `section ${s.n}`);

  // a second init refuses rather than destroying work
  assert.equal(handoff({ root: d, action: 'init', project: 'demo' }).code, 1);

  // hand-written content survives an update, and the timestamp moves
  fs.writeFileSync(file, text.replace('- TODO (write "none yet" if nothing has failed)', '- Tried X, failed with ENOENT because Y'));
  const before = fs.readFileSync(file, 'utf8');
  assert.equal(handoff({ root: d, action: 'update' }).code, 0);
  const after = fs.readFileSync(file, 'utf8');
  assert.ok(after.includes('Tried X, failed with ENOENT because Y'), 'prose preserved');
  assert.ok(after.includes('<!-- biswodip:auto:start -->'), 'auto block present');
  assert.notEqual(after, before);
  fs.rmSync(d, { recursive: true, force: true });
});

test('handoff records real git facts when the target is a repository', { skip: !which('git') }, () => {
  const d = tmp();
  run('git', ['-C', d, 'init', '-q', '-b', 'main']);
  fs.writeFileSync(path.join(d, 'a.txt'), 'one');
  run('git', ['-C', d, 'add', '.']);
  run('git', ['-C', d, '-c', 'user.email=t@e.st', '-c', 'user.name=T', 'commit', '-qm', 'first commit']);
  fs.writeFileSync(path.join(d, 'b.txt'), 'two');
  const facts = gitFacts(d);
  assert.equal(facts.isRepo, true);
  assert.equal(facts.branch, 'main');
  assert.equal(facts.subject, 'first commit');
  assert.ok(facts.changedCount >= 1);
  const t = template(d, 'demo');
  assert.ok(t.includes('first commit') && t.includes('b.txt'));
  fs.rmSync(d, { recursive: true, force: true });
});

test('handoff show fails cleanly when there is no file', () => {
  const d = tmp();
  assert.equal(handoff({ root: d, action: 'show' }).code, 1);
  fs.rmSync(d, { recursive: true, force: true });
});

test('this repository has a handoff.md with all six sections filled in', () => {
  const text = fs.readFileSync(path.join(PKG_ROOT, 'handoff.md'), 'utf8');
  for (const s of SECTIONS) assert.match(text, new RegExp(`^## ${s.n}\\) ${s.title}`, 'm'));
  assert.ok(!/^- TODO$/m.test(text), 'handoff.md still contains TODO placeholders');
  assert.ok(text.length > 2000, 'handoff.md looks unfilled');
});

// ---------------------------------------------------------------- package
test('required tree is present', () => {
  const missing = REQUIRED_TREE.filter((f) => !exists(path.join(PKG_ROOT, f)));
  assert.deepEqual(missing, []);
});

test('all eight skills are built, in sync, and within the context budget', () => {
  assert.equal(buildSkills({ check: true }).code, 0, 'run: node bin/biswodip.mjs build-skill');
  assert.equal(SKILLS.length, 8);
  for (const sk of SKILLS) {
    const md = path.join(PKG_ROOT, 'skills', sk.name, 'SKILL.md');
    const fm = readFrontmatter(md);
    assert.equal(fm.name, sk.name, `${sk.name} frontmatter name`);
    assert.ok(fm.description.length <= 1024 && !/[<>]/.test(fm.description), `${sk.name} description`);
    const size = fs.statSync(md).size;
    assert.ok(size <= SKILL_BUDGET_CHARS, `${sk.name} SKILL.md is ${size} chars, over the ${SKILL_BUDGET_CHARS} budget`);
  }
});

test('the router skill stays small and carries the full prompt as a reference, not inline', () => {
  const dir = path.join(PKG_ROOT, 'skills', ROUTER);
  const skillMd = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  assert.ok(skillMd.length < 8000, `router SKILL.md is ${skillMd.length} chars — keep it a router`);
  assert.ok(exists(path.join(dir, 'references', 'MASTER-PROMPT.md')), 'full prompt available on demand');
  for (const name of ['biswodip-security-review', 'biswodip-pentest', 'biswodip-handoff']) assert.ok(skillMd.includes(name), `router routes to ${name}`);
  const cat = catalogueTable();
  assert.equal(cat.length, 8);
  assert.ok(cat.every((r) => r.tokens > 0 && r.files > 0));
});

test('every skill carries the files its body references', () => {
  for (const sk of SKILLS) {
    const dir = path.join(PKG_ROOT, 'skills', sk.name);
    const body = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    const refs = [...body.matchAll(/`((?:references|lifecycle|security|reports|integrations|scripts|bin)\/[A-Za-z0-9_./-]+?)`/g)].map((m) => m[1]);
    for (const r of new Set(refs)) assert.ok(exists(path.join(dir, r)), `${sk.name} references ${r} but does not carry it`);
  }
});

test('MASTER-PROMPT keeps every section and the 2,215 gates', () => {
  const mp = fs.readFileSync(path.join(PKG_ROOT, 'MASTER-PROMPT.md'), 'utf8');
  for (let n = 0; n <= 44; n++) assert.match(mp, new RegExp(`^## ${n}\\. `, 'm'), `section ${n} missing`);
  const gates = fs.readFileSync(path.join(PKG_ROOT, 'references', '02-master-shipping-gate.md'), 'utf8');
  assert.equal((gates.match(/^\d+\. \[ \] OPEN — /gm) || []).length, 2215);
});

test('package self-verification passes', { timeout: 300000 }, () => {
  assert.equal(verifyPackage({}).code, 0);
});

test('every Biswodip-authored script carries the SPDX header', () => {
  const own = walk(PKG_ROOT, { ignore: new Set(['.git', 'node_modules', 'upstream', 'skills']) }).filter((f) => /\.(mjs|sh|ps1)$/.test(f));
  assert.ok(own.length >= 15);
  for (const f of own) {
    const head = fs.readFileSync(path.join(PKG_ROOT, f), 'utf8').slice(0, 600);
    assert.match(head, /SPDX-License-Identifier: Apache-2\.0/, f);
    assert.match(head, /Biswodip Goj/, f);
  }
});

test('the CLI runs, prints help and rejects an unknown command', () => {
  const cli = path.join(PKG_ROOT, 'bin', 'biswodip.mjs');
  const help = run(process.execPath, [cli, 'help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /verify-package/);
  assert.equal(run(process.execPath, [cli, 'version']).stdout.trim(), JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')).version);
  assert.equal(run(process.execPath, [cli, 'nonsense']).code, 2);
  assert.equal(run(process.execPath, [cli, 'gates', '--fail-on', 'silly']).code, 2);
});

test('shell wrappers are syntactically valid where a shell is available', { skip: !which('bash') }, () => {
  for (const f of walk(path.join(PKG_ROOT, 'scripts')).filter((f) => f.endsWith('.sh')))
    assert.equal(run('bash', ['-n', path.join(PKG_ROOT, 'scripts', f)]).code, 0, f);
  assert.equal(run('bash', ['-n', path.join(PKG_ROOT, 'integrations', 'strix', 'run-local-pentest.sh')]).code, 0);
});

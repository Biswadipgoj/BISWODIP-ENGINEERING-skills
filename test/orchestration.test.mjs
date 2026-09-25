// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Tests for the /dip planner, the stack catalog and the /dip-setapi gateway settings.
// Run: node --test test/orchestration.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PKG_ROOT, IS_WIN, exists } from '../scripts/lib/common.mjs';
import { buildPlan, goalHits, scanProject, installLines, planMarkdown, addEntries } from '../scripts/lib/planner.mjs';
import { setApi, getProfile, clearApi, toolEnv, mask, checkBaseUrl, inferProvider, execWithApi, llmReadiness, loadCatalog, configFile } from '../scripts/lib/llmconfig.mjs';
import { installCommands } from '../scripts/lib/core.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-orch-'));
const cfgEnv = () => ({ DIP_CONFIG_DIR: tmp() });
const FAKE_KEY = 'test-key-not-real-0000abcd';
const ids = (p) => p.entries.map((e) => e.id).sort();
const project = (files) => { const d = tmp(); for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), c); } return d; };

// ---------------------------------------------------------------- catalog
test('catalog: unique ids, GitHub repos, owners that ship as agents, valid llm mappings', () => {
  const cat = loadCatalog();
  const seen = new Set();
  for (const e of cat.entries) {
    assert.ok(!seen.has(e.id), `duplicate id ${e.id}`); seen.add(e.id);
    assert.match(e.repo, /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/, `${e.id} repo`);
    assert.ok(cat.agents[e.agent], `${e.id} agent ${e.agent} declared`);
    assert.ok(exists(path.join(PKG_ROOT, 'templates', 'claude', 'agents', `${e.agent}.md`)), `${e.agent}.md ships`);
    assert.ok(e.use && e.signals, `${e.id} use/signals`);
    for (const field of Object.values(e.llm?.env || {})) assert.ok(['apiKey', 'baseUrl', 'model', 'protocol'].includes(field), `${e.id} llm field ${field}`);
    if (e.fallbackFor) assert.ok(cat.entries.some((x) => x.id === e.fallbackFor), `${e.id} fallbackFor`);
  }
});

// ---------------------------------------------------------------- planner
test('goalHits matches whole words, plurals and long stems — not substrings', () => {
  assert.deepEqual(goalHits('Add Icons to the page', ['icon']), ['icon']);
  assert.deepEqual(goalHits('check accessibility', ['accessib']), ['accessib']);
  assert.deepEqual(goalHits('a pricing table', ['ui']), []);
  assert.deepEqual(goalHits('build an API', ['api']), ['api']);
});

test('android goal → mobile stack only, web-only animation dropped, security review added', () => {
  const p = buildPlan({ root: tmp(), goal: 'build an android app with login and animations' }, {});
  assert.deepEqual(ids(p), ['appwrite', 'expo', 'react-native']);
  assert.ok(p.waves.some((w) => w.agents.some((a) => a.agent === 'dip-mobile')));
  assert.ok(!p.waves.some((w) => w.agents.some((a) => a.agent === 'dip-frontend')));
  assert.ok(p.skills.includes('biswodip-security-review'));
  assert.match(p.notes.join(' '), /reanimated/);
});

test('web goal in a repo that already has motion: kept, marked in use, no reinstall', () => {
  const root = project({ 'package.json': JSON.stringify({ dependencies: { motion: '^12', react: '^19' } }), 'pnpm-lock.yaml': '' });
  const p = buildPlan({ root, goal: 'make the landing page beautiful with scroll animations and icons' }, {});
  const motion = p.entries.find((e) => e.id === 'motion');
  assert.ok(motion?.inUse, 'motion in use');
  assert.ok(!p.installs.some((l) => l.id === 'motion'), 'no reinstall of a present dep');
  assert.ok(p.skills.includes('biswodip-design-review'));
  assert.equal(p.project.packageManager, 'pnpm');
  const fa = installLines(loadCatalog().entries.find((e) => e.id === 'font-awesome'), scanProject(root));
  assert.deepEqual(fa[0].cmd, ['pnpm', 'add', '@fortawesome/fontawesome-free']);
});

test('one scraper per project language, and the browser fallback only as a note', () => {
  const py = buildPlan({ root: project({ 'requirements.txt': 'requests==2\n' }), goal: 'scrape prices and automate the browser' }, {});
  assert.ok(ids(py).includes('scrapling') && !ids(py).includes('crawlee'), ids(py).join());
  assert.ok(ids(py).includes('jev-ultrafast') && !ids(py).includes('browser-use'));
  assert.match(py.notes.join(' '), /Browser Use is the fallback/);
  const node = buildPlan({ root: project({ 'package.json': '{}' }), goal: 'scrape prices' }, {});
  assert.ok(ids(node).includes('crawlee') && !ids(node).includes('scrapling'));
});

test('plans stay small, unrelated in-use deps stay out, vague goals ask first', () => {
  const root = project({ 'package.json': JSON.stringify({ dependencies: { redis: '4', prisma: '5' } }) });
  const ui = buildPlan({ root, goal: 'animate the navbar icons' }, {});
  assert.ok(!ids(ui).includes('redis') && !ids(ui).includes('prisma'), 'backend deps not dragged into a UI plan');
  const big = buildPlan({ root, goal: 'website with animation icons bootstrap search cache database scrape kubernetes tests review', max: 4 }, {});
  assert.equal(big.entries.length, 4);
  assert.ok(buildPlan({ root, goal: 'give me some app ideas' }, {}).ideasFirst);
  assert.equal(buildPlan({ root, goal: '' }, {}).ideasFirst, null, 'empty goal on a real repo = forensics, not ideas');
});

test('plan reports the gateway state and the extra keys a tool still needs', () => {
  const env = cfgEnv();
  const p1 = buildPlan({ root: tmp(), goal: 'automate the browser' }, env);
  assert.equal(p1.llm.configured, false);
  assert.ok(p1.llm.missing.some((m) => m.key === 'TYPESAFE_API_KEY'));
  setApi({ baseUrl: 'https://openrouter.ai/api/v1', apiKey: FAKE_KEY, model: 'm', extra: ['TYPESAFE_API_KEY=typesafe-fake-0000wxyz'] }, env);
  const p2 = buildPlan({ root: tmp(), goal: 'automate the browser' }, env);
  assert.equal(p2.llm.configured, true);
  assert.deepEqual(p2.llm.missing, []);
  const md = planMarkdown(p2);
  assert.ok(!md.includes(FAKE_KEY) && md.includes('••••abcd'), 'PLAN.md never contains the key');
});

test('dip add: blocks npm without package.json, prints manual entries, rejects unknown ids', () => {
  const root = tmp();
  assert.equal(addEntries(['nope'], { root }).code, 2);
  const r = addEntries(['motion', 'expo', 'app-ideas'], { root, dryRun: true });
  const status = Object.fromEntries(r.rows.map((x) => [x[0], x[1]]));
  assert.equal(status.motion, 'BLOCKED');
  assert.equal(status.expo, 'MANUAL');
  assert.equal(status['app-ideas'], 'REFERENCE');
});

// ---------------------------------------------------------------- gateway settings
test('setApi validates URL, key and model, and refuses keys in URLs and remote http', () => {
  const env = cfgEnv();
  assert.equal(checkBaseUrl('http://example.com/v1').ok, false);
  assert.equal(checkBaseUrl('http://127.0.0.1:4000').ok, true);
  assert.equal(checkBaseUrl('https://user:pw@example.com').ok, false);
  assert.equal(checkBaseUrl('ftp://example.com').ok, false);
  assert.equal(setApi({ baseUrl: 'https://x.test', apiKey: 'has space', model: 'm' }, env).ok, false);
  assert.equal(setApi({ baseUrl: 'https://x.test', apiKey: FAKE_KEY }, env).ok, false, 'model required');
  assert.equal(setApi({ baseUrl: 'https://x.test', apiKey: FAKE_KEY, model: 'm', profile: '../evil' }, env).ok, false);
  assert.equal(setApi({ baseUrl: 'https://x.test', apiKey: FAKE_KEY, model: 'm', extra: ['lower=1'] }, env).ok, false);
  assert.equal(exists(configFile(env)), false, 'nothing written on invalid input');
});

test('setApi stores owner-only, infers provider/protocol, merges partial updates, masks', () => {
  const env = cfgEnv();
  const r = setApi({ baseUrl: 'https://openrouter.ai/api/v1/', apiKey: FAKE_KEY, model: 'anthropic/claude-sonnet-5' }, env);
  assert.ok(r.ok, r.errors?.join());
  assert.equal(r.summary.apiKey, '••••abcd');
  assert.equal(r.summary.provider, 'openrouter');
  assert.equal(r.summary.protocol, 'openai');
  assert.equal(getProfile(undefined, env).baseUrl, 'https://openrouter.ai/api/v1');
  if (!IS_WIN) {
    assert.equal(fs.statSync(configFile(env)).mode & 0o777, 0o600);
    assert.equal(fs.statSync(path.dirname(configFile(env))).mode & 0o777, 0o700);
  }
  assert.ok(setApi({ model: 'deepseek/deepseek-chat' }, env).ok, 'model-only update');
  assert.equal(getProfile(undefined, env).apiKey, FAKE_KEY, 'key kept');
  assert.ok(setApi({ baseUrl: 'https://api.anthropic.com/v1' }, env).ok);
  assert.equal(getProfile(undefined, env).protocol, 'anthropic', 'protocol re-inferred when the URL changes');
  assert.equal(inferProvider('http://localhost:11434/v1'), 'local');
  assert.equal(mask('short'), '••••');
  assert.ok(clearApi(undefined, env).ok);
  assert.equal(getProfile(undefined, env), null);
});

test('toolEnv maps the profile onto each tool, extras included, shell values win', () => {
  const env = cfgEnv();
  setApi({ baseUrl: 'https://gw.test/v1', apiKey: FAKE_KEY, model: 'gpt-x', extra: ['TYPESAFE_API_KEY=typesafe-fake-0000wxyz'] }, env);
  const p = getProfile(undefined, env);
  const all = toolEnv(p, { base: {} });
  assert.equal(all.OPENAI_API_KEY, FAKE_KEY);
  assert.equal(all.OCR_LLM_TOKEN, FAKE_KEY);
  assert.equal(all.OCR_LLM_PROTOCOL, 'openai');
  assert.equal(all.TEXT_MODEL, 'gpt-x');
  assert.equal(all.STRIX_LLM, 'openai/gpt-x');
  assert.equal(all.TYPESAFE_API_KEY, 'typesafe-fake-0000wxyz');
  const only = toolEnv(p, { forIds: ['open-code-review'], base: {} });
  assert.ok(only.OCR_LLM_URL && !only.TEXT_MODEL, '--for limits tool mappings');
  assert.equal(toolEnv(p, { base: { OPENAI_API_KEY: 'from-shell' } }).OPENAI_API_KEY, undefined, 'shell wins');
  assert.equal(llmReadiness(loadCatalog().entries.filter((e) => e.id === 'jev-ultrafast'), env).missing.length, 0);
});

test('dip exec injects the variables, returns the exit code, and redacts the key in the log', () => {
  const env = { ...process.env, ...cfgEnv() };
  delete env.OPENAI_API_KEY; delete env.OCR_LLM_MODEL;
  assert.equal(execWithApi(['node', '-e', '0'], {}, env).code, 5, 'no profile → BLOCKED');
  setApi({ baseUrl: 'https://gw.test/v1', apiKey: FAKE_KEY, model: 'gpt-x' }, env);
  const log = path.join(tmp(), 'commands.log');
  const script = `process.exit(process.env.OPENAI_API_KEY === ${JSON.stringify(FAKE_KEY)} && process.env.OCR_LLM_MODEL === 'gpt-x' ? 7 : 1)`;
  assert.equal(execWithApi([process.execPath, '-e', script], { logFile: log }, env).code, 7);
  assert.equal(execWithApi([], {}, env).code, 2);
  const leak = [process.execPath, '-e', `/*${FAKE_KEY}*/0`];
  execWithApi(leak, { logFile: log }, env);
  assert.ok(!fs.readFileSync(log, 'utf8').includes(FAKE_KEY), 'key redacted from the command log');
});

// ---------------------------------------------------------------- entry layer
test('install wires /dip-setapi, /dip:plan and every subagent', () => {
  const root = tmp();
  const kinds = installCommands(root).map((x) => x.kind);
  for (const k of ['/dip', '/dip-setapi', '/dip:plan', '@dip', '@dip-planner', '@dip-frontend', '@dip-mobile', '@dip-backend', '@dip-quality', '@dip-browser', '@dip-infra'])
    assert.ok(kinds.includes(k), `${k} installed`);
  const dip = fs.readFileSync(path.join(root, '.claude', 'commands', 'dip.md'), 'utf8');
  assert.match(dip, /biswodip-orchestrator\/bin\/biswodip\.mjs/);
  assert.match(dip, /node "\$DIP" plan --root \./);
});

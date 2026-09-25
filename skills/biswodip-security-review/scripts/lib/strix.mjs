// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Guarded Strix runner: authorized targets only, key never printed, run.json inspected (exit code is not trusted alone).

import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { c, log, which, run, exists, isDir, readJSON, writeJSON, timestamp } from './common.mjs';
import { dockerInfo, paths } from './core.mjs';
import { getProfile, toolEnv } from './llmconfig.mjs';

export const MODES = ['quick', 'standard', 'deep'];

// Loopback only is allowed without explicit authorization. Private LAN ranges are NOT assumed to be yours.
export function isLoopbackHost(host) {
  const h = String(host || '').replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === 'host.docker.internal' || h === '0.0.0.0') return true;
  if (net.isIPv4(h)) return h.startsWith('127.');
  if (net.isIPv6(h)) return h === '::1' || h === '0:0:0:0:0:0:0:1';
  return false;
}

export function checkTarget(url, authorizedHosts = []) {
  let u;
  try { u = new URL(url); } catch { return { ok: false, reason: `not a valid URL: ${url}` }; }
  if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, reason: `unsupported scheme ${u.protocol}` };
  if (isLoopbackHost(u.hostname)) return { ok: true, host: u.hostname, local: true };
  const allowed = authorizedHosts.map((h) => h.toLowerCase().trim()).filter(Boolean);
  if (allowed.includes(u.hostname.toLowerCase())) return { ok: true, host: u.hostname, local: false };
  return {
    ok: false, host: u.hostname,
    reason: `${u.hostname} is not a loopback host. Only test systems you own or are explicitly authorized to test. `
      + `If authorized, re-run with --authorized-host ${u.hostname} and keep the written authorization with your evidence.`,
  };
}

export function strixRun(opts) {
  const root = path.resolve(opts.root || '.');
  const P = paths(root);
  const mode = opts.mode || 'quick';
  const budget = Number(opts.budget ?? 10);
  const targetDir = path.resolve(root, opts.targetDir || '.');
  const urls = [].concat(opts.appUrl || []).filter(Boolean);
  const authorized = [].concat(opts.authorizedHost || []).flatMap((s) => String(s).split(','));
  const problems = [];
  // Shell variables win; otherwise the gateway saved with /dip-setapi fills STRIX_LLM / LLM_API_KEY / LLM_API_BASE.
  const E = { ...process.env, ...toolEnv(getProfile(), { forIds: ['strix'] }) };

  log.title(`Strix — authorized ${mode} assessment`);
  if (!MODES.includes(mode)) problems.push(`--mode must be one of ${MODES.join(', ')}`);
  if (!Number.isFinite(budget) || budget <= 0) problems.push('--budget must be a positive number (USD cap passed to --max-budget)');
  if (!isDir(targetDir)) problems.push(`target dir not found: ${targetDir}`);
  for (const u of urls) { const t = checkTarget(u, authorized); if (!t.ok) problems.push(t.reason); else log.info(`target ${u} ${t.local ? '(loopback)' : c.yellow('(declared authorized)')}`); }
  if (opts.openapi && !exists(path.resolve(root, opts.openapi))) problems.push(`OpenAPI file not found: ${opts.openapi}`);
  let instructionFile = opts.instructionFile ? path.resolve(root, opts.instructionFile) : null;
  if (instructionFile) {
    if (!exists(instructionFile)) problems.push(`instruction file not found: ${instructionFile}`);
    else if (E.LLM_API_KEY && fs.readFileSync(instructionFile, 'utf8').includes(E.LLM_API_KEY)) problems.push('instruction file contains LLM_API_KEY — remove the key from the file');
  }

  const env = { strix: which('strix'), docker: dockerInfo(), STRIX_LLM: Boolean(E.STRIX_LLM), LLM_API_KEY: Boolean(E.LLM_API_KEY) };
  log.info(`strix ${env.strix ? 'found' : 'MISSING'} · docker ${env.docker.running ? 'running' : 'NOT running'} · STRIX_LLM ${env.STRIX_LLM ? 'set' : 'missing'} · LLM_API_KEY ${env.LLM_API_KEY ? 'set' : 'missing'}`);
  const blocked = [];
  if (!env.strix) blocked.push('strix CLI not installed (pipx install strix-agent, or install-integrations --with-tools)');
  if (!env.docker.running) blocked.push('Docker is not running');
  if (!env.STRIX_LLM) blocked.push('STRIX_LLM not set — run /dip-setapi or export it');
  if (!env.LLM_API_KEY) blocked.push('LLM_API_KEY not set — run /dip-setapi or export it');

  const args = ['-n', '-t', targetDir, ...urls.flatMap((u) => ['-t', u]), ...(opts.openapi ? ['-t', path.resolve(root, opts.openapi)] : []),
    '--scan-mode', mode, '--max-budget', String(budget), ...(instructionFile ? ['--instruction-file', instructionFile] : [])];
  log.info(`command: strix ${args.join(' ')}`);

  const evidence = { tool: 'strix', startedAt: new Date().toISOString(), mode, budget, targets: [targetDir, ...urls, ...(opts.openapi ? [opts.openapi] : [])], authorizedHosts: authorized, command: `strix ${args.join(' ')}` };
  const finish = (status, extra = {}) => {
    Object.assign(evidence, { status, finishedAt: new Date().toISOString(), ...extra });
    try { writeJSON(path.join(P.evidence, `strix-${timestamp()}.json`), evidence); } catch { /* best effort */ }
    const paint = { CLEAN: c.green, FINDINGS: c.red, INCOMPLETE: c.yellow, BLOCKED: c.red, REFUSED: c.red, ERROR: c.red, DRY: c.gray }[status] || ((x) => x);
    log.raw(`\nStrix result: ${paint(status)}${extra.summary ? ` — ${extra.summary}` : ''}`);
    return { code: { CLEAN: 0, DRY: 0, FINDINGS: 2, INCOMPLETE: 4, BLOCKED: 5, REFUSED: 6 }[status] ?? 1, evidence };
  };

  if (problems.length) { problems.forEach((p) => log.err(p)); return finish('REFUSED', { summary: problems.join('; ') }); }
  if (opts.dryRun) return finish('DRY', { summary: blocked.length ? `would be BLOCKED: ${blocked.join('; ')}` : 'preconditions met' });
  if (blocked.length) { blocked.forEach((b) => log.err(b)); return finish('BLOCKED', { summary: blocked.join('; ') }); }

  const runsDir = path.join(root, 'strix_runs');
  const before = new Set(isDir(runsDir) ? fs.readdirSync(runsDir) : []);
  const r = run('strix', args, { cwd: root, inherit: true, timeout: 0, env: E, logFile: P.commandLog, redact: [E.LLM_API_KEY] });
  const after = isDir(runsDir) ? fs.readdirSync(runsDir).filter((d) => !before.has(d)) : [];
  const newest = after.map((d) => path.join(runsDir, d)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  const runJson = newest ? readJSON(path.join(newest, 'run.json'), null) : null;
  const vulns = newest ? readJSON(path.join(newest, 'vulnerabilities.json'), null) : null;
  const count = Array.isArray(vulns) ? vulns.length : Array.isArray(vulns?.vulnerabilities) ? vulns.vulnerabilities.length : null;
  const runStatus = runJson?.status || null;
  const cost = runJson?.llm_usage?.cost ?? null;
  const extra = { exitCode: r.code, runDir: newest || null, runStatus, cost, findings: count,
    artifacts: newest ? fs.readdirSync(newest) : [] };

  if (r.code === 1) return finish('ERROR', { ...extra, summary: 'strix exited with a fatal error — not a clean assessment' });
  if (r.code === 2 || (count && count > 0)) return finish('FINDINGS', { ...extra, summary: `${count ?? 'unknown number of'} finding(s) — reproduce each manually, fix root cause, add regression test, re-run same scope` });
  const completed = runStatus && /complete|finished|success/i.test(runStatus);
  const overBudget = cost != null && cost >= budget;
  if (r.code === 0 && completed && !overBudget) return finish('CLEAN', { ...extra, summary: `no findings for the analyzed scope (cost ${cost ?? '?'} / ${budget}). This is evidence of tested coverage, not proof of security.` });
  return finish('INCOMPLETE', { ...extra, summary: `run status "${runStatus ?? 'unknown'}"${overBudget ? ', budget exhausted' : ''} — does NOT qualify as a clean assessment` });
}

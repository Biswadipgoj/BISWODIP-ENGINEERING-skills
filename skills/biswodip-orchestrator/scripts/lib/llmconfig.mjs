// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// LLM gateway settings for /dip-setapi: base URL, API key and model, stored once per user (never in a
// project), then injected into each tool under the variable names that tool reads (`dip exec`).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PKG_ROOT, IS_WIN, log, table, readJSON, run } from './common.mjs';
import { isLoopbackHost } from './strix.mjs';

export const CATALOG_PATH = path.join(PKG_ROOT, 'integrations', 'catalog.json');
export const PROTOCOLS = ['openai', 'anthropic'];

export function configDir(env = process.env) {
  if (env.DIP_CONFIG_DIR) return path.resolve(env.DIP_CONFIG_DIR);
  if (IS_WIN && env.APPDATA) return path.join(env.APPDATA, 'biswodip');
  return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'biswodip');
}
export const configFile = (env) => path.join(configDir(env), 'llm.json');

export function loadConfig(env) { return readJSON(configFile(env), { version: 1, active: 'default', profiles: {} }); }

function saveConfig(cfg, env) {
  const dir = configDir(env), file = configFile(env);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch { /* best effort (Windows) */ }
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, file);
  try { fs.chmodSync(file, 0o600); } catch { /* best effort (Windows) */ }
  return file;
}

export function mask(secret) {
  if (!secret) return '(not set)';
  return secret.length >= 12 ? `••••${secret.slice(-4)}` : '••••';
}

/** https everywhere; plain http only for loopback gateways (LiteLLM, Ollama, LM Studio on this machine). */
export function checkBaseUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return { ok: false, reason: `not a valid URL: ${raw}` }; }
  if (u.username || u.password) return { ok: false, reason: 'put the key in --api-key, not in the URL' };
  if (u.protocol === 'http:' && !isLoopbackHost(u.hostname)) return { ok: false, reason: `http:// is only allowed for loopback gateways — use https:// for ${u.hostname}` };
  if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, reason: `unsupported scheme ${u.protocol}` };
  return { ok: true, url: u.toString().replace(/\/+$/, '') };
}

export function inferProvider(baseUrl) {
  const h = new URL(baseUrl).hostname.toLowerCase();
  const known = [['anthropic.com', 'anthropic'], ['openai.com', 'openai'], ['openrouter.ai', 'openrouter'], ['gateway.ai.cloudflare.com', 'cloudflare-ai-gateway'],
    ['portkey.ai', 'portkey'], ['groq.com', 'groq'], ['deepseek.com', 'deepseek'], ['together.xyz', 'together'], ['mistral.ai', 'mistral'], ['googleapis.com', 'google'], ['azure.com', 'azure']];
  for (const [d, name] of known) if (h === d || h.endsWith(`.${d}`)) return name;
  return isLoopbackHost(h) ? 'local' : 'custom';
}
export const inferProtocol = (baseUrl) => (inferProvider(baseUrl) === 'anthropic' ? 'anthropic' : 'openai');

const oneLine = (s) => typeof s === 'string' && s.length > 0 && !/[\s\0]/.test(s);

/**
 * Save or update a profile. Fields not given are kept, so `dip setapi --model x` only changes the model.
 * extra: ["NAME=value", …] for tool-specific keys (e.g. TYPESAFE_API_KEY for jev-ultrafast).
 */
export function setApi({ baseUrl, apiKey, model, protocol, profile = 'default', extra = [] } = {}, env = process.env) {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(profile)) return { ok: false, errors: ['--profile must be 1–40 letters, digits, _ or -'] };
  const cfg = loadConfig(env);
  const cur = cfg.profiles[profile] || {};
  const next = { ...cur, extra: { ...(cur.extra || {}) } };
  const errors = [];
  if (baseUrl != null) { const b = checkBaseUrl(baseUrl); if (b.ok) next.baseUrl = b.url; else errors.push(b.reason); }
  if (apiKey != null) { if (oneLine(apiKey)) next.apiKey = apiKey; else errors.push('API key is empty or contains whitespace'); }
  if (model != null) { if (oneLine(model)) next.model = model; else errors.push('model name is empty or contains whitespace'); }
  if (protocol != null) { if (PROTOCOLS.includes(protocol)) next.protocol = protocol; else errors.push(`--protocol must be ${PROTOCOLS.join(' or ')}`); }
  for (const kv of [].concat(extra || [])) {
    const m = String(kv).match(/^([A-Z][A-Z0-9_]{1,63})=(.*)$/);
    if (!m) { errors.push(`--extra expects NAME=value with an UPPER_CASE name (got "${String(kv).split('=')[0]}")`); continue; }
    if (m[2] === '') delete next.extra[m[1]]; else if (oneLine(m[2])) next.extra[m[1]] = m[2]; else errors.push(`${m[1]} contains whitespace`);
  }
  for (const f of ['baseUrl', 'apiKey', 'model']) if (!next[f]) errors.push(`${f === 'baseUrl' ? '--base-url' : f === 'apiKey' ? '--api-key' : '--model'} is required for a new profile`);
  if (errors.length) return { ok: false, errors };
  next.provider = inferProvider(next.baseUrl);
  if (!next.protocol || (baseUrl != null && protocol == null)) next.protocol = inferProtocol(next.baseUrl);
  next.updatedAt = new Date().toISOString();
  cfg.profiles[profile] = next;
  cfg.active = profile;
  return { ok: true, file: saveConfig(cfg, env), profile, summary: summarize(next) };
}

export function getProfile(name, env = process.env) {
  const cfg = loadConfig(env);
  const p = cfg.profiles[name || env.DIP_LLM_PROFILE || cfg.active];
  return p?.apiKey && p?.baseUrl && p?.model ? p : null;
}

export function summarize(p) {
  return { provider: p.provider, protocol: p.protocol, baseUrl: p.baseUrl, model: p.model, apiKey: mask(p.apiKey), extra: Object.fromEntries(Object.entries(p.extra || {}).map(([k, v]) => [k, mask(v)])) };
}

export function clearApi(profile, env = process.env) {
  const cfg = loadConfig(env);
  const name = profile || cfg.active;
  if (!cfg.profiles[name]) return { ok: false, errors: [`no profile "${name}"`] };
  delete cfg.profiles[name];
  if (cfg.active === name) cfg.active = Object.keys(cfg.profiles)[0] || 'default';
  saveConfig(cfg, env);
  return { ok: true, profile: name };
}

export function loadCatalog() { return readJSON(CATALOG_PATH); }

/**
 * The variables each tool reads, filled from the profile. Variables already set in the shell win, so a
 * one-off `OPENAI_API_KEY=… dip exec …` still overrides the saved profile.
 * forIds limits the tool-specific mappings to those catalog entries; the generic set is always added.
 */
export function toolEnv(p, { forIds = [], base = process.env } = {}) {
  if (!p) return {};
  const val = { apiKey: p.apiKey, baseUrl: p.baseUrl, model: p.model, protocol: p.protocol };
  const out = { DIP_LLM_BASE_URL: p.baseUrl, DIP_LLM_API_KEY: p.apiKey, DIP_LLM_MODEL: p.model, DIP_LLM_PROVIDER: p.provider, DIP_LLM_PROTOCOL: p.protocol };
  if (p.protocol === 'anthropic') Object.assign(out, { ANTHROPIC_API_KEY: p.apiKey, ANTHROPIC_BASE_URL: p.baseUrl, ANTHROPIC_MODEL: p.model });
  else Object.assign(out, { OPENAI_API_KEY: p.apiKey, OPENAI_BASE_URL: p.baseUrl, OPENAI_API_BASE: p.baseUrl, OPENAI_MODEL: p.model });
  // Strix (Phase 11) reads a LiteLLM model string; "<protocol>/<model>" plus LLM_API_BASE reaches any compatible gateway.
  Object.assign(out, { STRIX_LLM: p.model.startsWith(`${p.protocol}/`) ? p.model : `${p.protocol}/${p.model}`, LLM_API_KEY: p.apiKey, LLM_API_BASE: p.baseUrl });
  const ids = new Set([].concat(forIds).flatMap((s) => String(s).split(',')).filter(Boolean));
  for (const e of loadCatalog().entries) {
    if (!e.llm?.env || (ids.size && !ids.has(e.id))) continue;
    for (const [k, field] of Object.entries(e.llm.env)) if (val[field]) out[k] = val[field];
  }
  Object.assign(out, p.extra || {});
  for (const k of Object.keys(out)) if (base[k]) delete out[k];
  return out;
}

/** Which selected catalog entries still lack something (e.g. jev-ultrafast needs TYPESAFE_API_KEY). */
export function llmReadiness(entries, env = process.env) {
  const p = getProfile(undefined, env);
  const needs = entries.filter((e) => e.llm);
  const missing = [];
  for (const e of needs) for (const k of e.llm.extraKeys || []) if (!p?.extra?.[k] && !env[k]) missing.push({ id: e.id, key: k, fix: `/dip-setapi --extra ${k}=<value>` });
  return { configured: Boolean(p), profile: p ? summarize(p) : null, needs: needs.map((e) => e.id), missing };
}

/** Run a command with the profile's variables injected. The key is never printed or logged. */
export function execWithApi(argv, { forIds, profile, cwd, logFile } = {}, env = process.env) {
  if (!argv.length) return { code: 2, error: 'nothing to run — usage: dip exec [--for <id>] -- <command> [args]' };
  const p = getProfile(profile, env);
  if (!p) return { code: 5, error: 'no LLM profile — run /dip-setapi (or: dip setapi --base-url … --api-key … --model …)' };
  const extra = toolEnv(p, { forIds, base: env });
  const r = run(argv[0], argv.slice(1), { cwd, inherit: true, timeout: 0, env: { ...env, ...extra }, logFile, redact: [p.apiKey, ...Object.values(p.extra || {})] });
  return { code: r.code };
}

/** Reachability check: GET <base>/models. Reports the HTTP status only — never the key or the body. */
export async function testApi(profile, env = process.env) {
  const p = getProfile(profile, env);
  if (!p) return { ok: false, detail: 'no profile configured' };
  const headers = p.protocol === 'anthropic' ? { 'x-api-key': p.apiKey, 'anthropic-version': '2023-06-01' } : { authorization: `Bearer ${p.apiKey}` };
  try {
    const res = await fetch(`${p.baseUrl}/models`, { headers, signal: AbortSignal.timeout(15000) });
    const ok = res.status < 400;
    return { ok, status: res.status, detail: ok ? 'gateway reachable, key accepted' : res.status === 401 ? 'key rejected' : res.status === 403 ? 'forbidden — the key lacks access, or a proxy/firewall blocked the request' : res.status === 404 ? 'no /models route — the gateway may still work for chat' : `HTTP ${res.status}` };
  } catch (e) { return { ok: false, detail: `request failed: ${e.cause?.code || e.name}` }; }
}

export function printProfile(name, p, file) {
  log.title(`LLM gateway — profile "${name}"`);
  const s = summarize(p);
  table(['FIELD', 'VALUE'], [['provider', s.provider], ['protocol', s.protocol], ['base URL', s.baseUrl], ['model', s.model], ['API key', s.apiKey],
    ...Object.entries(s.extra).map(([k, v]) => [k, v])]);
  if (file) log.info(`stored in ${file} (owner-only permissions; outside every project)`);
}

/** Read a secret from stdin (piped) or a hidden prompt (TTY). */
export async function readSecret(prompt) {
  if (!process.stdin.isTTY) return fs.readFileSync(0, 'utf8').trim();
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin; let buf = '';
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); process.stdout.write('\n'); resolve(buf.trim()); }
      else if (ch === '\u0003') { stdin.setRawMode(false); process.stdout.write('\n'); process.exit(130); }
      else if (ch === '\u007f' || ch === '\b') buf = buf.slice(0, -1);
      else buf += ch;
    };
    stdin.on('data', onData);
  });
}

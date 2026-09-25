// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Shared utilities: paths, colour output, process execution, hashing, file walking.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const IS_WIN = process.platform === 'win32';
export const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ---------------------------------------------------------------- colour
const useColor = (() => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0') return true;
  return Boolean(process.stdout.isTTY);
})();
const wrap = (open, close) => (s) => (useColor ? `\x1b[${open}m${s}\x1b[${close}m` : String(s));
export const c = {
  bold: wrap(1, 22), dim: wrap(2, 22),
  red: wrap(31, 39), green: wrap(32, 39), yellow: wrap(33, 39),
  blue: wrap(34, 39), magenta: wrap(35, 39), cyan: wrap(36, 39), gray: wrap(90, 39),
};

let quiet = false;
export function setQuiet(v) { quiet = Boolean(v); }
export const log = {
  title: (s) => { if (!quiet) console.log(`\n${c.bold(c.blue('▌'))} ${c.bold(s)}`); },
  step: (s) => { if (!quiet) console.log(`${c.cyan('›')} ${s}`); },
  ok: (s) => { if (!quiet) console.log(`${c.green('✔')} ${s}`); },
  warn: (s) => console.warn(`${c.yellow('!')} ${s}`),
  err: (s) => console.error(`${c.red('✖')} ${s}`),
  info: (s) => { if (!quiet) console.log(`  ${c.gray(s)}`); },
  raw: (s) => { if (!quiet) console.log(s); },
};

export const STATUS_COLOR = {
  VERIFIED: c.green, PRESENT: c.green, INSTALLED: c.green, CLONED: c.green, UPDATED: c.green, PINNED: c.green, OK: c.green, RAN: c.green, CLEAN: c.green,
  PARTIAL: c.yellow, SNAPSHOT: c.yellow, DIFFERS: c.yellow, SKIPPED: c.gray, 'N/A': c.gray, DRY: c.gray,
  MISSING: c.yellow, UNVERIFIED: c.yellow, OPEN: c.yellow, WARN: c.yellow, INCOMPLETE: c.yellow,
  BLOCKED: c.red, FAILED: c.red, CONFLICT: c.red, INVALID: c.red, DRIFT: c.red, FINDINGS: c.red, ERROR: c.red,
};
export function paintStatus(s) {
  const key = String(s).split(/[\s(]/)[0].toUpperCase();
  return (STATUS_COLOR[key] || ((x) => x))(s);
}

// Render a table. rows: array of arrays of strings. Colour codes are ignored for width.
const strip = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
export function table(headers, rows) {
  const all = [headers, ...rows].map((r) => r.map((x) => (x == null ? '' : String(x))));
  const w = headers.map((_, i) => Math.max(...all.map((r) => strip(r[i] || '').length)));
  const line = (r) => r.map((x, i) => x + ' '.repeat(Math.max(0, w[i] - strip(x).length))).join('  ');
  const out = [c.bold(line(headers)), c.gray(w.map((n) => '─'.repeat(n)).join('  ')), ...all.slice(1).map(line)];
  if (!quiet) console.log(out.join('\n'));
  return out.map(strip).join('\n');
}

// ---------------------------------------------------------------- process
// Resolve an executable on PATH (honours PATHEXT on Windows). Returns absolute path or null.
export function which(cmd) {
  if (!cmd) return null;
  if (path.isAbsolute(cmd)) return fs.existsSync(cmd) ? cmd : null;
  const exts = IS_WIN ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';') : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      const p = path.join(dir, cmd + ext);
      try { if (fs.statSync(p).isFile()) return p; } catch { /* keep looking */ }
    }
  }
  return null;
}

// Run a command without a shell (no injection surface). On Windows, .cmd shims need a shell.
export function run(cmd, args = [], opts = {}) {
  const resolved = which(cmd) || cmd;
  const needsShell = IS_WIN && /\.(cmd|bat)$/i.test(resolved);
  const started = Date.now();
  const r = spawnSync(needsShell ? `"${resolved}"` : resolved, needsShell ? args.map(quoteWin) : args, {
    cwd: opts.cwd, env: opts.env || process.env, encoding: 'utf8',
    timeout: opts.timeout ?? 10 * 60 * 1000, maxBuffer: 64 * 1024 * 1024,
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'], shell: needsShell,
    windowsHide: true,
  });
  const res = {
    cmd: [cmd, ...args].join(' '), code: r.status ?? (r.error ? 127 : 1), signal: r.signal || null,
    stdout: r.stdout || '', stderr: r.stderr || (r.error ? String(r.error.message) : ''),
    ms: Date.now() - started, timedOut: r.error?.code === 'ETIMEDOUT',
  };
  if (opts.logFile) appendCommandLog(opts.logFile, res, opts.redact);
  return res;
}
function quoteWin(a) { return /[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '""')}"` : a; }

export function appendCommandLog(file, res, redact = []) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let line = `${new Date().toISOString()}\texit=${res.code}\t${res.ms}ms\t${res.cmd}`;
    for (const secret of redact) if (secret) line = line.split(secret).join('***REDACTED***');
    fs.appendFileSync(file, line + '\n');
  } catch { /* evidence logging is best effort */ }
}

export function sleepMs(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

// ---------------------------------------------------------------- files
export function expandHome(p) { return p && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p; }
export function exists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
export function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
export function readJSON(p, fallback = undefined) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { if (fallback !== undefined) return fallback; throw e; }
}
export function writeJSON(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, p); // atomic replace
}
export function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

const DEFAULT_IGNORES = new Set(['.git', 'node_modules', '.DS_Store']);
// Recursive file list (relative, POSIX separators, sorted). Symlinks are not followed.
export function walk(dir, { ignore = DEFAULT_IGNORES, filter } = {}) {
  const out = [];
  const rec = (d, rel) => {
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (ignore.has(e.name)) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) rec(path.join(d, e.name), r);
      else if (e.isFile() && (!filter || filter(r))) out.push(r);
    }
  };
  rec(dir, '');
  return out.sort();
}
// Content hash of a directory tree (path + bytes of every file), stable across platforms.
export function hashDir(dir, { exclude = [] } = {}) {
  const h = crypto.createHash('sha256');
  const skip = new Set(exclude);
  let n = 0;
  for (const rel of walk(dir)) {
    if (skip.has(rel)) continue;
    h.update(rel + '\0'); h.update(fs.readFileSync(path.join(dir, rel))); h.update('\0'); n++;
  }
  return { hash: h.digest('hex'), files: n };
}
export function copyDir(src, dst) { fs.cpSync(src, dst, { recursive: true, force: true, dereference: false, errorOnExist: false }); }
export function timestamp() { return new Date().toISOString().replace(/[:.]/g, '-'); }

// Parse the YAML frontmatter `name:` / `description:` of a SKILL.md without a YAML dependency.
export function readFrontmatter(file) {
  let text; try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

export function normalizeRemote(u) {
  if (!u) return '';
  return u.trim().replace(/^git@github\.com:/i, 'https://github.com/').replace(/^ssh:\/\/git@github\.com\//i, 'https://github.com/')
    .replace(/\.git$/i, '').replace(/\/+$/, '').toLowerCase();
}

export function nodeMajor() { return Number(process.versions.node.split('.')[0]); }

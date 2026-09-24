// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// handoff.md — the file the next session reads first.
// `update` refreshes only the facts that can be read from git and the evidence log;
// the prose sections (goal, failed attempts, next steps) are never overwritten.

import fs from 'node:fs';
import path from 'node:path';
import { c, log, run, which, exists, readJSON } from './common.mjs';
import { paths } from './core.mjs';

export const HANDOFF_FILE = 'handoff.md';
export const SECTIONS = [
  { n: 1, key: 'goal', title: 'Goal' },
  { n: 2, key: 'state', title: 'Current state' },
  { n: 3, key: 'files', title: 'Active files' },
  { n: 4, key: 'changes', title: 'Changes made' },
  { n: 5, key: 'failed', title: 'Failed attempts' },
  { n: 6, key: 'next', title: 'Next steps' },
];
const MARK = (key) => `<!-- biswodip:${key} -->`;
const AUTO_OPEN = '<!-- biswodip:auto:start -->';
const AUTO_END = '<!-- biswodip:auto:end -->';

function git(root, args) { return which('git') && exists(path.join(root, '.git')) ? run('git', ['-C', root, ...args], { timeout: 30000 }) : { code: 1, stdout: '', stderr: 'not a git repository' }; }

/** Facts the tool can read for itself. Everything else is the agent's to write. */
export function gitFacts(root) {
  const one = (args, fallback = '—') => { const r = git(root, args); return r.code === 0 ? r.stdout.trim() || fallback : fallback; };
  const status = git(root, ['status', '--porcelain']);
  const changed = status.code === 0 ? status.stdout.split('\n').filter(Boolean).map((l) => ({ state: l.slice(0, 2).trim(), file: l.slice(3) })) : [];
  const hasCommit = git(root, ['rev-parse', '--verify', 'HEAD']).code === 0;
  return {
    isRepo: status.code === 0,
    hasCommit,
    branch: one(['rev-parse', '--abbrev-ref', 'HEAD']),
    commit: one(['rev-parse', '--short', 'HEAD']),
    subject: one(['log', '-1', '--format=%s']),
    committedAt: one(['log', '-1', '--format=%cI']),
    ahead: one(['rev-list', '--count', '@{u}..HEAD'], '?'),
    recent: (one(['log', '-8', '--format=%h %s'], '')).split('\n').filter(Boolean),
    changed,
    changedCount: changed.length,
  };
}

function evidenceFacts(root) {
  const P = paths(root);
  const out = { commands: 0, lastCommands: [], gateReports: [], strixRuns: [], lock: null };
  try {
    if (exists(P.commandLog)) {
      const lines = fs.readFileSync(P.commandLog, 'utf8').split('\n').filter(Boolean);
      out.commands = lines.length;
      out.lastCommands = lines.slice(-5);
    }
    if (exists(P.evidence)) {
      for (const e of fs.readdirSync(P.evidence)) {
        if (e.startsWith('security-gates-')) out.gateReports.push(`.biswodip/evidence/${e}/report.md`);
        if (e.startsWith('strix-')) out.strixRuns.push(`.biswodip/evidence/${e}`);
      }
    }
    const lock = readJSON(P.lock, null);
    if (lock) out.lock = lock.integrations.map((i) => `${i.name}: ${i.status} ${i.version}`);
  } catch { /* evidence is best effort */ }
  out.gateReports = out.gateReports.slice(-3);
  out.strixRuns = out.strixRuns.slice(-3);
  return out;
}

function autoBlock(root) {
  const g = gitFacts(root);
  const e = evidenceFacts(root);
  const L = [AUTO_OPEN, '', '> Facts below are refreshed by `biswodip handoff update`. Everything outside this block is written by hand — do not let the tool own your reasoning.', ''];
  if (g.isRepo) {
    L.push(g.hasCommit
      ? `- **Branch / commit:** \`${g.branch}\` @ \`${g.commit}\` — ${g.subject}`
      : `- **Branch / commit:** \`${g.branch}\` — no commits yet`);
    if (g.hasCommit) L.push(`- **Last commit at:** ${g.committedAt}${g.ahead !== '?' && g.ahead !== '—' ? ` · unpushed commits: ${g.ahead}` : ''}`);
    L.push(`- **Uncommitted changes:** ${g.changedCount}`);
    if (g.changed.length) {
      L.push('', '| State | File |', '|---|---|', ...g.changed.slice(0, 25).map((x) => `| \`${x.state || '??'}\` | \`${x.file}\` |`));
      if (g.changed.length > 25) L.push(`| … | ${g.changed.length - 25} more |`);
    }
    if (g.recent.length) L.push('', '**Recent commits**', '', ...g.recent.map((r) => `- \`${r}\``));
  } else L.push('- Not a git repository (or git unavailable) — record state by hand.');
  if (e.lock) L.push('', '**Integrations**', '', ...e.lock.map((x) => `- ${x}`));
  if (e.commands) L.push('', `**Evidence:** ${e.commands} commands logged in \`.biswodip/evidence/commands.log\``,
    ...e.lastCommands.map((x) => `  - \`${x.replace(/\t/g, ' · ')}\``));
  if (e.gateReports.length) L.push('', '**Gate reports**', '', ...e.gateReports.map((x) => `- \`${x}\``));
  if (e.strixRuns.length) L.push('', '**Strix runs**', '', ...e.strixRuns.map((x) => `- \`${x}\``));
  L.push('', `_Refreshed ${new Date().toISOString()}_`, '', AUTO_END);
  return L.join('\n');
}

const GUIDANCE = {
  goal: `_What are we trying to achieve, in the user's terms? Acceptance criteria, and what is explicitly out of scope. This section rarely changes._\n\n- **Objective:** TODO\n- **Acceptance criteria:** TODO\n- **Out of scope:** TODO`,
  state: `_Where things actually stand. Statuses only from evidence: VERIFIED / PARTIAL / UNVERIFIED / BLOCKED / OPEN._\n\n- **Lifecycle phase:** TODO\n- **Builds / tests:** TODO (command + exit code)\n- **Known broken:** TODO`,
  files: `_The few files in play, each with its role and state. Paths, not prose. Mark anything that must not be touched._\n\n| File | Role | State |\n|---|---|---|\n| \`TODO\` | | |`,
  changes: `_What actually changed, in order, and why. Commands run with exit codes. Evidence paths._\n\n1. TODO`,
  failed: `_What was tried and did not work, with the error — not "didn't work". This is what stops the next session burning context on your dead ends._\n\n- TODO (write "none yet" if nothing has failed)`,
  next: `_Ordered, specific, immediately actionable. First item should be runnable now. Include questions blocked on the user._\n\n1. TODO`,
};

export function template(root, project) {
  const L = [`# Handoff — ${project}`, '', `_Last updated: ${new Date().toISOString()}_`, '',
    'Read this first. Verify section 2 against the repository (`git status`, run the build) before trusting it, then continue from section 6.', ''];
  for (const s of SECTIONS) {
    L.push(`## ${s.n}) ${s.title}`, '', MARK(s.key), '');
    if (s.key === 'state') L.push(autoBlock(root), '');
    L.push(GUIDANCE[s.key], '');
  }
  L.push('---', '', '_Maintained with the Biswodip Goj Unified Engineering system (`biswodip handoff update`). No secrets in this file — reference the environment variable name instead._', '');
  return L.join('\n');
}

export function handoff(opts) {
  const root = path.resolve(opts.root || '.');
  const file = path.join(root, HANDOFF_FILE);
  const action = opts.action || 'update';
  const project = opts.project || readJSON(path.join(root, 'package.json'), {}).name || path.basename(root);

  if (action === 'show') {
    if (!exists(file)) { log.err(`no ${HANDOFF_FILE} in ${root} — run: biswodip handoff init`); return { code: 1 }; }
    process.stdout.write(fs.readFileSync(file, 'utf8'));
    return { code: 0 };
  }

  if (action === 'init' || !exists(file)) {
    if (exists(file) && !opts.force) { log.err(`${HANDOFF_FILE} already exists — use "handoff update", or --force to overwrite`); return { code: 1 }; }
    if (opts.dryRun) { log.info(`would create ${file}`); return { code: 0 }; }
    fs.writeFileSync(file, template(root, project));
    log.ok(`created ${HANDOFF_FILE} with the six sections — fill in Goal, Failed attempts and Next steps by hand`);
    return { code: 0, file };
  }

  // update: refresh the auto block and the timestamp, keep every hand-written line.
  let text = fs.readFileSync(file, 'utf8');
  const missing = SECTIONS.filter((s) => !text.includes(MARK(s.key)) && !new RegExp(`^##\\s*${s.n}\\)`, 'm').test(text));
  if (missing.length) log.warn(`sections not found in ${HANDOFF_FILE}: ${missing.map((m) => m.title).join(', ')} — they were not added, to avoid disturbing your layout`);

  const block = autoBlock(root);
  if (text.includes(AUTO_OPEN) && text.includes(AUTO_END)) {
    text = text.replace(new RegExp(`${AUTO_OPEN}[\\s\\S]*?${AUTO_END}`), () => block);
  } else {
    const anchor = text.match(new RegExp(`^##\\s*2\\).*$`, 'm'));
    if (anchor) text = text.replace(anchor[0], `${anchor[0]}\n\n${block}`);
    else text += `\n\n${block}\n`;
    log.info('inserted a refreshable facts block under section 2');
  }
  text = text.replace(/^_Last updated: .*_$/m, `_Last updated: ${new Date().toISOString()}_`);
  if (opts.dryRun) { log.info(`would update ${file}`); return { code: 0 }; }
  fs.writeFileSync(file, text);
  log.ok(`updated ${HANDOFF_FILE} — facts refreshed, your prose untouched`);
  log.info(`${c.bold('Before you stop:')} confirm sections 4, 5 and 6 are true. The next session will act on them.`);
  return { code: 0, file };
}

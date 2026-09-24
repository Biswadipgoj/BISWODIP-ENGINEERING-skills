// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Skill catalogue and builder. Each skill is installable on its own from GitHub
// (`npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING --skill <name>`) and carries
// only the files its phase needs, so an agent loads a small SKILL.md instead of the whole system.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PKG_ROOT, c, log, table, exists, isDir, readJSON, hashDir, copyDir, walk } from './common.mjs';

export const SKILLS_DIR = path.join(PKG_ROOT, 'skills');
export const SKILLS_SRC = path.join(PKG_ROOT, 'skills-src');
export const ROUTER = 'biswodip-unified-engineering';
const LEGAL = ['LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md'];
const TOOLING = ['bin', 'scripts', 'integrations/manifest.json', 'package.json'];

/** Soft budget: a SKILL.md above this many characters is flagged (≈ chars/4 tokens). */
export const SKILL_BUDGET_CHARS = 14000;

export const SKILLS = [
  {
    name: ROUTER,
    title: 'Unified Engineering (router)',
    description: "Biswodip Goj's evidence-driven engineering system: the laws, the 14 phases and the routing table. Use when asked to build, fix, harden, review, audit, pentest or release-gate a repository, or to make it production-ready. Loads the detail for one phase at a time instead of the whole system.",
    parts: [...LEGAL, ...TOOLING, { from: 'MASTER-PROMPT.md', to: 'references/MASTER-PROMPT.md' }, 'references', 'lifecycle', 'security', 'reports', 'integrations', 'docs/INSTALL.md'],
  },
  {
    name: 'biswodip-bootstrap',
    title: 'Bootstrap integrations',
    description: 'Detect and install the five upstream integrations (Taste, Emil Kowalski, No AI Slop, Headroom, Strix) into a project without duplicating what is already there. Use at the start of any engagement, or when asked to set up, install, detect or verify the engineering integrations and agent skills.',
    parts: [...LEGAL, ...TOOLING, 'integrations', { from: 'lifecycle/00-bootstrap.md', to: 'lifecycle/00-bootstrap.md' }, 'reports/INTEGRATION-RECORD-TEMPLATE.md', 'docs/INSTALL.md'],
  },
  {
    name: 'biswodip-security-review',
    title: 'Security review',
    description: 'Server-authoritative security review of a codebase: secrets, authentication, authorization, database, money, webhooks, API, files, abuse, errors, logging, supply chain, privacy and AI-feature security, each with an evidence-backed status. Use when asked to review, harden or audit security, check authorization, or find vulnerabilities in code.',
    parts: [...LEGAL, ...TOOLING, { from: 'MASTER-PROMPT.md', to: 'references/MASTER-PROMPT.md' }, 'security', 'references/03-threat-model-auth-financial.md', 'references/07-extended-hardening.md',
      'lifecycle/03-threat-model.md', 'lifecycle/08-security.md', 'reports/THREAT-MODEL-TEMPLATE.md', 'reports/AUTHORIZATION-MATRIX-TEMPLATE.md', 'reports/FINDING-TEMPLATE.md'],
  },
  {
    name: 'biswodip-pentest',
    title: 'Authorized pentest and fix loop',
    description: 'Run an authorized penetration test (Strix plus a manual adversarial pass) against a local or explicitly authorized target, then fix root causes and re-run the exploit. Use when asked to pentest, attack, break, exploit or security-test an application, or to fix and verify a security finding.',
    parts: [...LEGAL, ...TOOLING, 'security/ATTACK-CATALOG.md', 'references/02-master-shipping-gate.md', 'references/04-pentest-and-strix.md',
      'integrations/strix', 'lifecycle/09-pentest.md', 'lifecycle/10-fix.md', 'lifecycle/11-adversarial.md', 'reports/FINDING-TEMPLATE.md', 'reports/SECURITY-EXCEPTION-TEMPLATE.md'],
  },
  {
    name: 'biswodip-design-review',
    title: 'Design, accessibility and copy review',
    description: 'Review or build a UI so it is complete across every state, responsive, accessible, purposeful in motion and free of generic AI styling and slop copy, using the Taste, Emil Kowalski and No AI Slop skills. Use when asked to design, redesign, polish, improve the UI or UX, check accessibility, or make an interface not look AI-generated.',
    parts: [...LEGAL, 'references/06-design-engineering-and-distribution.md', 'lifecycle/06-design.md',
      'integrations/taste/README.md', 'integrations/emilkowalski/README.md', 'integrations/no-ai-slop/README.md', 'integrations/manifest.json'],
  },
  {
    name: 'biswodip-release-gate',
    title: 'Evidence matrix, score and release gate',
    description: 'Build the evidence matrix, score the work out of 100 from evidence with mandatory caps, answer the absolute release blockers and write the final report with one honest release status. Use when asked whether something is production-ready, to score or grade a repository, to run a release gate, or to write a release or audit report.',
    parts: [...LEGAL, 'references/02-master-shipping-gate.md', 'references/05-release-gate-baseline-templates.md',
      'lifecycle/12-score.md', 'lifecycle/13-release.md', 'reports'],
  },
  {
    name: 'biswodip-handoff',
    title: 'Handoff between sessions',
    description: 'Write or update handoff.md — goal, current state, active files, changes made, failed attempts, next steps — so the next session resumes without re-deriving context. Use when context is running out, when the user says continue later or starts a new chat, after a milestone, or when asked for a handoff, status file or session summary.',
    parts: [...LEGAL, ...TOOLING, 'reports/HANDOFF-TEMPLATE.md'],
  },
];

export function frontmatterFor(skill) {
  const pj = readJSON(path.join(PKG_ROOT, 'package.json'));
  if (/[<>]/.test(skill.description)) throw new Error(`${skill.name}: description must not contain angle brackets`);
  if (skill.description.length > 1024) throw new Error(`${skill.name}: description exceeds 1024 characters`);
  return ['---', `name: ${skill.name}`, `description: ${skill.description}`, 'license: Apache-2.0', 'metadata:',
    '  author: Biswodip Goj', `  version: ${pj.version}`, `  homepage: ${pj.homepage}`, '---', ''].join('\n');
}

function copyPart(part, out) {
  const spec = typeof part === 'string' ? { from: part, to: part } : { to: part.from, ...part };
  const src = path.join(PKG_ROOT, spec.from);
  if (!exists(src)) throw new Error(`skill part missing: ${spec.from}`);
  const dst = path.join(out, spec.to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (isDir(src)) copyDir(src, dst); else fs.copyFileSync(src, dst);
}

function buildOne(skill, out) {
  const body = fs.readFileSync(path.join(SKILLS_SRC, `${skill.name}.md`), 'utf8');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'SKILL.md'), frontmatterFor(skill) + body);
  for (const p of skill.parts) copyPart(p, out);
}

export function buildSkills({ check = false } = {}) {
  const rows = [];
  let drift = 0;
  const tmpRoot = check ? fs.mkdtempSync(path.join(os.tmpdir(), 'biswodip-skills-')) : null;
  try {
    for (const skill of SKILLS) {
      const out = check ? path.join(tmpRoot, skill.name) : path.join(SKILLS_DIR, skill.name);
      buildOne(skill, out);
      const live = path.join(SKILLS_DIR, skill.name);
      const built = hashDir(out);
      const ok = !check || (isDir(live) && hashDir(live).hash === built.hash);
      if (!ok) drift++;
      const skillMd = fs.statSync(path.join(out, 'SKILL.md')).size;
      rows.push([skill.name, `${Math.round(skillMd / 4)}`, String(built.files), skillMd > SKILL_BUDGET_CHARS ? c.yellow('OVER BUDGET') : (ok ? c.green(check ? 'in sync' : 'built') : c.red('DRIFT'))]);
    }
  } finally { if (tmpRoot) fs.rmSync(tmpRoot, { recursive: true, force: true }); }
  if (!check) {
    // Remove skill folders that are no longer in the catalogue.
    for (const e of (isDir(SKILLS_DIR) ? fs.readdirSync(SKILLS_DIR) : []))
      if (!SKILLS.some((s) => s.name === e)) { fs.rmSync(path.join(SKILLS_DIR, e), { recursive: true, force: true }); log.warn(`removed stale skill folder: ${e}`); }
    log.title(`Skills built — ${SKILLS.length}`);
    table(['SKILL', '~TOKENS', 'FILES', 'STATUS'], rows);
    log.info('Each SKILL.md is what an agent loads on trigger; everything else is read on demand.');
  }
  return { code: drift ? 1 : 0, rows, drift };
}

/** Markdown table of the catalogue, for README/docs generation and the context budget. */
export function catalogueTable() {
  return SKILLS.map((s) => {
    const md = path.join(SKILLS_DIR, s.name, 'SKILL.md');
    const size = exists(md) ? fs.statSync(md).size : 0;
    const files = isDir(path.join(SKILLS_DIR, s.name)) ? hashDir(path.join(SKILLS_DIR, s.name)).files : 0;
    return { name: s.name, title: s.title, tokens: Math.round(size / 4), files, description: s.description };
  });
}

export function skillNames() { return SKILLS.map((s) => s.name); }

export function largestReferences(n = 8) {
  const out = [];
  for (const dir of ['references', 'lifecycle', 'security', 'reports']) {
    for (const rel of walk(path.join(PKG_ROOT, dir))) {
      const p = path.join(PKG_ROOT, dir, rel);
      out.push({ file: `${dir}/${rel}`, tokens: Math.round(fs.statSync(p).size / 4) });
    }
  }
  return out.sort((a, b) => b.tokens - a.tokens).slice(0, n);
}

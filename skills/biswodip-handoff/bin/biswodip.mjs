#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Single cross-platform entry point. The scripts/*.sh and scripts/*.ps1 wrappers call this file.

import { parseArgs } from 'node:util';
import { c, log, setQuiet, nodeMajor } from '../scripts/lib/common.mjs';
import { detect, printDetect, install, verify, pkgVersion } from '../scripts/lib/core.mjs';

if (nodeMajor() < 18) { console.error(`Node.js >= 18 is required (found ${process.versions.node}).`); process.exit(2); }

const HELP = `
${c.bold('Biswodip Goj Unified Engineering')} v${pkgVersion()} — © 2026 Biswodip Goj · Apache-2.0

${c.bold('USAGE')}
  node bin/biswodip.mjs <command> [options]

${c.bold('COMMANDS')}
  detect            Detect upstream clones, agent skills, CLIs, Docker and env (never prints secret values)
  install           Clone EVERY upstream repo into <root>/.biswodip/upstream, verify, install skills, write lock
  verify            Verify an installed project against its lock file
  gates             Run automated security gates (secrets, risk hints, dependency audit, checks, Strix)
  strix             Guarded Strix pentest (loopback targets only unless --authorized-host)
  doctor            detect + actionable fixes
  handoff           Write or refresh handoff.md (init | update | show) so the next session resumes
  verify-package    Maintainer: verify this package (structure, licences, snapshots, scripts, sync)
  build-skill       Maintainer: rebuild all 7 skill folders from MASTER-PROMPT.md and skills-src/
  skills            List the installable skills with their context cost
  refresh-snapshots Maintainer: re-clone upstream repos into upstream/ and update the manifest
  help | version

${c.bold('COMMON OPTIONS')}
  --root <dir>              Target project (default: .)
  --only <ids>              Limit to integrations: taste,emilkowalski,headroom,strix,no-ai-slop
  --json                    Machine-readable output (detect/verify/gates)
  --quiet                   Less output

${c.bold('INSTALL OPTIONS')}
  --agent <name>            claude-code (default) | codex | cursor | agents
  --global                  Install skills to the user-level skill dir instead of the project
  --pinned                  Check out the exact commits recorded in integrations/manifest.json
  --update                  Fast-forward existing clones and replace differing skill copies
  --full                    Full history clones (default: shallow --depth 1)
  --offline                 Do not touch the network; use the bundled upstream/ snapshots
  --from-snapshot <dir>     Use a different snapshot directory
  --with-tools              Also install the Headroom and Strix CLIs (uv/pipx; Strix installer as fallback)
  --with-headroom-sdk       npm install headroom-ai into the target package.json (opt-in)
  --use-skills-cli          Additionally run 'npx skills add' for each skill repo
  --no-skills               Clone/verify only
  --no-commands             Do not install the /dip slash commands and @dip agent
  --no-self-skill           Do not install the Biswodip skill itself
  --retries <n>             Network retries per repo (default 3)
  --force                   Move a conflicting path aside instead of refusing
  --strict                  Non-zero exit if CLIs are missing (CI)
  --dry-run                 Print what would happen

${c.bold('GATES / STRIX OPTIONS')}
  --project-checks          Run package.json lint/typecheck/test/build scripts
  --skip-audit              Skip dependency audits
  --fail-on <sev>           low | medium | high (default) | critical
  --exclude <path>          Exclude a path from scanning (repeatable)
  --include-skills          Also scan vendored agent skill directories (.claude/skills, …)
  --strix                   (gates) also run the Strix runner
  --target-dir <dir>        Source directory for Strix (default: .)
  --app-url <url>           Running app URL (repeatable) — loopback only by default
  --openapi <file>          OpenAPI/Swagger spec target
  --mode <m>                quick (default) | standard | deep
  --budget <usd>            --max-budget passed to Strix (default 10)
  --instruction-file <f>    Strix instruction file (must not contain keys)
  --authorized-host <h>     Declare a non-loopback host you are explicitly authorized to test

${c.bold('HANDOFF')}
  node bin/biswodip.mjs handoff init --root .      Create handoff.md (6 sections)
  node bin/biswodip.mjs handoff update --root .    Refresh the facts, keep your prose
  node bin/biswodip.mjs handoff show --root .

${c.bold('EXIT CODES')}
  0 ok · 1 failure · 2 usage / Strix findings · 3 strict-mode warnings · 4 Strix incomplete · 5 blocked · 6 refused
`;

const options = {
  root: { type: 'string', default: '.' }, only: { type: 'string', multiple: true }, json: { type: 'boolean' }, quiet: { type: 'boolean' }, verbose: { type: 'boolean' },
  agent: { type: 'string', default: 'claude-code' }, global: { type: 'boolean' }, pinned: { type: 'boolean' }, update: { type: 'boolean' }, full: { type: 'boolean' },
  offline: { type: 'boolean' }, 'from-snapshot': { type: 'string' }, 'with-tools': { type: 'boolean' }, 'with-headroom-sdk': { type: 'boolean' },
  'use-skills-cli': { type: 'boolean' }, 'no-skills': { type: 'boolean' }, 'no-self-skill': { type: 'boolean' }, 'no-commands': { type: 'boolean' }, retries: { type: 'string', default: '3' },
  force: { type: 'boolean' }, strict: { type: 'boolean' }, 'dry-run': { type: 'boolean' }, title: { type: 'string' },
  'project-checks': { type: 'boolean' }, 'skip-audit': { type: 'boolean' }, 'include-skills': { type: 'boolean' }, 'fail-on': { type: 'string', default: 'high' }, exclude: { type: 'string', multiple: true },
  strix: { type: 'boolean' }, 'target-dir': { type: 'string' }, 'app-url': { type: 'string', multiple: true }, openapi: { type: 'string' },
  mode: { type: 'string', default: 'quick' }, budget: { type: 'string', default: '10' }, 'instruction-file': { type: 'string' }, 'authorized-host': { type: 'string', multiple: true },
  help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
};

let parsed;
try { parsed = parseArgs({ args: process.argv.slice(2), options, allowPositionals: true, strict: true }); }
catch (e) { console.error(`${e.message}\nRun: node bin/biswodip.mjs help`); process.exit(2); }
const v = parsed.values;
const cmd = parsed.positionals[0] || (v.version ? 'version' : 'help');
if (v.help) { console.log(HELP); process.exit(0); }
if (v.quiet || v.json) setQuiet(true);
if (!['quick', 'standard', 'deep'].includes(v.mode)) { console.error('--mode must be quick, standard or deep'); process.exit(2); }
if (!['low', 'medium', 'high', 'critical'].includes(v['fail-on'])) { console.error('--fail-on must be low, medium, high or critical'); process.exit(2); }

const o = {
  root: v.root, only: v.only, verbose: v.verbose, agent: v.agent, global: v.global, pinned: v.pinned, update: v.update, full: v.full, offline: v.offline,
  fromSnapshot: v['from-snapshot'], withTools: v['with-tools'], withHeadroomSdk: v['with-headroom-sdk'], useSkillsCli: v['use-skills-cli'],
  skills: !v['no-skills'], selfSkill: !v['no-self-skill'], commands: !v['no-commands'], retries: Number(v.retries), force: v.force, strict: v.strict, dryRun: v['dry-run'],
  projectChecks: v['project-checks'], skipAudit: v['skip-audit'], includeSkills: v['include-skills'], failOn: v['fail-on'], exclude: v.exclude, strix: v.strix,
  targetDir: v['target-dir'], appUrl: v['app-url'], openapi: v.openapi, mode: v.mode, budget: Number(v.budget), instructionFile: v['instruction-file'], authorizedHost: v['authorized-host'],
};

async function main() {
  switch (cmd) {
    case 'help': console.log(HELP); return 0;
    case 'version': console.log(pkgVersion()); return 0;
    case 'detect': { const d = detect(o); if (v.json) console.log(JSON.stringify(d, null, 2)); else printDetect(d); return 0; }
    case 'doctor': return doctor();
    case 'handoff': {
      const { handoff } = await import('../scripts/lib/handoff.mjs');
      const action = parsed.positionals[1] || 'update';
      if (!['init', 'update', 'show'].includes(action)) { console.error('handoff takes: init | update | show'); return 2; }
      return handoff({ ...o, action, project: v.title }).code;
    }
    case 'skills': {
      const { catalogueTable } = await import('../scripts/lib/skills.mjs');
      const rows = catalogueTable();
      if (v.json) { console.log(JSON.stringify(rows, null, 2)); return 0; }
      const { table } = await import('../scripts/lib/common.mjs');
      log.title('Installable skills');
      table(['SKILL', 'PURPOSE', '~TOKENS ON TRIGGER', 'FILES'], rows.map((r) => [r.name, r.title, String(r.tokens), String(r.files)]));
      log.info('Install all: npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING');
      return 0;
    }
    case 'install': return install(o).code;
    case 'verify': { const r = verify(o); if (v.json) console.log(JSON.stringify(r.report, null, 2)); return r.code; }
    case 'gates': { const { runGates } = await import('../scripts/lib/gates.mjs'); const r = runGates(o); if (v.json) console.log(JSON.stringify(r.report, null, 2)); return r.code; }
    case 'strix': { const { strixRun } = await import('../scripts/lib/strix.mjs'); return strixRun(o).code; }
    case 'verify-package': { const { verifyPackage } = await import('../scripts/lib/package.mjs'); return verifyPackage(o).code; }
    case 'build-skill': case 'build-skills': { const { buildSkills } = await import('../scripts/lib/skills.mjs'); return buildSkills().code; }
    case 'refresh-snapshots': { const { refreshSnapshots } = await import('../scripts/lib/package.mjs'); return refreshSnapshots(o).code; }
    default: console.error(`Unknown command "${cmd}". Run: node bin/biswodip.mjs help`); return 2;
  }
}

function doctor() {
  const d = detect(o);
  printDetect(d);
  const fixes = [];
  if (!d.env.git) fixes.push('Install git — required to clone the upstream repositories.');
  for (const r of d.records) {
    if (r.clone.status === 'MISSING') fixes.push(`${r.name}: not cloned → node bin/biswodip.mjs install --root ${o.root}`);
    if (r.clone.status === 'CONFLICT') fixes.push(`${r.name}: ${r.clone.path} is not a clone of ${r.repo} → inspect it, or re-run install with --force`);
    if (r.skills.missing.length) fixes.push(`${r.name}: missing skills ${r.skills.missing.join(', ')} → install (or --update)`);
    if (r.tool && !r.tool.found) fixes.push(`${r.name}: ${r.tool.command} CLI missing → install --with-tools (uses ${r.id === 'strix' ? 'pipx install strix-agent' : 'uv tool install "headroom-ai[all]"'})`);
  }
  if (!d.env.docker.running) fixes.push('Docker not running → required for local Strix scans (Phase 11 will be BLOCKED).');
  if (d.env.STRIX_LLM === 'missing' || d.env.LLM_API_KEY === 'missing') fixes.push('Set STRIX_LLM and LLM_API_KEY in the current shell only (never in committed files).');
  if (!d.self.locations.length) fixes.push('Biswodip skill not installed for this agent → install');
  log.title('Doctor');
  if (!fixes.length) log.ok('everything detected — ready');
  else fixes.forEach((f) => log.warn(f));
  return 0;
}

main().then((code) => process.exit(code ?? 0)).catch((e) => { log.err(e?.stack || String(e)); process.exit(1); });

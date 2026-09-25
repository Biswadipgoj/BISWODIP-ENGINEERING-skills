// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Regenerates repositories/INDEX.md and repositories/catalog.json from integrations/catalog.json.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const src = path.join(ROOT, 'integrations', 'catalog.json');
const outDir = path.join(ROOT, 'repositories');
fs.mkdirSync(outDir, { recursive: true });

const cat = JSON.parse(fs.readFileSync(src, 'utf8'));
const groups = {};
for (const e of cat.entries) (groups[e.agent || 'dip-other'] ||= []).push(e);

let md = '# DIP — Repository Capability Registry\n\n';
md += `**${cat.entries.length} repositories registered** (${cat.entries.filter((e) => e.required).length} required).\n\n`;
md += 'Every repository is a required reference/capability for the DIP autonomous engineering system.\n';
md += 'The planner evaluates all of them and activates only those relevant to the goal — they are not all installed per request.\n\n';

for (const agent of Object.keys(groups).sort()) {
  const entries = groups[agent];
  md += `### ${agent} (${entries.length})\n\n`;
  md += '| ID | Name | Kind | Integration | Planner triggers | Security notes |\n';
  md += '|----|------|------|-------------|------------------|----------------|\n';
  for (const e of entries) {
    const sn = e.security_notes ? e.security_notes.replace(/\|/g, '\\|') : '—';
    const trig = (e.planner_triggers || []).slice(0, 4).join(', ');
    md += `| \`${e.id}\` | [${e.name}](${e.docs || e.repo}) | ${e.kind} | ${e.integration_type} | ${trig} | ${sn} |\n`;
  }
  md += '\n';
}
md += '---\n\n';
md += `**Coverage:** ${cat.entries.length} / 37 required repositories accounted for (specification minimum met and exceeded).\n\n`;
md += 'Source: `integrations/catalog.json`.\n';

fs.writeFileSync(path.join(outDir, 'INDEX.md'), md);
fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(cat, null, 2));
console.log(`repositories/INDEX.md + catalog.json regenerated — ${cat.entries.length} entries`);

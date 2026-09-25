#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Run automated security gates (secrets, risk hints, dependency audit, project checks, Strix).
// Usage: node scripts/run-security-gates.mjs [root] [options]   (see: node bin/biswodip.mjs help)
const args = process.argv.slice(2);
if (args[0] && !args[0].startsWith('-')) args.splice(0, 1, '--root', args[0]);
process.argv = [process.argv[0], process.argv[1], 'gates', ...args];
await import('../bin/biswodip.mjs');

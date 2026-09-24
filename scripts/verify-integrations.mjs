#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
// Verify an installed project against .biswodip/integrations.lock.json.
// Usage: node scripts/verify-integrations.mjs [root] [options]   (see: node bin/biswodip.mjs help)
const args = process.argv.slice(2);
if (args[0] && !args[0].startsWith('-')) args.splice(0, 1, '--root', args[0]);
process.argv = [process.argv[0], process.argv[1], 'verify', ...args];
await import('../bin/biswodip.mjs');

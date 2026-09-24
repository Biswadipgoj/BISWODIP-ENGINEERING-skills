<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. This brief is Biswodip Goj's integration documentation; the upstream project belongs to its authors. -->

# Integration: No AI Slop

| | |
|---|---|
| **Upstream** | https://github.com/petergyang/no-ai-slop |
| **Author / licence** | Peter Yang · MIT |
| **Pinned commit** | see `integrations/manifest.json` → `no-ai-slop.snapshot.commit` |
| **Bundled snapshot** | `upstream/no-ai-slop/` |
| **Used in** | MASTER-PROMPT §43, Phase 8 (UI copy) and Phase 18 (final report) |

## What it provides
The `no-ai-slop` skill: edits a draft into sharper, more human writing while preserving the author's voice, or detects slop patterns without rewriting. It catches 20+ patterns — binary contrasts ("it's not X, it's Y"), throat-clearing openers, faux-insight setups, colon reveals, dramatic fragments, superficial analysis, importance puffery, weasel attribution, synonym cycling, fake-profound endings — and checks the fundamentals: lead with the point, active voice, concrete detail.

## Install
```bash
bash scripts/install-integrations.sh . --only no-ai-slop
npx skills add petergyang/no-ai-slop --skill no-ai-slop --global --yes
```

## How this system uses it
| Text | When |
|---|---|
| UI copy, empty states, error messages | Phase 8, step 9 |
| README, docs, comments that explain why | Phase 6 / §30 |
| Commit messages and PR descriptions | Phase 6 |
| Findings, evidence notes, the release report | Phase 18 / §34 |

Two modes: **edit** (default, minimum effective edit plus a "what changed" list) and **detect** (`is this slop?` — names and quotes each pattern, no rewrite).

## Boundaries
Editing text never changes a status. Clear writing does not upgrade `UNVERIFIED` to `VERIFIED` (§1.2), and no rewrite may soften a finding's severity or remove a caveat that is factually required. Technical accuracy outranks style: keep the exact route, command, exit code and commit.

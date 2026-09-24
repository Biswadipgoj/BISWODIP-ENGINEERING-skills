<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Context budget

Context is the scarce resource, not disk. Every file here is sized and placed so an agent loads
the least it can get away with and still be correct. Token figures are characters / 4.

## What loads when a skill triggers

| Skill | Purpose | ~tokens on trigger | Files carried |
|---|---|---:|---:|
| `biswodip-unified-engineering` | Unified Engineering (router) | **1,365** | 71 |
| `biswodip-bootstrap` | Bootstrap integrations | **848** | 37 |
| `biswodip-security-review` | Security review | **1,295** | 40 |
| `biswodip-pentest` | Authorized pentest and fix loop | **1,324** | 38 |
| `biswodip-design-review` | Design, accessibility and copy review | **931** | 10 |
| `biswodip-release-gate` | Evidence matrix, score and release gate | **1,105** | 16 |
| `biswodip-handoff` | Handoff between sessions | **932** | 27 |

One skill triggering costs roughly **848–1,365 tokens**.
Loading the whole catalogue would be ~7,800, and you never need to.

**Before v2.1.0** the single skill put the entire operating system — ~12,900 tokens — into context on
every trigger, whether the task was a release gate or a typo fix. That is the context rot this layout removes.

## The three tiers

1. **Skill body** (always loaded on trigger) — laws, phase order, routing, exit gates. Budget: 14,000 characters,
   enforced by `verify-package`; a skill over budget fails the check.
2. **Procedure files** (`lifecycle/*.md`, ~1–2k tokens each) — read the one phase you are running.
3. **Reference files** — read *sections*, never whole files.

## Read sections, not files

The largest files exist so your context does not have to hold them:

| File | ~tokens | How to read it |
|---|---:|---|
| `references/02-master-shipping-gate.md` | ~120,000 | `grep -n "^### " …` to list 120 domains, then `grep -n -A11 "^### Webhooks" …` |
| `references/MASTER-PROMPT.md` | ~12,900 | Jump to a section: `sed -n '/^## 11\./,/^## 12\./p'` |
| `references/06-design-engineering-and-distribution.md` | ~5,200 | Read §14.3 or §15.3 only |
| `security/*.md` | ~700–1,100 each | Small enough to read whole |
| `reports/*-TEMPLATE.md` | ~400–900 each | Read the one you are filling |

## Habits that keep the window clean

- Grep for the heading, read the block, close it. Never `cat` a reference file.
- One phase at a time. Finish it, record the evidence, then move on.
- Put evidence on disk (`.biswodip/evidence/`), not in the conversation. Reference the path.
- Run long commands through the tooling so output lands in files and only the verdict comes back.
- Use `--json` and `--quiet` when you only need the result.
- Write `handoff.md` at ~70% context, not at 95%. See the `biswodip-handoff` skill.
- Headroom (`headroom wrap claude`) compresses agent context further — an optimisation layer only,
  never a security control, and never allowed to drop a finding or an acceptance criterion.

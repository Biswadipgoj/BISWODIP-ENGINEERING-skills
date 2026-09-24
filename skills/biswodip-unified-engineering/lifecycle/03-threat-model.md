<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 03 — Threat model (Phase 4)

**Goal:** know what can be attacked, by whom, through which entry point, and what stops it.

Use `reports/THREAT-MODEL-TEMPLATE.md`. Full background: `MASTER-PROMPT.md` §5 and `references/03-threat-model-auth-financial.md`.

## Procedure
1. List **assets** (sessions, personal data, money, secrets, files, audit records, admin functions, backups).
2. List **actors**, including an authenticated low-privilege attacker, a compromised account, a malicious insider, a compromised dependency and — if the product uses an LLM — a prompt-injected agent.
3. Draw **trust boundaries**. The browser and any client are outside every one of them.
4. List **entry points**: UI, API, webhook, upload, import, URL fetch, job, cron, admin, CLI, queue, LLM prompt/tool surface.
5. For each sensitive asset, write one row: asset · actor · entry point · boundary · required authorization · abuse case · impact · preventive control · detection · recovery · verification evidence.
6. Mark which rows have **no control today** — those become MUST CHANGE items in the plan.
7. Decide the authentication strength proportional to the asset (`security/SERVER-AUTHORITY.md`).

## Exit gate
- [ ] Every sensitive operation has a named server-side control.
- [ ] Every abuse case has either a control or an explicit accepted risk with an owner.
- [ ] The threat model is written to `.biswodip/evidence/THREAT-MODEL.md`, not held in your head.

**Next:** `04-implement.md`.

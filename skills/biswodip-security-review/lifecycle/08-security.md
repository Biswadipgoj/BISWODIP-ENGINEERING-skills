<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 08 — Security review (Phase 10)

**Goal:** review the implementation against every applicable control before attacking it.

Work through `MASTER-PROMPT.md` §6–§17 and §28, the deep-dives in `security/`, and `references/07-extended-hardening.md`. Grep `references/02-master-shipping-gate.md` for the domains this repository actually has.

## Checklist by area
- **Server authority (§6):** no client-provided identity, role, tenant, ownership, price, amount or status trusted anywhere.
- **Secrets (§7):** nothing in source, bundles, source maps, logs, errors, images, CI output; public-prefixed env vars checked.
- **Authentication (§8):** sessions opaque and server-side, cookie flags set, rotation and revocation work, reset/MFA/OAuth flows tested, no tokens in Web Storage.
- **Authorization (§9):** deny by default, object-level checks, tenant isolation, no stale decisions — matrix written.
- **Database (§10):** parameterised queries, constraints, transactions, least-privilege credentials, RLS where used.
- **Money (§11):** exact arithmetic, server-owned state machine, idempotency, audit trail, reconciliation.
- **Webhooks (§12):** signature over raw body, timestamp window, event ID replay protection, idempotent processing.
- **API (§13):** schema validation, limits, CORS, CSRF, SSRF, mass assignment, error hygiene.
- **Files (§14):** type/size/content checks, safe storage, authorized download, traversal and archive defences.
- **Abuse (§15):** meaningful rate limits keyed correctly, bounded expensive operations.
- **Errors/logging (§16–§17):** no internals leaked, security events auditable, no secrets logged.
- **Supply chain (§28):** lockfile, audit output, pinned CI actions, reviewed install scripts.
- **AI features (§41):** prompt injection, tool least privilege, output handling, retrieval isolation, cost limits.

## Automated support
```bash
node <pkg>/bin/biswodip.mjs gates --root . --project-checks --fail-on high
```
Secret candidates are findings to confirm; risk hints are `UNVERIFIED` pointers for manual review. A clean scan proves nothing on its own.

## Exit gate
- [ ] Every applicable area reviewed with a status, not skipped silently.
- [ ] Findings recorded with file and line.
- [ ] Automated gate evidence saved under `.biswodip/evidence/`.

**Next:** `09-pentest.md`.

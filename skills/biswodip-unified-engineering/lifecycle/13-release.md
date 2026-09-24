<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 13 — Release gate and report (Phase 17–18)

**Goal:** one honest decision, and a report someone can act on.

## Final sequence
1. Build from a clean checkout.
2. Run unit, integration and security tests.
3. Scan dependencies and artifacts; inspect the built bundle for secrets.
4. Re-run the authorized adversarial tests on the release candidate.
5. Validate migrations, rollback and recovery; confirm a restore has actually been tested.
6. Validate observability and audit trails.
7. Review every unresolved finding and its documented status.
8. Record release evidence. Only then deploy.

## The report
Use `reports/RELEASE-REPORT-TEMPLATE.md` and §34. Run the copy through `no-ai-slop` (§43): lead with the decision, keep the detail concrete, no puffery. Include failures — a report that hides them is worthless.

## The decision — exactly one
- **RELEASE READY**
- **RELEASE READY WITH DOCUMENTED ACCEPTED RISKS**
- **NOT RELEASE READY**
- **BLOCKED — INSUFFICIENT EVIDENCE**

Never "looks good", "seems secure", "probably production ready", "should be fine", "everything is perfect".

## Exit gate
- [ ] Every blocker in §33 answered from evidence.
- [ ] Score, statuses and remaining risks stated.
- [ ] Evidence locations listed so another engineer can re-check them.
- [ ] The status word is one of the four above.

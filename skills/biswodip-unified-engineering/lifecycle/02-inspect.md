<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 02 — Inspect (Phase 2)

**Goal:** understand the repository as it is. No changes in this phase.

## Procedure
1. **Identity:** purpose, users, major workflows, critical operations, sensitive data, money flows, external integrations.
2. **Stack:** language, framework, runtime, package manager, database, ORM, frontend, backend, API style, auth, storage, deployment, CI/CD.
3. **Layout:** entry points, routing, middleware, configuration, environment files, build and test scripts, migrations, seeds, fixtures, docs.
4. **Dependencies:** direct, transitive risk, unused, outdated, duplicated, install scripts.
5. **Data flow:** trace `USER → CLIENT → API → AUTHN → AUTHZ → LOGIC → DB → EXTERNAL → RESPONSE` for at least the most sensitive workflow, and mark every trust boundary.
6. **Baseline:** run the project checks before changing anything and record the result — a failure that already existed is not caused by your change.
   ```bash
   node <pkg>/bin/biswodip.mjs gates --root . --project-checks
   ```
7. **Secrets:** locate where secrets come from without printing their values.
8. **Tests:** what exists, what is actually asserted, what is only mocked.

## Evidence to record
- `.biswodip/evidence/BASELINE.md`: commands run, exit codes, pre-existing failures.
- The traced data flow and trust boundaries (feed straight into `03-threat-model.md`).

## Exit gate
- [ ] You can describe the architecture without guessing.
- [ ] Baseline build/test state recorded.
- [ ] Sensitive operations and their current authorization are listed.
- [ ] Nothing was modified in this phase.

**Next:** `01-plan.md`.

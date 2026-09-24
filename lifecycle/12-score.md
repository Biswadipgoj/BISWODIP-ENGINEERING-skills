<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 12 — Evidence matrix and score (Phase 16–17)

**Goal:** a score that is a measurement, not a mood.

## Procedure
1. Build the evidence matrix (`reports/EVIDENCE-MATRIX-TEMPLATE.md`): every requirement and every applicable gate → implementation → test → result → evidence location → status.
2. Allowed statuses: `VERIFIED · PARTIAL · UNVERIFIED · BLOCKED · OPEN · N/A` (with a reason). `VERIFIED` requires implementation location, procedure, actual result, date/commit and artifact. Never convert `UNVERIFIED` to `VERIFIED` without new evidence.
3. Score each category 0–10 and weight it (§32): Security 25 · Correctness 20 · Reliability 15 · Test/evidence 15 · Architecture 10 · Performance 5 · Accessibility 5 · Design 5. A category with no evidence scores 0, not "probably fine".
4. Apply the mandatory caps — unresolved Critical, authorization bypass, exposed secret or unsafe financial transition caps the score at 49 and blocks release; unresolved High in an exposed path caps at 69; fabricated or missing critical evidence caps at 59.
5. Check the absolute release blockers (§33) one by one.

## Exit gate
- [ ] Matrix complete; no blank statuses.
- [ ] Score computed from the matrix, with the caps applied.
- [ ] Blocker list explicitly answered yes/no.

**Next:** `13-release.md`.

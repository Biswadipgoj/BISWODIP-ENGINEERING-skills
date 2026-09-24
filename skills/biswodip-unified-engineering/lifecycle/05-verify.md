<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 05 — Verify (Phase 7 & 14)

**Goal:** evidence that it works — and that it still works after the fixes.

## Procedure
1. Run everything the project has, and record the exact command and exit code:
   ```bash
   node <pkg>/bin/biswodip.mjs gates --root . --project-checks
   ```
   (build · typecheck · lint · unit · integration · API · migration · smoke.)
2. Test the four paths for each acceptance criterion: happy, failure, boundary, unauthorized.
3. Test malicious input, concurrency (N identical requests → exactly one effect) and recovery (kill between commit and provider call).
4. For UI work: mobile viewport, keyboard, slow network, refresh, back/forward, deep link.
5. Re-run this phase after every fix round (Phase 14) — the same commands, plus the regression tests added for each finding.

## Rules
- A failing test is investigated, never deleted, skipped or weakened to pass.
- A test that only asserts a mock proves nothing about the system.
- Coverage numbers are not evidence; assertions are.
- If a test cannot run in this environment, mark it `BLOCKED` with the reason.

## Evidence to record
- `.biswodip/evidence/` — command log, full output of failures, test summary per acceptance criterion.

## Exit gate
- [ ] Every acceptance criterion has a passing test or an explicit `UNVERIFIED`/`BLOCKED` status.
- [ ] No pre-existing failure was silently adopted as "expected".
- [ ] Exit codes recorded, not paraphrased.

**Next:** `06-design.md` (if UI changed), otherwise `07-performance.md`.

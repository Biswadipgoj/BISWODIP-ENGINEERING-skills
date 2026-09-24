<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 10 — Fix (Phase 13)

**Goal:** the root cause is gone, proven by re-running the original exploit.

## Per finding
1. **Reproduce** it yourself. If you cannot reproduce it, it is not confirmed — record it as `UNVERIFIED`, do not "fix" it blindly.
2. **Find the root cause.** Ask why the control was missing, not just where. A missing ownership check in one handler usually means several handlers are missing it.
3. **Fix at the right boundary** — server side for anything security-relevant. Never hide a symptom, never suppress a scanner rule to make it quiet.
4. **Add a regression test** that fails without the fix.
5. **Re-run the original exploit.** It must now fail.
6. **Test neighbouring variants:** another user, another tenant, another role, another verb, encoded input, concurrent duplicate, replay.
7. **Confirm legitimate functionality still works** — the authorized user must still be able to do the thing.
8. **Check for the same bug elsewhere** in the codebase.

## Closing a finding
A finding is closed only as **FIXED** (with regression evidence), or explicitly documented as **ACCEPTED RISK** (`reports/SECURITY-EXCEPTION-TEMPLATE.md`: owner, compensating controls, expiry), **BLOCKED**, or **UNVERIFIED**. Never silently dropped.

## Exit gate
- [ ] Every confirmed finding is FIXED or formally documented.
- [ ] Every fix has a regression test.
- [ ] No security control elsewhere was weakened to make the fix work.

**Next:** `05-verify.md` (regression), then `09-pentest.md` (re-run).

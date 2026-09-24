<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. Template: copy into the target repository and fill from evidence. -->

# Finding: <ID> — <title>

- **Severity:** Critical | High | Medium | Low  (and why that severity)
- **Asset:** <host / route / component / table>
- **Environment:** <local / staging — never production data>
- **Discovered by:** <manual attack / Strix run id / review>
- **Preconditions:** <account, role, tenant, state>

## Reproduction (safe, exact)
```text
1.
2.
3.
```

## Expected
<the secure behaviour>

## Observed
<the actual behaviour — what an attacker gets>

## Evidence
<request/response excerpt, log line, test output, artifact path. Never include real secrets — mask them.>

## Impact
<concrete: whose data, how much money, which privilege, what availability>

## Root cause
<why the control was missing or wrong — not just where>

## Fix
<the change, at which trust boundary, plus anywhere else the same pattern exists>

## Regression test
<test name and location; it must fail without the fix>

## Verification
- Commit/build: <sha>
- Original exploit re-run: <result>
- Neighbouring variants tested: <list>
- Legitimate functionality re-tested: <result>
- Verified by / date: <…>
- Residual risk: <…>

**Status:** FIXED | ACCEPTED RISK (see exception) | BLOCKED | UNVERIFIED

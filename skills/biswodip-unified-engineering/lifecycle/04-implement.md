<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 04 — Implement (Phase 6)

**Goal:** the smallest correct change that satisfies the plan, with security on the server side.

## Order of work
1. Preserve existing correct behaviour. Reuse what exists (§1.3).
2. Establish **server authority** first for anything sensitive: identity, ownership, role, tenant, money, state (`security/SERVER-AUTHORITY.md`).
3. Validate at every trust boundary — schema, type, range, size, encoding; reject unknown fields.
4. Authorize every privileged operation, deny by default (`security/AUTHORIZATION.md`).
5. Add transaction, idempotency and concurrency control wherever state can be duplicated or raced (`references/07-extended-hardening.md` §6, `security/FINANCIAL-SYSTEMS.md`).
6. Verify webhooks properly (`security/WEBHOOKS.md`).
7. Handle errors deliberately: safe outside, diagnosable inside, fail closed (§16).
8. Add observability without leaking secrets (§17).
9. Build the UI with complete states, keyboard access and purposeful motion (`06-design.md`).
10. Write tests for normal, boundary, hostile and unauthorized inputs as you go.

## Rules while editing
- Keep the frontend a presentation concern. It never becomes the source of truth.
- No new dependency without a documented reason (§28).
- No commented-out code, no debug routes, no development bypasses left behind (§26).
- Keep the diff reviewable; unrelated refactors go in their own change.
- Update documentation in the same change when behaviour changes (§30).

## Evidence to record
- Files changed and why (feeds the final report).
- Any deviation from the plan, with the reason.

## Exit gate
- [ ] Every acceptance criterion has an implementation.
- [ ] No security decision depends on client code.
- [ ] Nothing in DO NOT CHANGE was modified.
- [ ] The change builds locally.

**Next:** `05-verify.md`.

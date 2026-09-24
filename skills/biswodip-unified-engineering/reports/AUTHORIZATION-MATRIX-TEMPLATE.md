<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. Template: copy into the target repository and fill from evidence. -->

# Authorization Matrix — <project>

Legend: `A` allowed · `O` allowed only for objects the caller owns · `T` allowed within the caller's tenant only · `—` denied · `S` step-up/re-auth required

| # | Operation (method + route / action) | Object owner rule | Anonymous | User | Privileged | Admin | Service | Tested? | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `GET /api/orders/:id` | order.userId == session.userId | — | O | T | T | — | | |
| 2 | | | | | | | | | |

## Rules applied
- Deny by default; the decision is server-side and re-evaluated per request.
- Tenant resolved from the session, never from the request.
- Property-level: which fields each role may write.

## Test evidence
| Test | From | Target | Expected | Result |
|---|---|---|---|---|
| Horizontal IDOR | user A | user B's object | 403/404, no data, no side effect | |
| Vertical escalation | user | admin route | 403 | |
| Cross-tenant | admin t1 | object in t2 | 403/404 | |
| Property escalation | user | `role` in update body | ignored | |
| Stale authorization | downgraded user | privileged action | 403 | |

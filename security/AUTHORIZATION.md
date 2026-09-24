<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Authorization

Deny by default. Evaluate server-side, at the operation boundary, for every request.

## The four questions per endpoint
1. Who may call this at all? (function-level)
2. Who owns this object? (object-level)
3. Which fields may this caller change? (property-level)
4. What happens across a tenant boundary?

## Build an authorization matrix
Use `reports/AUTHORIZATION-MATRIX-TEMPLATE.md`: one row per operation, one column per role, with the ownership/tenant condition written out. Anything blank is a finding waiting to happen.

## Implementation rules
- Centralise the decision (policy/guard/middleware) and make the default path a denial.
- Fetch the object first, then check it: `findOne({ id, ownerId: session.userId })` beats `findOne({ id })` plus a later `if`.
- Never rely on route obscurity, hidden UI, a disabled button, a client role claim, or an unguessable id.
- Re-check on every request. Cached decisions must be invalidated on role, membership and status changes.
- Apply the same checks to background jobs, exports, downloads, admin APIs, GraphQL resolvers and websocket events.
- Mass assignment: allowlist assignable fields per role; never spread the request body into the model.
- Record denials as audit events (§17) — they are your detection signal.

## Multi-tenancy
- Resolve the tenant from the session, never from a header or body field.
- Put the tenant condition in the query, not in application code after the fetch.
- Consider database-level defence too (row-level security), but do not let it replace application checks.
- Test with two tenants that have identically-shaped data and sequential ids.

## Tests
- Horizontal: user A reads/updates/deletes user B's object.
- Vertical: a normal user calls admin endpoints; a read-only role performs writes.
- Property: a normal user sends `role`, `ownerId`, `tenantId`, `status` in an update.
- Cross-tenant: admin of tenant 1 acts on an object of tenant 2.
- Post-change: token issued before a downgrade still used after it.
- Every one of these must produce no data, no side effect and an audit record.

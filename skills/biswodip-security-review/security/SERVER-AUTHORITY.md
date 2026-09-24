<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Server Authority

The client is untrusted. Everything below is decided by the server, from server state, on every request.

## Never authoritative from the client
`userId` · `accountId` · `tenantId` · `organizationId` · `role` · `permissions` · `isAdmin` · `isOwner` · `isVerified` · `subscriptionTier` · `plan` · `price` · `amount` · `currency` · `fee` · `discount` · `balance` · `paymentStatus` · `transactionStatus` · `ownerId` · `createdBy` · `status` · `expiresAt`.

A field may be *sent* by the client as a request (which order, which quantity). It may never be *believed* as a fact (which price, whose order).

## Pattern
```text
1. Authenticate      → server resolves the session to a user id from its own store
2. Load              → fetch the object by id from the database
3. Authorize         → compare the object's owner/tenant/state against the resolved user
4. Compute           → derive price, fee, balance, permissions from server data
5. Validate          → schema + business invariants on what the client asked for
6. Act               → inside a transaction, with idempotency where state changes
7. Audit             → record who did what to which object, and when
```

## Anti-patterns seen in real repositories
- `if (req.body.isAdmin) { … }` — the client declaring its own role.
- `where: { id: req.body.orderId }` with no owner condition — IDOR.
- Reading the tenant from a header the client controls.
- `const total = req.body.total` — the client pricing its own cart.
- Hiding an admin button in the UI and leaving the endpoint open.
- A "trusted" internal header (`X-Internal: true`) that an external request can also set.
- Re-using a cached permission decision after a role change.
- Treating a valid session as permission to touch any object ("authentication is not authorization").

## Sessions and tokens
- Browser sessions: opaque random identifier → server-side session record (user id, assurance level, created/idle/absolute expiry, `revoked_at`, rotation metadata).
- Cookie flags: `HttpOnly`, `Secure`, `SameSite`, narrow `Path`, host-only (`__Host-` prefix where possible).
- Rotate on login and privilege change; revoke server-side on logout, password change, MFA change, recovery.
- Never store JWT access or refresh tokens in Local Storage, Session Storage, IndexedDB, URLs or readable cookies.
- A cookie is still a bearer credential: reduce exposure, do not claim it cannot be stolen.
- Service-to-service: short-lived credentials, scoped per service, never the user's token replayed onward with more privilege.

## Tests
- Substitute another user's id in every parameter; expect 403/404 with no data leak and no side effect.
- Send each forbidden field above from a low-privilege account; expect the value to be ignored, not applied.
- Use a session after logout, after password change, after role downgrade; expect rejection.
- Call every privileged endpoint unauthenticated; expect rejection before any work happens.

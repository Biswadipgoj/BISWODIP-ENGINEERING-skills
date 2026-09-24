<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj. Part of the Biswodip Goj Unified Engineering Skill. Content carried forward from v1.2.0 sections 3-5. -->

## 3. Threat Model

# Threat Model

## Trust boundary

```text
UNTRUSTED BROWSER / MOBILE UI
        |
        | hostile input, replay, modified requests
        v
SERVER / API / APPLICATION LOGIC
        |
        +--> DATABASE
        +--> OBJECT STORAGE
        +--> PAYMENT / BANK / CRYPTO PROVIDER
        +--> EMAIL / NOTIFICATION PROVIDER
        +--> JOB / QUEUE SYSTEM
```

The browser is never an authority. A request being made by the legitimate UI does not make the request trustworthy.

## Assets

- identities and sessions
- authorization and tenant membership
- personal/customer data
- secrets and credentials
- financial balances and ledger records
- payment/provider state
- uploaded files
- audit records
- backups and exports
- operational infrastructure

## Primary attacker capabilities

Assume an attacker can:
- modify every client-side field
- call APIs without the UI
- replay requests
- reorder requests
- create concurrent requests
- tamper with cookies and headers within browser constraints
- upload hostile files
- manipulate URLs and redirect targets
- submit malformed or oversized input
- discover undocumented endpoints
- observe public responses and timing
- obtain a legitimate low-privilege account

## Security objectives

1. Confidentiality: unauthorized actors cannot read protected data.
2. Integrity: unauthorized actors cannot alter protected data or financial state.
3. Authenticity: identity assertions are server-verified.
4. Authorization: every protected action is evaluated server-side.
5. Availability: abuse cannot trivially exhaust finite resources.
6. Accountability: sensitive actions produce tamper-resistant audit evidence.
7. Recoverability: incidents can be contained, credentials revoked and data restored.

---

## 4. Browser Authentication & Session Architecture

# Browser Authentication & Session Architecture

## Required model

Do not use JWT access/refresh tokens as browser storage credentials.

Preferred web model:

```text
Browser
  |
  | HTTPS request + opaque random session identifier
  v
Server
  |
  +--> server-side session store
          - session id hash / lookup key
          - user id
          - authentication assurance
          - created / idle / absolute expiry
          - revoked_at
          - rotation metadata
```

The browser cookie, if used, is only an opaque reference. It must not contain authorization claims that the server blindly trusts.

## Cookie baseline

- `HttpOnly`
- `Secure`
- host-only where possible
- narrow `Path`
- appropriate `SameSite`
- short idle timeout
- bounded absolute lifetime
- rotation after login and privilege changes
- server-side revocation
- invalidate on logout
- invalidate affected sessions after credential/security changes

A cookie is still a bearer credential. The objective is to reduce exposure and make theft harder to exploit, not to claim impossibility of compromise.

## Authorization

Never accept these as authoritative from the client:

`userId`, `accountId`, `tenantId`, `role`, `permissions`, `isAdmin`, `isOwner`, `balance`, `amount`, `currency`, `price`, `discount`, `fee`, `paymentStatus`, `verified`, `subscriptionTier`.

Resolve them from server-side records and enforce ownership/permission checks at the operation boundary.

## High-assurance authentication

For sensitive applications consider phishing-resistant WebAuthn/passkeys, step-up authentication and device/session management. Authentication strength must be proportional to the protected asset.

---

## 5. Financial / Bank / Crypto-like Security

# Financial / Bank / Crypto-like Security Rules

This policy applies whenever an application handles balances, transfers, payments, deposits, withdrawals, invoices, refunds, credits, financial positions, wallets or other high-integrity state.

## Server-authoritative invariant

The client requests an operation. The server decides whether it is legal.

Never trust client-calculated:
- balance
- available balance
- amount
- fee
- exchange rate
- currency conversion
- payment status
- settlement status
- wallet ownership
- account ownership
- transaction state

## Monetary representation

Use integer minor units or exact decimal arithmetic. Never use binary floating point for money.

Every monetary operation validates:
- currency
- precision
- sign
- minimum/maximum
- account ownership
- available funds where applicable
- current state
- authorization
- idempotency key

## Transaction state machine

Define an explicit server-owned state machine, for example:

`CREATED → AUTHORIZED → SUBMITTED → PROVIDER_PENDING → CONFIRMED`

with explicit failure, cancellation, reversal and reconciliation states as required by the provider and product.

Reject illegal transitions. Never let the browser choose the state.

## Idempotency and concurrency

State-changing financial endpoints must have:
- idempotency keys
- uniqueness constraints where appropriate
- database transactions
- concurrency control
- safe retry semantics
- duplicate-request tests
- out-of-order event handling

## Webhooks

Verify provider signatures and timestamps according to provider documentation. Track provider event IDs. Reject/reconcile replays. Validate schemas and payload sizes. Make processing idempotent. Handle retries, delayed success, duplicates and out-of-order events.

## Reconciliation

Do not assume the provider response, webhook, internal record and ledger are permanently synchronized. Build reconciliation and exception handling for mismatches.

## Secrets

Provider credentials stay server-side and outside source control. Never return them to the browser or log them.

## Testing

Use provider sandbox/test instruments and synthetic data. Never use real customer funds for security tests.

---


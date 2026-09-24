<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Financial Systems

Applies to balances, transfers, payments, deposits, withdrawals, invoices, refunds, credits, wallets, positions, and any point system with monetary value.

## Representation
- Integer minor units (`amount_cents BIGINT`) or an exact decimal type. Never binary floating point.
- Currency stored with the amount; never assume a default.
- Validate on every operation: currency, precision, sign, minimum, maximum, ownership, available funds, current state, authorization, idempotency key.

## Server-owned state machine
```text
CREATED → AUTHORIZED → SUBMITTED → PROVIDER_PENDING → CONFIRMED
   ↘ FAILED    ↘ CANCELLED    ↘ REVERSED / REFUNDED    ↘ RECONCILIATION_REQUIRED
```
- Transitions are validated server-side; illegal transitions are rejected and logged.
- The browser never chooses a state. `HTTP 200` is not a payment. A client saying "success" is not a payment.
- Only trusted server or provider evidence moves money.

## Idempotency and concurrency
- Every state-changing endpoint takes an idempotency key; the same key returns the original result and never performs the action twice.
- Enforce uniqueness in the database (unique constraint), not only in application code.
- Wrap multi-step changes in a transaction; take a row lock (`SELECT … FOR UPDATE`) or use optimistic versioning for balance updates.
- Test: fire N concurrent identical requests; exactly one effect, N consistent responses.

## Ledger and audit
- Append-only records. No updates, no deletes; corrections are new compensating entries.
- Double-entry where a real ledger exists: every movement has a matching pair and the sum is invariant.
- Record actor, object, amount, currency, before/after state, provider reference, timestamp and correlation id.

## Provider integration
- Verify webhooks (`WEBHOOKS.md`), and prefer re-fetching the object from the provider API before acting.
- Handle timeout-then-late-success, duplicate delivery, out-of-order events, partial refunds and disputes.
- Reconcile: provider record vs internal record vs ledger, on a schedule, with an exception queue for mismatches. Do not assume they stay in sync.

## Testing
- Provider sandbox instruments and synthetic data only. Never real funds or real customer financial data to prove a vulnerability.
- Attack list: amount/currency/fee tampering; negative, zero, overflow and precision-edge amounts; duplicate submission; idempotency-key reuse with a different body; concurrent races; illegal transitions; unauthorized refund; forged/replayed/out-of-order webhooks; cross-tenant access; audit-log tampering.

<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Webhooks

A request that reaches your endpoint proves nothing about who sent it.

## Verification order
1. Read the **raw** body before any JSON parsing or middleware rewrites it.
2. Verify the provider signature over that raw body with a constant-time comparison.
3. Check the timestamp against a tolerance window (e.g. ±5 minutes) to limit replay.
4. Enforce a maximum payload size and a strict schema; reject unknown or malformed events.
5. Look up the provider event id; if it has been processed, acknowledge and stop (idempotency).
6. Persist the event, acknowledge quickly (2xx), then process asynchronously.
7. Where the stakes are high, re-fetch the object from the provider API instead of trusting the payload.

## Rules
- The signing secret lives in the environment or a secret manager, is rotatable, and is never logged.
- Never accept an unsigned "test" mode in production, and never skip verification behind a feature flag.
- Never trust an IP allowlist alone.
- Processing must be idempotent: the same event delivered five times changes state once.
- Handle out-of-order delivery: compare event timestamps/sequence to current state and ignore stale transitions.
- Handle retries: providers retry on any non-2xx, including your timeout.
- Failures go to a dead-letter store with alerting, never to a silent catch.
- Log the event id and type, never the full payload if it contains personal or payment data.

## Tests
- Wrong signature, missing signature, empty signature → rejected.
- Valid signature, stale timestamp → rejected.
- Same event id twice, and twice concurrently → one state change.
- Events delivered out of order → final state correct.
- Oversized payload → rejected before parsing.
- Unknown event type → ignored safely, recorded.
- Slow handler → provider retry does not duplicate the effect.

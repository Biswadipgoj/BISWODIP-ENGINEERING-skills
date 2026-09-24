<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Data Protection

## Inventory first
For every category of personal or sensitive data: what it is, where it is stored (database, logs, cache, queue, backups, analytics, third parties), who can read it, why it is collected, and how long it is kept.

## Minimise
- Do not collect what the product does not need. Do not log personal data by default.
- Redact structurally in logs and error trackers (allowlist fields, not blocklist).
- Truncate or tokenise identifiers where the full value is not needed (last four digits, not the card number).
- Keep test and staging free of unmasked production data unless explicitly authorized.

## Protect
- TLS 1.2+ everywhere, including internal hops where the network is not trusted.
- Encrypt sensitive stores at rest; keep keys outside the application database, rotatable.
- Least-privilege database and storage credentials; separate credentials per service.
- Object storage: private by default, authorized access, signed URLs with short expiry, no directory listing.
- Access to production data is logged and attributable to a person.

## Lifecycle
- Retention periods defined per category, enforced by a job, not by intention.
- Deletion and export requests must be implementable end to end, including backups within a stated window.
- Backups are encrypted, access-controlled, and **restore-tested** — an untested backup is not a backup.
- Document sub-processors and what is sent to each.

## Regimes
Identify what applies (GDPR, India DPDP Act, CCPA, HIPAA, PCI DSS, sector rules). Map controls to requirements and mark the rest `UNVERIFIED`. This system produces engineering evidence; it does not certify legal compliance, and no report from it may claim that it does.

## Tests
- Fetch another user's personal record through every endpoint, export and download.
- Confirm deletion actually removes data from primary, derived and cached stores.
- Grep logs, error tracker payloads and analytics events for personal data and secrets.
- Confirm an unauthenticated request cannot read an object-storage URL that was meant to be signed.
- Restore a backup into a scratch environment and verify integrity.

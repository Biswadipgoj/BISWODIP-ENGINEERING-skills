<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 11 — Adversarial break test (Phase 12)

**Goal:** you, deliberately trying to break what you just built. Manual, on an authorized target, regardless of what any scanner reported.

Full catalogue: `security/ATTACK-CATALOG.md`; 1,200 attack-variant gates in `references/02-master-shipping-gate.md` (items 1016–2215).

## Run these, from a second low-privilege account
1. Substitute another user's object ID in every read, write, export and download.
2. Substitute another tenant's ID. Remove the tenant field entirely.
3. Call every admin route with a normal account, with no session, and with an expired one.
4. Send a request the disabled UI button would have sent.
5. Change amount, price, currency, fee, discount, status, role, `isAdmin`, owner in the body, query and headers.
6. Replay a successful state-changing request. Send it twice concurrently. Reuse the idempotency key with a different body.
7. Forge a webhook; replay a real one; deliver events out of order; deliver a duplicate.
8. Upload the wrong type, a huge file, a polyglot, an archive with `../` paths, a zip bomb, a scripted SVG.
9. Request `../../etc/passwd` and its encoded variants on every path parameter.
10. Point every URL-fetching feature at `http://169.254.169.254/`, at `localhost`, and at a redirect to them.
11. Inject into queries, commands, templates and the search/filter/sort parameters.
12. Force errors and read them for stack traces, SQL, paths, versions and internal IDs.
13. Read the client bundle and source maps for secrets and hidden endpoints.
14. Use the session after logout, after password change, after role downgrade.
15. Page, filter, sort and export beyond the intended limits; request page size 1000000.
16. Exhaust something: expensive query, upload, export, email, job queue, LLM tokens.
17. If the product has an LLM feature: inject instructions through ingested content, exfiltrate via rendered links, force a privileged tool call, retrieve another tenant's document.

## Recording
Every attempt gets a row: attack · precondition · expected · observed · verdict. Both outcomes are evidence — "attempted and rejected" is the result you want, and it must be written down to count.

## Exit gate
- [ ] All applicable attacks attempted, with results recorded.
- [ ] Every success is a finding in `10-fix.md`.
- [ ] Nothing was tested against a system you are not authorized to test.

**Next:** `10-fix.md`.

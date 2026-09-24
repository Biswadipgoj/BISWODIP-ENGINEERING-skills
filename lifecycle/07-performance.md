<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 07 — Performance and context efficiency (Phase 9)

**Goal:** measured performance, not guessed optimisation.

## Procedure
1. **Measure first.** Record the numbers before touching anything: API p50/p95/p99, query counts, bundle size, Core Web Vitals (LCP, INP, CLS), memory.
2. Look for the usual suspects: N+1 queries, missing indexes, unbounded result sets, oversized payloads, unnecessary client JavaScript, unoptimised images, polling that should be an event, missing cache, cache that leaks between users.
3. Fix the biggest measured cost first. Re-measure after each change and keep both numbers.
4. Bound everything that touches the network or the disk: timeouts, retry caps with jitter, pagination limits, concurrency limits, body size limits.
5. Test on a throttled connection and a mid-range device, not only on a fast laptop.

## Headroom (agent context efficiency)
Headroom compresses the agent's own context; it is not part of the product and never a security control.
```bash
headroom doctor          # health check
headroom wrap claude     # wrap the agent session
```
Keep two layers: **authoritative state** (files, test output, findings, config) and **compressed working context**. When they disagree, retrieve the authoritative state and trust it. Never let compression drop a security requirement, an acceptance criterion, a finding, exact error evidence or a test failure. Do not claim token savings you have not measured.

## Exit gate
- [ ] Before/after numbers recorded for every optimisation.
- [ ] No security control, test or business rule removed for speed.
- [ ] Expensive paths are bounded.
- [ ] Remaining known costs documented rather than hidden.

**Next:** `08-security.md`.

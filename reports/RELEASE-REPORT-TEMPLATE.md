<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. Template: copy into the target repository and fill from evidence. -->

# Release Report — <project>

- **Date / commit / build:** <iso date> · `<sha>` · `<build id>`
- **Prepared by:** <agent/engineer>  · **Authorized by:** <owner>
- **Scope run:** full lifecycle / narrowed (<which phases, why>)
- **Environments used:** <local / staging / sandbox>

## 1. Decision
**RELEASE STATUS:** `RELEASE READY` | `RELEASE READY WITH DOCUMENTED ACCEPTED RISKS` | `NOT RELEASE READY` | `BLOCKED — INSUFFICIENT EVIDENCE`

**Final score:** <n>/100 (caps applied: <yes/no — which>)

One paragraph: what was done, what it means for release, what remains. No puffery, no hedging.

## 2. Project and stack
<purpose, users, critical operations, sensitive data, money flows, stack, deployment>

## 3. Integrations
| Integration | Status | Version | Source | Location | Action taken |
|---|---|---|---|---|---|
| Taste Skill | | | | | |
| Emil Kowalski Skills | | | | | |
| No AI Slop | | | | | |
| Headroom | | | | | |
| Strix | | | | | |

## 4. What was inspected
<files, services, routes, schemas, jobs, configs, CI — and the baseline state before changes>

## 5. What changed and why
| Change | Files | Reason | Risk | Rollback |
|---|---|---|---|---|

Dependencies added/removed and their justification: <…>

## 6. Architecture and trust-boundary decisions
<decisions taken, alternatives rejected, where authority now lives>

## 7. Verification
| Command | Exit code | Result |
|---|---|---|

Acceptance criteria: | Criterion | Test | Status |

## 8. Security testing
- Manual adversarial attempts: <table or reference to evidence file>
- Strix: mode, scope, budget, run status, exit code, artifacts path
- Findings summary: <n critical / n high / n medium / n low>

## 9. Findings and fixes
| ID | Severity | Asset | Root cause | Fix | Regression test | Status |
|---|---|---|---|---|---|---|

## 10. Regression results
<what was re-run after fixes, and the outcome>

## 11. Performance
| Metric | Before | After | Method |
|---|---|---|---|

## 12. Design and accessibility
<states implemented, responsive checks, keyboard pass, reduced motion, contrast, remaining issues>

## 13. Score by category (evidence-backed)
| Category | Weight | Score /10 | Weighted | Evidence |
|---|---:|---:|---:|---|
| Security | 25 | | | |
| Correctness / business integrity | 20 | | | |
| Reliability | 15 | | | |
| Test / evidence quality | 15 | | | |
| Architecture / maintainability | 10 | | | |
| Performance | 5 | | | |
| Accessibility / responsive UX | 5 | | | |
| Design / interaction | 5 | | | |
| **Total** | **100** | | | |

## 14. Release blockers (§33)
| Blocker | Present? | Evidence |
|---|---|---|

## 15. Remaining risks, BLOCKED and UNVERIFIED items
<each with owner, reason and what would resolve it>

## 16. Evidence locations
<paths under .biswodip/evidence/, strix_runs/, CI run links>

## 17. Operational notes
<migrations, rollback steps, feature flags, monitoring to watch after deploy>

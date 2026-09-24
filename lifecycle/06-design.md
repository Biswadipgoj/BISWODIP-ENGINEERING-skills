<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 06 — Design and accessibility (Phase 8)

**Goal:** an interface that is legible, complete, accessible and free of generic AI styling — without weakening anything in phases 4–10.

Integrations: **Taste** (`design-taste-frontend`, `redesign-existing-projects`, `minimalist-ui`, `high-end-visual-design`, `full-output-enforcement`), **Emil Kowalski** (`emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `pick-ui-library`, `mobile-native`), **No AI Slop** (`no-ai-slop`) for the copy.

## Procedure (the 12-step pipeline, condensed — full version in `references/06-design-engineering-and-distribution.md` §14.3)
1. Understand the user task and the real business goal.
2. Audit the existing UI: components, spacing, type, colour, states, patterns. Do not redesign what already works.
3. Decide visual intent deliberately: hierarchy, density, composition, motion.
4. Implement the smallest coherent token/primitive set that the work needs.
5. Implement every state: loading, slow, empty, partial, large, error, validation, auth expiry, permission denied, rate limited, retry, duplicate submit, offline.
6. Make it responsive with real content at mobile, tablet and desktop widths.
7. Review motion: enter, exit, hover, focus, press, transition. Purposeful, consistent easing, compositor-friendly, `prefers-reduced-motion` honoured.
8. Anti-slop pass: remove meaningless gradients, glassmorphism, decorative 3D, random animation, fake dashboards, fake data, badge noise.
9. Copy pass with `no-ai-slop` (§43): clear labels, actionable errors, no puffery.
10. Accessibility pass (§19): keyboard, focus order and visibility, semantics, labels, contrast, touch targets, dialogs, live regions, 200% zoom.
11. Performance pass: bundle impact, images, layout shift, animation cost, client JS.
12. Security and regression pass: visual work never becomes the authorization path; business behaviour unchanged.

## Exit gate
- [ ] Every interaction has real loading, empty, error and success states.
- [ ] Keyboard-only walkthrough completed.
- [ ] Reduced-motion verified.
- [ ] No fake progress, fake data or unearned badges.
- [ ] Screenshots or notes recorded as evidence.

**Next:** `07-performance.md`.

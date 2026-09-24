<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. This brief is Biswodip Goj's integration documentation; the upstream project belongs to its authors. -->

# Integration: Taste Skill

| | |
|---|---|
| **Upstream** | https://github.com/Leonxlnx/taste-skill |
| **Author / licence** | Leonxlnx · MIT |
| **Pinned commit** | see `integrations/manifest.json` → `taste.snapshot.commit` |
| **Bundled snapshot** | `upstream/taste-skill/` |
| **Installed to** | `.biswodip/upstream/taste-skill` + agent skill directory |
| **Used in** | Phase 8 (`lifecycle/06-design.md`), MASTER-PROMPT §18 |

## What it provides
Anti-slop frontend design skills for AI agents: `design-taste-frontend` (default), `design-taste-frontend-v1`, `redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `full-output-enforcement`, `stitch-design-taste`, `gpt-taste`, `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`, `brandkit`.

## Install
```bash
bash scripts/install-integrations.sh . --only taste     # clone + copy skills (recommended)
npx skills add https://github.com/Leonxlnx/taste-skill  # upstream CLI
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

## How this system uses it
- New UI → `design-taste-frontend`. Existing UI → audit with `redesign-existing-projects` first; do not replace working UI blindly.
- Pick one visual direction deliberately; do not stack every style skill.
- Output completeness (`full-output-enforcement`) supports §15.3's UI completeness gate.

## Boundaries
Security, accessibility, performance, correctness and product requirements outrank every visual suggestion (§1.5). No skill may add a dependency, animation or effect without an engineering reason. Upstream guidance changes independently — pin it for reproducible review (`--pinned`).

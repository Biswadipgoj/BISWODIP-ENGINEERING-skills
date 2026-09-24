<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. This brief is Biswodip Goj's integration documentation; the upstream project belongs to its authors. -->

# Integration: Emil Kowalski Skills

| | |
|---|---|
| **Upstream** | https://github.com/emilkowalski/skills |
| **Author / licence** | Emil Kowalski · MIT |
| **Pinned commit** | see `integrations/manifest.json` → `emilkowalski.snapshot.commit` |
| **Bundled snapshot** | `upstream/emilkowalski-skills/` |
| **Used in** | Phase 8 (`lifecycle/06-design.md`), MASTER-PROMPT §18 |

## What it provides
Design-engineering and motion skills: `emil-design-eng`, `animate`, `animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `pick-ui-library`, `mobile-native`, `ask-sonner`, `prototype`, `write-swift`.

## Install
```bash
bash scripts/install-integrations.sh . --only emilkowalski
npx skills@latest add emilkowalski/skills
npx -y skills add emilkowalski/skills --agent claude-code
```

## How this system uses it
- Motion is a design-engineering decision: easing and duration chosen for the semantic role of the transition, consistent families, compositor-friendly properties.
- `review-animations` / `improve-animations` run whenever motion changed; `pick-ui-library` runs before adding any UI dependency (§28).
- Loading states must represent real system state — never fake progress, and never optimistic UI that implies a completed financial or security operation (§6).

## Boundaries
No perpetual motion, no animation that delays the task, no motion that hides weak information architecture. `prefers-reduced-motion` must give an equally usable experience (§19).

---
description: Design, accessibility and copy review — complete states, responsive, no AI slop
argument-hint: [screen, component or path]
---

Read `.claude/skills/biswodip-design-review/SKILL.md` and follow it.

Scope for this run: $ARGUMENTS

Audit the existing UI before changing it. Implement every state (loading, slow, empty, partial, error, validation, auth expiry, permission denied, rate limited, retry, duplicate submit, offline, success). Do the keyboard-only pass and check reduced motion. Run the copy through the `no-ai-slop` skill if it is installed.

Security, correctness, accessibility and performance outrank every visual suggestion. Never add fake data, fake progress or unearned badges.

---
description: Server-authoritative security review with an evidence-backed status per control
argument-hint: [area or path — e.g. "auth flow", "src/api", "payments"]
---

Read `.claude/skills/biswodip-security-review/SKILL.md` and follow it.

Scope for this run: $ARGUMENTS — if empty, review the whole repository.

Work the checklist area by area. Every applicable control gets a status (`VERIFIED` / `PARTIAL` / `UNVERIFIED` / `BLOCKED` / `OPEN` / `N/A` with a reason) and, for findings, a `file:line`. Run the automated gates for evidence, and treat their output as an input, not a verdict:

```bash
node .claude/skills/biswodip-security-review/bin/biswodip.mjs gates --root . --fail-on high
```

Report findings with root causes, not just locations. Do not fix anything until the review is complete unless the user asks you to.

---
description: Write or refresh handoff.md so the next session resumes without losing context
argument-hint: [init | update | show]
---

Read `.claude/skills/biswodip-handoff/SKILL.md` and follow it.

Action: $ARGUMENTS (default: update, or init if `handoff.md` does not exist yet).

```bash
node .claude/skills/biswodip-handoff/bin/biswodip.mjs handoff init --root .
node .claude/skills/biswodip-handoff/bin/biswodip.mjs handoff update --root .
```

The tool refreshes what it can read from git and the evidence log. **You** write the six sections properly:

1) Goal · 2) Current state · 3) Active files · 4) Changes made · 5) Failed attempts · 6) Next steps

Section 5 is mandatory — the error and why it failed, so the next session does not repeat your dead ends. Be concrete: paths, commands, exit codes. No secrets in the file.

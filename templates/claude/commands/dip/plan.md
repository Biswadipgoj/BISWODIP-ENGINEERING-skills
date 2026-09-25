---
description: Plan only — which few skills, stack entries and subagents this goal needs; changes nothing
argument-hint: [goal]
---

Read `.claude/skills/biswodip-orchestrator/SKILL.md`, then run:

```bash
DIP=.claude/skills/biswodip-orchestrator/bin/biswodip.mjs; [ -f "$DIP" ] || DIP="$HOME/.claude/skills/biswodip-orchestrator/bin/biswodip.mjs"
node "$DIP" plan --root . "$ARGUMENTS"
```

Read `.biswodip/PLAN.md` and the files it points at in this repository, then present the plan: the goal as acceptance criteria, the skills and stack entries with the reason for each, the waves and which agent owns which files, the installs (marking the manual ones), and whether the LLM gateway is ready. Cut anything the repository shows is not needed, and say why.

Do not edit code, install anything or launch build agents. End with: "Run `/dip <goal>` to execute this plan."

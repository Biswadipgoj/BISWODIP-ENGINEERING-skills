---
description: Biswodip Goj Unified Engineering — auto-plans the goal, picks the few skills and stack it needs, runs subagents, verifies with evidence
argument-hint: [goal — e.g. "android app with login" · or: bootstrap | security | pentest | design | release | handoff]
---

You are running the **Biswodip Goj Unified Engineering** system on this repository. The request is:

$ARGUMENTS

**Step 1 — load the law.** Read `.claude/skills/biswodip-unified-engineering/SKILL.md` (falling back to `~/.claude/skills/...`). If it is missing, say so and stop — do not improvise the system from memory.

**Step 2 — single-phase shortcuts.** If the request is only one of these, load that one skill, follow it, and skip Steps 3–5:

| Request | Load |
|---|---|
| setting up / installing integrations | `.claude/skills/biswodip-bootstrap/SKILL.md` |
| security review only | `.claude/skills/biswodip-security-review/SKILL.md` |
| pentest / fixing a finding | `.claude/skills/biswodip-pentest/SKILL.md` |
| design review only | `.claude/skills/biswodip-design-review/SKILL.md` |
| score / release report | `.claude/skills/biswodip-release-gate/SKILL.md` |
| handoff | `.claude/skills/biswodip-handoff/SKILL.md` |

**Step 3 — plan (always, for anything else).** Read `.claude/skills/biswodip-orchestrator/SKILL.md`, then run the deterministic planner:

```bash
DIP=.claude/skills/biswodip-orchestrator/bin/biswodip.mjs; [ -f "$DIP" ] || DIP="$HOME/.claude/skills/biswodip-orchestrator/bin/biswodip.mjs"
node "$DIP" plan --root . "<the request, verbatim>"
```

It writes `.biswodip/PLAN.md` and `.biswodip/plan.json`: the skills to load, the **few** stack entries this goal needs (never the whole catalog), the waves of subagents, the installs, and whether the LLM gateway is set. Read `PLAN.md`. Then:

- `ideasFirst` set → offer 3 concrete options and wait for the user's pick.
- LLM gateway needed but not configured → tell the user to run `/dip-setapi` and continue with everything that does not need it.
- Anything `manual` (scaffolds, services, hooks, plugins) → list it and ask before running it.

**Step 4 — run the waves with subagents.** Use the Agent tool:

1. **Plan** — launch `dip-planner` with the goal and `PLAN.md`. It returns tasks with acceptance criteria and one owner per file area.
2. **Build** — launch the build agents named in the plan (`dip-frontend`, `dip-mobile`, `dip-backend`, `dip-browser`, `dip-infra`) **in parallel, in one message**, each with only its tasks, its catalog entries and the files it owns. Two agents never edit the same file.
3. **Verify** — launch `dip-quality` and `dip` (security review) in parallel on the combined diff.
4. **Gate** — you: merge the reports, fix what they found (or send it back to the owner), re-run the checks, then follow `biswodip-release-gate`.

Give each subagent a self-contained brief: goal, its tasks, entries with docs links, owned paths, the laws below, and "report commands run, results and files changed". Subagent reports are evidence to check, not verdicts to repeat.

**Laws, in force at all times:**
- Evidence, not claims. No "tested", "secure" or "fixed" without a recorded command, result and artifact; otherwise `UNVERIFIED` or `BLOCKED`.
- The client is untrusted — identity, role, tenant, ownership, price, amount and state are resolved server-side.
- Smallest coherent change. Only the stack the plan justifies — no technology for appearance.
- Keys come from `/dip-setapi` through `dip exec`; never print them, never write them into the repo.
- No push, deploy, publish, merge or paid action without explicit permission.

**Step 5 — report.** What was planned and why, what each agent did, what you verified and how, what is still `UNVERIFIED`, `BLOCKED` or `OPEN`, and the next step. For a release decision, exactly one of: `RELEASE READY` · `RELEASE READY WITH DOCUMENTED ACCEPTED RISKS` · `NOT RELEASE READY` · `BLOCKED — INSUFFICIENT EVIDENCE`.

No request at all → run the planner with no goal (repository forensics) and propose a plan before changing anything.

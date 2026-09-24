---
description: Biswodip Goj Unified Engineering — evidence-driven build, harden, verify, attack, score, release
argument-hint: [what to do — or: bootstrap | security | pentest | design | release | handoff]
---

You are running the **Biswodip Goj Unified Engineering** system on this repository.

**Step 1 — load the law and the map.** Read `.claude/skills/biswodip-unified-engineering/SKILL.md` (about 1.4k tokens). If it is not there, read `~/.claude/skills/biswodip-unified-engineering/SKILL.md`. If neither exists, say so and stop — do not improvise the system from memory.

**Step 2 — route on the request.** The request is:

$ARGUMENTS

| If the request is about | Load |
|---|---|
| setting up / installing / detecting integrations | `.claude/skills/biswodip-bootstrap/SKILL.md` |
| security review, authz, secrets, money, webhooks, AI features | `.claude/skills/biswodip-security-review/SKILL.md` |
| pentest, attack, exploit, fixing a finding | `.claude/skills/biswodip-pentest/SKILL.md` |
| UI, UX, design, accessibility, copy | `.claude/skills/biswodip-design-review/SKILL.md` |
| production readiness, score, audit, release report | `.claude/skills/biswodip-release-gate/SKILL.md` |
| handing over, running out of context, "continue later" | `.claude/skills/biswodip-handoff/SKILL.md` |
| anything else, or a whole-repository job | stay with the router and follow the 14 phases in order |

Load **one** skill, not all of them. Read reference files by section (`grep -n "^### "` then read the block) — never whole.

**Step 3 — work.** Follow that skill's procedure, and keep the laws in force at all times:

- Evidence, not claims. No "tested", "secure" or "fixed" without a recorded command, result and artifact; otherwise the status is `UNVERIFIED` or `BLOCKED`.
- The client is untrusted — identity, role, tenant, ownership, price, amount and state are resolved server-side.
- Smallest coherent change. Understand before adding. No technology for appearance.
- Authorized targets only for any security testing.
- No push, deploy, publish, merge or paid action without explicit permission.

**Step 4 — report.** State what you did, what you verified and how, what is still `UNVERIFIED`, `BLOCKED` or `OPEN`, and the next step. If this was a release gate, end with exactly one of: `RELEASE READY` · `RELEASE READY WITH DOCUMENTED ACCEPTED RISKS` · `NOT RELEASE READY` · `BLOCKED — INSUFFICIENT EVIDENCE`.

If no arguments were given, run repository forensics (phase 1) and propose the plan before changing anything.

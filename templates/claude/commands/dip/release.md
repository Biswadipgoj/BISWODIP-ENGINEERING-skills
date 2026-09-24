---
description: Evidence matrix, weighted score with caps, blockers, and the final release report
argument-hint: [scope note — e.g. "v1.4 candidate"]
---

Read `.claude/skills/biswodip-release-gate/SKILL.md` and follow it.

Scope for this run: $ARGUMENTS

Build the evidence matrix first — every requirement and applicable gate with implementation, procedure, result, evidence and status. `VERIFIED` needs all five. A category with no evidence scores 0, not "probably fine". Apply the mandatory caps, answer every absolute blocker yes/no from evidence, then write the report.

End with exactly one status: `RELEASE READY` · `RELEASE READY WITH DOCUMENTED ACCEPTED RISKS` · `NOT RELEASE READY` · `BLOCKED — INSUFFICIENT EVIDENCE`. Never "looks good" or "should be fine".

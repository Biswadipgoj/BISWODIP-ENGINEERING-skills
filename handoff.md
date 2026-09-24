# Handoff — BISWODIP-GOJ-UNIFIED-ENGINEERING

_Last updated: 2026-09-23T15:05:00.000Z_

Read this first. Verify section 2 against the repository (`git status`, run the build) before trusting it, then continue from section 6.

## 1) Goal

<!-- biswodip:goal -->

Maintain the Biswodip Goj Unified Engineering system: one evidence-driven operating system for AI coding agents, installable from GitHub as a set of small skills, orchestrating five upstream projects (Taste, Emil Kowalski, No AI Slop, Headroom, Strix) under one release gate.

- **Objective:** an agent can be pointed at any repository and take it from "it runs" to "explained, verified, monitored, recoverable" — with every claim backed by a recorded command, result and artifact.
- **Acceptance criteria:**
  - `node bin/biswodip.mjs verify-package` passes with zero FAILED.
  - `node --test test/tooling.test.mjs` passes.
  - The installer clones **all five** upstream repositories, verifies each, and never duplicates what is already installed.
  - Every skill's `SKILL.md` stays under the context budget (14,000 chars ≈ 3.5k tokens).
  - The v1.2.0 material is preserved verbatim in `references/`, including all 2,215 verification gates.
  - Upstream licences and notices are never modified; attribution holds.
- **Out of scope:** modifying anything under `upstream/` by hand; certifying legal compliance; promising any software is unhackable; running security tests against targets the user has not authorized.

## 2) Current state

<!-- biswodip:state -->

<!-- biswodip:auto:start -->

> Facts below are refreshed by `biswodip handoff update`. Everything outside this block is written by hand — do not let the tool own your reasoning.

- **Version:** 2.1.0 — not yet a git repository in this working copy; initialise and push per `docs/GITHUB.md`.
- **Package self-verification:** VERIFIED (only PowerShell parsing is UNVERIFIED where `pwsh` is unavailable; CI covers it on Windows).
- **Tests:** passing.

<!-- biswodip:auto:end -->

- **Lifecycle phase:** 13 — release. v2.1.0 packaged and delivered as zip; GitHub push pending on the owner.
- **Builds / tests:** `node bin/biswodip.mjs verify-package` → 0 FAILED. `node --test test/tooling.test.mjs` → all pass. `node bin/biswodip.mjs build-skill` → 7 skills, all in sync.
- **Verified by running:** live install cloned all 5 repos at pinned commits and installed 36 upstream skills; re-run reinstalled nothing; tampering with a vendored `LICENSE` is caught by `verify`; Strix guard refuses a non-loopback target (exit 6) and reports BLOCKED without Docker (exit 5); gates catch a planted AWS key with the value masked; the no-Node fallback still clones all five.
- **UNVERIFIED:** PowerShell script parsing (no `pwsh` in the build container — CI matrix covers Windows). The `.ps1` wrappers have not been executed on a real Windows host.
- **BLOCKED:** nothing.
- **OPEN:** the repository has never been pushed; the CI badge in `README.md` will 404 until it is.

## 3) Active files

<!-- biswodip:files -->

| File | Role | State |
|---|---|---|
| `MASTER-PROMPT.md` | The operating system, §0–§43. Canonical source of the router skill. | Stable — edit here, never in `skills/` |
| `skills-src/*.md` | Body of each of the 7 skills (frontmatter is generated). | Stable |
| `scripts/lib/skills.mjs` | Skill catalogue: which files each skill carries, budget check. | Stable |
| `scripts/lib/core.mjs` | Detect / install / verify engine — clone, retries, pinning, snapshot fallback, lock file. | Stable |
| `scripts/lib/gates.mjs` | Secret rules, risk heuristics, dependency audits, evidence output. | Stable |
| `scripts/lib/strix.mjs` | Guarded pentest runner (target guard, `run.json` verdict). | Stable |
| `scripts/lib/handoff.mjs` | This file's tooling. | New in 2.1.0 |
| `integrations/manifest.json` | Pinned commits, expected paths, skill lists, install strategies. | Regenerate with `refresh-snapshots` |
| `upstream/**` | Exact vendored snapshots of 5 repos. | **Do not edit.** Regenerate only |
| `references/01–06` | v1.2.0 content, verbatim. | **Do not rewrite.** Add, don't replace |

## 4) Changes made

<!-- biswodip:changes -->

1. **v2.0.0 — rebuilt from v1.2.0.** Merged the master operating prompt with the old 531 KB `SKILL.md`; split that file verbatim into `references/01–06` (line-by-line check: every non-empty line survives, 2,215 gates intact); added §41 AI/LLM security, §42 agent self-safety, §43 writing quality.
2. Built `lifecycle/00–13`, `security/` (6 deep-dives), `reports/` (7 templates), `integrations/` (5 briefs + manifest + guarded Strix runner).
3. Vendored all five upstream repos into `upstream/` via `git archive` at recorded commits; tree hashes in `upstream/SNAPSHOTS.json`.
4. Wrote the tooling: `bin/biswodip.mjs` + `scripts/lib/*` (detect, install, verify, gates, strix, package verify, snapshot refresh) and `.sh`/`.ps1`/`.mjs` entry points for the four scripts.
5. Relicensed from MIT to **Apache-2.0 under Biswodip Goj**, added `NOTICE`, corrected `THIRD-PARTY-NOTICES.md` (v1.2.0 wrongly claimed Emil Kowalski's repo had no licence — it is MIT).
6. Fixed v1.2.0 defects: missing YAML frontmatter, `citeturn0view0` corruption, literal `\n` escapes, duplicate section numbers, a reference to a `run-local-pentest.ps1` that did not exist, automatic `npm install` into the user's project, no retries or verification in the installer, a stale `.tgz` inside the package.
7. **v2.1.0 — context surgery.** Split the monolith into 7 GitHub-installable skills; the router's `SKILL.md` went from ~12,900 to ~1,365 tokens on trigger (−89%). Added `handoff.md` tooling, `docs/GITHUB.md`, `docs/CONTEXT-BUDGET.md`, and a per-skill budget check in `verify-package`.
8. Evidence: `.biswodip/evidence/` in any project the tooling runs against; the build ran `verify-package`, `node --test`, a live pinned install, an offline install, and the Strix guard checks.

## 5) Failed attempts

<!-- biswodip:failed -->

- **`node --test test/` and bare `node --test`** — the first failed with `MODULE_NOT_FOUND` on Node 22; the second auto-discovered `upstream/headroom/sdk/typescript/test/**` and tried to run vendored Vitest suites (34 failures that were not ours). Fixed by naming the file: `node --test test/tooling.test.mjs`. If you add a test file, add it to the `test` script explicitly — do not go back to directory discovery.
- **`rsync` for the upstream snapshots** — not installed in the build container. `git archive HEAD | tar -x` is better anyway: it exports exactly the tracked files at the commit, with no `.git` and no local dirt.
- **Checking the `skills` CLI flags from npm** — `npm view skills` returns `403 Forbidden` behind the proxy. Read the flags from the `vercel-labs/skills` README instead. Do not assume registry access exists.
- **Delivering the full 42.8 MB zip in chat** — rejected, 30 MiB limit. Now shipped as a 396 KB core build plus two split parts; `scripts/lib/package.mjs` understands an `upstream/.snapshots-omitted` marker so the core build still verifies honestly instead of reporting FAILED.
- **PowerShell validation** — no `pwsh` in the container and it cannot be installed through the proxy. Left as `UNVERIFIED` rather than assumed-good; the CI matrix parses the `.ps1` files on Windows.
- **Installing `headroom-ai` automatically when a `package.json` exists** (inherited from v1.2.0) — that silently mutates the user's dependencies. Removed; now opt-in behind `--with-headroom-sdk`.
- **Scanning everything under `.claude/skills` in the gates** — 36 vendored skills produced hint noise that buried the real planted finding. Those directories are now excluded unless `--include-skills` is passed.

## 6) Next steps

<!-- biswodip:next -->

1. **Push to GitHub** — follow `docs/GITHUB.md` exactly (`git init`, add, commit, `gh repo create Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING --public --source=. --push`). Confirm the Actions run is green; the README badge resolves only after that.
2. **Verify the install path from GitHub** in a scratch project: `npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING` then confirm 7 skill folders appear in `.claude/skills` and the router triggers by description.
3. **Run the Windows leg** once: `scripts\install-integrations.ps1 -Root .` and `integrations\strix\run-local-pentest.ps1 -DryRun` on a real Windows host, then move PowerShell parsing from UNVERIFIED to VERIFIED in the evidence matrix.
4. **Exercise Strix end to end** on a disposable local app with Docker running and `STRIX_LLM` / `LLM_API_KEY` set — quick, then standard — and confirm the runner classifies `run.json` correctly for a findings run (exit 2) and a clean one.
5. **Refresh upstream** before any release: `node bin/biswodip.mjs refresh-snapshots` then `verify-package`. Taste, Strix and Headroom all moved during the 2.0.0 build, so the pinned commits are already behind HEAD. Never refresh immediately before shipping.
6. **Open questions for the owner:** keep Apache-2.0 or revert to MIT? Publish to npm under `biswodip-goj-unified-engineering`, or GitHub-only? Should the repository be public (the upstream licences allow redistribution) or private?

---

_Maintained with the Biswodip Goj Unified Engineering system (`biswodip handoff update`). No secrets in this file — reference the environment variable name instead._

<!-- SPDX-License-Identifier: Apache-2.0 -->
# Changelog

All notable changes to this package. Format based on Keep a Changelog; this project uses semantic versioning.

## [2.2.0] — 2026-09-24

One archive to unzip and push, and `/dip` in any project.

### Added
- **`/dip` slash commands and the `@dip` agent** (`templates/claude/` → a project's `.claude/`):
  `/dip` (routes on what you type), `/dip:bootstrap`, `/dip:security`, `/dip:pentest`, `/dip:design`,
  `/dip:release`, `/dip:handoff`, and `@dip` as a named agent. They carry no engineering content of their
  own — each points at a skill and restates the laws — so they cannot drift from the system.
- The installer now wires that entry layer into every project (`--no-commands` opts out), records it in
  `.biswodip/integrations.lock.json`, and `verify` fails if a command file goes missing.
- **`install.sh` / `install.ps1`** — one-command install from anywhere: clones the repository to
  `~/.biswodip-goj-unified-engineering` (or uses the unzipped copy), then installs into the target project.
- **`npx --yes github:Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING dip install --root .`** via a new `dip` bin.
- **`START-HERE.md`** — unzip → push to GitHub → install → use, with the `/dip` command table.
- **`ARCHITECTURE.md`** — the nine layers, what happens on `/dip` step by step, the build and install
  pipelines, and the design decisions with their reasons.
- `verify-package` now checks the entry layer: every command file has a description, and every skill a
  command references actually ships.

### Changed
- `package.json` ships `templates/`, `START-HERE.md`, `ARCHITECTURE.md` and both installers; `bin` exposes
  both `biswodip` and `dip`.

## [2.1.0] — 2026-09-23

Context surgery and GitHub distribution. Same system, a fraction of the load.

### Added
- **Seven installable skills** (`skills/`), each generated from `skills-src/` and carrying only the files its phase needs:
  `biswodip-unified-engineering` (router), `biswodip-bootstrap`, `biswodip-security-review`, `biswodip-pentest`,
  `biswodip-design-review`, `biswodip-release-gate`, `biswodip-handoff`. Install all of them with
  `npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING`, or one with `--skill <name>`.
- **`handoff.md` protocol and tooling** — the six sections (Goal, Current state, Active files, Changes made,
  Failed attempts, Next steps), `MASTER-PROMPT.md` §44, `reports/HANDOFF-TEMPLATE.md`, the `biswodip-handoff`
  skill, and `biswodip handoff init|update|show`. `update` refreshes branch, commit, working-tree state, recent
  commits, integration lock and evidence paths from git, and never touches hand-written prose.
- **`biswodip skills`** — lists every skill with its context cost (`--json` for machines).
- **`docs/CONTEXT-BUDGET.md`** — what loads when, the three tiers, and how to read sections instead of files.
- **`docs/GITHUB.md`** — push, host, release, install-from-GitHub and refresh instructions.
- Per-skill **context budget check** in `verify-package`: a `SKILL.md` over 14,000 characters fails the gate.

### Changed
- **The router skill dropped from ~12,900 to ~1,365 tokens on trigger (−89%).** `MASTER-PROMPT.md` moved to
  `references/MASTER-PROMPT.md` inside that skill and is read by section; the skill body is now the laws, the
  14-phase order, the routing table and the agent's working rules.
- `build-skill` builds all seven skills, prunes stale folders and prints a token/file table.
- `package.json` `files` now ships `skills-src/`, `docs/` and `handoff.md`.

### Fixed
- Stale skill folders left behind when the catalogue changes are now removed by the builder rather than shipped.

## [2.0.0] — 2026-09-23

Rebuilt as a repository-shaped system with real upstream source, working tooling and a self-verifying package.

### Added
- **`MASTER-PROMPT.md`** — the unified operating system (§0–§43), merging the v1.2.0 skill with the master operating prompt: core law, principles, forensics, integration discovery, threat model, server authority, secrets, authn, authz, database, financial, webhooks, API, files, rate limiting, errors, logging, design, accessibility, performance, testing, Strix, adversarial pass, fix loop, regression, hygiene, operations, supply chain, compatibility, documentation, evidence matrix, scoring, blockers, report, status, failure behaviour, execution order, autonomy, engineering law — plus three new sections: **§41 AI/LLM feature security**, **§42 agent self-safety**, **§43 writing quality**.
- **`lifecycle/00…13`** — one procedure file per phase: entry criteria, steps, commands, evidence and an exit gate.
- **`security/`** — six deep-dives: server authority, authorization, financial systems, webhooks, data protection, attack catalogue.
- **`upstream/`** — exact source snapshots of all five upstream repositories (3,000+ files), each with its licence preserved and its tree hash recorded in `upstream/SNAPSHOTS.json`.
- **Fifth integration: No AI Slop** (https://github.com/petergyang/no-ai-slop, MIT) for UI copy, documentation and report writing.
- **Working tooling** (`bin/biswodip.mjs`, `scripts/lib/`): `detect`, `install`, `verify`, `gates`, `strix`, `doctor`, `verify-package`, `build-skill`, `refresh-snapshots`.
- **Robust installer** — clones every upstream repository with retries and exponential backoff, verifies remote URL, expected files and licence, supports `--pinned` commits, `--update`, `--full`, `--offline`, `--from-snapshot`, `--force`, `--dry-run`, per-agent and global skill directories, and falls back to the bundled snapshot when the network fails. Writes `.biswodip/integrations.lock.json` (INTEGRATION | STATUS | VERSION | SOURCE | LOCATION | ACTION TAKEN). Never reinstalls something already present, and never duplicates a skill across scopes.
- **Security gates** (`run-security-gates`) — 17 secret-detection rules with masked output and tracked-file checks, 12 code-risk heuristics mapped to MASTER-PROMPT sections, dependency audits for npm/pnpm/yarn/Python/Rust/Go, optional project checks, optional Strix run, JSON + Markdown evidence.
- **Guarded Strix runner** — loopback-only targets unless `--authorized-host` is declared, precondition checks recorded as `BLOCKED` instead of pretending, key never printed or logged, result classified from `run.json` rather than the exit code.
- **Package self-verification** (`verify-package`) — required tree, §0–§43 presence, referenced-path resolution, gate count, skill/source sync, version agreement, snapshot integrity, licence and SPDX headers, script parsing on three shells, secret scan.
- `reports/` templates (release report, evidence matrix, finding, exception, threat model, authorization matrix, integration record), `docs/INSTALL.md`, `SECURITY.md`, `CONTRIBUTING.md`, tests, CI, and GitHub presentation (banner, badges, `.gitattributes` vendoring so the language bar reflects this project's own code).

### Changed
- Licence moved from **MIT to Apache-2.0** under Biswodip Goj, with a `NOTICE` file — this preserves attribution on redistribution and adds an explicit patent grant.
- The v1.2.0 `SKILL.md` (531 KB, 4,088 lines) is preserved **in full** in `references/01…06`, split by section; nothing was dropped. The installable skill is now generated from `MASTER-PROMPT.md` and carries the references beside it.
- Release statuses standardised to the four in §35, with the v1.x labels mapped.
- `integrations.json` became `integrations/manifest.json` with pinned commits, expected paths, licence metadata, skill lists and tool install strategies.

### Fixed
- **Missing YAML frontmatter** on `SKILL.md` — the v1.2.0 skill could not be loaded as a skill by name or description.
- **Corrupted text**: stray `citeturn0view0` markers and a section appended with literal `\n` escapes instead of newlines; duplicate section numbers 14 and 15.
- **Broken reference** to `tools/strix/run-local-pentest.ps1`, a file that did not exist in v1.2.0 — the runner now exists for both shells.
- **Incorrect third-party notice** claiming Emil Kowalski Skills exposed no OSI licence file; it is MIT-licensed, verified at the pinned commit.
- Installer defects: `npm install headroom-ai` ran automatically against the user's `package.json` (now opt-in via `--with-headroom-sdk`); a single failed clone aborted the whole run under `set -euo pipefail`; no retries, no verification, no record of what was installed; the PowerShell script assumed `npx` and `git` were present.
- `verify.mjs` resolved its own path in a way that breaks on Windows and on paths containing spaces; replaced by `verify-package`.
- Removed the stale `biswodip-goj-unified-engineering-skill-1.2.0.tgz` tarball that shipped inside the v1.2.0 package.

## [1.2.0] — 2026

- Combined master document, installer scripts, agent lifecycle and repository integration docs. Preserved in `references/` and in the git history of this repository.

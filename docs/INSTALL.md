<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Install and operate

## Requirements

| | Needed for | If missing |
|---|---|---|
| **git** | cloning the five upstream repositories | the bundled snapshots in `upstream/` are used instead |
| **Node.js ≥ 18.17** | all tooling | `install-integrations.sh/.ps1` fall back to a clone-only mode |
| **Docker (running)** | Strix scans | Phase 11 is recorded `BLOCKED`, never skipped silently |
| **uv or pipx** | installing the Headroom / Strix CLIs with `--with-tools` | install them manually (`integrations/*/README.md`) |
| **npx** | `--use-skills-cli` only | skills are copied directly from the verified clone instead |

No runtime npm dependencies. Nothing is installed into your project unless you ask for it.

## Install

```bash
# Linux / macOS / WSL / Git Bash
bash /path/to/pkg/scripts/install-integrations.sh /path/to/your/project

# Windows PowerShell
& C:\path\to\pkg\scripts\install-integrations.ps1 -Root C:\path\to\your\project

# Any platform, directly
node /path/to/pkg/bin/biswodip.mjs install --root /path/to/your/project
```

What it does, per integration: detect → clone (3 retries, exponential backoff) into `<project>/.biswodip/upstream/<name>` → verify (remote URL, expected files, licence file, SHA-256 of the licence) → install that repository's agent skills → detect the CLI → record everything.

It never: reinstalls something already present, replaces a newer copy with an older one, duplicates a skill that exists in another scope, overwrites a modified skill without `--update`, deletes anything, or adds a dependency to your `package.json` without `--with-headroom-sdk`.

## Options

| Flag | Effect |
|---|---|
| `--root <dir>` | Target project (default `.`) |
| `--only <ids>` | `taste`, `emilkowalski`, `no-ai-slop`, `headroom`, `strix` (comma-separated) |
| `--pinned` | Check out the exact commits in `integrations/manifest.json` — use this for reproducible security review |
| `--update` | Fast-forward existing clones; replace skill copies that differ from upstream |
| `--full` | Full history instead of `--depth 1` |
| `--offline` | Never touch the network; copy the bundled snapshots |
| `--from-snapshot <dir>` | Use a different snapshot directory |
| `--with-tools` | Also install the Headroom and Strix CLIs (uv → pipx → upstream installer, downloaded to a file with its SHA-256 printed) |
| `--with-headroom-sdk` | `npm install headroom-ai` into the target project (opt-in) |
| `--use-skills-cli` | Additionally run `npx skills add` for each skill repository |
| `--agent <name>` | `claude-code` (default), `codex`, `cursor`, `agents` |
| `--global` | Install skills to the user-level directory instead of the project |
| `--no-skills` / `--no-self-skill` | Clone and verify only / skip installing this system's own skill |
| `--retries <n>` · `--force` · `--strict` · `--dry-run` · `--quiet` · `--json` | Network retries · move a conflicting path aside · fail on missing CLIs · preview · less output · machine-readable |

## After installing

```bash
node bin/biswodip.mjs doctor --root .     # what is present, and the command that fixes each gap
node bin/biswodip.mjs verify --root . --verbose
```

`.biswodip/` in your project holds `upstream/` (clones), `evidence/` (command log, gate reports, Strix evidence), `cache/`, `integrations.lock.json` and a `.gitignore` that keeps clones and scan output out of your repository.

## Using the skill

The installer copies this system into your agent's skill directory (`.claude/skills/biswodip-unified-engineering` by default) with the references, lifecycle, security, reports and tooling beside it. Then either let the agent trigger it by description, or say: *"Follow MASTER-PROMPT.md for this repository."*

To install the skill only:

```bash
node bin/biswodip.mjs install --root . --only taste --no-skills   # clones only
node bin/biswodip.mjs install --root . --global                   # user-level skills
```

## Security gates

```bash
node bin/biswodip.mjs gates --root .                        # secrets + hints + dependency audits
node bin/biswodip.mjs gates --root . --project-checks       # + lint/typecheck/test/build
node bin/biswodip.mjs gates --root . --fail-on medium       # stricter threshold
node bin/biswodip.mjs gates --root . --strix --app-url http://127.0.0.1:3000 --mode quick
```

Vendored agent skill directories (`.claude/skills`, `.codex/skills`, …) are excluded by default — they are third-party content, not your code; add `--include-skills` to scan them anyway.

Evidence lands in `.biswodip/evidence/security-gates-<timestamp>/` as `report.json` and `report.md`. Exit code 1 means the threshold was crossed. Secret matches are masked in every output. To suppress a confirmed false positive, put `biswodip-allow-secret` on the line.

## Strix

```bash
export STRIX_LLM="openrouter/<model>"
export LLM_API_KEY="<key>"          # current shell only, never committed
bash integrations/strix/run-local-pentest.sh --target-dir . --app-url http://127.0.0.1:3000 --mode quick --budget 10
```

Exit codes: `0` clean for the analyzed scope · `2` findings · `4` incomplete (not clean) · `5` blocked (no Docker/CLI/env) · `6` refused (unauthorized target). Non-loopback targets need `--authorized-host <host>`, and that declaration is your statement of authorization.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `CONFLICT` on an integration | `.biswodip/upstream/<name>` exists but is not that repository. Inspect it; re-run with `--force` to move it aside (nothing is deleted). |
| `SNAPSHOT` instead of `CLONED` | The network was unavailable — the bundled copy was used. Re-run with `--update` when online. |
| Skill shows `DIFFERS` | Your local copy was edited. Re-run with `--update` to take upstream (the old copy is kept as `.bak-<timestamp>`). |
| `strix` not found after `--with-tools` | The tool directory is not on `PATH` (`~/.local/bin`). Open a new shell, or run `uv tool update-shell`. |
| Strix `BLOCKED` | Docker is not running, or `STRIX_LLM`/`LLM_API_KEY` are unset in *this* shell. |
| `npm audit` reports `BLOCKED` | No network or no lockfile. Record it as `BLOCKED` — it is not a pass. |
| Windows: script will not run | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`, or call `node bin\biswodip.mjs` directly. |
| Node missing | `install-integrations.sh/.ps1` still clone every repository; everything else needs Node ≥ 18.17. |

## Keeping upstream current (maintainer)

```bash
node bin/biswodip.mjs refresh-snapshots     # re-clone, update manifest + SNAPSHOTS.json, rebuild the skill
node bin/biswodip.mjs verify-package --verbose
```

Do not edit `upstream/` by hand, and do not pull new upstream versions immediately before a release.

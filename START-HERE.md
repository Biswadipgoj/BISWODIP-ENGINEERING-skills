<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# START HERE

Three steps: unzip → push to GitHub → install in a project. Then `/dip` works.

---

## Step 1 — Unzip

```bash
unzip BISWODIP-GOJ-UNIFIED-ENGINEERING.zip
cd BISWODIP-GOJ-UNIFIED-ENGINEERING
```

Check it arrived intact (optional, 10 seconds):

```bash
node bin/biswodip.mjs verify-package
```

Expect `0 FAILED`. PowerShell parsing shows `UNVERIFIED` unless you are on Windows — that is honest, not broken.

---

## Step 2 — Push to GitHub

```bash
git init -b main
git add .
git commit -m "Biswodip Goj Unified Engineering v2.2.0"

# GitHub CLI
gh repo create Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING --public --source=. --push

# or by hand: create the empty repo on github.com first, then
git remote add origin https://github.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING.git
git push -u origin main
```

That is the whole upload. No build step, no secrets to configure, no LFS. CI starts on its own and runs the full verification on Ubuntu, macOS and Windows across Node 18/20/22.

> **Name it exactly `BISWODIP-GOJ-UNIFIED-ENGINEERING` under `Biswadipgoj`**, or the install commands below need their URL changed to match.

---

## Step 3 — Install into any project

Pick one. All three do the same thing.

```bash
# A — one command, from anywhere (clones this repo to ~/.biswodip-goj-unified-engineering, then installs)
curl -fsSL https://raw.githubusercontent.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING/main/install.sh | bash

# B — npx, no clone kept
npx --yes github:Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING dip install --root .

# C — from your unzipped copy
bash /path/to/BISWODIP-GOJ-UNIFIED-ENGINEERING/install.sh /path/to/your/project
```

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING/main/install.ps1 | iex
```

What lands in your project:

```text
your-project/
├── .claude/
│   ├── commands/dip.md            → /dip
│   ├── commands/dip/*.md          → /dip:bootstrap /dip:security /dip:pentest
│   │                                 /dip:design /dip:release /dip:handoff
│   ├── agents/dip.md              → @dip
│   └── skills/                    → 7 Biswodip skills + 36 upstream skills
└── .biswodip/
    ├── upstream/                  → the 5 cloned upstream repositories
    ├── evidence/                  → command log, gate reports, Strix runs
    └── integrations.lock.json     → what was installed, from where, at which commit
```

Useful variants: `--pinned` (exact commits, reproducible), `--with-tools` (also install the Headroom and Strix CLIs), `--global` (user-level, every project at once), `--offline` (air-gapped), `--update`, `--dry-run`.

---

## Step 4 — Use it

In Claude Code, inside that project:

| Type | And it does |
|---|---|
| `/dip` | Loads the router, works out the phase, runs it with evidence |
| `/dip harden the login flow` | Same, aimed at what you typed |
| `/dip:bootstrap` | Detect and install the integrations |
| `/dip:security src/api` | Server-authoritative security review, status per control |
| `/dip:pentest http://127.0.0.1:3000 quick` | Authorized pentest, then the fix loop |
| `/dip:design checkout page` | States, responsive, accessibility, anti-slop copy |
| `/dip:release` | Evidence matrix, score, blockers, report |
| `/dip:handoff` | Writes `handoff.md` for the next session |
| `@dip` | The same agent, in any conversation |

No slash commands in your tool? Say **"Follow MASTER-PROMPT.md for this repository"** — the skills trigger on description alone.

---

## If something is off

| Symptom | Fix |
|---|---|
| `/dip` not offered | The files live in `.claude/commands/`. Reopen the project, or re-run the installer in the right directory. |
| "skills are not installed" | `node bin/biswodip.mjs doctor --root .` prints the exact command for each gap. |
| A repo would not clone | It falls back to the bundled snapshot and says `SNAPSHOT`. Re-run with `--update` when online. |
| Strix `BLOCKED` | Docker is not running, or `STRIX_LLM` / `LLM_API_KEY` are unset in this shell. That is recorded, never skipped silently. |
| Want it everywhere | Re-run with `--global`. |

Deeper reading: [`ARCHITECTURE.md`](ARCHITECTURE.md) (how it all fits together) · [`docs/INSTALL.md`](docs/INSTALL.md) (every flag) · [`docs/GITHUB.md`](docs/GITHUB.md) (hosting, releases) · [`docs/CONTEXT-BUDGET.md`](docs/CONTEXT-BUDGET.md) (why it stays cheap).

<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Architecture

How the system is put together, step by step: what each layer is, where its files live, and what happens when you type `/dip`.

---

## 1. The shape of it

```text
                        ┌──────────────────────────────────────────────┐
  YOU  ──/dip──────────▶│  ENTRY LAYER    .claude/commands/, agents/   │
       ──@dip──────────▶│  slash commands + the dip agent              │
       ──"harden this"─▶│  (or plain description → skill triggers)     │
                        └───────────────────┬──────────────────────────┘
                                            │ loads ONE small file (~1.4k tokens)
                        ┌───────────────────▼──────────────────────────┐
                        │  ROUTER SKILL   biswodip-unified-engineering │
                        │  laws · 14 phases · routing table            │
                        └───────────────────┬──────────────────────────┘
                     ┌──────────────────────┼─────────────────────┬─────────────┐
                     ▼                      ▼                     ▼             ▼
            ┌────────────────┐   ┌──────────────────┐   ┌───────────────┐  ┌──────────┐
            │ PHASE SKILLS   │   │ PROCEDURES       │   │ DEEP DIVES    │  │ TEMPLATES│
            │ bootstrap      │   │ lifecycle/00–13  │   │ security/*.md │  │ reports/ │
            │ security-review│   │ one per phase    │   │ 6 topics      │  │ 7 files  │
            │ pentest        │   └──────────────────┘   └───────────────┘  └──────────┘
            │ design-review  │            │                     │
            │ release-gate   │            ▼                     ▼
            │ handoff        │   ┌──────────────────────────────────────┐
            └───────┬────────┘   │ REFERENCES  references/01–07         │
                    │            │ incl. 2,215 verification gates       │
                    │            │ read by SECTION, never whole         │
                    │            └──────────────────────────────────────┘
                    ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  TOOLING   bin/biswodip.mjs + scripts/lib/*                   │
        │  detect · install · verify · gates · strix · handoff · skills │
        └───────────────────────┬───────────────────────────────────────┘
                                ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  INTEGRATIONS   5 upstream projects, cloned + vendored        │
        │  Taste · Emil Kowalski · No AI Slop · Headroom · Strix        │
        └───────────────────────┬───────────────────────────────────────┘
                                ▼
        ┌───────────────────────────────────────────────────────────────┐
        │  EVIDENCE   .biswodip/evidence/ · integrations.lock.json      │
        │  handoff.md · strix_runs/ — every claim traceable             │
        └───────────────────────────────────────────────────────────────┘
```

The whole design serves one rule: **load the least context that still gets it right.** Detail lives on disk, not in the window.

---

## 2. Layer by layer

### Layer 1 — Entry (`templates/claude/` → your project's `.claude/`)

| File | Becomes | Job |
|---|---|---|
| `commands/dip.md` | `/dip` | Load the router, route on your words, run the phase |
| `commands/dip/*.md` | `/dip:bootstrap` … `/dip:handoff` | Jump straight to one phase |
| `agents/dip.md` | `@dip` | The same laws as a named agent |

These are copied into a project by the installer. They are tiny — each one says which skill to read and which laws hold. They contain no engineering content of their own, so they never drift from the system.

### Layer 2 — Router skill (`skills/biswodip-unified-engineering/SKILL.md`)

~1,365 tokens. Holds the eight laws, the status vocabulary, the 14-phase order, the scoring model with its caps, the four release statuses, the agent's own working rules, and a routing table. It answers "what am I allowed to do, in what order, and where is the detail" — nothing else. Everything it references sits beside it, read on demand.

### Layer 3 — Phase skills (6)

| Skill | Phase | ~tokens |
|---|---|---:|
| `biswodip-bootstrap` | 0 — detect and install integrations | 848 |
| `biswodip-security-review` | 8 — every control, with a status | 1,295 |
| `biswodip-pentest` | 9–11 — authorized attack, fix loop | 1,324 |
| `biswodip-design-review` | 6 — states, a11y, motion, copy | 931 |
| `biswodip-release-gate` | 12–13 — matrix, score, blockers, report | 1,105 |
| `biswodip-handoff` | any — write `handoff.md` | 932 |

Each is independently installable (`npx skills add … --skill <name>`) and carries only the files its phase needs. One phase costs about a thousand tokens to load, not thirteen thousand.

### Layer 4 — Procedures (`lifecycle/00-bootstrap.md` … `13-release.md`)

One file per phase: entry criteria, numbered steps, exact commands, what evidence to record, and an exit gate you can tick. Read when you run that phase.

### Layer 5 — Deep dives (`security/`)

`SERVER-AUTHORITY.md` · `AUTHORIZATION.md` · `FINANCIAL-SYSTEMS.md` · `WEBHOOKS.md` · `DATA-PROTECTION.md` · `ATTACK-CATALOG.md`. Concrete patterns, the anti-patterns that appear in real repositories, and the tests that prove each one.

### Layer 6 — References (`references/01–07`)

The complete v1.2.0 material, preserved verbatim, plus `MASTER-PROMPT.md` (all 45 sections) and the v2.0 hardening additions. `references/02-master-shipping-gate.md` alone is ~120,000 tokens: 15 owner-mandated controls, 2,200 verification gates across 120 domains, and 1,200 attack variants. It exists to be **grepped**:

```bash
grep -n "^### " references/02-master-shipping-gate.md          # the 120 domains
grep -n -A11 "^### Webhooks" references/02-master-shipping-gate.md
```

### Layer 7 — Tooling (`bin/biswodip.mjs`, `scripts/lib/*.mjs`)

Zero runtime dependencies, Node ≥ 18.17, Linux/macOS/Windows.

| Module | Does |
|---|---|
| `core.mjs` | detect · install (clone, retry, pin, verify, snapshot fallback) · verify · command install |
| `gates.mjs` | 17 secret rules, 12 risk heuristics, dependency audits, project checks, evidence output |
| `strix.mjs` | the guarded pentest runner (target guard, `run.json` verdict, key never printed) |
| `handoff.mjs` | `handoff.md` init/update/show — refreshes facts, never your prose |
| `skills.mjs` | the skill catalogue, the builder, the context budget |
| `package.mjs` | package self-verification, snapshot refresh |
| `common.mjs` | paths, colour, process execution, hashing, frontmatter |

`scripts/*.sh` and `scripts/*.ps1` are thin wrappers; the installers also work with no Node at all (clone-only fallback).

### Layer 8 — Integrations (`integrations/`, `upstream/`)

`integrations/manifest.json` is the machine-readable truth: repo URL, pinned commit, expected files, licence, skill names, tool install strategies. `upstream/` holds an exact export of each repository at that commit — licences intact, tree hashes recorded in `upstream/SNAPSHOTS.json`, never edited by hand.

| Integration | Licence | Used in |
|---|---|---|
| Taste Skill | MIT | design (phase 6) |
| Emil Kowalski Skills | MIT | design + motion (phase 6) |
| No AI Slop | MIT | copy, docs, report (§43) |
| Headroom | Apache-2.0 | agent context compression (phase 7) |
| Strix | Apache-2.0 | authorized pentest (phase 9) |

### Layer 9 — Evidence (in your project, `.biswodip/`)

`evidence/commands.log` (every command, exit code, timestamp) · `evidence/security-gates-*/report.{json,md}` · `evidence/strix-*.json` · `integrations.lock.json` · `handoff.md` at the repository root. This layer is what turns "it's secure" into "here is the command, the result and the artifact".

---

## 3. What happens when you type `/dip`

```text
1. Claude Code reads .claude/commands/dip.md                          (~600 tokens)
2. It reads .claude/skills/biswodip-unified-engineering/SKILL.md      (~1,365 tokens)
3. It matches your words to a phase, and reads ONE phase skill        (~0.8–1.3k tokens)
4. It reads that phase's lifecycle/<nn>-*.md procedure                (~1–2k tokens)
5. It works — running the tooling, writing evidence to .biswodip/
6. It greps a reference section only if the phase needs it            (a block, not a file)
7. It reports with statuses, not adjectives; findings carry file:line
8. At ~70% context, it writes handoff.md so the next session resumes
```

Total to start work: **under 4k tokens.** The pre-2.1.0 layout spent ~12,900 before step 3, on every trigger, whatever the task.

---

## 4. Build pipeline (maintainer)

```text
MASTER-PROMPT.md  ─┐
skills-src/*.md   ─┼─▶ node bin/biswodip.mjs build-skill ─▶ skills/<7 folders>
lifecycle/ …      ─┘        (frontmatter generated, parts copied per catalogue)

upstream remotes  ──▶ node bin/biswodip.mjs refresh-snapshots ──▶ upstream/ + manifest + SNAPSHOTS.json

everything        ──▶ node bin/biswodip.mjs verify-package ──▶ 61 checks
                      tree · sections §0–§44 · path resolution · gate count (2,215)
                      · skill sync + budget · versions · snapshot hashes · licences
                      · SPDX headers · script parsing · secret scan
```

Rules: never edit `skills/` (generated) · never edit `upstream/` (someone else's work) · never rewrite `references/` (carried forward verbatim) · every `.mjs`/`.sh`/`.ps1` starts with the SPDX header.

---

## 5. Install pipeline (any project)

```text
install.sh / install.ps1 / npx github:… dip install
        │
        ├─ 1. check git, Node ≥ 18.17
        ├─ 2. clone or update ~/.biswodip-goj-unified-engineering
        ├─ 3. for each of the 5 integrations:
        │       detect → clone (3 retries, backoff) → verify (remote, files, LICENSE)
        │       → install its skills → detect its CLI → record
        │       (network down → bundled snapshot, recorded as SNAPSHOT not CLONED)
        ├─ 4. install the 7 Biswodip skills into .claude/skills/
        ├─ 5. install /dip commands + @dip agent into .claude/
        ├─ 6. write .biswodip/integrations.lock.json and .biswodip/.gitignore
        └─ 7. print INTEGRATION | STATUS | VERSION | SOURCE | LOCATION | ACTION TAKEN
```

It never reinstalls what is present, never replaces a newer copy with an older one, never duplicates a skill across scopes, never overwrites your edits without `--update`, never deletes anything, and never adds a dependency to your `package.json` unless you ask.

---

## 6. Design decisions, and why

| Decision | Why |
|---|---|
| A router skill instead of one big skill | 12,917 → 1,365 tokens on trigger. Context is the scarce resource. |
| Seven skills, each self-contained | A typo fix must not drag a release gate into the window; each installs alone. |
| Slash commands hold no engineering content | They point at skills, so they cannot drift from the system. |
| Generated `skills/`, hand-written sources | One source of truth; `verify-package` fails on drift. |
| Vendored upstream + clone at install | Works offline and air-gapped; still gets live code when online; licences travel with the code. |
| Pinned commits in the manifest | Security review has to be reproducible. |
| Evidence on disk, not in chat | Survives the session, and someone else can re-check it. |
| Statuses instead of adjectives | `UNVERIFIED` is a fact; "should be fine" is not. |
| Guarded Strix runner | An autonomous exploit tool needs a hard stop between "my machine" and "someone else's". |
| `handoff.md` with mandatory failed attempts | The next session's biggest cost is repeating your dead ends. |
| Apache-2.0 with a NOTICE | Attribution survives redistribution; adds an explicit patent grant. |

---

## 7. Where to go next

| You want | Read |
|---|---|
| To install and use it | [`START-HERE.md`](START-HERE.md) |
| Every flag and troubleshooting | [`docs/INSTALL.md`](docs/INSTALL.md) |
| To host, release, refresh | [`docs/GITHUB.md`](docs/GITHUB.md) |
| The token maths and reading habits | [`docs/CONTEXT-BUDGET.md`](docs/CONTEXT-BUDGET.md) |
| The full operating system | [`MASTER-PROMPT.md`](MASTER-PROMPT.md) — 45 sections |
| The state of the project itself | [`handoff.md`](handoff.md) |

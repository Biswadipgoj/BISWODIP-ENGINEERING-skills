<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# upstream/ — vendored source snapshots

This directory holds an exact export of every upstream repository at the commit recorded in `SNAPSHOTS.json`: `.git` removed, licences and notices intact, tree hash verifiable with `node bin/biswodip.mjs verify-package`.

**These files are not the work of Biswodip Goj.** They belong to their authors under their own licences — see `../THIRD-PARTY-NOTICES.md`. Never edit anything here by hand.

| Directory | Project | Licence |
|---|---|---|
| `taste-skill/` | Taste Skill — Leonxlnx | MIT |
| `emilkowalski-skills/` | Emil Kowalski Skills | MIT |
| `no-ai-slop/` | No AI Slop — Peter Yang | MIT |
| `headroom/` | Headroom | Apache-2.0 (LICENSE + NOTICE) |
| `strix/` | Strix | Apache-2.0 |

## What they are for

The installer clones each project from its upstream remote. These snapshots are the fallback: they make `--offline` work (air-gapped install), and they are used automatically when the network fails, with the record marked `SNAPSHOT` rather than `CLONED` so the difference is never silent.

## Core distribution

An archive carrying `upstream/.snapshots-omitted` has these directories stripped to keep the download small. Everything else is identical and nothing is lost — the installer clones all five repositories:

```bash
bash scripts/install-integrations.sh .            # current upstream HEADs
bash scripts/install-integrations.sh . --pinned   # the exact commits in integrations/manifest.json
```

`verify-package` then reports the snapshots as `UNVERIFIED` rather than `FAILED`, and `--offline` is unavailable until you restore them:

```bash
node bin/biswodip.mjs refresh-snapshots
```

## Refreshing

`refresh-snapshots` re-clones each repository, replaces these directories, updates the pinned commits in `integrations/manifest.json`, records new tree hashes in `SNAPSHOTS.json`, warns about upstream skill drift, and rebuilds the skills. Do not run it immediately before a release.

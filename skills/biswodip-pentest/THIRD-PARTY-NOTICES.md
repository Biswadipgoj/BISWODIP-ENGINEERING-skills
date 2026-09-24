<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj -->

# Third-Party Notices

**Biswodip Goj Unified Engineering** is the orchestration and engineering system in this repository; it is licensed under Apache-2.0 (see `LICENSE` and `NOTICE`). The upstream projects below are **not** relicensed and are **not** the work of Biswodip Goj. Each is redistributed unmodified under its own licence, with its own `LICENSE` (and `NOTICE`, where provided) file preserved inside its directory.

Snapshot commits, tree hashes and file counts are recorded in `upstream/SNAPSHOTS.json` and `integrations/manifest.json`. Verify them at any time with:

```bash
node bin/biswodip.mjs verify-package
```

---

## 1. Taste Skill

- **Source:** https://github.com/Leonxlnx/taste-skill
- **Copyright:** Copyright (c) 2026 Leonxlnx
- **Licence:** MIT — full text at `upstream/taste-skill/LICENSE`
- **Bundled at:** `upstream/taste-skill/` (unmodified snapshot)
- **Used for:** frontend design skills (Phase 8)

The MIT licence permits redistribution provided the copyright notice and permission notice are included. They are preserved in the bundled `LICENSE` file, and the installer copies that licence alongside any skill it installs (`UPSTREAM-LICENSE`).

## 2. Emil Kowalski Skills

- **Source:** https://github.com/emilkowalski/skills
- **Copyright:** Copyright (c) 2026 Emil Kowalski
- **Licence:** MIT — full text at `upstream/emilkowalski-skills/LICENSE`
- **Bundled at:** `upstream/emilkowalski-skills/` (unmodified snapshot)
- **Used for:** design-engineering and motion skills (Phase 8)

> Correction to v1.2.0 of this package: an earlier note in `THIRD-PARTY-NOTICES.md` stated that this repository exposed no OSI licence file. That is not correct — the repository carries an MIT `LICENSE`, verified at commit `85e8e23`. The note has been removed and the project is redistributed here under MIT with its notice preserved.

## 3. No AI Slop

- **Source:** https://github.com/petergyang/no-ai-slop
- **Copyright:** Copyright (c) 2026 Peter Yang
- **Licence:** MIT — full text at `upstream/no-ai-slop/LICENSE`
- **Bundled at:** `upstream/no-ai-slop/` (unmodified snapshot)
- **Used for:** writing quality for UI copy, documentation and the release report (MASTER-PROMPT §43)

The upstream repository also contains `TERMS.md` and `PRIVACY.md` covering its ChatGPT/Codex plugin distribution; both are preserved in the snapshot.

## 4. Headroom

- **Source:** https://github.com/headroomlabs-ai/headroom
- **Copyright:** Copyright 2025 Headroom Contributors
- **Licence:** Apache-2.0 — full text at `upstream/headroom/LICENSE`; upstream `NOTICE` preserved at `upstream/headroom/NOTICE`
- **Bundled at:** `upstream/headroom/` (unmodified snapshot)
- **Used for:** agent context/token compression (Phase 9)

Apache-2.0 §4 requires that redistribution retain the licence, copyright, patent, trademark and attribution notices, and that any `NOTICE` file content be carried forward. Both files are preserved unmodified. Headroom's own `NOTICE` lists its third-party dependencies (tiktoken, Pydantic and others); those notices remain part of that file and apply to Headroom, not to this distribution.

## 5. Strix

- **Source:** https://github.com/usestrix/strix
- **Copyright:** Copyright the Strix authors (usestrix)
- **Licence:** Apache-2.0 — full text at `upstream/strix/LICENSE`
- **Bundled at:** `upstream/strix/` (unmodified snapshot)
- **Used for:** authorized autonomous penetration testing (Phase 11)

Strix must only be run against systems you own or are explicitly authorized to test. That obligation is part of using the tool and is enforced in this system by the guarded runner in `integrations/strix/`.

---

## Apache-2.0 attribution statement

This distribution contains Apache-2.0 licensed material from Headroom and Strix. In accordance with the licence:

- the `LICENSE` file of each is included with it;
- the `NOTICE` file of Headroom is included with it;
- no upstream copyright, patent, trademark or attribution notice has been removed or altered;
- no upstream file in `upstream/` has been modified by Biswodip Goj — the directories are exact exports of the recorded commits with the `.git` directory removed, verifiable by tree hash.

## MIT attribution statement

This distribution contains MIT licensed material from Taste Skill, Emil Kowalski Skills and No AI Slop. The copyright notice and permission notice of each are included with them in `upstream/`, and are copied alongside any skill installed from them.

## Trademarks

Project names ("Taste Skill", "Emil Kowalski Skills", "No AI Slop", "Headroom", "Strix") are used only to identify the upstream projects this system integrates with. No endorsement by, or affiliation with, their authors is claimed or implied.

## Ownership boundary

The Biswodip Goj contribution is the orchestration system, engineering lifecycle, integration architecture, security and release gates, verification and scoring model, agent operating instructions, tooling and original documentation. Copyright (c) 2026 Biswodip Goj for those materials only.

If you redistribute this package, keep this file, `LICENSE`, `NOTICE` and the `upstream/` licence files intact.

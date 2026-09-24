<!-- SPDX-License-Identifier: Apache-2.0 -->
# Contributing

This package is maintained by **Biswodip Goj**. Contributions are welcome under the same terms as the project (Apache-2.0).

## Before you open a PR

```bash
node bin/biswodip.mjs verify-package --verbose   # structure, licences, snapshots, sync, scripts, secrets
node --test test/                                # unit tests
```
Both must pass. CI runs them on Ubuntu, macOS and Windows.

## Rules of the repository

1. **Never edit `upstream/`.** Those directories are exact exports of upstream commits; their licences and notices must stay intact. To move to newer upstream versions, run `node bin/biswodip.mjs refresh-snapshots` — it re-clones, updates `integrations/manifest.json` and `upstream/SNAPSHOTS.json`, and reports skill drift.
2. **Never edit `skills/biswodip-unified-engineering/` by hand.** It is generated. Edit `MASTER-PROMPT.md`, `lifecycle/`, `security/`, `references/` or `reports/`, then run `node bin/biswodip.mjs build-skill`.
3. **`references/` is carried forward from v1.2.0** and is deliberately preserved verbatim, including the 2,215-item gate catalogue. Add new material rather than rewriting it; `verify-package` checks the gate count.
4. Every `.mjs`, `.sh` and `.ps1` file starts with the SPDX header and the copyright line.
5. Scripts must work on Linux, macOS and Windows, with Node >= 18.17 and no runtime dependencies. The installers must also degrade to a clone-only fallback when Node is unavailable.
6. No secrets, no API keys, no personal data — `verify-package` scans for them.
7. Documentation describes reality. If a feature is not implemented, it is not documented as if it were.
8. Run new prose through the `no-ai-slop` skill (§43) before submitting.

## Reporting security issues

See `SECURITY.md` — not through public issues.

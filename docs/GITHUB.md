<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Hosting this on GitHub

The repository is the distribution. Once it is pushed, anyone (including your agents) installs the skills straight from it.

## 1. Push it

```bash
cd BISWODIP-GOJ-UNIFIED-ENGINEERING
git init -b main
git add .
git commit -m "Biswodip Goj Unified Engineering v2.1.0"

# with the GitHub CLI
gh repo create Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING --public --source=. --push

# or by hand
git remote add origin https://github.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING.git
git push -u origin main
```

Before the first push, confirm the package verifies:

```bash
node bin/biswodip.mjs verify-package --verbose
node --test test/tooling.test.mjs
```

### Size

The repository carries the five vendored upstream snapshots (~85 MB on disk, largest single file ~15 MB). That is inside GitHub's limits — no Git LFS needed. The `core` distribution omits `upstream/` if you prefer a small repository; the installer then clones each project instead, and `verify-package` reports those snapshots as UNVERIFIED rather than FAILED.

## 2. What GitHub shows

- `.gitattributes` marks `upstream/**` as `linguist-vendored`, so the language bar reflects your JavaScript, shell and PowerShell rather than Headroom's Python and Rust. `skills/**` is `linguist-generated` (collapsed in diffs), and the docs directories are `linguist-documentation`.
- `README.md` opens with `assets/banner.svg` and the badge row. The CI badge resolves once the first Actions run finishes.
- `.github/workflows/ci.yml` runs on Ubuntu, macOS and Windows across Node 18/20/22: package verification, unit tests, an installer dry run, an offline install, the Strix guard refusal check, the security gates, a live clone of all five upstream repos at their pinned commits, plus `shellcheck` and `PSScriptAnalyzer`.
- Issue forms, a PR checklist and `CODEOWNERS` are in `.github/`.

## 3. Installing the skills from the repository

```bash
# every skill
npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING

# one skill
npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING --skill biswodip-security-review

# a specific agent, non-interactive
npx skills add Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING -a claude-code -y
```

Or clone and use the installer, which also clones the five upstream projects and writes the lock file:

```bash
git clone https://github.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING.git
bash BISWODIP-GOJ-UNIFIED-ENGINEERING/scripts/install-integrations.sh /path/to/your/project
```

## 4. Releases

Tag and attach the zips so people can download without cloning 85 MB:

```bash
git tag -a v2.1.0 -m "v2.1.0"
git push origin v2.1.0
gh release create v2.1.0 \
  --title "v2.1.0" \
  --notes-file <(sed -n '/## \[2.1.0\]/,/## \[2.0.0\]/p' CHANGELOG.md) \
  dist/*.zip dist/*.sha256
```

Build the archives first:

```bash
mkdir -p dist
zip -rq dist/BISWODIP-GOJ-UNIFIED-ENGINEERING-v2.1.0.zip . -x '.git/*' 'dist/*' 'node_modules/*'
(cd dist && sha256sum *.zip > SHA256SUMS)
```

## 5. Keeping it current

```bash
node bin/biswodip.mjs refresh-snapshots     # re-clone upstream, update manifest + SNAPSHOTS.json, rebuild skills
node bin/biswodip.mjs verify-package --verbose
git add -A && git commit -m "chore: refresh upstream snapshots"
```

Never edit `upstream/` by hand, never edit `skills/` by hand (edit `MASTER-PROMPT.md` or `skills-src/`, then `build-skill`), and do not refresh upstream immediately before a release.

## 6. If you keep it private

Everything works the same; `npx skills add` needs an authenticated `git` for a private repository. Vendoring MIT and Apache-2.0 code in a private repository is fine — the licence obligations (keeping `LICENSE`, `NOTICE` and attribution intact) apply when you redistribute, and this package keeps them either way.

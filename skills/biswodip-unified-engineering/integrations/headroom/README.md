<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. This brief is Biswodip Goj's integration documentation; the upstream project belongs to its authors. -->

# Integration: Headroom

| | |
|---|---|
| **Upstream** | https://github.com/headroomlabs-ai/headroom |
| **Licence** | Apache-2.0 (upstream `LICENSE` + `NOTICE` preserved) |
| **Pinned commit / version** | see `integrations/manifest.json` → `headroom.snapshot` |
| **Bundled snapshot** | `upstream/headroom/` |
| **Used in** | Phase 9 (`lifecycle/07-performance.md`), MASTER-PROMPT §20, references 01 §1B |

## What it provides
Local context/token compression for coding agents, with agent wrapping, proxy and MCP modes. The `headroom` CLI ships in the **PyPI** package; the npm `headroom-ai` package is the TypeScript **SDK only** (no CLI).

## Install
```bash
uv tool install --python 3.13 "headroom-ai[all]"     # preferred: isolated app env
pipx install --python python3.13 "headroom-ai[all]"
pip install "headroom-ai[all]"
npm install headroom-ai                               # SDK only

headroom doctor        # health check
headroom wrap claude   # wrap an agent session
```
`bash scripts/install-integrations.sh . --with-tools --only headroom` attempts the uv/pipx route for you. The npm SDK is only installed into your `package.json` with `--with-headroom-sdk` — this system does not add dependencies to your project silently.

## Rules in this system
- Headroom is an optimisation layer, **never** a security layer.
- Compression must never drop: authorization requirements, acceptance criteria, security findings, exact error evidence, migration details, test failures.
- Keep authoritative state (files, test output, findings, config) retrievable; when compressed context disagrees with it, retrieve the original and trust that.
- Never send secrets to a third-party compression service; prefer the documented local execution model.
- Do not claim token savings you have not measured in the actual workload.

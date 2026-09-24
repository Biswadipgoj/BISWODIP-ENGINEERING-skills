<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. This brief is Biswodip Goj's integration documentation; the upstream project belongs to its authors. -->

# Integration: Strix

| | |
|---|---|
| **Upstream** | https://github.com/usestrix/strix |
| **Licence** | Apache-2.0 (upstream `LICENSE` preserved) |
| **Pinned commit / version** | see `integrations/manifest.json` → `strix.snapshot` |
| **Bundled snapshot** | `upstream/strix/` |
| **Used in** | Phase 11 & 15 (`lifecycle/09-pentest.md`), MASTER-PROMPT §22, references 04 |

## What it provides
An open-source autonomous pentesting CLI (source trees, live apps, OpenAPI targets, multi-target runs) plus nine agent skills: `penetration-testing-with-strix`, `fix-security-vulnerabilities-with-strix`, `ci-security-scanning-with-strix`, `managed-pentesting-with-strix`, `application-security-testing`, `web-app-penetration-testing`, `api-security-testing`, `owasp-top-10-testing`, `find-security-vulnerabilities-in-code`.

## Install
```bash
pipx install strix-agent                       # preferred — no piping a script into a shell
curl -sSL https://strix.ai/install | bash      # upstream installer (review it first)
npx skills add usestrix/strix                  # the nine agent skills
```
Requires **Docker running** and an LLM provider configured through the environment.

## Configure (current shell only — never in a committed file)
```bash
export STRIX_LLM="openrouter/<model>"
export LLM_API_KEY="<key>"
```

## Run — use the guarded runner
```bash
bash integrations/strix/run-local-pentest.sh --target-dir . --app-url http://127.0.0.1:3000 --mode quick --budget 10
```
```powershell
.\integrations\strix\run-local-pentest.ps1 -TargetDir . -AppUrl http://127.0.0.1:3000 -Mode quick -Budget 10
```
The runner refuses any non-loopback target unless you pass `--authorized-host <host>`, refuses to start when Docker or the environment is not ready (recording `BLOCKED` instead of pretending), never prints or logs your key, and classifies the result from `run.json` rather than the exit code alone. Add `--openapi ./openapi.yaml` for API-first testing and `--instruction-file` for authenticated or financial scope (template alongside this file).

## Reading the result
- Exit codes: `0` clean **for the analyzed scope**, `1` fatal error, `2` vulnerabilities found.
- Artifacts: `strix_runs/<run>/penetration_test_report.md`, `vulnerabilities/*.md`, `vulnerabilities.json`, `findings.sarif`, `run.json`.
- An incomplete or budget-stopped run is `UNVERIFIED`, never clean. A scanner result is evidence, not truth — reproduce every finding manually.

## Authorization
Only scan systems you own or are explicitly authorized to test. Use disposable environments, test identities and provider sandbox instruments. Keep the written authorization with your evidence.

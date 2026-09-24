<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering. Template: copy into the target repository and fill from evidence. -->

# Threat Model — <project>

## Trust boundaries
```text
UNTRUSTED CLIENT (browser / mobile / API consumer / LLM input)
      |  hostile input, replay, modified requests, forged identity
      v
SERVER / API / BUSINESS LOGIC        <-- every security decision happens here
      +--> DATABASE
      +--> OBJECT STORAGE
      +--> PAYMENT / BANK PROVIDER
      +--> EMAIL / NOTIFICATION PROVIDER
      +--> QUEUE / JOBS
      +--> LLM PROVIDER / TOOLS
```

## Assets
| Asset | Sensitivity | Where stored | Who may access |
|---|---|---|---|

## Actors
| Actor | Capability | Trusted for |
|---|---|---|
| Anonymous | | |
| Authenticated user | | |
| Privileged user / admin | | |
| Service account | | |
| External provider | | |
| Malicious user / compromised account | | |
| Compromised dependency | | |
| Prompt-injected AI agent (if applicable) | | |

## Entry points
<UI, API, webhook, upload, import, URL fetch, job, cron, admin, CLI, queue, LLM surface>

## Abuse cases
| # | Asset | Actor | Entry point | Boundary | Required authz | Abuse case | Impact | Preventive control | Detection | Recovery | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|

## Security objectives
Confidentiality · Integrity · Authenticity · Authorization · Availability · Accountability · Recoverability — state how each is met.

## Gaps (become MUST CHANGE items)
| Gap | Risk | Planned control |
|---|---|---|

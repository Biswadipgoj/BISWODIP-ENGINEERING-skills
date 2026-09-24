<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj. Part of the Biswodip Goj Unified Engineering Skill. Content carried forward from v1.2.0 sections 8-13 and Final Agent Protocol. -->

## 8. Release Gate

# Release Gate

## Hard blockers

Release MUST be blocked when any of the following is true:

- known critical security vulnerability
- unresolved broken authorization
- exposed production secret
- browser-accessible privileged credential
- client-authoritative financial/security decision
- unsafe financial state transition
- unauthenticated privileged endpoint
- cross-tenant data access
- known destructive data-integrity defect
- unrecoverable migration risk
- unbounded resource-exhaustion path on a reachable endpoint
- security regression with no compensating control
- fabricated or missing verification evidence for a mandatory gate

## Evidence standard

A gate is `VERIFIED` only when an engineer can point to:
- implementation location
- test or inspection procedure
- actual result
- date/commit/version
- artifact/log/report where appropriate

Allowed states:

`VERIFIED | PARTIAL | BLOCKED | UNVERIFIED | OPEN | N/A`

`N/A` requires a written reason.

## Final release sequence

1. Build from clean checkout.
2. Run unit/integration/security tests.
3. Scan dependencies and artifacts.
4. Inspect generated bundles for secrets.
5. Run authorized adversarial tests.
6. Validate migrations and rollback/recovery.
7. Validate observability and audit trails.
8. Review unresolved findings.
9. Record release evidence.
10. Only then permit deployment.

---

## 9. Security Baseline

# Security Baseline

## Secrets
- no secrets in source, logs, client bundles, source maps, fixtures or documentation
- secret scanning in CI
- environment-specific secret management
- rotation/revocation procedure

## Authentication
- strong credential policy appropriate to risk
- phishing-resistant MFA/passkeys for high-risk actions where appropriate
- server-side sessions
- no browser JWT access/refresh storage
- session rotation/revocation

## Authorization
- deny by default
- server-side role/permission checks
- object ownership checks
- tenant isolation
- privileged action re-authentication/step-up where required

## Web/API
- strict input schemas
- bounded body sizes
- rate limits
- resource/timeouts
- CSRF protection for cookie-authenticated state changes
- safe CORS
- security headers
- generic production errors

## Database
- least-privilege database identity
- parameterized queries
- constraints for invariants
- transactions for multi-step state changes
- safe migrations
- tested backup/restore

## Files
- allowlist where possible
- size/count limits
- MIME/content verification
- randomized storage names
- non-executable storage
- authorization on every download
- archive traversal defenses

## Operations
- structured logs without secrets
- security/audit events
- monitoring and alerting
- dependency updates
- incident response
- rollback and recovery

---

## 10. Attack Scenarios

# Adversarial Scenario Catalogue

Use only in an authorized environment.

- Change `userId` to another user's ID.
- Change `tenantId` to another tenant.
- Remove role claims/headers.
- Call admin endpoints directly.
- Replay a previously successful state-changing request.
- Send the same payment request concurrently.
- Change amount/currency/fee/discount/status in the request.
- Submit negative, zero, maximum, overflow and precision-edge amounts.
- Forge/replay/out-of-order a webhook.
- Upload executable, oversized, polyglot and archive-traversal files.
- Request `../../` and encoded traversal paths.
- Supply internal/cloud metadata URLs to URL-fetching features.
- Attempt SQL/NoSQL/template/command injection.
- Attempt reflected/stored/DOM XSS where applicable.
- Exhaust pagination, batch and expensive query paths.
- Bypass rate limits using alternate identifiers/headers/routes.
- Inspect browser bundles, source maps and error responses for secrets.
- Trigger provider timeouts and retry storms.
- Kill workers between database commit and external-provider calls.
- Deliver duplicate and out-of-order asynchronous events.

---

## 11. Pentest Finding Template

# Finding: <ID> — <Title>

- Severity: <Critical/High/Medium/Low>
- Asset: <host/route/component>
- Environment: <staging/sandbox/etc.>
- Preconditions: <...>

## Reproduction

<safe exact reproduction>

## Expected

<secure behavior>

## Observed

<actual behavior>

## Evidence

<request/response/log/test artifact references; never include secrets>

## Impact

<concrete impact>

## Remediation

<fix>

## Regression test

<test that prevents recurrence>

## Verification

- Commit/build: <...>
- Verified by: <...>
- Date: <...>
- Result: <...>

---

## 12. Security Exception Template

# Security Exception

- Control: <gate/control>
- Owner: <person/team>
- Reason: <why the control cannot currently be met>
- Affected assets: <...>
- Risk: <concrete risk>
- Compensating controls: <...>
- Expiry date: <mandatory>
- Remediation plan: <...>
- Approval: <authorized approver>

Exceptions are temporary risk decisions, not evidence that a missing control is secure.

---

## 13. Security Policy

# Security Policy

Do not publish exploitable security details in a public issue before responsible disclosure.

For a project using this gate, replace this document with the application's actual private reporting contact and supported versions.

Security testing must be authorized and must not target unrelated systems or real customer funds/data.

## Strix validation

Before release, authorized local/staging assessments may use the Strix open-source CLI. The intended sequence is source review → authenticated dynamic testing → API testing → deep pre-release testing → manual verification → regression retest. Strix results are evidence, not a guarantee of security; incomplete or budget-stopped runs do not qualify as a clean assessment.

---

## Final Agent Protocol

The AI agent MUST follow this sequence:

1. **Inspect** the complete repository and runtime architecture.
2. **Map** assets, trust boundaries, identities, roles, data ownership and privileged operations.
3. **Threat-model** realistic attackers and abuse paths.
4. **Fix** server-side authorization, validation, secrets, data integrity and business logic before cosmetic work.
5. **Verify** every mandatory control with real evidence.
6. **Attack** the application from the browser/API boundary using safe test identities and data.
7. **Stress** concurrency, retries, malformed input, rate limits, file handling and provider failures.
8. **Run Strix** locally against the source and disposable running application; review its findings rather than blindly accepting them.
9. **Re-test** every fixed finding and preserve regression tests/evidence.
10. **Inspect artifacts** for secrets, debug code, generated files, logs and accidental credentials.
11. **Release only** when mandatory gates are VERIFIED and no hard blocker remains.

### Non-negotiable anti-vibe-code law
Do not add technologies, abstractions, dependencies, animations, security packages, tests, dashboards, documentation, AI labels, or architectural layers merely to make the repository look senior. Every component must have a real operational, security, reliability, maintainability, or product requirement.

### Evidence rule
Never write “secure”, “penetration tested”, “production ready”, “fixed”, or “verified” solely because code was generated or reviewed. Record the exact test, environment, result, artifact, commit/version, and remaining limitations.

### Secret-handling rule
API keys are credentials. Private repository visibility does not make hard-coded credentials safe. Use environment variables or an approved secret manager. If a key has ever been pasted into chat, source control, logs, screenshots, or a shared document, treat it as exposed and rotate/revoke it before relying on it for anything sensitive.


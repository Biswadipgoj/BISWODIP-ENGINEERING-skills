<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj. Part of the Biswodip Goj Unified Engineering Skill. Content carried forward from v1.2.0 sections 14-23 plus attribution/final contract. -->

# 14. AI DESIGN-ENGINEERING SKILL INTEGRATION

This master gate incorporates the operational intent of the following external agent-skill repositories as complementary quality systems. Do not copy their full source into this document; install the upstream skills in the project when needed and treat this master gate as the higher-level release/security contract.

## 14.1 Taste Skill — `leonxlnx/taste-skill`

Repository: https://github.com/leonxlnx/taste-skill

The current repository describes itself as an anti-slop frontend framework for AI agents and provides installable skills for frontend taste, redesign, visual systems, motion, output completeness and related workflows.

Official installation:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill
```

Default frontend skill:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

The agent MUST use these skills as quality guidance, not as permission to add visual complexity. Security, accessibility, performance, maintainability and product requirements always override decorative design choices.

### Taste integration rules

- Eliminate generic AI-generated visual patterns and boilerplate layouts.
- Establish a deliberate visual language before implementing a page.
- Use hierarchy, typography, spacing, density, composition and motion intentionally.
- Avoid random gradients, excessive glassmorphism, gratuitous blobs, fake 3D, neon overload, dashboard-template styling and decoration without purpose.
- Do not make every section visually loud.
- Do not animate everything.
- Do not use motion to hide weak information architecture.
- Preserve a coherent design system across desktop, tablet and mobile.
- Prefer meaningful interaction feedback over ornamental animation.
- Motion must communicate state, hierarchy, continuity or spatial relationships.
- Respect `prefers-reduced-motion` and provide an equally usable reduced-motion experience.
- Never sacrifice keyboard access, contrast, semantics, performance or error handling for visual polish.
- Existing projects must be audited before being redesigned; do not blindly replace working UI.
- Never rewrite functional backend/security architecture merely to support a visual preference.
- Never add a dependency solely because an AI agent thinks it looks impressive.

## 14.2 Emil Kowalski Design Engineering Skills — `emilkowalski/skills`

Repository: https://github.com/emilkowalski/skills

Official installation:

```bash
npx skills@latest add emilkowalski/skills
```

The repository provides design-engineering skills covering UI polish, animation decisions, animation review, animation vocabulary, redesign workflows, visual design directions, output completeness and related design workflows. The upstream README specifically positions the collection as guidance for designers and engineers and notes that it is based on experience from environments including Vercel and Linear.

### Required installation for Claude Code / compatible agents

When the project uses Claude Code and the local skills CLI is available:

```bash
npx -y skills add emilkowalski/skills --agent claude-code
```

If project-local installation is preferred, install the collection into the project rather than relying on an undocumented global state.

### Emil skill integration rules

- Treat animation as a design-engineering decision, not decoration.
- Select enter/exit/interaction easing according to the physical or semantic role of the transition.
- Avoid excessive springiness, bounce, stagger and perpetual motion.
- Avoid animation that delays the user from completing a task.
- Use consistent duration and easing families across related interactions.
- Keep motion subtle when the UI is information-dense.
- Use opacity/transform changes where appropriate instead of expensive layout animation.
- Prefer compositor-friendly transforms and opacity for frequent motion.
- Measure animation performance on realistic hardware.
- Review motion on touch devices and low-power devices.
- Test reduced-motion behavior.
- Never animate security-critical state in a way that can cause a stale authorization or payment state to appear valid.
- Never let optimistic UI imply a successful financial/security operation before the server confirms it.
- Loading states must represent actual system state, not fake progress.
- Error, retry, pending, success and rollback states must be distinguishable.

## 14.3 Combined visual-quality pipeline

For any meaningful frontend change, the agent MUST execute this sequence:

1. **Understand the product** — identify the user task, information hierarchy and real business goal.
2. **Inspect existing UI** — identify reusable components, established spacing, typography, colors, states and interaction patterns.
3. **Define visual intent** — choose hierarchy, density, composition and motion intentionally.
4. **Implement the smallest coherent design system** — tokens, primitives and reusable patterns only where justified.
5. **Implement states** — loading, empty, error, disabled, pending, success, partial failure and permission-denied states where applicable.
6. **Implement responsive behavior** — test real content at mobile, tablet and desktop widths.
7. **Review motion** — inspect enter, exit, hover, focus, press, loading and transition behavior.
8. **Run a visual anti-slop review** — remove generic AI patterns, unnecessary decoration and inconsistent choices.
9. **Run accessibility review** — keyboard, focus, semantics, contrast, zoom, reduced motion and screen-reader behavior.
10. **Run performance review** — bundle impact, image loading, layout shifts, animation cost and unnecessary client JavaScript.
11. **Run security review** — ensure visual/client behavior never becomes the source of authorization truth.
12. **Run functional regression** — confirm that visual changes did not alter business behavior.

# 15. MASTER ANTI-SLOP + SECURITY CONTRACT

The project now has two complementary quality dimensions:

**Security/engineering correctness:** this document's security, reliability, data-integrity, server-authority and release gates.

**Design-engineering quality:** the Taste Skill and Emil Kowalski skill collections' principles for deliberate composition, typography, spacing, interaction and motion.

Neither dimension may weaken the other.

## 15.1 Absolute priority order

When requirements conflict, use this order:

1. Safety and legal/authorization boundaries
2. Server-side security and authorization
3. Data integrity and financial correctness
4. Reliability and recoverability
5. Accessibility and usability
6. Performance and operational cost
7. Maintainability and architecture clarity
8. Product requirements
9. Visual design and motion polish
10. Decorative effects

## 15.2 Never do these merely for appearance

- Add unnecessary frameworks.
- Add unnecessary animation libraries.
- Add a design system package when a small local token system is sufficient.
- Add a state-management library without a real state-management requirement.
- Add a database/ORM solely because it appears in senior-engineering examples.
- Add fake API calls or mock production data to make a UI look populated.
- Add fake loading percentages.
- Add fake analytics.
- Add fake security dashboards.
- Add AI-generated copy that does not represent real product behavior.
- Add badges such as "enterprise-grade" without evidence.
- Add unnecessary 3D scenes, particles, gradients or glass effects.
- Add excessive scroll-triggered animation.
- Add animations that obscure content or make navigation slower.
- Add client-side checks and call them authorization.

## 15.3 Production UI completeness gate

A UI is not complete merely because the happy path looks polished.

For every important interaction, verify:

- Initial loading
- Slow loading
- Empty data
- Partial data
- Large data
- Network failure
- Server error
- Validation error
- Authentication expiry
- Authorization denial
- Rate limiting
- Retry
- Duplicate submission
- Concurrent update
- Offline/poor connectivity where applicable
- Mobile viewport
- Keyboard navigation
- Reduced motion
- Screen-reader semantics
- Long text
- Localization expansion where applicable
- Browser refresh
- Back/forward navigation
- Deep-link entry
- Unexpected server response

## 15.4 Security must remain server-authoritative

No design skill may override these requirements:

- Browser code is untrusted.
- Client-side validation is UX only.
- Authorization is server-side.
- Roles and permissions are server-derived.
- Financial calculations are server-side.
- Account ownership is server-side.
- Payment status is server-side.
- Webhook verification is server-side.
- Secrets never belong in browser code.
- Sensitive tokens must not be placed in Local Storage, Session Storage, IndexedDB or URLs.
- Never trust client-provided identity, role, amount, balance, price, discount, permission, tenant or transaction state.
- Never treat a successful animation as proof of a successful server operation.

# 16. AGENT EXECUTION CHECKLIST — ALL SYSTEMS COMBINED

Before modifying code:

- Read this entire master document.
- Inspect the repository.
- Inspect existing skills and project instructions.
- Identify the actual stack before selecting tools.
- Identify server/client trust boundaries.
- Identify sensitive data and financial operations.
- Identify existing design language before changing it.
- Identify test and staging environments.

During implementation:

- Keep security decisions server-side.
- Keep business rules deterministic and testable.
- Keep secrets outside source control.
- Reuse existing components when appropriate.
- Prefer simple architecture over performative complexity.
- Implement complete UI states.
- Keep motion purposeful and restrained.
- Keep accessibility intact.
- Keep performance measurable.
- Add dependencies only with documented justification.

After implementation:

- Run static/security checks.
- Run unit/integration tests.
- Run API authorization tests.
- Run adversarial tests.
- Run file/upload tests if applicable.
- Run concurrency/idempotency tests for state-changing operations.
- Run Strix against the authorized local/staging target.
- Review Strix findings manually.
- Re-test every fixed security finding.
- Perform the Taste/visual anti-slop review.
- Perform animation review where motion changed.
- Perform responsive/accessibility review.
- Inspect the final diff for unrelated changes.
- Scan repository artifacts for secrets and credentials.
- Confirm no production debug bypass exists.
- Confirm no fake success/loading/security indicators exist.
- Record evidence.
- Release only when mandatory gates pass.

# 17. INSTALLATION REFERENCE

The recommended project setup is:

```bash
# Taste Skill
npx skills add https://github.com/Leonxlnx/taste-skill

# Emil Kowalski design-engineering skills
npx skills@latest add emilkowalski/skills
```

For Claude Code specifically:

```bash
npx -y skills add emilkowalski/skills --agent claude-code
```

These are upstream skill installations. The repository's own `AGENT-INSTRUCTIONS.md` and this master gate remain the authoritative project-specific instructions.

# 18. UPSTREAM REFERENCE POLICY

Upstream skills can change independently of this project. Therefore:

- Record the installed skill version/commit when reproducibility matters.
- Review upstream changes before adopting them in a security-sensitive production repository.
- Do not blindly auto-update skills immediately before a release.
- Do not treat an upstream skill as a security certification.
- Do not allow a skill to override project security policies.
- Prefer pinned versions for reproducible CI/security review environments.
- Re-run the full project verification suite after changing skill versions.
- Keep the local master gate stable even when upstream design guidance changes.

# 19. FINAL DEFINITION OF DONE

The product is DONE only when all of the following are true:

- It works for the intended real user workflows.
- The server is authoritative for security-sensitive behavior.
- Authorization has been tested, not merely implemented.
- Sensitive data is protected.
- Secrets are not exposed.
- Financial/state-changing operations are idempotent and integrity-protected where applicable.
- Errors fail safely.
- Abuse controls exist where required.
- Files, APIs, webhooks and external integrations have been tested where applicable.
- Strix testing has been performed for the authorized scope where required.
- Security findings have been manually verified and regression-tested.
- No critical release blocker remains.
- The UI is complete across required states and responsive sizes.
- Accessibility has been verified.
- Motion is purposeful, performant and reduced-motion aware.
- The interface does not look like generic AI-generated slop.
- No unnecessary technology was introduced.
- No fake production evidence exists.
- Documentation reflects the actual implementation.
- The repository is understandable to another engineer.
- A future engineer can operate, debug, secure, test, deploy, rollback and recover the system.

**Security evidence beats claims. Product correctness beats polish. Taste beats decoration. Simplicity beats performative complexity.**


# 20. BISWODIP GOJ UNIFIED SKILL INTEGRATION

This document is the canonical consolidated skill maintained by **Biswodip Goj**. It combines the complete security/shipping requirements from this project with design-engineering guidance incorporated from the following open-source skill repositories:

- Taste Skill: https://github.com/Leonxlnx/taste-skill
- Emil Kowalski Skills: https://github.com/emilkowalski/skills

## Integrated Taste capabilities

Apply the relevant Taste guidance for anti-slop frontend engineering, layout variance, motion intensity, visual density, typography, spacing, hierarchy, redesign audits, complete output, responsive composition and visual quality. Relevant upstream skill names include `design-taste-frontend`, `redesign-existing-projects`, `high-end-visual-design`, `full-output-enforcement`, `minimalist-ui`, and related variants. Do not mechanically apply every visual style; choose only what the product brief actually requires.

## Integrated Emil Kowalski capabilities

Apply relevant design-engineering guidance for animation curves, duration, property selection, motion restraint, animation review, animation opportunity discovery, animation vocabulary, mobile-native interaction, UI-library selection, performance and reduced-motion behavior. Relevant upstream skills include `emil-design-eng`, `animate`, `animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design`, `pick-ui-library`, `mobile-native`, and related skills.

## Priority when rules conflict

Security and correctness always override visual/design guidance. Accessibility and reduced-motion requirements override decorative motion. Performance overrides unnecessary animation. Product requirements override stylistic defaults. Never add animation, a library, a visual effect, a dependency, or an abstraction merely because an upstream skill suggests it.

# 21. CONVERSATION-DERIVED MASTER REQUIREMENTS

The agent must treat the following as persistent requirements for this unified skill:

- Production engineering, not vibe coding or demo engineering.
- Inspect the entire repository before architectural changes.
- Keep secrets, authorization decisions, business rules, financial calculations and security-sensitive state server-authoritative.
- Never trust browser/client claims about identity, roles, permissions, ownership, tenant, account, amount, balance, price, fee, discount, payment state or verification state.
- Do not place JWT access or refresh tokens in Local Storage, Session Storage, IndexedDB, URLs, DOM storage or readable cookies. If cookie-backed sessions are used, use opaque server-side sessions with secure cookie flags and server-side revocation.
- Financial operations require exact monetary representation, transaction integrity, idempotency, concurrency protection, replay protection, state-machine enforcement, webhook verification and reconciliation.
- Penetration testing must be authorized, scoped and performed against disposable/local/staging targets where possible. Never treat an automated scanner as proof that software is secure.
- Strix should be used for authorized source, local, API and live-target penetration testing where applicable; verify its findings manually and inspect run artifacts/status.
- Remove debug artifacts, fake test data, exposed secrets, unsafe error details and development bypasses before release.
- Test failure modes, race conditions, rate-limit bypasses, malformed input, authorization boundaries, uploads, webhooks, external integrations and degraded networks.
- The UI must be complete, responsive, accessible and coherent across loading, empty, error, success, permission and edge states.
- Avoid generic AI-generated visual patterns, excessive gradients, arbitrary glassmorphism, meaningless animation, excessive rounded cards, fake dashboards, decorative complexity and technology name-dropping.
- Motion must have a reason, use appropriate easing/duration, remain performant and honor `prefers-reduced-motion`.
- Do not introduce dependencies unless they materially solve a verified problem and are maintained, justified and compatible with the project.
- Evidence beats claims: every security or quality gate must have observable verification where practical.
- Never fabricate pentest results, test coverage, performance measurements, security guarantees or production readiness.
- The final repository must be maintainable by another engineer without relying on the original AI conversation.

# 22. PRIVATE-REPOSITORY / NPM DISTRIBUTION

This skill is designed to live in a private GitHub repository owned and maintained by Biswodip Goj and to be installable as an npm package from that repository. The package should not contain API keys or other credentials.

Recommended installation after the private repository has been created:

```bash
npm install git+https://github.com/Biswadipgoj/<PRIVATE-REPOSITORY>.git
```

The installed package contains the canonical skill at:

```text
node_modules/biswodip-goj-unified-engineering-skill/skills/biswodip-unified-engineering/SKILL.md
```

For Skills CLI environments, the upstream projects can also be installed directly with:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill
npx skills@latest add emilkowalski/skills
```

The unified package should preserve required third-party attribution and license notices. It may be branded, maintained and extended by Biswodip Goj, but it must not falsely claim that third-party copyrighted material was originally authored by Biswodip Goj or remove legally required notices.

# 23. FINAL AGENT EXECUTION LOOP

**DISCOVER → MODEL → PLAN → IMPLEMENT → TEST → ATTACK → VERIFY → REVIEW → HARDEN → REGRESS → DOCUMENT → RELEASE**

At every stage, prefer the smallest justified change. If evidence contradicts an assumption, stop and investigate rather than forcing the implementation to match the assumption.


# 24. INTEGRATED SOURCE AND ATTRIBUTION POLICY

This unified skill is maintained and packaged by **Biswodip Goj**. The original security, server-authority, financial-integrity, release-gate, agent workflow, scoring and integration material is authored for this project.

The project also integrates/adapts concepts and interfaces from:
- Taste Skill — https://github.com/Leonxlnx/taste-skill
- Emil Kowalski Skills — https://github.com/emilkowalski/skills
- Headroom — https://github.com/headroomlabs-ai/headroom
- Strix — https://github.com/usestrix/strix

Third-party licenses and copyright notices remain in `THIRD-PARTY-NOTICES.md`. “Biswodip Goj” branding identifies this combined maintained distribution; it does not erase upstream copyright ownership or convert third-party code into original authorship.

# 25. FINAL AGENT CONTRACT

**PLAN → INSPECT → MODEL → IMPLEMENT → VERIFY → ATTACK → FIX → REGRESSION-TEST → SCORE → RELEASE GATE → REPORT.**

No shortcut is valid merely because the UI looks polished, the build passes, the scanner returns clean, or the agent says it is finished. Evidence is the authority.

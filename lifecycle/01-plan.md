<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# 01 — Plan (Phase 3 & 5)

**Goal:** a plan another engineer could execute, with acceptance criteria that can be tested.

## Entry criteria
- Bootstrap complete, forensics (`02-inspect.md`) complete.

## Procedure
1. Restate the request in engineering terms. Name the user, the workflow and the business operation it touches.
2. Write acceptance criteria as testable statements ("an authenticated user who does not own order X receives 404 and no data"), not aspirations ("secure ordering").
3. Map impact: files, modules, services, APIs, database objects, jobs, external providers, clients.
4. State the implications: authentication, authorization, security, data integrity, performance, UX, accessibility, migration, API compatibility, observability, cost.
5. Decide the change set and classify every item: **MUST CHANGE · SHOULD CHANGE · OPTIONAL · DO NOT CHANGE**. Optional work that adds risk is dropped, not "done quickly".
6. Define the test strategy (unit, integration, API, e2e, negative, concurrency) and the pentest strategy (what will be attacked, from which identity, in which environment).
7. Define rollback: how this change is undone, and what happens to data written in the meantime.
8. Ask the user only about what cannot be safely inferred (§39). Otherwise decide and record the decision.

## Anti-patterns
- Starting to edit files before the plan exists.
- Abstractions whose only purpose is to make the diff look senior.
- A plan that lists technologies instead of behaviour.
- Inventing requirements the user never stated.

## Evidence to record
- The plan itself (`.biswodip/evidence/PLAN.md`), including the classification table and acceptance criteria.

## Exit gate
- [ ] Acceptance criteria are testable and cover failure and unauthorized paths.
- [ ] Every MUST CHANGE item has an owner file/module.
- [ ] Rollback is written down.
- [ ] Nothing in DO NOT CHANGE is touched later without an explicit note.

**Next:** `03-threat-model.md` for anything security-sensitive, otherwise `04-implement.md`.

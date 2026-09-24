<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# Attack Catalogue

Use only against a system you own or are explicitly authorized to test, in a disposable environment, with test data. Record every attempt and its result — a rejected attack is evidence too.

## Identity and session
- Unauthenticated call to every privileged endpoint.
- Expired, revoked, tampered and replayed session.
- Session fixation; session not rotated after login or privilege change.
- Password reset: token reuse, no expiry, user-supplied email in the reset link, enumeration via response or timing.
- MFA: skip the second step, reuse a code, brute force, downgrade to a weaker factor.
- OAuth: missing `state`, open redirect on the callback, token from another client, mismatched `aud`/`iss`.

## Authorization
- Another user's id, another tenant's id, removed tenant field, guessed sequential ids.
- Admin endpoints from a normal account; read-only role performing writes.
- Forbidden fields in create/update (`role`, `ownerId`, `status`, `price`).
- Export, download, report and job endpoints — usually the forgotten ones.
- Stale authorization after a downgrade.

## Input and injection
- SQL/NoSQL, command, template, LDAP, XPath injection in every parameter, including sort and filter.
- XSS: reflected, stored, DOM, and in rendered markdown, SVG or file names.
- Path traversal, including encoded and double-encoded variants.
- SSRF to `169.254.169.254`, `localhost`, internal hostnames, and via a redirect or DNS rebind.
- Deserialization, prototype pollution, mass assignment, parameter pollution, method override.
- Header injection, CRLF, host-header poisoning.

## Files
- Wrong MIME/extension, executable content, polyglot, oversized upload, zip bomb, archive with `../` entries, scripted SVG, malformed image that crashes the processor.
- Download another user's file; guess a storage key; use an expired signed URL.

## State, money and events
- Replay a successful request; submit twice concurrently; reuse an idempotency key with a different body.
- Tamper amount, currency, fee, discount, status; negative, zero and overflow amounts.
- Forge a webhook; replay a real one; deliver out of order; deliver duplicates; time out then succeed late.
- Race two transfers against the same balance; race two redemptions of the same coupon.

## Resource abuse
- Rate-limit bypass via alternate route, header, casing, API version or account.
- Page size 1000000; deep pagination; expensive search; batch amplification; N+1 explosion.
- Upload, export, email, SMS and job-queue flooding; LLM token exhaustion.

## Disclosure
- Error messages, stack traces, SQL errors, framework banners, verbose 500s.
- Client bundle, source maps, `.git`, `.env`, backup files, debug routes, admin panels.
- Cache poisoning; a private response served from a shared cache; CDN key confusion.

## AI features
- Direct and indirect prompt injection through every ingested channel.
- Data exfiltration through rendered links and images.
- Forced tool call, escalated tool arguments, cross-tenant retrieval, system-prompt extraction, cost exhaustion.

For the exhaustive machine-generated list of 1,200 attack variants across every domain, see items 1016–2215 in `references/02-master-shipping-gate.md`.

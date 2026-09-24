<!-- SPDX-License-Identifier: Apache-2.0 -->
# Security Policy

## Reporting a vulnerability in this package

Report privately to the maintainer (Biswodip Goj) through GitHub Security Advisories on this repository, or by private message to the repository owner. Please do not open a public issue with exploitable detail before a fix is available.

Include: affected file or command, version or commit, reproduction steps, impact, and your assessment of severity. You will get an acknowledgement; if you do not, assume the message did not arrive and try the other channel.

## Scope

**In scope:** the tooling in `bin/`, `scripts/` and `test/`, the installer's handling of paths, clones and skill copying, the Strix target guard, the secret scanner's handling of matched values, and anything in this package that could execute untrusted content or leak a credential.

**Out of scope here:** vulnerabilities in the upstream projects under `upstream/` — report those to their own maintainers (Taste Skill, Emil Kowalski Skills, No AI Slop, Headroom, Strix). Also out of scope: findings in *your* repository produced by running this system; those belong in your own tracker.

## Using this system safely

- Penetration testing, including Strix, is permitted only against systems you own or are explicitly authorized to test. The guarded runner refuses non-loopback targets unless you declare authorization; that declaration is your statement, and the responsibility is yours.
- `STRIX_LLM` and `LLM_API_KEY` belong in the environment of the current shell, a secret manager or CI secrets — never in a committed file. This package never prints, logs or stores their values.
- A key that has been pasted into chat, source control, logs, screenshots or a shared document is exposed: rotate it.
- The installer clones third-party source and can install third-party CLIs. Review what you install; `--with-tools` is opt-in for exactly that reason, and the Strix installer is downloaded to a file with its SHA-256 printed rather than piped into a shell.
- Automated gates produce evidence, not assurance. Nothing in this package certifies that software is secure.

## Supported versions

The latest released version is supported. Security fixes are not backported to 1.x.

#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
#
# One-command install into any project.
#
#   curl -fsSL https://raw.githubusercontent.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING/main/install.sh | bash
#   bash install.sh /path/to/project --pinned
#
# Installs: 7 skills + /dip commands + @dip agent, and clones the five upstream projects.
set -euo pipefail

REPO="${BISWODIP_REPO:-https://github.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING.git}"
HOME_DIR="${BISWODIP_HOME:-$HOME/.biswodip-goj-unified-engineering}"
TARGET="."
ARGS=()
for a in "$@"; do case "$a" in -*) ARGS+=("$a");; *) TARGET="$a";; esac; done

say() { printf '\033[36m›\033[0m %s\n' "$1"; }
die() { printf '\033[31m✖\033[0m %s\n' "$1" >&2; exit 1; }

command -v git >/dev/null || die "git is required."
command -v node >/dev/null || die "Node.js >= 18.17 is required (https://nodejs.org)."
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || die "Node.js >= 18.17 is required."

if [ -f "$(dirname "${BASH_SOURCE[0]}")/bin/biswodip.mjs" ]; then
  PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"          # running from a clone or an unzipped copy
elif [ -d "$HOME_DIR/.git" ]; then
  say "updating $HOME_DIR"; git -C "$HOME_DIR" pull --quiet --ff-only || true; PKG="$HOME_DIR"
else
  say "cloning $REPO → $HOME_DIR"; git clone --quiet --depth 1 "$REPO" "$HOME_DIR"; PKG="$HOME_DIR"
fi

TARGET="$(cd "$TARGET" && pwd)"
say "installing into $TARGET"
node "$PKG/bin/biswodip.mjs" install --root "$TARGET" "${ARGS[@]+"${ARGS[@]}"}"
printf '\n\033[32m✔\033[0m Ready. In this project, run \033[1m/dip\033[0m (or \033[1m@dip\033[0m) in Claude Code.\n'

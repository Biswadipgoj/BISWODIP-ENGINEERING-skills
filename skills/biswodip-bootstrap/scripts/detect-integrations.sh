#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
# Detect upstream clones, agent skills, CLIs, Docker and environment.
# Usage: bash scripts/detect-integrations.sh [root] [options]      Help: bash scripts/detect-integrations.sh --help
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

fallback_clone() { echo "ERROR: Node.js >= 18 is required for this script (https://nodejs.org)." >&2; exit 2; }

NODE_BIN="${NODE:-node}"
if command -v "$NODE_BIN" >/dev/null 2>&1 && [ "$("$NODE_BIN" -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 18 ]; then
  exec "$NODE_BIN" "$SCRIPT_DIR/detect-integrations.mjs" "$@"
fi
root="."; if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then root="$1"; fi
fallback_clone "$root"

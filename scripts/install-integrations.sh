#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
# Clone EVERY upstream repository, verify it, install agent skills, write the lock file.
# Usage: bash scripts/install-integrations.sh [root] [options]      Help: bash scripts/install-integrations.sh --help
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- No Node.js: minimal pure-shell fallback so every upstream repository is still cloned. ----
fallback_clone() {
  root="${1:-.}"
  command -v git >/dev/null 2>&1 || { echo "ERROR: neither node nor git is available — install git (and Node.js >= 18 for full features)." >&2; exit 1; }
  echo "WARNING: Node.js >= 18 not found — running clone-only fallback (no skill install, no lock file)." >&2
  dest="$root/.biswodip/upstream"; mkdir -p "$dest"
  repos=$(grep -o "\"repo\": *\"[^\"]*\"" "$PKG_ROOT/integrations/manifest.json" | sed "s/.*\"\\(https[^\"]*\\)\"/\\1/")
  dirs=$(grep -o "\"dir\": *\"[^\"]*\"" "$PKG_ROOT/integrations/manifest.json" | sed "s/.*\"\\([^\"]*\\)\"$/\\1/")
  set -- $dirs; failed=0
  for repo in $repos; do
    d="$1"; shift
    if [ -d "$dest/$d/.git" ]; then echo "[present] $d"; continue; fi
    ok=0; for i in 1 2 3; do
      if git clone --quiet --depth 1 "$repo" "$dest/$d"; then ok=1; break; fi
      rm -rf "$dest/$d"; echo "  retry $i for $d" >&2; sleep $((i * 2))
    done
    if [ $ok = 1 ]; then echo "[cloned]  $d"
    elif [ -d "$PKG_ROOT/upstream/$d" ]; then cp -R "$PKG_ROOT/upstream/$d" "$dest/$d"; echo "[snapshot] $d (network unavailable)"
    else echo "[FAILED]  $d" >&2; failed=1; fi
  done
  exit $failed
}

NODE_BIN="${NODE:-node}"
if command -v "$NODE_BIN" >/dev/null 2>&1 && [ "$("$NODE_BIN" -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 18 ]; then
  exec "$NODE_BIN" "$SCRIPT_DIR/install-integrations.mjs" "$@"
fi
root="."; if [ $# -gt 0 ] && [ "${1#-}" = "$1" ]; then root="$1"; fi
fallback_clone "$root"

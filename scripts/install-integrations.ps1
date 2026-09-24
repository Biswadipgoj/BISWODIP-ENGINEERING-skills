#Requires -Version 5.1
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
# Clone EVERY upstream repository, verify it, install agent skills, write the lock file.
# Usage: .\scripts\install-integrations.ps1 [-Root <dir>] [extra options passed to bin/biswodip.mjs]
[CmdletBinding()]
param(
  [string]$Root = ".",
  [Parameter(ValueFromRemainingArguments = $true)] [string[]] $Rest
)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PkgRoot = Split-Path -Parent $ScriptDir

function Get-NodeCommand {
  foreach ($candidate in @($env:NODE, "node")) {
    if (-not $candidate) { continue }
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if (-not $cmd) { continue }
    try { $major = [int](& $cmd.Source -p "process.versions.node.split('.')[0]") } catch { continue }
    if ($major -ge 18) { return $cmd.Source }
  }
  return $null
}

# ---- No Node.js: clone-only fallback so every upstream repository is still cloned. ----
function Invoke-Fallback {
  param([string] $Root)
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Neither Node.js >= 18 nor git is available. Install git, and Node.js >= 18 for the full installer."
    exit 1
  }
  Write-Warning "Node.js >= 18 not found - running clone-only fallback (no skill install, no lock file)."
  $manifest = Get-Content (Join-Path $PkgRoot "integrations/manifest.json") -Raw | ConvertFrom-Json
  $dest = Join-Path $Root ".biswodip/upstream"
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $failed = 0
  foreach ($it in $manifest.integrations) {
    $target = Join-Path $dest $it.dir
    if (Test-Path (Join-Path $target ".git")) { Write-Host "[present] $($it.dir)"; continue }
    $ok = $false
    foreach ($attempt in 1..3) {
      git clone --quiet --depth 1 $it.repo $target
      if ($LASTEXITCODE -eq 0) { $ok = $true; break }
      Remove-Item -Recurse -Force $target -ErrorAction SilentlyContinue
      Start-Sleep -Seconds (2 * $attempt)
    }
    $snapshot = Join-Path $PkgRoot "upstream/$($it.dir)"
    if ($ok) { Write-Host "[cloned]  $($it.dir)" }
    elseif (Test-Path $snapshot) { Copy-Item $snapshot $target -Recurse; Write-Host "[snapshot] $($it.dir) (network unavailable)" }
    else { Write-Error "[FAILED]  $($it.dir)"; $failed = 1 }
  }
  exit $failed
}
$node = Get-NodeCommand
if ($node) {
  & $node (Join-Path $ScriptDir "install-integrations.mjs") "--root" $Root @Rest
  exit $LASTEXITCODE
}
Invoke-Fallback -Root $Root

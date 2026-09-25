#Requires -Version 5.1
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
# Run automated security gates (secrets, risk hints, dependency audit, project checks, Strix).
# Usage: .\scripts\run-security-gates.ps1 [-Root <dir>] [extra options passed to bin/biswodip.mjs]
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

function Invoke-Fallback {
  param([string] $Root)
  Write-Error "Node.js >= 18 is required for this script (https://nodejs.org)."
  exit 2
}
$node = Get-NodeCommand
if ($node) {
  & $node (Join-Path $ScriptDir "run-security-gates.mjs") "--root" $Root @Rest
  exit $LASTEXITCODE
}
Invoke-Fallback -Root $Root

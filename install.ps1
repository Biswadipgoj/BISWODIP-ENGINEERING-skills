#Requires -Version 5.1
# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering
#
# One-command install into any project.
#
#   irm https://raw.githubusercontent.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING/main/install.ps1 | iex
#   .\install.ps1 -Target C:\path\to\project -Pinned
[CmdletBinding()]
param(
  [string] $Target = ".",
  [switch] $Pinned,
  [switch] $WithTools,
  [switch] $Update,
  [Parameter(ValueFromRemainingArguments = $true)] [string[]] $Rest
)
$ErrorActionPreference = "Stop"
$Repo = if ($env:BISWODIP_REPO) { $env:BISWODIP_REPO } else { "https://github.com/Biswadipgoj/BISWODIP-GOJ-UNIFIED-ENGINEERING.git" }
$HomeDir = if ($env:BISWODIP_HOME) { $env:BISWODIP_HOME } else { Join-Path $HOME ".biswodip-goj-unified-engineering" }

foreach ($tool in @("git", "node")) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { Write-Error "$tool is required."; exit 1 }
}
if ([int](node -p "process.versions.node.split('.')[0]") -lt 18) { Write-Error "Node.js >= 18.17 is required."; exit 1 }

$local = if ($PSScriptRoot) { Join-Path $PSScriptRoot "bin/biswodip.mjs" } else { $null }
if ($local -and (Test-Path $local)) { $Pkg = $PSScriptRoot }
elseif (Test-Path (Join-Path $HomeDir ".git")) { git -C $HomeDir pull --quiet --ff-only; $Pkg = $HomeDir }
else { Write-Host "cloning $Repo -> $HomeDir"; git clone --quiet --depth 1 $Repo $HomeDir; $Pkg = $HomeDir }

$Target = (Resolve-Path $Target).Path
$cliArgs = @("install", "--root", $Target)
if ($Pinned) { $cliArgs += "--pinned" }
if ($WithTools) { $cliArgs += "--with-tools" }
if ($Update) { $cliArgs += "--update" }
if ($Rest) { $cliArgs += $Rest }

node (Join-Path $Pkg "bin/biswodip.mjs") @cliArgs
Write-Host "`nReady. In this project, run /dip (or @dip) in Claude Code." -ForegroundColor Green

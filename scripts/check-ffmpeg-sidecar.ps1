$ErrorActionPreference = "Stop"

$TargetTriple = "x86_64-pc-windows-msvc"
$ExpectedVersion = "8.0.1-full_build-www.gyan.dev"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SidecarDir = Join-Path $RepoRoot "src-tauri\binaries"

function Assert-Sidecar {
  param(
    [Parameter(Mandatory = $true)][string]$ToolName
  )

  $path = Join-Path $SidecarDir "$ToolName-$TargetTriple.exe"
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Missing $ToolName sidecar: $path. Run: pnpm.cmd run sidecar:prepare"
  }

  $output = & $path -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "$ToolName sidecar failed to run. Exit code: $LASTEXITCODE. Path: $path"
  }

  $versionLine = [string]($output | Select-Object -First 1)
  if (-not $versionLine) {
    throw "$ToolName sidecar did not print a version line. Path: $path"
  }

  if ($versionLine -notlike "*$ExpectedVersion*") {
    throw "$ToolName sidecar version mismatch. Expected '$ExpectedVersion', got '$versionLine'. Run: pnpm.cmd run sidecar:prepare"
  }

  Write-Host "$ToolName OK: $versionLine"
}

Assert-Sidecar -ToolName "ffmpeg"
Assert-Sidecar -ToolName "ffprobe"
Write-Host "FFmpeg sidecars are ready in $SidecarDir"

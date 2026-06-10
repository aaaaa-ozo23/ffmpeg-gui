param(
  [string]$FfmpegBinDir
)

$ErrorActionPreference = "Stop"

$TargetTriple = "x86_64-pc-windows-msvc"
$ExpectedVersion = "8.0.1-full_build-www.gyan.dev"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SidecarDir = Join-Path $RepoRoot "src-tauri\binaries"

function Resolve-ToolPath {
  param(
    [Parameter(Mandatory = $true)][string]$ToolName
  )

  if ($FfmpegBinDir) {
    $candidate = Join-Path $FfmpegBinDir "$ToolName.exe"
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
      throw "Expected $ToolName.exe under -FfmpegBinDir, but it was not found: $candidate"
    }
    return (Resolve-Path -LiteralPath $candidate).Path
  }

  $command = Get-Command "$ToolName.exe" -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "Could not find $ToolName.exe on PATH. Pass -FfmpegBinDir with the directory that contains ffmpeg.exe and ffprobe.exe."
  }

  return $command.Source
}

function Read-VersionLine {
  param(
    [Parameter(Mandatory = $true)][string]$ToolPath
  )

  $output = & $ToolPath -version 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to run '$ToolPath -version'. Exit code: $LASTEXITCODE"
  }

  $line = ($output | Select-Object -First 1)
  if (-not $line) {
    throw "No version output was returned by $ToolPath."
  }

  return [string]$line
}

function Copy-Sidecar {
  param(
    [Parameter(Mandatory = $true)][string]$ToolName
  )

  $source = Resolve-ToolPath -ToolName $ToolName
  $versionLine = Read-VersionLine -ToolPath $source

  if ($versionLine -notlike "*$ExpectedVersion*") {
    throw "$ToolName version mismatch. Expected '$ExpectedVersion', got '$versionLine'."
  }

  New-Item -ItemType Directory -Force -Path $SidecarDir | Out-Null

  $destination = Join-Path $SidecarDir "$ToolName-$TargetTriple.exe"
  Copy-Item -LiteralPath $source -Destination $destination -Force

  return [ordered]@{
    name = $ToolName
    source = $source
    destination = $destination
    versionLine = $versionLine
    sizeBytes = (Get-Item -LiteralPath $destination).Length
  }
}

$ffmpeg = Copy-Sidecar -ToolName "ffmpeg"
$ffprobe = Copy-Sidecar -ToolName "ffprobe"

$manifest = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  targetTriple = $TargetTriple
  expectedVersion = $ExpectedVersion
  tools = @($ffmpeg, $ffprobe)
}

$manifestPath = Join-Path $SidecarDir "sidecar-manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host "Prepared FFmpeg sidecars:"
Write-Host "  $($ffmpeg.destination)"
Write-Host "  $($ffprobe.destination)"
Write-Host "Manifest: $manifestPath"

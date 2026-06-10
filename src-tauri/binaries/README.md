# FFmpeg Sidecars

This directory is for local, untracked FFmpeg binaries used by the Tauri app.

Expected Windows filenames:

- `ffmpeg-x86_64-pc-windows-msvc.exe`
- `ffprobe-x86_64-pc-windows-msvc.exe`

Prepare the sidecars from the locally installed FFmpeg package:

```powershell
pnpm.cmd run sidecar:prepare
```

Or provide the FFmpeg `bin` directory explicitly:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-ffmpeg-sidecar.ps1 -FfmpegBinDir "C:\path\to\ffmpeg\bin"
```

Current pinned source:

- Distribution: Gyan FFmpeg static Windows build
- Version: `8.0.1-full_build-www.gyan.dev`
- Target triple: `x86_64-pc-windows-msvc`
- License: GPL v3 for the full build

The `.exe` files and generated `sidecar-manifest.json` are intentionally ignored
by Git because the binaries are large. Keep source, version, license, and build
configuration notes here so the local sidecars can be reproduced.

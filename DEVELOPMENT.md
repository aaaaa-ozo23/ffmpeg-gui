# FFmpeg GUI 开发文档

更新时间：2026-06-09  
首版目标平台：Windows  
计划技术栈：Tauri 2 + Rust 后端 + TypeScript 前端  
音视频处理方式：首版调用 `ffmpeg.exe` / `ffprobe.exe` 命令行 sidecar

## 1. 项目定位

本项目定位为一个轻量级 FFmpeg 图形界面工具，面向普通用户完成常见音视频处理任务。

首版聚焦：

- 媒体信息读取
- 格式转换
- 截取片段
- 视频截图
- 音频提取
- 添加字幕
- 倍速导出
- 简单任务队列、进度显示、取消和日志

首版暂不做：

- 多轨时间线
- 专业剪辑工程
- 调色、关键帧、复杂特效
- Photoshop / DaVinci Resolve / Premiere 类专业工作流
- 直接链接 FFmpeg C API

核心原则：先做稳定的常用处理工具，再逐步扩展批量处理和跨平台打包。

## 2. 当前开发环境快照

以下为当前机器已核对到的环境状态。

| 项目 | 当前状态 |
| --- | --- |
| OS | Microsoft Windows 10.0.26200.8457 |
| Git | 2.53.0.windows.1 |
| Node.js | v26.1.0，路径 `C:\Program Files\nodejs\node.exe` |
| npm | 11.13.0 |
| pnpm | 11.1.2，路径 `C:\Users\许涵予xhy\AppData\Roaming\npm\pnpm.CMD` |
| Rust | rustc 1.95.0 |
| Cargo | cargo 1.95.0 |
| Rust toolchain | `stable-x86_64-pc-windows-msvc` |
| Visual Studio | Visual Studio Community 2026 18.6.0 |
| MSVC 工具链 | 已能被 `vswhere` 以 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` 识别 |
| WebView2 Runtime | 已安装，检测到 148.0.3967.96 / 149.0.4022.52 |
| ffmpeg / ffprobe | 当前未加入 PATH，首版按 sidecar 固定到项目内 |
| cargo-tauri | 未全局安装，建议使用项目本地 Tauri CLI |

注意：

- 当前 Node.js 是 v26 Current，不是 LTS。项目本身可以运行，但面向开源协作时建议在文档中声明推荐 Node LTS 或明确支持范围。
- `corepack` 不是项目硬依赖；当前 `pnpm` 已可用即可继续开发。
- `ffmpeg` 和 `ffprobe` 不需要加入系统 PATH，项目内固定二进制更利于复现和打包。

## 3. 推荐技术栈

| 层级 | 推荐方案 | 说明 |
| --- | --- | --- |
| 桌面框架 | Tauri 2 | Windows 首发，后续扩展 macOS / Linux |
| 后端 | Rust | 负责 FFmpeg 进程管理、任务队列、参数构造、日志 |
| 前端 | TypeScript + React + Vite | UI 开发效率高，贡献者容易上手 |
| 包管理 | pnpm | 已安装，建议项目固定 `packageManager` |
| 音视频处理 | FFmpeg / FFprobe sidecar | 首版不直接链接 C API |
| 进程调用 | Tauri shell plugin | 调用 sidecar，读取 stdout/stderr |
| 本地状态 | JSON 配置文件起步 | 后续再考虑 SQLite |

## 4. 推荐目录结构

```text
project-root/
  README.md
  DEVELOPMENT.md
  package.json
  pnpm-lock.yaml
  src/
    app/
    components/
    features/
      probe/
      convert/
      trim/
      screenshot/
      subtitle/
      speed/
      jobs/
    lib/
    styles/
  src-tauri/
    tauri.conf.json
    Cargo.toml
    binaries/
      ffmpeg-x86_64-pc-windows-msvc.exe
      ffprobe-x86_64-pc-windows-msvc.exe
    src/
      main.rs
      commands/
        mod.rs
        media.rs
        jobs.rs
      ffmpeg/
        mod.rs
        command_builder.rs
        progress.rs
        probe.rs
        presets.rs
      jobs/
        mod.rs
        queue.rs
        model.rs
      config/
        mod.rs
      errors.rs
  test-assets/
    README.md
```

目录职责：

- `src/features/*`：前端功能模块，不直接拼 FFmpeg 命令。
- `src-tauri/src/ffmpeg`：后端统一封装 FFmpeg 参数、进度解析和媒体探测。
- `src-tauri/src/jobs`：任务队列、任务状态、取消、日志。
- `src-tauri/binaries`：固定 FFmpeg / FFprobe sidecar。
- `test-assets`：开发测试素材说明，不建议提交大体积媒体文件到 Git。

## 5. 项目初始化流程

如果当前目录为空，可以直接在当前目录初始化：

```cmd
pnpm create tauri-app .
```

推荐选择：

```text
Frontend language: TypeScript
Package manager: pnpm
Frontend framework: React
Template: Vite
```

初始化后执行：

```cmd
pnpm install
pnpm tauri dev
```

建议在 `package.json` 中保留这些脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  },
  "packageManager": "pnpm@11.1.2"
}
```

Rust 侧建议先保持依赖精简，按功能逐步加入：

```text
serde
serde_json
thiserror
uuid
tauri-plugin-shell
tauri-plugin-dialog
```

## 6. FFmpeg Sidecar 准备

首版不要依赖用户系统安装的 FFmpeg。应将固定版本的 `ffmpeg.exe` 和 `ffprobe.exe` 放入：

```text
src-tauri/binaries/
```

Windows MSVC x64 目标建议文件名：

```text
ffmpeg-x86_64-pc-windows-msvc.exe
ffprobe-x86_64-pc-windows-msvc.exe
```

当前 target triple 可用以下命令确认：

```cmd
rustc --print host-tuple
```

`tauri.conf.json` 中应配置 external binaries，示例：

```json
{
  "bundle": {
    "externalBin": [
      "binaries/ffmpeg",
      "binaries/ffprobe"
    ]
  }
}
```

约定：

- 记录 FFmpeg 来源、版本、构建配置和下载日期。
- 首版优先使用一个稳定版本，避免开发期间频繁换二进制。
- 不要求用户将 FFmpeg 加入 PATH。
- 所有 FFmpeg 调用都通过后端统一封装。

## 7. 后端设计约定

前端不得直接拼接命令行字符串。前端只提交结构化参数：

```ts
type ConvertRequest = {
  inputPath: string;
  outputPath: string;
  container: "mp4" | "mkv" | "mov" | "mp3" | "wav" | "flac";
  videoCodec?: "copy" | "h264" | "h265" | "vp9";
  audioCodec?: "copy" | "aac" | "mp3" | "flac";
};
```

Rust 后端负责：

- 参数校验
- 输出路径检查
- 构造 FFmpeg 参数数组
- 启动 sidecar
- 解析进度
- 收集 stderr 日志
- 处理取消任务
- 返回结构化错误

禁止做法：

```text
ffmpeg -i "用户路径" ... 这种整条 shell 字符串拼接
```

推荐做法：

```text
Command + args 数组
```

这样可以更好地处理中文路径、空格路径和特殊字符。

## 8. 媒体信息读取

所有媒体导入后先调用 `ffprobe` 获取结构化信息：

```cmd
ffprobe -v error -print_format json -show_format -show_streams input.mp4
```

后端输出统一模型，例如：

```ts
type MediaInfo = {
  path: string;
  durationSec?: number;
  sizeBytes?: number;
  formatName?: string;
  videoStreams: VideoStreamInfo[];
  audioStreams: AudioStreamInfo[];
  subtitleStreams: SubtitleStreamInfo[];
};
```

UI 应展示：

- 文件名
- 时长
- 容器格式
- 分辨率
- 视频编码
- 音频编码
- 字幕轨数量
- 文件大小

## 9. 进度与日志

FFmpeg 任务建议使用：

```cmd
-progress pipe:1 -nostats
```

进度计算：

```text
progress = 当前 out_time_ms / 媒体总时长
```

任务日志至少记录：

- 创建时间
- 输入文件
- 输出文件
- 功能类型
- FFmpeg 参数数组
- FFmpeg 版本
- stdout
- stderr
- 退出码
- 错误分类

失败时 UI 不只显示“失败”，应提供“查看日志”。

## 10. MVP 功能顺序

第一阶段建议严格按以下顺序实现。

### 10.1 文件导入与媒体探测

目标：

- 选择单个媒体文件
- 调用 `ffprobe`
- 在 UI 展示媒体信息
- 对损坏文件、未知格式给出明确错误

验收：

- 支持中文路径
- 支持带空格路径
- 支持 MP4 / MKV / MOV / MP3 / WAV 基础样例

### 10.2 单文件格式转换

目标：

- 视频转 MP4
- 音频转 MP3 / WAV / FLAC
- 支持 copy/remux 与重编码两类模式

验收：

- 能显示进度
- 能取消任务
- 失败时可查看日志
- 输出文件可正常播放

### 10.3 截取片段

目标：

- 输入开始时间和结束时间
- 支持快速截取和精确截取

说明：

- 快速截取：优先 stream copy，速度快但切点可能不完全精确。
- 精确截取：重编码，切点更准但耗时更长。

### 10.4 视频截图

目标：

- 指定时间点导出 PNG / JPG
- 后续再扩展批量截图

### 10.5 音频提取

目标：

- 从视频中提取音频
- 输出 MP3 / AAC / WAV / FLAC

### 10.6 添加字幕

第一步：

- 支持外挂字幕封装到 MKV / MP4。

第二步：

- 支持硬字幕烧录。

注意：

- 硬字幕需要处理字体路径、ASS/SRT 差异和编码问题。
- 首版 UI 应明确区分“封装字幕”和“烧录字幕”。

### 10.7 倍速导出

目标：

- 支持导出 0.5x / 1.25x / 1.5x / 2x。

注意：

- 区分“预览倍速播放”和“导出倍速文件”。
- 首版优先做导出倍速文件。

### 10.8 批量队列

目标：

- 多文件排队执行同一种处理。
- 支持单任务失败后继续执行后续任务。

## 11. UI 设计原则

首版 UI 应偏工具型，不做复杂剪辑软件界面。

建议信息架构：

```text
左侧：功能导航
中间：当前功能参数区
右侧或底部：任务队列 / 日志 / 结果
```

功能入口：

- 转换
- 截取
- 截图
- 音频
- 字幕
- 倍速
- 任务
- 设置

UI 原则：

- 每个功能只暴露少量高频参数。
- 高级 FFmpeg 参数放到“高级设置”折叠区。
- 默认预设应能让普通用户不理解编码器也能完成任务。
- 错误信息要能指导用户下一步操作。

## 12. 测试素材清单

建议准备以下本地测试素材：

| 类别 | 用途 |
| --- | --- |
| 短 MP4 | 基础转换、截图、截取 |
| 长 MP4 | 进度条和取消任务 |
| MKV | remux、字幕轨测试 |
| MOV | 常见相机/手机格式 |
| MP3 | 音频转换 |
| WAV | 无损音频转换 |
| SRT | 字幕封装/烧录 |
| ASS | 样式字幕测试 |
| 中文路径文件 | Windows 路径兼容 |
| 空格路径文件 | 参数数组兼容 |
| 损坏文件 | 错误处理 |

不建议把大文件直接提交到 Git。可以在 `test-assets/README.md` 中说明如何准备。

## 13. 验证命令

开发环境检查：

```cmd
git --version
node -v
npm -v
pnpm -v
rustc -Vv
cargo -V
rustup show active-toolchain
```

项目开发：

```cmd
pnpm install
pnpm tauri dev
```

项目构建：

```cmd
pnpm build
pnpm tauri build
```

如果 PowerShell 对 `.ps1` 有执行策略限制，优先使用 cmd，或在 PowerShell 中显式调用：

```powershell
pnpm.cmd -v
```

## 14. 第一版完成标准

第一版可以认为完成，当以下条件全部满足：

- Windows 上可以通过安装包安装和启动。
- 不依赖用户系统 PATH 中的 FFmpeg。
- 可以导入文件并显示媒体信息。
- 可以完成单文件格式转换。
- 可以完成截取、截图、音频提取至少三个基础功能。
- 所有长任务都有进度、取消和日志。
- 中文路径、空格路径可用。
- 失败任务能给出可复制的错误日志。
- README 中有安装、使用和常见问题说明。

## 15. 后续演进路线

第二阶段：

- 批量转换
- 预设管理
- 视频压缩
- 转 GIF
- 多音轨/字幕轨选择
- 历史任务记录

第三阶段：

- macOS / Linux 打包
- 自动更新
- 硬件编码支持
- 更完整的预览播放器
- 多语言 i18n

只有当项目明确转向交互式剪辑器、逐帧处理、实时滤镜或复杂时间线时，才重新评估 FFmpeg C API。

当前项目定位下，FFmpeg CLI sidecar 方案应作为长期主线，而不是临时过渡方案。

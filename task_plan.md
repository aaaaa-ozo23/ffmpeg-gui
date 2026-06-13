# ffmpeg-gui 详细开发计划

## 目标
基于 DEVELOPMENT.md 的约定，从当前只有文档的仓库开始，逐步完成一个 Windows 首发的轻量级 FFmpeg GUI：使用 Tauri 2 + Rust 后端 + TypeScript/React/Vite 前端，通过项目内 FFmpeg/FFprobe sidecar 完成常见音视频处理任务。

## 当前状态
- 规划制定：complete
- 实际开发：阶段 7 集成 in progress
- 当前分支：`codex/stage7-full`，已合并截取、截图、音频提取三个独立分支，待执行阶段 7 全量统一验证

## 范围边界

### 首版必须坚持
- Windows 首发。
- 不依赖用户系统 PATH 中的 FFmpeg。
- 前端只提交结构化参数，不拼接 FFmpeg 命令字符串。
- Rust 后端统一负责参数校验、路径检查、参数数组构造、进度解析、日志收集、取消任务和结构化错误。
- 所有媒体导入后先走 ffprobe 探测。
- 长任务必须有进度、取消和可复制日志。
- 中文路径、空格路径必须作为核心兼容性要求验证。

### 首版不做
- 多轨时间线。
- 专业剪辑工程。
- 调色、关键帧、复杂特效。
- Premiere / DaVinci Resolve 类专业工作流。
- 直接链接 FFmpeg C API。

## 里程碑总览

| 里程碑 | 覆盖阶段 | 目标 |
|------|---------|------|
| M0：工程可运行 | 阶段 1 | Tauri + React + Rust 项目可启动、可构建 |
| M1：端到端薄切片 | 阶段 2-4 | UI 能选择文件，后端能调用 ffprobe，前端能展示媒体信息 |
| M2：MVP 可用 | 阶段 5-7 | 任务系统、格式转换、截取、截图、音频提取可用 |
| M3：首版功能完整 | 阶段 8-9 | 字幕、倍速、批量队列、设置/预设补齐 |
| M4：Windows 可交付 | 阶段 10 | 测试、打包、README 和常见问题完成 |

## 阶段 1：工程脚手架与开发基线
**状态：complete**

### 目标
在当前目录建立 Tauri 2 + React + Vite + TypeScript + Rust 的基础项目，并保证开发、构建命令可运行。

### 主要任务
- [x] 使用临时目录生成官方 Tauri 2 模板，再合并到当前仓库。
- [x] 选择 TypeScript、pnpm、React、Vite 模板。
- [x] 固定 `packageManager` 为 `pnpm@11.1.2`，保留 `dev`、`build`、`preview`、`tauri`、`tauri:dev`、`tauri:build` 脚本。
- [x] 建立推荐目录结构：
  - 前端：`src/app`、`src/components`、`src/features`、`src/lib`、`src/styles`。
  - 后端：`src-tauri/src/commands`、`ffmpeg`、`jobs`、`config`。
  - 测试素材说明：`test-assets/README.md`。
- [x] 加入基础依赖：`serde`、`serde_json`、`thiserror`、`uuid`、`tauri-plugin-shell`、`tauri-plugin-dialog`。
- [x] 注册 Tauri shell/dialog/opener 插件。
- [x] 明确 PowerShell 中需使用 `pnpm.cmd` / `npm.cmd`。

### 输出物
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `src/`
- `src-tauri/`
- `test-assets/README.md`

### 验收标准
- [x] `pnpm.cmd install` 成功。
- [x] `pnpm.cmd tauri dev` 能启动默认桌面应用。
- [x] `pnpm.cmd build` 通过。
- [x] `pnpm.cmd tauri build` 通过，并生成 exe、MSI、NSIS 安装包。

## 阶段 2：产品界面架构与前端基础
**状态：complete**

### 目标
搭建首版工具型 UI 骨架，先保证信息架构稳定，再逐个功能填入具体表单和状态。

### 主要任务
- [x] 按 DEVELOPMENT.md 建立三栏/两区工具型布局：
  - 左侧：功能导航。
  - 中间：当前功能参数区。
  - 右侧或底部：任务队列、日志、结果。
- [x] 建立功能入口：
  - 转换
  - 截取
  - 截图
  - 音频
  - 字幕
  - 倍速
  - 任务
  - 设置
- [x] 建立前端设计系统：
  - 按钮、输入框、选择器、文件选择行、任务行、日志面板、错误提示、进度条。
  - 工具型低干扰配色，不做营销页或复杂剪辑软件界面。
- [x] 建立前端状态模型：
  - 当前媒体文件。
  - 当前功能参数。
  - 任务队列。
  - 当前日志。
  - 错误与通知。
- [x] 每个功能模块放入 `src/features/*`，避免一个巨型 App 组件。

### 输出物
- 应用 shell。
- 基础导航状态切换。
- 复用 UI 组件。
- 功能模块文件夹。
- 阶段 2 mock 数据和前端类型。

### 验收标准
- [x] 所有首版功能入口可见。
- [x] 切换功能不丢失全局任务队列状态。
- [x] 页面在桌面窗口常见宽度下不出现文字重叠、控件溢出。
- [x] 不出现“前端直接拼命令字符串”的实现入口。

## 阶段 3：FFmpeg sidecar 与 Rust 后端基础
**状态：complete**

### 目标
建立后端命令调用、安全参数构造、错误模型和 sidecar 解析能力，为后续所有功能提供统一通道。

### 主要任务
- [x] 在 `src-tauri/binaries/` 通过本地未跟踪策略放置固定版本：
  - `ffmpeg-x86_64-pc-windows-msvc.exe`
  - `ffprobe-x86_64-pc-windows-msvc.exe`
- [x] 记录 FFmpeg 来源、版本、许可证、目标 triple 和准备命令。
- [x] 在 `tauri.conf.json` 配置 `bundle.externalBin`。
- [x] 建立 Rust 模块：
  - `commands/mod.rs`
  - `commands/media.rs`
  - `commands/jobs.rs`
  - `ffmpeg/command_builder.rs`
  - `ffmpeg/progress.rs`
  - `ffmpeg/probe.rs`
  - `ffmpeg/presets.rs`
  - `errors.rs`
- [x] 封装统一执行层：
  - sidecar 路径解析。
  - args 数组构造。
  - stdout/stderr 捕获。
  - 退出码处理。
  - 结构化错误返回。
- [x] 禁止 shell 字符串拼接，所有调用使用命令 + 参数数组。
- [x] 添加 `sidecar:prepare` / `sidecar:check` npm scripts。
- [x] 前端顶部状态区接入 `check_ffmpeg_health`，普通浏览器预览显示 Tauri runtime fallback。

### 输出物
- 可调用 `ffmpeg -version` / `ffprobe -version` 的后端命令。
- 统一错误类型。
- 基础命令构造工具。
- 本地 sidecar 准备/检查脚本和 `src-tauri/binaries/README.md`。

### 验收标准
- [x] 不把 FFmpeg 加入系统 PATH 也能从应用内调用。
- [x] 中文路径、空格路径通过参数数组传递。
- [x] sidecar 缺失时能给出明确错误。
- [x] 前端能调用一个健康检查命令显示 FFmpeg/FFprobe 版本。

## 阶段 4：文件导入与媒体探测
**状态：complete**

### 目标
完成第一个端到端功能：用户选择媒体文件，后端调用 ffprobe，前端展示媒体信息。

### 主要任务
- [x] 前端接入文件选择对话框。
- [x] 文件选择支持常见视频、音频和图片格式。
- [x] 后端实现 `probe_media` 命令。
- [x] 使用：
  - `ffprobe -v error -print_format json -show_format -show_streams <input>`
- [x] 将 ffprobe JSON 映射为统一 `MediaInfo`：
  - path
  - durationSec
  - sizeBytes
  - formatName
  - videoStreams
  - audioStreams
  - subtitleStreams
- [x] UI 展示：
  - 媒体类型
  - 文件名
  - 时长
  - 容器格式
  - 分辨率
  - 视频编码
  - 音频编码
  - 字幕轨数量
  - 文件大小
- [x] 对损坏文件、未知格式、无权限路径给出明确错误。

### 输出物
- `src/lib/tauri.ts` 文件选择与 typed invoke。
- `src/lib/mediaFormats.ts` 常见视频、音频、图片格式白名单。
- `src/lib/media.ts` 前端 `MediaInfo` 到 `MediaSummary` 映射。
- `src/components/MediaSummaryPanel.tsx` 四态媒体信息展示。
- `media.rs` 后端命令。
- `ffmpeg/probe.rs` 探测解析逻辑。

### 验收标准
- [x] MP4 / MKV / MOV / MP3 / WAV / FLAC 基础样例可探测。
- [x] PNG / JPEG / WebP 图片样例可探测。
- [x] 中文路径样例可探测。
- [x] 带空格路径样例可探测。
- [x] 损坏文件不会导致应用崩溃。

## 阶段 5：任务系统、进度、取消与日志
**状态：complete**

### 目标
在真正处理功能大规模接入前，先建立长任务基础设施，避免每个功能重复实现进度和日志。

### 主要任务
- [x] 定义 `JobRecord` 任务模型：
  - `id`
  - `kind`
  - `title`
  - `inputPath`
  - `outputPath`
  - `status`
  - `progressPct`
  - `createdAt`
  - `startedAt`
  - `finishedAt`
  - `args`
  - `stdout`
  - `stderr`
  - `exitCode`
  - `errorCategory`
  - `errorMessage`
- [x] 实现内存任务队列状态：
  - `queued`
  - `running`
  - `success`
  - `failed`
  - `canceling`
  - `canceled`
- [x] 实现可配置并发调度：
  - 默认 `maxConcurrent = 1`。
  - 允许 1-4。
  - FIFO 启动队列任务。
  - 降低并发不终止已运行任务。
- [x] 实现取消机制：
  - queued 任务直接变为 canceled。
  - running 任务先变为 canceling，再 kill 子进程。
  - 已结束任务返回结构化错误。
- [x] 实现 FFmpeg 进度解析：
  - 使用 `-progress pipe:1 -nostats`。
  - 解析 `out_time_ms`。
  - 用媒体总时长计算 0-99 运行百分比，成功时置 100。
  - 未知时长保持 indeterminate。
- [x] 实现阶段 5 临时能力：Null 输出验证任务：
  - 参数固定为 `-hide_banner -nostdin -re -i <input> -map 0:v? -map 0:a? -f null -progress pipe:1 -nostats NUL`。
  - 只验证任务系统，不生成用户文件。
  - 不进入阶段 6 的真实转换。
- [x] 实现日志面板：
  - 可查看任务参数数组。
  - 可查看 stdout/stderr。
  - 可复制单任务或全部任务日志。
  - 日志限制为最近 200 行或 128 KiB，并标记截断。
- [x] 前端先 `list_jobs()`，再监听 `jobs-event` 增量同步 UI。
- [x] 普通浏览器/Vite 预览继续显示 Tauri runtime fallback，不崩溃。

### 输出物
- `src/features/jobs`
- `src-tauri/src/jobs`
- `ffmpeg/progress.rs`
- 任务队列和日志 UI。

### 验收标准
- [x] Null 输出验证任务能持续写出进度。
- [x] 取消任务后 UI 与后端状态模型覆盖 queued/running 两类取消路径。
- [x] 失败任务能查看和复制 stdout/stderr、退出码和错误信息。
- [x] 单任务失败不会破坏后续任务调度状态。
- [x] 并发限制和 FIFO 调度有单元测试覆盖。

## 阶段 6：单文件格式转换
**状态：complete**

### 目标
完成首个真正处理功能：格式转换。所有现有视频、音频、图片格式都可作为输入；输出开放常用稳定目标格式，不做 MP4-only。阶段 6 已从单文件转换补强为同类多文件批量转换，但不提前实现阶段 9 的设置、预设、历史或暂停队列能力。

### 主要任务
- [x] 前端转换表单：
  - 输入文件。
  - 输出路径。
  - 按媒体类型动态过滤输出格式。
  - 视频编码：copy / h264 / h265 / vp9。
  - 音频编码：copy / aac / mp3 / flac / opus / vorbis / pcm_s16le。
  - auto / copy / custom 模式。
  - 高级设置中控制是否覆盖已有输出文件。
- [x] 后端定义 `ConvertRequest` 结构体：
  - `inputPath`
  - `outputPath`
  - `mediaKind`
  - `outputFormat`
  - `mode`
  - `videoCodec`
  - `audioCodec`
  - `overwrite`
  - `durationSec`
- [x] 实现转换参数构造：
  - copy/remux 模式。
  - auto/custom 重编码模式。
  - 输出覆盖策略。
  - 输出路径合法性检查。
- [x] 接入任务系统：
  - 创建任务。
  - 显示进度。
  - 支持取消。
  - 保存日志。
- [x] 增加阶段 6 输出矩阵：
  - 视频输出：MP4 / MKV / MOV / WebM。
  - 音频输出：MP3 / WAV / FLAC / AAC / M4A / OGG / Opus。
  - 图片输出：PNG / JPG / WebP / BMP / TIFF。
- [x] 保持阶段边界：
  - 默认同类转换；视频提取音频和视频截图留到阶段 7。
  - 图片按静态图片转换处理；动图输入先取首帧，动图转码不纳入阶段 6。
- [x] 批量选择与批量转换增强：
  - 前端支持一次选择多个媒体文件，并逐个 `ffprobe` 探测。
  - 只允许同类批量：视频批量、音频批量或图片批量；混选时禁止创建任务并提示分批处理。
  - 探测失败的文件保留在批量列表中展示错误，成功且同类的文件仍可入队。
  - 输出路径改为选择输出目录，按 `<原文件名>-converted.<目标格式>` 自动生成。
  - 同批次内输出文件名冲突时自动追加 `-2`、`-3`。
  - 不新增后端批量 command；前端逐个调用现有 `enqueue_convert_job`，每个文件仍是独立任务。
- [x] 批量选择生命周期增强：
  - 未开始转换或转换运行中，再次选择文件追加到当前批次。
  - 当前批次所有已创建任务进入 `success` / `failed` / `canceled` 后，再次选择文件覆盖旧批次。
  - ready 条目记录 `jobId`、固定 `outputPath` 和入队错误，已入队条目不会重复创建任务。
  - 运行中追加文件后，只为新增或入队失败的条目创建任务。
- [x] 批量列表管理增强：
  - 已选择媒体条目支持删除、上移和下移。
  - 删除已入队且未终态的条目时复用 `cancel_job` 取消任务，任务页记录和日志保留。
  - 排序只影响转换页列表和后续未入队任务创建顺序，不重排已创建任务。
  - 已入队输出路径参与后续待入队文件命名去重，避免新任务复用固定输出文件名。

### 输出物
- `src/features/convert`
- `ffmpeg/command_builder.rs` 转换分支。
- `src-tauri/src/jobs` 转换任务分支。
- `src-tauri/src/commands/jobs.rs` 新增 `enqueue_convert_job`。
- `src/lib/mediaFormats.ts` 转换输出格式矩阵。
- `src/lib/tauri.ts` 多文件选择、输出目录选择与转换任务 invoke。

### 验收标准
- [x] 视频转 MP4 / MKV / WebM 成功，输出可被 ffprobe 读取。
- [x] 音频转 MP3 / WAV / FLAC / Opus 成功，输出可被 ffprobe 读取。
- [x] 图片转 PNG / JPG / WebP 成功，输出可被 ffprobe 读取。
- [x] copy/remux 与 auto/custom 重编码模式都有参数构造测试覆盖。
- [x] 转换任务复用阶段 5 进度、取消、日志和任务事件系统。
- [x] 中文路径和空格路径可用。
- [x] 多文件选择后可批量创建多个独立转换任务。
- [x] 混选不同媒体类型时阻止入队并提示分批处理。
- [x] 批量输出目录自动命名和批内重名去重可用。
- [x] 未转换前连续选择会追加文件；转换完成后再次选择会覆盖旧批次。
- [x] 已入队文件不会因再次点击开始转换而重复入队。
- [x] 已选择媒体可从转换页列表删除，必要时同步取消未完成任务。
- [x] 已选择媒体可用上移/下移调整顺序，并影响后续待入队任务创建顺序。

## 阶段 7：三个基础处理功能：截取、截图、音频提取
**状态：in progress**

### 目标
完成第一版完成标准中要求的三个基础功能：截取、截图、音频提取。

### 主要任务
- [x] 截取片段：
  - [x] 输入开始时间和结束时间。
  - [x] 快速截取：stream copy，速度快但切点可能不完全精确。
  - [x] 精确截取：重编码，切点更准但耗时更长。
  - [x] UI 明确提示两种模式差异。
- [x] 视频截图：
  - [x] 指定时间点。
  - [x] 输出 PNG / JPG。
  - [x] 输出路径检查。
- [x] 音频提取：
  - [x] 从视频中提取音频。
  - [x] 输出 MP3 / AAC / WAV / FLAC。
  - [x] 根据输入媒体是否有音频流给出提示。
- [x] 截取功能接入任务系统。
- [x] 视频截图接入任务系统。
- [x] 音频提取接入任务系统。
- [x] 为截取功能补充后端请求类型和参数构造测试。
- [x] 为视频截图补充后端请求类型和参数构造测试。
- [x] 为音频提取补充后端请求类型和参数构造测试。

### 输出物
- [x] `src/features/trim`
- [x] `src/features/screenshot`
- [x] `src/features/audio`
- [x] 截取对应 Rust 命令和参数构造逻辑。
- [x] 截图对应 Rust 命令和参数构造逻辑。
- [x] 音频提取对应 Rust 命令和参数构造逻辑。

### 验收标准
- [x] 截取输出可播放。
- [x] 截图在指定时间点附近生成图片。
- [x] 音频提取输出可播放。
- [x] 截取功能支持进度、取消和日志。
- [x] 视频截图支持进度、取消和日志。
- [x] 音频提取支持进度、取消和日志。
- [x] 截取功能能处理中文路径、空格路径。
- [x] 视频截图能处理中文路径、空格路径。
- [x] 音频提取能处理中文路径、空格路径。
- [ ] 三个独立分支合并后统一验证阶段 7 全量功能。

## 阶段 8：字幕与倍速导出
**状态：pending**

### 目标
补齐首版聚焦功能中的字幕和倍速导出，注意清楚区分模式，避免普通用户误解。

### 主要任务
- 添加字幕：
  - 第一步支持外挂字幕封装到 MKV / MP4。
  - 第二步支持硬字幕烧录。
  - UI 明确区分“封装字幕”和“烧录字幕”。
  - 处理 SRT / ASS 差异、字幕编码和字体路径风险。
- 倍速导出：
  - 支持 0.5x / 1.25x / 1.5x / 2x。
  - 明确这是“导出倍速文件”，不是播放器预览倍速。
  - 处理视频 PTS 与音频 tempo/filter 参数。
- 两个功能接入任务系统、日志和错误提示。

### 输出物
- `src/features/subtitle`
- `src/features/speed`
- 字幕和倍速参数构造逻辑。

### 验收标准
- SRT 字幕封装成功。
- 至少一个硬字幕烧录样例成功。
- 0.5x / 1.25x / 1.5x / 2x 导出成功。
- 字幕/倍速失败时日志能指导用户下一步。

## 阶段 9：批量队列、设置与预设
**状态：pending**

### 目标
在阶段 6 同类批量转换基础上，继续补充更完整的批量控制、配置、预设和用户偏好。

### 主要任务
- 批量队列：
  - 多文件排队执行同一种处理。
  - 单任务失败后继续执行后续任务。
  - 支持暂停排队或停止后续任务。
- 预设管理：
  - 内置常用预设。
  - 支持用户保存简单自定义预设。
  - 预设落地到 JSON 配置。
- 设置：
  - 默认输出目录。
  - 输出文件重名策略。
  - 日志保留策略。
  - FFmpeg/FFprobe 版本查看。
- 任务历史起步：
  - 首版可先记录最近任务。
  - 后续再考虑 SQLite。

### 输出物
- `src/features/settings`
- 批量队列 UI。
- JSON 配置读写模块。
- 预设管理模块。

### 验收标准
- 批量转换多个文件时，某个文件失败不影响后续任务。
- 用户能保存和复用至少一种转换预设。
- 设置重启后仍然生效。
- FFmpeg 版本和 sidecar 状态可在设置中查看。

## 阶段 10：测试、打包、文档与首版发布
**状态：pending**

### 目标
将项目从“功能可用”推进到“Windows 首版可交付”。

### 主要任务
- 准备 `test-assets/README.md`，说明如何准备：
  - 短 MP4
  - 长 MP4
  - MKV
  - MOV
  - MP3
  - WAV
  - SRT
  - ASS
  - 中文路径文件
  - 空格路径文件
  - 损坏文件
- Rust 测试：
  - 命令参数构造。
  - 进度解析。
  - ffprobe JSON 映射。
  - 错误分类。
- 前端测试：
  - 表单状态。
  - 任务队列状态。
  - 错误提示。
  - 关键 UI 组件。
- 集成/人工验收：
  - 按首版完成标准逐项验证。
  - 验证安装包安装和启动。
  - 验证无系统 PATH FFmpeg 时仍可运行。
- 文档：
  - 更新 README：安装、使用、常见问题、测试素材说明。
  - 更新 DEVELOPMENT：实际目录结构、已验证环境、FFmpeg sidecar 来源。
  - 增加故障排查：PowerShell 执行策略、sidecar 缺失、路径权限、输出文件被占用。

### 输出物
- Windows 安装包。
- 完整 README。
- 更新后的 DEVELOPMENT。
- 测试记录或发布检查清单。

### 验收标准
- Windows 上可以通过安装包安装和启动。
- 不依赖用户系统 PATH 中的 FFmpeg。
- 可以导入文件并显示媒体信息。
- 可以完成单文件格式转换。
- 可以完成截取、截图、音频提取至少三个基础功能。
- 所有长任务都有进度、取消和日志。
- 中文路径、空格路径可用。
- 失败任务能给出可复制的错误日志。

## 推荐执行顺序
1. 先做阶段 1，确保项目脚手架和命令可运行。
2. 再做阶段 2，固定工具型 UI 信息架构，避免后续功能反复改布局。
3. 阶段 3-4 做一个最小端到端闭环：文件选择 -> ffprobe -> UI 展示。
4. 阶段 5 先完成任务系统，再接入耗时处理功能。
5. 阶段 6-7 完成 MVP 主功能。
6. 阶段 8-9 补齐首版完整功能和批量能力。
7. 阶段 10 做系统测试、打包和文档。

## 测试策略
- 单元测试优先覆盖 Rust 后端纯逻辑：参数构造、进度解析、错误分类、ffprobe 映射。
- 前端测试覆盖表单状态、任务状态变化、错误提示和日志展示。
- 集成验证使用真实小体积媒体文件，不把大文件提交到 Git。
- 每个 FFmpeg 功能都必须至少覆盖：
  - 普通英文路径。
  - 中文路径。
  - 带空格路径。
  - 失败输入。
- 每个长任务都必须验证：
  - 进度显示。
  - 取消。
  - stderr 日志。
  - 输出文件可用性。

## 主要风险与处理策略
| 风险 | 影响 | 处理策略 |
|------|------|---------|
| Node v26 不是 LTS | 协作者环境可能不一致 | README 中声明推荐 Node LTS 或明确当前支持范围 |
| FFmpeg sidecar 来源不清 | 许可、复现和打包风险 | 记录来源、版本、构建配置和下载日期 |
| Windows 中文路径/空格路径 | 命令执行失败或输出异常 | 后端坚持 args 数组，测试素材必须覆盖 |
| 硬字幕烧录复杂 | 字体路径、编码、ASS/SRT 兼容风险 | 先做字幕封装，再做硬字幕；UI 明确区分 |
| 进度解析不稳定 | UI 进度错误 | 使用 `-progress pipe:1 -nostats`，保留 stderr 日志兜底 |
| 大体积测试素材 | 仓库膨胀 | 只提交 `test-assets/README.md`，不提交大媒体文件 |

## 完成后可进入的后续路线
- 批量转换增强。
- 视频压缩。
- 转 GIF。
- 多音轨/字幕轨选择。
- 历史任务记录。
- macOS / Linux 打包。
- 自动更新。
- 硬件编码支持。
- 更完整的预览播放器。
- 多语言 i18n。

## 本次规划记录
- DEVELOPMENT.md 与 README.md 已读取。
- 计划文件已按 planning-with-files-zh 落在项目根目录。
- 本计划只制定开发路线，尚未开始项目初始化或代码实现。

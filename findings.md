# 发现与决策

## 需求
- 用户要求读取项目初步敲定的开发文档，并为 ffmpeg-gui 项目制定详细开发计划。
- 计划需要具体到分成几个阶段，以及每个阶段应该做什么。
- 用户指定使用 planning-with-files-zh，并显式关联 Build Web Apps 插件。

## 研究发现
- 项目根目录当前包含 README.md 与 DEVELOPMENT.md。
- 目前尚未发现已有源码目录或包管理配置文件。
- README.md 将项目定义为“基于 FFmpeg 的图形化界面应用”，用于简单音视频及图片处理。
- DEVELOPMENT.md 更新时间为 2026-06-09，明确首版目标平台为 Windows。
- 计划技术栈为 Tauri 2 + Rust 后端 + TypeScript 前端，前端推荐 React + Vite，包管理推荐 pnpm。
- 首版音视频处理方式为调用项目内固定的 ffmpeg.exe / ffprobe.exe sidecar，不依赖系统 PATH，不直接链接 FFmpeg C API。
- 首版聚焦功能：媒体信息读取、格式转换、截取片段、视频截图、音频提取、添加字幕、倍速导出、简单任务队列、进度显示、取消和日志。
- 首版暂不做多轨时间线、专业剪辑工程、调色、关键帧、复杂特效或专业剪辑软件工作流。
- 推荐目录结构包括前端 `src/features/*` 模块与后端 `src-tauri/src/ffmpeg`、`jobs`、`config`、`commands` 等模块。
- 后端必须负责参数校验、输出路径检查、FFmpeg 参数数组构造、sidecar 启动、进度解析、stderr 日志收集、任务取消和结构化错误。
- 前端不得直接拼接命令行字符串，只提交结构化参数；后端使用 Command + args 数组以支持中文路径、空格路径和特殊字符。
- 所有导入媒体先使用 ffprobe 输出 JSON，并统一映射为 MediaInfo 模型。
- 长任务进度建议使用 `-progress pipe:1 -nostats`，按 `out_time_ms / 媒体总时长` 计算。
- 第一版完成标准包括：Windows 安装包可安装启动、不依赖系统 FFmpeg PATH、媒体信息读取、单文件转换、截取/截图/音频提取至少三个基础功能、长任务进度/取消/日志、中文路径和空格路径可用、失败日志可复制、README 完整。
- 阶段 1 已使用临时目录生成 Tauri 2 + React + TypeScript + Vite 模板，并合并到当前仓库；现有 README.md、DEVELOPMENT.md 和规划文件未被模板覆盖。
- PowerShell 直接调用 `pnpm` / `npm` 会被执行策略拦截；阶段 1 配置和验证均使用 `pnpm.cmd` / `npm.cmd`。
- pnpm 11.1.2 首次安装时拦截了 `esbuild` 构建脚本，已通过 `pnpm-workspace.yaml` 只允许 `esbuild: true` 解决。
- Tauri 构建通过，生成 `src-tauri/target/release/ffmpeg-gui.exe`、MSI 和 NSIS 安装包。
- Tauri 构建提示 `com.ffmpeggui.app` 以 `.app` 结尾不推荐用于 macOS；这是当前用户确认的阶段 1 标识符，Windows 首发不阻塞。
- 阶段 2 已在 `codex/ui-shell` 分支完成前端 UI shell：左侧功能导航、中间功能参数区、右侧任务/日志面板。
- 阶段 2 采用浅色、克制、工具型桌面应用方向；保持 true white surfaces、浅灰背景、冷灰边框和单一蓝色系 accent。
- 阶段 2 严格只做 UI 壳和 mock 状态，未接入真实 Tauri dialog、FFmpeg、ffprobe、sidecar 或后端命令。
- 视觉验证时 in-app Browser 工具未暴露可调用接口；已用 Microsoft Edge headless 截图作为回退验证。
- 1120x720 桌面截图验证三栏布局可用，外层页面不滚动，中间工作区内部滚动；740x900 窄屏截图验证内容纵向堆叠且无明显重叠。
- 阶段 3 采用本地未跟踪 sidecar 策略：`src-tauri/binaries/*.exe` 和 `sidecar-manifest.json` 被 Git 忽略，只跟踪 README 与准备/检查脚本。
- 当前固定 sidecar 来源为 Gyan FFmpeg `8.0.1-full_build-www.gyan.dev` full build，两个 exe 合计约 422 MB，许可证为 GPL v3。
- `pnpm.cmd run sidecar:prepare` 会从本机 `Get-Command ffmpeg.exe` / `ffprobe.exe` 或显式 `-FfmpegBinDir` 复制为 Tauri 期望的 `ffmpeg-x86_64-pc-windows-msvc.exe` / `ffprobe-x86_64-pc-windows-msvc.exe`。
- `pnpm.cmd run sidecar:check` 会直接运行项目内 sidecar 的 `-version`，不依赖系统 PATH，并在文件缺失或版本不匹配时给出可操作错误。
- Tauri bundle 已配置 `externalBin: ["binaries/ffmpeg", "binaries/ffprobe"]`，release 目录会生成 `ffmpeg.exe` 和 `ffprobe.exe`。
- Rust 端新增 `check_ffmpeg_health`，通过 `tauri_plugin_shell::ShellExt` 启动 sidecar 并返回 `{ targetTriple, ffmpeg, ffprobe }`。
- Rust 错误模型统一返回 `{ category, message, detail }`，包含 sidecar 缺失、启动失败、非零退出码和输出解析失败分类。
- 前端顶部状态区已接入健康检查；Tauri runtime 中显示 FFmpeg/FFprobe version line，普通 Vite 浏览器预览显示“需要 Tauri 桌面运行时”fallback。
- 阶段 4 已实现第一个端到端闭环：前端通过 Tauri dialog 选择文件，Rust 后端通过项目内 `ffprobe` sidecar 读取 JSON，前端展示真实媒体信息。
- `probe_media(inputPath: String)` 返回统一 `MediaInfo`：`path`、`durationSec`、`sizeBytes`、`formatName`、`videoStreams`、`audioStreams`、`subtitleStreams`。
- `ffmpeg/probe.rs` 对 ffprobe JSON 字段保持宽容：duration、size、sample_rate 等数字字段按字符串解析，缺失或非法值映射为 `None`，不会 panic。
- 路径输入在调用 sidecar 前先校验：空路径、文件不存在、目录输入、权限拒绝会返回结构化 `{ category, message, detail }` 错误。
- 损坏媒体文件通过 ffprobe 非零退出分类为 `nonZeroExit`，前端显示错误提示且不破坏应用状态。
- 前端 `MediaSummaryPanel` 现在覆盖未选择、探测中、探测失败、探测成功四态；不再默认把 mock 媒体当作已选择文件。
- 阶段 4 本地临时素材验证覆盖普通英文路径、中文路径、带空格路径与损坏文件；生成位置在 `D:\tl-temp\ffmpeg-gui-stage4-media`，不纳入 Git。
- 阶段 4 补充支持常见视频、音频和图片文件选择：视频包含 MP4/M4V/MOV/MKV/WebM/AVI/WMV/FLV/MPEG/TS/3GP/OGV/VOB，音频包含 MP3/WAV/FLAC/M4A/AAC/OGG/Opus/WMA/AIFF/APE/AMR/AC3/MKA，图片包含 JPG/JPEG/PNG/WebP/GIF/BMP/TIFF/AVIF/HEIC/HEIF。
- 前端格式列表只影响文件对话框过滤和展示提示；后端不做扩展名白名单，仍由 ffprobe 结果决定是否可解析。
- 静态图片在 ffprobe 中以 `video` stream 形式出现，前端按扩展名、图片 codec 或 `image2` format 推断为“图片”，时长统一显示“不适用”。
- 阶段 4 补充临时素材验证位置为 `D:\tl-temp\ffmpeg-gui-stage4-formats`，已验证 MKV、MOV、WAV、FLAC、PNG、JPG、WebP 可被项目内 ffprobe 读取。
- 阶段 5 已在 `codex/job-system` 分支实现内存态 `JobManager`，作为 Tauri managed state 管理任务队列、运行中子进程、日志和并发配置。
- 阶段 5 公共命令包括 `list_jobs`、`get_job`、`enqueue_null_job`、`cancel_job`、`clear_finished_jobs`、`get_job_queue_config`、`set_job_queue_config`。
- 阶段 5 事件名为 `jobs-event`，前端启动时先拉取 `list_jobs()`，再通过事件监听增量同步任务状态和日志。
- 队列并发默认 `maxConcurrent = 1`，允许范围为 1-4；降低并发不会杀死已运行任务，只限制后续 FIFO 启动。
- 阶段 5 仅新增 Null 输出验证任务，FFmpeg 参数为安全数组：`-hide_banner -nostdin -re -i <input> -map 0:v? -map 0:a? -f null -progress pipe:1 -nostats NUL`。
- Null 输出验证任务只用于验证进度、取消、日志和事件链路，不生成用户文件，不代表阶段 6 的真实转换能力。
- 任务状态统一为 `queued`、`running`、`success`、`failed`、`canceling`、`canceled`。
- 日志分别保存 stdout 与 stderr，限制为最近 200 行或 128 KiB，超过限制时保留截断标记并支持复制日志。
- FFmpeg 进度解析复用 `-progress pipe:1` stdout，按 `out_time_ms` 和媒体总时长计算 0-99 运行进度；成功完成后置为 100，未知时长保持不定进度。
- 前端已移除右侧任务/日志 mock 数据，转换页主按钮改为“验证任务系统（Null 输出）”，并明确该操作不是转换导出。
- 阶段 5 真实验证生成的临时 MP4 位于 `D:\tl-temp\ffmpeg-gui-stage5-jobs`，包含中文和空格路径，不纳入 Git。
- 阶段 5 普通浏览器/Vite fallback 已用 Edge headless 验证，渲染 DOM 包含“需要 Tauri 桌面运行时”文案。

## 技术决策
| 决策 | 理由 |
|------|------|
| 先以 DEVELOPMENT.md 作为主要依据 | 文件名表明其为开发文档，且 README.md 较短 |
| 计划需覆盖 Web App 前端实现与本地 FFmpeg 工作流 | 用户关联 Build Web Apps，项目名为 ffmpeg-gui |
| 将开发计划从脚手架阶段开始 | 当前仓库未发现 package.json、src、src-tauri 等源码基础 |
| 项目主线采用 FFmpeg CLI sidecar | DEVELOPMENT.md 明确该方案是当前定位下的长期主线 |
| 将项目开发拆为 10 个执行阶段 | 能从零搭建覆盖到 Windows 首版交付，并保持每阶段有明确输出物和验收标准 |
| 将媒体探测作为第一个端到端薄切片 | ffprobe 是所有后续处理功能的输入基础，且可尽早验证 sidecar、路径和前后端通信 |
| 在转换等耗时功能前先做任务系统 | 进度、取消和日志是多个功能共享能力，应避免在每个功能中重复实现 |
| 阶段 1 使用 `pnpm.cmd` / `npm.cmd` | 当前 PowerShell 执行策略会阻止 `.ps1` 入口 |
| 在 `pnpm-workspace.yaml` 中仅允许 `esbuild` 构建脚本 | Vite 需要 esbuild postinstall；只批准必要依赖比批准全部更可控 |
| 阶段 2 只使用 React 本地状态和 mock 数据 | 符合阶段范围，避免提前进入媒体探测或任务执行 |
| 阶段 2 使用 `lucide-react` 图标 | 能保持工具按钮和导航图标一致，并符合 UI 控件识别习惯 |
| 阶段 2 不展示命令预览 | 避免前端拼接 FFmpeg 命令字符串，后续由 Rust 后端负责参数构造 |
| 阶段 3 sidecar 不提交 exe 到 Git | Gyan full build 单个 exe 超过 200 MB，直接提交会显著增大仓库且可能触发远程限制 |
| 阶段 3 移除前端 `shell:default` capability | sidecar 只从 Rust 命令启动，前端不需要直接 shell 权限 |
| 阶段 3 严格不做媒体探测 | 保持阶段边界，`ffprobe -show_streams` 留到阶段 4 |
| 阶段 4 媒体导入复用现有顶部“打开文件”和转换页“选择文件”入口 | 符合首个薄切片范围，不新增单独导入导航 |
| 阶段 4 只实现探测，不创建任务、不执行 FFmpeg 转换 | 保持阶段边界，阶段 5 才进入任务系统和进度/取消 |
| 前端继续保留 mock 任务/日志面板 | 当前任务系统尚未实现，阶段 4 只替换媒体状态为真实数据 |
| 普通 Vite 预览只显示 Tauri runtime fallback | 文件选择和后端 invoke 必须在 Tauri 桌面运行时中执行 |
| 将支持格式集中到 `src/lib/mediaFormats.ts` | 避免 dialog 过滤、展示提示和后续测试素材清单分散漂移 |
| 阶段 5 使用内存态 JobManager | 阶段目标是建立长任务基础设施，持久化历史留到后续设置/历史阶段 |
| 任务事件统一为 `jobs-event` | 前端可用一个监听入口同步状态、进度和日志，避免每个功能各自建立事件模型 |
| 阶段 5 使用 Null 输出验证任务 | 能验证 FFmpeg 长任务、进度、取消和日志，不提前实现真实格式转换 |
| 并发配置只允许 1-4 | Windows 首发场景下避免一次启动过多 FFmpeg 进程，同时满足基本并行验证 |
| 降低并发不终止已运行任务 | 避免配置变化造成隐式取消；新配置只影响后续调度 |
| 日志采用 200 行或 128 KiB 双限制 | 保留足够排错信息，同时避免长任务日志无限增长 |

## 遇到的问题
| 问题 | 解决方案 |
|------|---------|
| `pnpm.cmd install` 首次返回 `ERR_PNPM_IGNORED_BUILDS`，提示 esbuild 构建脚本被忽略 | 在 `pnpm-workspace.yaml` 中设置 `allowBuilds.esbuild: true` 后重新安装成功 |
| `pnpm.cmd tauri build` 警告 bundle identifier 以 `.app` 结尾 | 记录为当前已知警告；该值来自阶段 1 确认方案，Windows 构建不阻塞 |
| Browser 插件工具搜索未暴露可调用浏览器控制接口 | 使用 Microsoft Edge headless 生成桌面和窄屏截图作为视觉验证回退 |
| `generate_handler![commands::check_ffmpeg_health]` 无法通过 re-export 找到 Tauri 命令宏符号 | 改为直接注册 `commands::media::check_ffmpeg_health` |
| 缺失 sidecar 模拟测试首次包装方式误判外部命令退出码 | 改用 `$LASTEXITCODE` 和合并 stdout/stderr 后重新验证 |
| 缺失 sidecar 模拟与正常检查并行操作同一个 ffprobe 文件导致检查互相干扰 | 改为顺序执行，先恢复再模拟缺失 |
| 阶段 4 前端构建首次失败，TypeScript target 不支持 `String.prototype.replaceAll` | 改用正则 `path.replace(/\\/g, "/")` |
| 阶段 4 前端构建再次失败，TypeScript target 不支持 `Array.prototype.at` | 改用数组索引读取最后一段路径 |
| 生成临时媒体素材时 FFmpeg stderr 被 PowerShell 当作 NativeCommandError 显示 | 保留退出码判断，重新运行后确认测试素材生成成功 |
| 停止 Vite 预览进程时变量名 `$pid` 与 PowerShell 只读 `$PID` 冲突 | 改用 `$childProcessId` 等非保留变量重新停止进程树 |
| Browser 插件在阶段 4 Vite 页面检查时触发 URL policy 拒绝 | 不绕过策略；记录为 UI 浏览器验证阻断，使用构建和 Tauri dev 日志 smoke 作为本轮验证依据 |
| 阶段 4 补充格式验证时，PowerShell 再次把 FFmpeg stderr 当作 NativeCommandError | 改为显式将 FFmpeg stderr 写入日志文件，并只按 `$LASTEXITCODE` 判断成败 |
| `pnpm.cmd run tauri:build` 首次补充复验失败，旧的 release `ffmpeg-gui.exe` 正在运行并锁住目标文件 | 查到并停止 `src-tauri\target\release\ffmpeg-gui.exe` 进程及其 WebView 子进程后重试成功 |
| `CommandEvent` receiver 处理时按 Result 匹配导致编译失败 | 按 Tauri shell 实际事件流改为处理 `Option<CommandEvent>`，分别匹配 stdout、stderr、error 和 terminated |
| `dispatch` 中同时借用任务记录和运行中进程集合导致 Rust borrow checker 报错 | 先收集可启动任务的快照并标记 running，再释放锁后 spawn，最后回写 child 句柄 |
| `cargo test` 首次发现新增 Rust 文件格式不符合 rustfmt | 运行 `cargo fmt` 后复验 `cargo fmt --check` 通过 |
| 生成阶段 5 临时 MP4 时 PowerShell 再次将 FFmpeg stderr 包装为 NativeCommandError | 将命令包装为显式退出码判断，并用直接 Null 输出 smoke 验证进度行和退出码 |
| 首次 Vite fallback 检查把 `pnpm.cmd dev -- --host ...` 传成了 Vite 位置参数并导致等待端口超时 | 改用 `pnpm.cmd exec vite --host 127.0.0.1 --port 1421 --strictPort`，再用 Edge headless 验证 DOM |

## 规划结论
- 开发计划已写入 task_plan.md。
- 计划分为 10 个实际开发阶段：工程脚手架、前端基础、sidecar/后端基础、媒体探测、任务系统、格式转换、三个基础处理功能、字幕与倍速、批量/设置/预设、测试打包文档。
- M2 可作为 MVP 可用节点，M4 可作为 Windows 首版交付节点。
- 阶段 1 已完成。
- 阶段 2 已完成，下一阶段应进入“FFmpeg sidecar 与 Rust 后端基础”。
- 阶段 3 已完成，下一阶段应进入“文件导入与媒体探测”。
- 阶段 4 已完成，第一个文件选择 -> ffprobe -> UI 展示闭环已落地；下一阶段应进入任务系统、进度、取消与日志。
- 阶段 5 已完成，任务系统、进度、取消、日志、事件同步和 Null 输出验证任务已落地；下一阶段应进入单文件格式转换。

## 资源
- README.md
- DEVELOPMENT.md

## 视觉/浏览器发现
- 阶段 2 已用 Edge headless 截图验证 1120x720 与 740x900 两个视口。
- 桌面布局为左侧导航、中间转换参数区、右侧任务/日志面板。
- 窄屏布局中右侧面板下移，整体纵向滚动，无明显文本重叠或控件溢出。

---
*每执行2次查看/浏览器/搜索操作后更新此文件*
*防止视觉信息丢失*

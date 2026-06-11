# 进度日志

## 会话：2026-06-09

### 阶段 1：项目文档与约束梳理
- **状态：** complete
- **开始时间：** 2026-06-09
- 执行的操作：
  - 读取 planning-with-files-zh 技能说明。
  - 检查项目根目录文件。
  - 确认当前不存在 task_plan.md、findings.md、progress.md。
  - 创建项目规划文件骨架。
  - 读取 README.md 与 DEVELOPMENT.md。
  - 确认仓库当前尚无源码脚手架，只有开发文档和 README。
  - 将技术栈、MVP 功能、sidecar 约束、测试验收要求记录到 findings.md。
  - 将项目实际开发计划扩展为 10 个阶段，并写入 task_plan.md。
  - 自检计划覆盖前端、后端/命令执行、配置、测试、打包和文档。
  - 记录本次只制定计划，未开始项目初始化或代码实现。
- 创建/修改的文件：
  - task_plan.md
  - findings.md
  - progress.md

### 阶段 1：工程脚手架与开发基线
- **状态：** complete
- 执行的操作：
  - 在临时目录生成官方 Tauri 2 + React + TypeScript + Vite 模板。
  - 将模板源码、配置和资源合并到当前仓库，跳过模板 README.md。
  - 将 React 入口整理到 `src/app/App.tsx`，全局样式放入 `src/styles/global.css`。
  - 创建 `src/components`、`src/features`、`src/lib`、`src-tauri/src/commands`、`src-tauri/src/ffmpeg`、`src-tauri/src/jobs`、`src-tauri/src/config`。
  - 添加 Tauri shell/dialog 前端依赖和 Rust 插件依赖。
  - 在 Tauri builder 中注册 dialog、opener、shell 插件。
  - 创建 `test-assets/README.md`，记录后续测试素材清单。
  - 使用 `pnpm.cmd install` 安装依赖；首次因 esbuild build approval 失败，配置 `pnpm-workspace.yaml` 后重试成功。
  - 运行环境检查、前端构建、Tauri release 构建和 Tauri dev 冒烟测试。
- 创建/修改的文件：
  - `.gitignore`
  - `.vscode/extensions.json`
  - `index.html`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `src/`
  - `src-tauri/`
  - `test-assets/README.md`
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `vite.config.ts`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| 计划覆盖自检 | task_plan.md | 覆盖文档要求的功能、约束和交付验收 | 已覆盖脚手架、UI、sidecar、媒体探测、任务系统、MVP 功能、字幕倍速、批量、测试打包文档 | pass |
| 环境检查 | `node -v` / `npm.cmd -v` / `pnpm.cmd -v` / `rustc -Vv` / `cargo -V` / `rustup show active-toolchain` | 输出可用版本 | Node v26.1.0、npm 11.13.0、pnpm 11.1.2、rustc/cargo 1.95.0、stable MSVC 工具链 | pass |
| 依赖安装 | `pnpm.cmd install` | 生成 pnpm-lock.yaml 并安装依赖 | 首次因 esbuild build approval 失败；允许 esbuild 后安装成功 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过，生成 dist 资源 | pass |
| Tauri release 构建 | `pnpm.cmd tauri build` | Rust/Tauri 编译通过并生成包 | 构建通过，生成 release exe、MSI、NSIS 安装包；有 `.app` identifier 警告 | pass |
| Tauri dev 冒烟 | `pnpm.cmd tauri dev` | Vite ready，Rust debug 编译完成，应用进程启动 | Vite ready，debug 编译完成并运行 `target\\debug\\ffmpeg-gui.exe`；随后手动停止进程 | pass |

## 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-09 | `pnpm.cmd install` 返回 `ERR_PNPM_IGNORED_BUILDS`，esbuild build script 被忽略 | 1 | 设置 `pnpm-workspace.yaml` 的 `allowBuilds.esbuild: true` 后重新安装成功 |
| 2026-06-09 | `pnpm.cmd tauri build` 警告 `com.ffmpeggui.app` 以 `.app` 结尾不推荐 | 1 | 记录为已知警告；Windows 构建通过，后续如面向 macOS 可重新评估 identifier |

## 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 1：工程脚手架与开发基线已完成 |
| 我要去哪里？ | 若继续开发，应从 task_plan.md 的阶段 2：产品界面架构与前端基础开始 |
| 目标是什么？ | 完成 ffmpeg-gui 的 Tauri 2 + React + Rust 工程脚手架与开发基线 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方记录 |

## 会话：2026-06-10

### 阶段 2：产品界面架构与前端基础
- **状态：** complete
- 执行的操作：
  - 确认当前分支为 `codex/ui-shell`，工作区干净。
  - 添加 `lucide-react` 依赖。
  - 将 baseline 面板替换为完整应用 shell。
  - 创建前端类型、mock 数据、左侧导航、中间功能工作区、右侧任务/日志面板。
  - 为转换功能实现 mock 参数表单，为其它功能实现一致的占位参数面板。
  - 使用 React 本地状态支持功能切换和任务/日志 tab 切换。
  - 约束检查确认未新增真实 `invoke(...)`、FFmpeg/ffprobe 调用、sidecar 调用或 Tauri API 使用。
  - in-app Browser 工具未暴露可调用接口，改用 Microsoft Edge headless 生成截图验证。
  - 查看 1120x720 和 740x900 截图，修复桌面外层滚动条，改为中间工作区内部滚动。
- 创建/修改的文件：
  - `package.json`
  - `pnpm-lock.yaml`
  - `src/app/App.tsx`
  - `src/app/types.ts`
  - `src/app/mockData.ts`
  - `src/components/*`
  - `src/features/*`
  - `src/styles/global.css`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 2 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| 依赖安装 | `pnpm.cmd install` | 依赖状态正常 | Already up to date | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Tauri release 构建 | `pnpm.cmd tauri build` | Rust/Tauri 编译通过并生成包 | 构建通过，仍有 `.app` identifier 已知警告 | pass |
| Tauri dev 冒烟 | `pnpm.cmd tauri dev` | Vite ready，桌面应用进程启动 | `target\\debug\\ffmpeg-gui.exe` 启动，随后停止进程 | pass |
| 视觉验证 | Edge headless 1120x720 / 740x900 截图 | 桌面三栏、窄屏堆叠，无明显重叠 | 通过；桌面滚动限定在中间工作区内部 | pass |
| 阶段边界检查 | `rg` 搜索 `invoke`、`ffmpeg`、`ffprobe`、Tauri API | 不应新增真实后端/sidecar 调用 | 未发现匹配 | pass |

## 阶段 2 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-10 | Browser 插件工具搜索未暴露可调用浏览器控制接口 | 1 | 使用 Microsoft Edge headless 截图作为浏览器验证回退 |
| 2026-06-10 | 首次截图访问 `127.0.0.1:1420` 得到连接拒绝页 | 1 | 改用 Vite 日志中的 `localhost:1420` 重新截图成功 |
| 2026-06-10 | 桌面截图出现外层页面滚动条 | 1 | 将桌面根布局固定为 `height: 100vh`，让中间工作区内部滚动 |

## 阶段 2 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 2：产品界面架构与前端基础已完成 |
| 我要去哪里？ | 若继续开发，应从 task_plan.md 的阶段 3：FFmpeg sidecar 与 Rust 后端基础开始 |
| 目标是什么？ | 完成浅色工具型前端 UI shell、mock 状态和组件基础 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 2 记录 |

### 阶段 3：FFmpeg sidecar 与 Rust 后端基础
- **状态：** complete
- 执行的操作：
  - 确认当前分支为 `codex/ffmpeg-sidecar-backend`。
  - 新增 `scripts/prepare-ffmpeg-sidecar.ps1` 和 `scripts/check-ffmpeg-sidecar.ps1`。
  - 新增 `src-tauri/binaries/README.md`，记录 Gyan FFmpeg `8.0.1-full_build-www.gyan.dev`、GPL v3、目标 triple 和准备命令。
  - 更新 `.gitignore`，忽略本地 sidecar exe 和 `sidecar-manifest.json`，保留 README。
  - 更新 `package.json`，新增 `sidecar:prepare` / `sidecar:check`，并让 `tauri:dev` / `tauri:build` 先跑 sidecar 检查。
  - 更新 `tauri.conf.json`，配置 `bundle.externalBin`。
  - 移除前端 `shell:default` capability，sidecar 只通过 Rust 后端调用。
  - 新增 Rust 统一错误模型、sidecar 执行器、参数数组构造、版本解析和进度行解析。
  - 注册 `check_ffmpeg_health` Tauri 命令。
  - 前端顶部状态区接入健康检查；普通浏览器预览显示 Tauri runtime fallback。
  - 更新 `index.html` 标题为 `FFmpeg GUI`。
- 创建/修改的文件：
  - `.gitignore`
  - `index.html`
  - `package.json`
  - `scripts/*`
  - `src-tauri/binaries/README.md`
  - `src-tauri/capabilities/default.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/src/commands/*`
  - `src-tauri/src/errors.rs`
  - `src-tauri/src/ffmpeg/*`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/types.ts`
  - `src/lib/*`
  - `src/styles/global.css`

## 阶段 3 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| sidecar 准备 | `pnpm.cmd run sidecar:prepare` | 复制 ffmpeg/ffprobe 到 `src-tauri/binaries` | 生成两个 exe 和本地 manifest | pass |
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 两个工具版本匹配固定版本 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Rust 单元测试 | `cargo test` | 参数数组、进度解析、版本解析、错误序列化测试通过 | 10 个测试通过 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | 先检查 sidecar，再完成 release 构建和 bundle | 通过，生成 exe、MSI、NSIS；仍有 `.app` identifier 已知警告 | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug 编译并启动 app | 通过；后续手动终止进程树导致退出码 `0xffffffff` | pass |
| 浏览器 fallback | Browser 打开 `http://localhost:1420` | 普通 Vite 环境不崩溃并显示 Tauri runtime fallback | 页面非空、标题 `FFmpeg GUI`、无 console warn/error、fallback 文案可见 | pass |
| 缺失 sidecar 检查 | 临时隐藏 `ffprobe-x86_64-pc-windows-msvc.exe` | 明确提示缺失并给出准备命令 | 输出 `Missing ffprobe sidecar... Run: pnpm.cmd run sidecar:prepare` | pass |

## 阶段 3 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-10 | `cargo fmt --check` 首次发现新 Rust 文件格式不符合 rustfmt | 1 | 运行 `cargo fmt` 后复验通过 |
| 2026-06-10 | `tauri::generate_handler![commands::check_ffmpeg_health]` 不能通过 re-export 找到命令宏符号 | 1 | 改为直接注册 `commands::media::check_ffmpeg_health` |
| 2026-06-10 | 缺失 sidecar 模拟脚本首次误判外部命令退出码 | 1 | 使用 `$LASTEXITCODE` 判断 `pnpm.cmd` 退出码 |
| 2026-06-10 | 缺失 sidecar 模拟与正常检查并行操作同一 ffprobe 文件 | 1 | 改为顺序执行并先恢复 sidecar |

## 阶段 3 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 3：FFmpeg sidecar 与 Rust 后端基础已完成 |
| 我要去哪里？ | 下一阶段应进入阶段 4：文件导入与媒体探测 |
| 目标是什么？ | 建立项目内 FFmpeg/FFprobe sidecar 调用、错误模型和健康检查通道 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 3 记录 |

### 阶段 4：文件导入与媒体探测
- **状态：** complete
- 执行的操作：
  - 从 `codex/ffmpeg-sidecar-backend` 创建并切换到 `codex/media-import-probe`。
  - 新增 `probe_media(inputPath: String) -> MediaInfo` Tauri 命令，并注册到 `invoke_handler`。
  - 在 `ffmpeg/probe.rs` 实现路径校验、ffprobe JSON 解析、视频/音频/字幕流映射和结构化错误。
  - 在 `command_builder.rs` 新增 `probe_args`，保持中文路径和空格路径作为单独参数传递。
  - 扩展错误分类：文件不存在、目录输入、权限拒绝。
  - 前端新增 `selectMediaFile`、`probeMedia` typed invoke 和 `toMediaSummary` 映射。
  - 顶部“打开文件”和转换页“选择文件”共用同一个导入处理函数。
  - `MediaSummaryPanel` 支持未选择、探测中、探测失败、探测成功四态。
  - 补充常见视频、音频、图片格式选择支持，并将格式列表集中到 `src/lib/mediaFormats.ts`。
  - 前端 summary 新增媒体类型展示；静态图片显示为“图片”，时长显示“不适用”。
  - 阶段 4 严格未创建任务、未做进度/取消、未执行 FFmpeg 转换。
- 创建/修改的文件：
  - `src-tauri/src/commands/media.rs`
  - `src-tauri/src/errors.rs`
  - `src-tauri/src/ffmpeg/command_builder.rs`
  - `src-tauri/src/ffmpeg/probe.rs`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/types.ts`
  - `src/components/MediaSummaryPanel.tsx`
  - `src/features/FeaturePlaceholder.tsx`
  - `src/features/FeatureWorkspace.tsx`
  - `src/features/convert/ConvertPanel.tsx`
  - `src/lib/index.ts`
  - `src/lib/media.ts`
  - `src/lib/mediaFormats.ts`
  - `src/lib/tauri.ts`
  - `src/styles/global.css`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 4 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 ffmpeg/ffprobe 可运行且版本匹配 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Rust 单元测试 | `cargo test` | 参数数组、ffprobe JSON、错误分类测试通过 | 19 个测试通过 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | 先检查 sidecar，再完成 release 构建和 bundle | 通过；仍有 `.app` identifier 已知警告 | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug 编译并启动 app | 日志显示 `target\debug\ffmpeg-gui.exe` 启动，随后手动停止进程树 | pass |
| 临时 MP4 探测 | `D:\tl-temp\ffmpeg-gui-stage4-media\english\sample.mp4` | ffprobe 输出视频+音频信息 | 2 个 stream，duration `1.000000`，size `13609` | pass |
| 空格路径 MP4 探测 | `D:\tl-temp\ffmpeg-gui-stage4-media\space path\sample with spaces.mp4` | 路径作为单独参数传递并可探测 | 2 个 stream，duration `1.000000` | pass |
| 中文路径 MP3 探测 | `D:\tl-temp\ffmpeg-gui-stage4-media\中文路径\音频 sample.mp3` | 中文路径可探测 | 1 个 audio stream，format `mp3`，duration `1.000000` | pass |
| 损坏文件探测 | `D:\tl-temp\ffmpeg-gui-stage4-media\中文路径\broken file.mp4` | ffprobe 失败但应用不崩溃 | sidecar 退出码为 1，后端会映射为结构化 `nonZeroExit` | pass |
| 多视频格式探测 | `D:\tl-temp\ffmpeg-gui-stage4-formats\sample video.mkv` / `.mov` | MKV/MOV 可由项目内 ffprobe 读取 | MKV=`matroska,webm`，MOV=`mov,mp4,m4a,3gp,3g2,mj2`，均含 video+audio streams | pass |
| 多音频格式探测 | `D:\tl-temp\ffmpeg-gui-stage4-formats\audio sample.wav` / `.flac` | WAV/FLAC 可由项目内 ffprobe 读取 | WAV=`pcm_s16le`，FLAC=`flac`，均为 audio stream | pass |
| 图片格式探测 | `D:\tl-temp\ffmpeg-gui-stage4-formats\still image.png` / `.jpg` / `.webp` | PNG/JPEG/WebP 可由项目内 ffprobe 读取 | PNG=`png`，JPG=`mjpeg`，WebP=`webp`，均为 video stream 并可取分辨率 | pass |
| Browser/Vite UI QA | Browser 打开 `http://localhost:1420` | 普通 Vite 环境显示 Tauri fallback 且无崩溃 | Browser 插件执行页面检查时被 URL policy 拒绝，未绕过 | blocked |

## 阶段 4 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-10 | `cargo fmt --check` 首次发现 `probe.rs` 格式不符合 rustfmt | 1 | 运行 `cargo fmt` 后复验通过 |
| 2026-06-10 | `pnpm.cmd build` 因 `replaceAll` 不满足当前 TypeScript target 失败 | 1 | 改用正则替换路径分隔符 |
| 2026-06-10 | `pnpm.cmd build` 因 `Array.prototype.at` 不满足当前 TypeScript target 失败 | 1 | 改用数组索引读取末尾文件名 |
| 2026-06-10 | 生成临时媒体素材时 PowerShell 将 FFmpeg stderr 包装为 NativeCommandError | 1 | 保留退出码判断并重新生成，最终素材验证通过 |
| 2026-06-10 | 停止 Vite 预览时使用 `$pid` 变量与 PowerShell 只读 `$PID` 冲突 | 1 | 改用 `$childProcessId` 等变量名后停止成功 |
| 2026-06-10 | Browser 插件对 Vite 页面检查返回 URL policy 拒绝 | 1 | 不绕过策略，记录为 blocked；保留 Tauri dev 日志 smoke 和构建验证 |
| 2026-06-10 | 补充格式验证时 PowerShell 再次将 FFmpeg stderr 包装为 NativeCommandError | 1 | 显式将 stderr 写入日志文件，并按 `$LASTEXITCODE` 判断 |
| 2026-06-10 | `pnpm.cmd run tauri:build` 首次失败：旧 release `ffmpeg-gui.exe` 锁住目标文件 | 1 | 停止 `src-tauri\target\release\ffmpeg-gui.exe` 及其 WebView 子进程后重试成功 |

## 阶段 4 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 4：文件导入与媒体探测已完成 |
| 我要去哪里？ | 下一阶段应进入阶段 5：任务系统、进度、取消与日志 |
| 目标是什么？ | 完成用户选择文件、后端调用 ffprobe、前端展示媒体信息的首个端到端闭环 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 4 记录 |

## 会话：2026-06-11

### 阶段 5：任务系统、进度、取消与日志
- **状态：** complete
- 执行的操作：
  - 确认当前分支为 `codex/job-system`。
  - 将 `JobManager` 注册为 Tauri managed state，统一管理内存队列、运行中 `CommandChild`、任务日志和并发配置。
  - 新增任务命令：`list_jobs`、`get_job`、`enqueue_null_job`、`cancel_job`、`clear_finished_jobs`、`get_job_queue_config`、`set_job_queue_config`。
  - 新增 `jobs-event` 事件，前端启动时先 `list_jobs()`，再监听事件增量同步任务状态和日志。
  - 实现可配置并发，默认 `maxConcurrent = 1`，允许 1-4；降低并发不终止已运行任务。
  - 新增 Null 输出验证任务，调用项目内 `ffmpeg` sidecar 并输出到 Windows `NUL`，用于验证进度、取消和日志，不生成用户文件。
  - 扩展 `ffmpeg/progress.rs`，按 `out_time_ms` 和媒体总时长计算运行进度，未知时长保持不定进度。
  - 扩展结构化错误分类，覆盖任务不存在、无效配置、已结束任务取消、取消失败等场景。
  - 前端移除右侧任务/日志 mock 数据，新增真实任务队列、并发选择、取消按钮、参数数组、stdout/stderr 和复制日志。
  - 转换页主按钮改为“验证任务系统（Null 输出）”，仅在媒体探测成功后启用，并明确不是转换导出。
  - 生成本地临时 MP4 做 Null 输出验证，路径包含中文和空格，未纳入 Git。
- 创建/修改的文件：
  - `src-tauri/src/commands/jobs.rs`
  - `src-tauri/src/errors.rs`
  - `src-tauri/src/ffmpeg/command_builder.rs`
  - `src-tauri/src/ffmpeg/progress.rs`
  - `src-tauri/src/jobs/mod.rs`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/mockData.ts`
  - `src/app/types.ts`
  - `src/components/InspectorPanel.tsx`
  - `src/components/TaskRow.tsx`
  - `src/features/FeatureWorkspace.tsx`
  - `src/features/convert/ConvertPanel.tsx`
  - `src/features/jobs/JobsPanel.tsx`
  - `src/lib/tauri.ts`
  - `src/styles/global.css`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 5 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 ffmpeg/ffprobe 可运行且版本匹配 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Rust 单元测试 | `cargo test` | 队列、并发、状态、取消、进度、日志截断、参数数组和错误序列化测试通过 | 27 个测试通过 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | 先检查 sidecar，再完成 release 构建和 bundle | 通过；仍有 `.app` identifier 已知警告 | pass |
| Null 输出 smoke | `D:\tl-temp\ffmpeg-gui-stage5-jobs\job validation 中文 space sample.mp4` | FFmpeg 输出 progress 行并成功退出 | 退出码 0，stdout 包含 22 行 `out_time`/`progress` 相关输出，末尾为 `progress=end` | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug 编译并启动 app | 日志显示 `target\debug\ffmpeg-gui.exe` 启动，随后停止本次进程树 | pass |
| Vite fallback | Edge headless 打开 `http://127.0.0.1:1421` | 普通浏览器环境不崩溃并显示 Tauri runtime fallback | DOM 包含“需要 Tauri 桌面运行时”，渲染长度 31451 | pass |
| 人工 UI 点击验证 | Tauri 窗口中导入媒体、点击“验证任务系统”、取消任务 | UI 中确认 running、progress、cancel 和日志复制 | 本轮未执行交互点击；代码路径通过构建、单元测试和 dev 启动日志验证 | not run |

## 阶段 5 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-11 | `CommandEvent` receiver 按 Result 匹配导致编译失败 | 1 | 改为按实际事件流处理 `Option<CommandEvent>` |
| 2026-06-11 | `dispatch` 中同时可变借用任务和运行中集合导致 borrow checker 报错 | 1 | 先收集待启动任务快照并释放锁，再 spawn 和回写 child |
| 2026-06-11 | `cargo fmt --check` 首次发现新增 Rust 文件格式不符合 rustfmt | 1 | 运行 `cargo fmt` 后复验通过 |
| 2026-06-11 | 生成阶段 5 临时 MP4 时 PowerShell 将 FFmpeg stderr 包装为 NativeCommandError | 1 | 使用显式退出码判断，并通过 Null 输出 smoke 复验 |
| 2026-06-11 | 首次 Vite fallback 检查等待 `127.0.0.1:1421` 超时 | 1 | 改用 `pnpm.cmd exec vite --host 127.0.0.1 --port 1421 --strictPort` 后 Edge headless 验证通过 |

## 阶段 5 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 5：任务系统、进度、取消与日志已完成 |
| 我要去哪里？ | 下一阶段应进入阶段 6：单文件格式转换 |
| 目标是什么？ | 建立可复用长任务基础设施，并通过 Null 输出验证任务验证 FFmpeg 进度、取消和日志通道 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 5 记录 |

---
*每个阶段完成后或遇到错误时更新此文件*

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

### 阶段 6：单文件格式转换
- **状态：** complete
- 执行的操作：
  - 确认当前分支 `codex/single-file-convert` 误建在阶段 1 基线，仅有未跟踪 `src-tauri/binaries/` 本地 sidecar。
  - 使用 `git merge --ff-only codex/job-system` 将当前分支快进到阶段 5 基线，保留本地未跟踪 sidecar。
  - 新增 `ConvertRequest`、`ConvertMediaKind`、`ConvertOutputFormat`、`ConvertMode`、`ConvertVideoCodec`、`ConvertAudioCodec`。
  - 在 `ffmpeg/command_builder.rs` 新增转换参数构造与校验：输入路径、输出路径、父目录、扩展名、同路径、媒体类型与输出格式匹配、覆盖策略。
  - `JobKind` 新增 `convert`，`JobManager` 新增 `enqueue_convert_job`，真实转换任务复用阶段 5 队列、进度、取消、日志和 `jobs-event`。
  - 注册 Tauri command `enqueue_convert_job`。
  - 前端新增 `ConvertRequest` 类型、输出格式矩阵、`selectOutputFile` 和 `enqueueConvertJob` typed invoke。
  - 转换页从静态表单改为受控表单：按媒体类型过滤输出格式、自动生成默认输出路径、保存对话框选择输出路径、auto/copy/custom 模式、覆盖开关、真实“开始转换”。
  - 任务页和右侧 inspector 将阶段 5 的 Null 输出提示替换为格式转换任务提示。
  - 用项目内 FFmpeg sidecar 生成临时素材并做真实转换 smoke，路径包含中文和空格。
  - 将转换页从单文件输入补强为同类多文件批量输入。
  - 新增批量媒体状态，每个条目保留路径、探测状态、媒体类型、摘要或错误。
  - 前端文件选择改为 `multiple: true`，选择后逐个调用 `probe_media`。
  - 保留第一个成功条目派生的 `MediaProbeState`，兼容现有摘要与占位组件。
  - 输出路径从保存文件改为选择输出目录，并按 `<原文件名>-converted.<目标格式>` 自动生成。
  - 同批次输出 basename 冲突时追加 `-2`、`-3` 去重。
  - 混选视频、音频、图片时禁用开始按钮并提示分批处理。
  - 不新增后端批量 command，前端顺序调用 `enqueue_convert_job`，每个文件仍是独立转换任务。
  - 调整普通浏览器 fallback 下的批量入口文案与输出目录提示。
  - 新增批量生命周期：`collecting`、`running`、`complete`。
  - 调整再次选择文件的行为：未开始或运行中追加，当前批次任务全部终态后覆盖。
  - ready 条目新增 `jobId`、固定 `outputPath` 和 `enqueueError`，避免已入队条目重复创建任务。
  - 开始转换时只为未入队或入队失败的 ready 条目生成 `ConvertJobDraft`。
  - 输出路径生成把已入队和待入队条目一起计入同名去重，已入队条目保留原输出路径。
  - 转换页增加待入队、已入队、批次生命周期、入队失败统计和完成批次提示。
  - 批量媒体列表新增删除、上移和下移操作，默认顺序仍按用户选择/追加顺序保留。
  - 删除未入队、入队失败或探测失败条目时直接从转换页列表移除；loading 探测中条目暂不允许删除。
  - 删除已入队且未终态条目时先调用 `cancel_job`，取消成功或后端已终态后再移出转换页列表；任务页记录和日志保留。
  - 排序只影响转换页列表和后续尚未入队条目的创建顺序，已创建任务的实际队列顺序不重排。
  - 批量输出路径去重先保留已入队条目的固定 `outputPath` 文件名，再按当前列表顺序为待入队条目生成 `-2`、`-3` 后缀。
- 创建/修改的文件：
  - `src-tauri/src/commands/jobs.rs`
  - `src-tauri/src/ffmpeg/command_builder.rs`
  - `src-tauri/src/jobs/mod.rs`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/types.ts`
  - `src/components/InspectorPanel.tsx`
  - `src/features/FeatureWorkspace.tsx`
  - `src/features/convert/ConvertPanel.tsx`
  - `src/features/jobs/JobsPanel.tsx`
  - `src/lib/index.ts`
  - `src/lib/mediaFormats.ts`
  - `src/lib/tauri.ts`
  - `src/styles/global.css`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 6 测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Rust 单元测试 | `cargo test` | 转换请求校验、路径校验、参数数组、任务队列回归测试通过 | 35 个测试通过 | pass |
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 ffmpeg/ffprobe 可运行且版本匹配 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | sidecar 检查、前端构建、Rust release 编译和 MSI/NSIS 打包通过 | 通过，生成 MSI 与 NSIS；仍有 `.app` identifier 已知警告 | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug 编译并启动 app | 日志显示 `target\debug\ffmpeg-gui.exe` 启动，随后停止本次进程树 | pass |
| 视频转换 smoke | `D:\tl-temp\ffmpeg-gui-stage6-convert-20260611-173454` | 视频输入可输出 MP4/MKV/WebM 并可探测 | 三个输出均被 ffprobe 读取，包含 video,audio streams | pass |
| 音频转换 smoke | `D:\tl-temp\ffmpeg-gui-stage6-convert-20260611-173454` | 音频输入可输出 MP3/WAV/FLAC/Opus 并可探测 | 四个输出均被 ffprobe 读取，包含 audio stream | pass |
| 图片转换 smoke | `D:\tl-temp\ffmpeg-gui-stage6-convert-20260611-173454` | 图片输入可输出 PNG/JPG/WebP 并可探测 | 三个输出均被 ffprobe 读取，包含 video stream | pass |
| Browser/Vite fallback | Browser 打开 `http://127.0.0.1:1421` | 普通浏览器环境不崩溃，显示 Tauri runtime fallback，无 console error/warn | URL/title 正确，页面非空，旧 Null 文案消失，console 无 error/warn | pass |
| 批量 UI fallback | Browser 打开 `http://127.0.0.1:1421` | 普通浏览器环境显示批量入口和输出目录提示，且不触发 console error/warn | 显示“批量选择媒体”“选择多个文件”“输出目录”“支持一次选择多个同类视频、音频或图片文件。”，console 无 warn/error | pass |
| 批量逻辑审阅 | `src/features/convert/ConvertPanel.tsx` / `src/app/App.tsx` | 多选探测、同类校验、失败保留、输出命名去重、逐任务 enqueue 符合计划 | 已确认批量状态、混选禁用、失败条目保留、`-2`/`-3` 去重和顺序调用 `enqueue_convert_job` | pass |
| 批量生命周期构建验证 | `pnpm.cmd build` | TypeScript 和 Vite 构建通过 | 构建通过，生命周期类型、草稿请求和转换页 UI 均通过类型检查 | pass |
| 批量生命周期静态审阅 | `src/app/App.tsx` / `src/features/convert/ConvertPanel.tsx` | 连续选择追加、完成后覆盖、已入队不重复、失败可重试、输出路径固定 | 已确认 `complete` 后选择会重置列表，`running/collecting` 会追加，按钮只提交无 `jobId` 条目 | pass |
| 批量生命周期 Browser fallback | Browser 打开 `http://127.0.0.1:1421` | 普通浏览器环境显示批量入口，Tauri fallback 正常，无 console error/warn | 显示批量选择、输出目录和 Tauri runtime fallback；旧 Null 文案不存在；console 无 warn/error | pass |
| 批量列表管理构建验证 | `pnpm.cmd build` | 删除/排序回调、图标按钮和输出路径去重通过类型检查 | 构建通过 | pass |
| 批量列表管理静态审阅 | `src/app/App.tsx` / `src/features/convert/ConvertPanel.tsx` | 删除条目规则、取消未终态任务、loading 禁用操作、排序边界和后续入队顺序符合计划 | 已确认删除已入队未终态条目前调用 `cancel_job`，取消失败保留条目；上移/下移边界禁用；已入队输出名优先参与去重 | pass |
| 批量列表管理 Browser fallback | Browser 打开 `http://127.0.0.1:1421` | 普通浏览器环境仍显示批量入口和 Tauri runtime fallback，无 console error/warn | URL/title 正确，显示“批量选择媒体”“选择多个文件”“输出目录”和 Tauri runtime fallback；旧 Null 文案不存在；console 无 warn/error | pass |

## 阶段 6 错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-11 | `cargo fmt --check` 首次发现新增 Rust 代码格式不符合 rustfmt | 1 | 运行 `cargo fmt` 后复验通过 |
| 2026-06-11 | 直接 PowerShell 调用 FFmpeg smoke 时，正常 stderr 仍被包装为 `NativeCommandError` | 1 | 放弃 PowerShell native 调用，改用 Python `subprocess.run([...])` 参数数组启动 sidecar |
| 2026-06-11 | Python inline 脚本中的中文字面量经 PowerShell here-string 变成 `?` 导致路径非法 | 1 | 改用 Unicode escape 构造中文路径后 smoke 通过 |
| 2026-06-11 | 首次 `pnpm.cmd run tauri:build` 因工具超时截断，但 makensis 子进程仍在完成打包 | 1 | 等待 makensis 结束并用更长超时重跑 `tauri:build`，取得成功退出码 |
| 2026-06-11 | Browser 快照发现右侧 inspector 仍提示 Null 输出验证任务 | 1 | 更新 `InspectorPanel` 文案并复验旧文案消失 |
| 2026-06-11 | 批量改造后前端构建首次无法自动收窄 ready 条目类型 | 1 | 使用显式 `useMemo<ReadyBatchMediaItem[]>` 循环收集 ready 条目 |
| 2026-06-11 | 批量改造后发现媒体类型切换时输出格式可能短暂保留旧值 | 1 | 将当前输出格式是否属于当前媒体类型纳入开始按钮启用条件 |
| 2026-06-11 | 批量改造后首次 `pnpm.cmd run tauri:build` 失败，旧 release `ffmpeg-gui.exe` 锁定目标文件 | 1 | 停止本仓库 release 进程后重跑成功 |
| 2026-06-13 | 批量生命周期改造后首次 `pnpm.cmd build` 发现空批量状态缺少 `lifecycle`，且转换页残留未使用 `ConvertRequest` import | 1 | 补齐空状态 `lifecycle: "collecting"` 并移除未使用 import 后构建通过 |
| 2026-06-13 | 一次 `rg` 检查命令被 PowerShell 引号解析成非法路径 | 1 | 改用单引号包裹正则后重新检查 |
| 2026-06-13 | Tauri dev smoke 主进程停止后 Vite 子进程仍监听 1420 | 1 | 按端口定位并停止 Vite 子进程，后续 Browser fallback 改用 1421 独立预览 |
| 2026-06-13 | 批量列表管理验证后发现 Tauri dev smoke 仍留下 debug app 和 Vite 1420 监听 | 1 | 按本仓库 debug/release app 路径和 1420/1421 监听进程清理，复查无剩余监听 |

## 阶段 6 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 6：格式转换已完成，并已补强同类多文件批量转换、批次生命周期、列表删除与上移/下移排序 |
| 我要去哪里？ | 下一阶段应进入阶段 7：截取、截图、音频提取 |
| 目标是什么？ | 完成首个真实处理功能，覆盖现有输入格式，支持常用视频、音频、图片输出，并可按批次生命周期追加或覆盖同类批量转换任务，也可管理已选择文件列表 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 6 记录 |

## 会话：2026-06-13

### 阶段 7：截取音视频片段
- **状态：** partial complete（本分支只完成截取；截图和音频提取仍 pending）
- 执行的操作：
  - 确认当前分支从 `codex/single-file-convert` 切到 `codex/stage7-trim`，工作区开始时干净。
  - 新增后端 `TrimRequest`、`TrimMediaKind`、`TrimMode`，并复用阶段 6 输出格式矩阵。
  - 新增 `trim_args` 和 `validate_trim_request`，校验输入路径、输出路径、输出格式、开始/结束时间、已知媒体总时长、同路径输出等。
  - 快速截取模式使用 `-ss` 在 `-i` 前和 `-c copy`；精确截取模式使用 `-ss` 在 `-i` 后并自动重编码。
  - `JobKind` 新增 `trim`，`JobManager` 新增 `enqueue_trim_job`，截取任务复用现有队列、进度、取消、日志和 `jobs-event`。
  - 注册 Tauri command `enqueue_trim_job`。
  - 前端新增 `TrimRequest` 类型和 `enqueueTrimJob` typed invoke。
  - 新增 `src/features/trim/TrimPanel.tsx`，实现单文件选择、时间输入、输出目录、输出格式、快速/精确模式、覆盖设置和任务创建。
  - 顶部“打开文件”在截取页使用单文件选择，在转换页继续保留阶段 6 的批量选择。
  - 截取页只接受视频/音频；图片和未知媒体类型在 UI 和后端都不可入队。
  - 更新 `task_plan.md` 和 `findings.md`，阶段 7 标记为 partial in progress，截取完成，截图/音频提取保持 pending。
### 阶段 7：视频截图
- **状态：** in progress
- 执行的操作：
  - 从 `origin/codex/single-file-convert` 创建独立分支 `codex/stage7-screenshot`，未叠加 `codex/stage7-trim`。
  - 后端新增 `ScreenshotRequest`、`ScreenshotOutputFormat`、`screenshot_args` 和 `validate_screenshot_request`。
  - 复用输出路径校验逻辑，覆盖扩展名、父目录、目录输出、输出等于输入等场景。
  - `JobKind` 新增 `screenshot`，`JobManager` 新增 `enqueue_screenshot_job`，并注册 Tauri command。
  - 前端新增 `ScreenshotRequest` / `ScreenshotOutputFormat` 类型和 `enqueueScreenshotJob` invoke。
  - `selectMediaFile()` 改为真正的单文件选择；转换页继续保留阶段 6 的批量选择。
  - 新增 `src/features/screenshot/ScreenshotPanel.tsx`，实现视频限定、时间输入解析、PNG/JPG 输出、输出目录选择和自动命名。
  - `App.tsx` 新增截图页独立单文件 probe 状态，顶部“打开文件”在截图页走单文件选择。
  - 更新 `task_plan.md` / `findings.md` / `progress.md`，标记本分支只完成视频截图，截取和音频提取保持独立分支边界。

### 阶段 7：音频提取
- **状态：** in progress
- 执行的操作：
  - 从 `origin/codex/single-file-convert` 创建独立分支 `codex/stage7-audio-extract`，未叠加 `codex/stage7-trim` 或 `codex/stage7-screenshot`。
  - 后端新增 `AudioExtractRequest`、`AudioExtractOutputFormat`、`audio_extract_args` 和 `validate_audio_extract_request`。
  - 复用输出路径校验逻辑，覆盖扩展名、父目录、目录输出、输出等于输入等场景。
  - `JobKind` 新增 `audioExtract`，`JobManager` 新增 `enqueue_audio_extract_job`，并注册 Tauri command。
  - 前端新增 `AudioExtractRequest` / `AudioExtractOutputFormat` 类型和 `enqueueAudioExtractJob` invoke。
  - `selectMediaFile()` 改为真正的单文件选择；转换页继续保留阶段 6 的批量选择。
  - 新增 `src/features/audio/AudioExtractPanel.tsx`，实现视频限定、音频流检查、MP3/AAC/WAV/FLAC 输出、输出目录选择和自动命名。
  - `App.tsx` 新增音频页独立单文件 probe 状态，顶部“打开文件”在音频页走单文件选择。
  - 更新 `task_plan.md` / `findings.md` / `progress.md`，标记本分支只完成音频提取，截取和截图保持独立分支边界。
- 创建/修改的文件：
  - `src-tauri/src/commands/jobs.rs`
  - `src-tauri/src/ffmpeg/command_builder.rs`
  - `src-tauri/src/jobs/mod.rs`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/mockData.ts`
  - `src/app/types.ts`
  - `src/components/InspectorPanel.tsx`
  - `src/features/FeatureWorkspace.tsx`
  - `src/features/trim/TrimPanel.tsx`
  - `src/features/screenshot/ScreenshotPanel.tsx`
  - `src/features/audio/AudioExtractPanel.tsx`
  - `src/lib/tauri.ts`
  - `src/styles/global.css`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 7 截取测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| Rust 单元测试 | `cargo test` | 截取参数顺序、格式分支、路径安全、时间范围和输出路径校验通过 | 43 个测试通过 | pass |
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 ffmpeg/ffprobe 可运行且版本匹配 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | sidecar 检查、前端构建、Rust release 编译和 MSI/NSIS 打包通过 | 第二次长超时运行通过，生成 MSI 与 NSIS；仍有 `.app` identifier 已知警告 | pass |
| 截取 smoke | `D:\tl-temp\ffmpeg-gui-stage7-trim-20260613-153816` | 英文、中文、空格路径视频截取和音频截取输出可被 ffprobe 读取 | MP4/MKV/WebM 视频截取输出包含 video+audio；FLAC 音频截取输出包含 audio | pass |
| Browser/Vite fallback | Browser 打开 `http://127.0.0.1:1421` 并切到“截取” | 普通浏览器环境不崩溃，显示截取页和 Tauri runtime fallback，无 console error/warn | 显示单文件选择、开始/结束时间、快速/精确截取、输出目录和 fallback；console error/warn 为空 | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug 编译并启动 app | 日志显示 `target\debug\ffmpeg-gui.exe` 启动，随后清理本次进程 | pass |
| 桌面 UI 创建/取消截取任务 | Tauri 窗口导入媒体、创建截取任务、取消任务、复制日志 | 任务队列中确认进度、取消和日志复制 | 本轮未做人工交互点击；任务系统通过既有队列测试、截取任务接入和 dev 启动验证 | not run |

## 阶段 7 截取错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-13 | 首次 `pnpm.cmd run tauri:build` 在 NSIS 打包阶段被工具超时截断，但 makensis 仍在运行 | 1 | 等待 makensis 结束后用更长超时重跑，取得成功退出码 |
| 2026-06-13 | 截取 smoke 的 Python here-string 中文字面量变为 `????`，导致 Windows 路径非法 | 1 | 改用 Unicode escape 构造中文路径后重跑通过 |
| 2026-06-13 | 清理 Tauri dev 进程时命令行匹配过宽，把当前检查 shell 也匹配到并提前退出 | 1 | 重新检查端口和进程后按具体 PID 清理，复查 1420/1421 无残留监听 |

## 阶段 7 截取五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 7 截取音视频片段分支已完成，截图和音频提取仍未开始 |
| 我要去哪里？ | 后续应继续阶段 7 的视频截图分支或音频提取分支 |
| 目标是什么？ | 完成基础截取功能：单文件音视频输入、开始/结束时间、快速/精确模式、输出目录自动命名、任务队列接入 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 7 截取记录 |

## 阶段 7 视频截图测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| Rust 单元测试 | `cargo test` | 截图参数构造、校验和既有队列/转换回归测试通过 | 43 个测试通过 | pass |
| TypeScript 类型检查 | `pnpm.cmd exec tsc --noEmit` | 截图面板、invoke 和 App wiring 类型正确 | 通过 | pass |
| Rust 格式检查 | `cargo fmt --check` | 无格式变更需求 | 通过 | pass |
| sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 ffmpeg/ffprobe 可运行且版本匹配 | FFmpeg/FFprobe 均为 `8.0.1-full_build-www.gyan.dev` | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite 构建通过 | 构建通过，生成 dist 资源 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | sidecar 检查、前端构建、Rust release 编译和 MSI/NSIS 打包通过 | 通过，生成 MSI 与 NSIS；仍有 `.app` identifier 已知警告 | pass |
| 截图 smoke | `D:\tl-temp\ffmpeg-gui-stage7-screenshot-20260613-162756` | 英文、中文、空格路径视频可导出 PNG/JPG 截图并可被 ffprobe 读取 | PNG=`png`，JPG=`mjpeg`，尺寸均为 `320x180` | pass |
| Browser/Vite fallback | Browser 打开 `http://127.0.0.1:1421` 并切到“截图” | 普通浏览器环境不崩溃，截图页渲染正常，显示 Tauri runtime fallback，无 console error/warn | 显示“选择单个视频”“截图参数”，包含 PNG/JPG，fallback 可见，console warn/error 数量为 0 | pass |
| Tauri dev 冒烟 | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite ready、Rust debug app 启动 | 已启动 `target\debug\ffmpeg-gui.exe` 和 Vite 1420；随后手动停止，dev 命令记录预期终止退出码 | pass |

## 阶段 7 视频截图错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-13 | Browser runtime 不支持 `networkidle` load state | 1 | 改用支持的 `load` 状态后完成截图页 fallback 验证 |
| 2026-06-13 | Tauri dev smoke 手动停止 debug app 后命令记录 `exit code 0xffffffff` | 1 | 这是手动清理进程的预期结果；日志已确认 sidecar、Vite 和 debug app 启动成功 |

### 阶段 7：集成合并
- **状态：** in progress
- 执行的操作：
  - 从 `origin/codex/single-file-convert` 创建集成分支 `codex/stage7-full`。
  - 已合并 `codex/stage7-trim`。
  - 已合并 `codex/stage7-screenshot`。
  - 已合并 `codex/stage7-audio-extract`。
  - 已将共享的类型、命令注册、任务分支、前端状态和规划文件解析为截取、截图、音频提取三者共存。

## 阶段 7 音频提取测试结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| Rust 单元测试 | `cargo test` | 音频提取参数构造、校验和既有队列/转换回归测试通过 | 43 个测试通过 | pass |
| TypeScript 类型检查 | `pnpm.cmd exec tsc --noEmit` | 音频提取面板、invoke 和 App wiring 类型正确 | 通过 | pass |
| Rust 格式检查 | `cargo fmt --check` | Rust 文件格式符合 rustfmt | 通过 | pass |
| Sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 FFmpeg/FFprobe sidecar 可用 | FFmpeg/FFprobe 8.0.1 检查通过 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite production build 通过 | 通过 | pass |
| 桌面打包 | `pnpm.cmd run tauri:build` | Windows release build 和安装包生成成功 | 通过，生成 MSI 和 NSIS 安装包；保留既有 bundle identifier warning | pass |
| FFmpeg smoke：英文路径视频提取 MP3 | `english\video-with-audio.mp4` | 输出可被 ffprobe 读取，音频编码为 MP3 | `english\video-audio.mp3`，codec `mp3` | pass |
| FFmpeg smoke：中文路径视频提取 AAC | `中文路径\带音频视频.mp4` | 输出可被 ffprobe 读取，音频编码为 AAC | `中文路径\带音频视频-audio.aac`，codec `aac` | pass |
| FFmpeg smoke：空格路径视频提取 WAV | `space path\video with audio.mp4` | 输出可被 ffprobe 读取，音频编码为 WAV PCM | `space path\video with audio-audio.wav`，codec `pcm_s16le` | pass |
| FFmpeg smoke：英文路径视频提取 FLAC | `english\video-with-audio.mp4` | 输出可被 ffprobe 读取，音频编码为 FLAC | `english\video-audio.flac`，codec `flac` | pass |
| FFmpeg smoke：无音频视频 fixture | `english\video-without-audio.mp4` | ffprobe 能识别没有音频流，用于 UI 禁止创建任务验证 | `audioStreams: 0` | pass |
| Browser fallback | `http://127.0.0.1:1421` | 普通 Vite 下音频页渲染正常，显示 Tauri runtime fallback，console 无 error/warn | 音频页文案、MP3/AAC/WAV/FLAC 和 fallback 均存在；warn/error 0 | pass |
| Tauri dev smoke | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite 和 Rust debug app 启动正常 | debug app 启动成功；手动停止后返回预期 `0xffffffff` | pass |

### 阶段 7：全量统一验证
- **状态：** complete
- 执行的操作：
  - 在 `codex/stage7-full` 上完成 `codex/stage7-trim`、`codex/stage7-screenshot`、`codex/stage7-audio-extract` 三个独立分支合并。
  - 解决共享文件冲突：后端 request/args/job/command 注册、前端 App/FeatureWorkspace/typed invoke、三套单文件面板状态、规划文件。
  - 删除合并后重复的 `format_seconds` helper，保留一个共享实现。
  - 使用统一临时素材目录 `D:\tl-temp\ffmpeg-gui-stage7-full-20260613-200614` 验证截取、截图和音频提取。
- 创建/修改的文件：
  - `src-tauri/src/commands/jobs.rs`
  - `src-tauri/src/ffmpeg/command_builder.rs`
  - `src-tauri/src/jobs/mod.rs`
  - `src-tauri/src/lib.rs`
  - `src/app/App.tsx`
  - `src/app/types.ts`
  - `src/features/FeatureWorkspace.tsx`
  - `src/features/audio/AudioExtractPanel.tsx`
  - `src/features/screenshot/ScreenshotPanel.tsx`
  - `src/features/trim/TrimPanel.tsx`
  - `src/lib/tauri.ts`
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

## 阶段 7 全量统一验证结果
| 测试 | 输入 | 预期结果 | 实际结果 | 状态 |
|------|------|---------|---------|------|
| Rust 格式检查 | `cargo fmt --check` | Rust 文件格式符合 rustfmt | 通过 | pass |
| Rust 单元测试 | `cargo test` | 转换、截取、截图、音频提取、任务系统回归测试通过 | 59 个测试通过 | pass |
| Sidecar 检查 | `pnpm.cmd run sidecar:check` | 项目内 FFmpeg/FFprobe sidecar 可用 | FFmpeg/FFprobe 8.0.1 检查通过 | pass |
| 前端构建 | `pnpm.cmd build` | TypeScript 与 Vite production build 通过 | 通过 | pass |
| Tauri release 构建 | `pnpm.cmd run tauri:build` | Windows release build 和安装包生成成功 | 通过，生成 MSI 和 NSIS 安装包；保留既有 bundle identifier warning | pass |
| 统一 FFmpeg smoke：截取 | 英文视频、中文视频、空格路径音频 | 快速截取、精确截取和音频截取输出可被 ffprobe 读取 | MKV/MP4 输出含 video+audio，FLAC 输出含 audio | pass |
| 统一 FFmpeg smoke：截图 | 中文路径视频、空格路径视频 | PNG/JPG 截图输出可被 ffprobe 读取 | PNG=`png`，JPG=`mjpeg`，尺寸 `320x180` | pass |
| 统一 FFmpeg smoke：音频提取 | 英文/中文/空格路径视频 | MP3/AAC/WAV/FLAC 输出可被 ffprobe 读取 | codecs 为 `mp3`、`aac`、`pcm_s16le`、`flac` | pass |
| Browser fallback | `http://127.0.0.1:1421` | 截取、截图、音频页渲染正常，显示 Tauri runtime fallback，console 无 error/warn | 三个页面核心文案和 fallback 均存在；warn/error 0 | pass |
| Tauri dev smoke | `pnpm.cmd run tauri:dev` | sidecar 检查、Vite 和 Rust debug app 启动正常 | debug app 启动成功；手动停止后返回预期 `0xffffffff` | pass |

## 阶段 7 集成错误日志
| 时间戳 | 错误 | 尝试次数 | 解决方案 |
|--------|------|---------|---------|
| 2026-06-13 | `cargo test` 首次失败：`format_seconds` 在合并后重复定义 | 1 | 删除后面的重复 helper，保留共享实现后复验 `cargo fmt --check` 和 59 个测试通过 |

## 阶段 7 五问重启检查
| 问题 | 答案 |
|------|------|
| 我在哪里？ | 阶段 7 三个基础处理功能已合并到 `codex/stage7-full` 并完成统一验证 |
| 我要去哪里？ | 后续可进入阶段 8：字幕与倍速导出，或先提交/推送集成分支 |
| 目标是什么？ | 完成截取、截图、音频提取三个基础功能，并确认它们在同一分支共存、构建、打包和 smoke 均通过 |
| 我学到了什么？ | 见 findings.md |
| 我做了什么？ | 见上方阶段 7 全量统一验证记录 |

---
*每个阶段完成后或遇到错误时更新此文件*

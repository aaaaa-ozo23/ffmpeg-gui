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

## 遇到的问题
| 问题 | 解决方案 |
|------|---------|
| `pnpm.cmd install` 首次返回 `ERR_PNPM_IGNORED_BUILDS`，提示 esbuild 构建脚本被忽略 | 在 `pnpm-workspace.yaml` 中设置 `allowBuilds.esbuild: true` 后重新安装成功 |
| `pnpm.cmd tauri build` 警告 bundle identifier 以 `.app` 结尾 | 记录为当前已知警告；该值来自阶段 1 确认方案，Windows 构建不阻塞 |
| Browser 插件工具搜索未暴露可调用浏览器控制接口 | 使用 Microsoft Edge headless 生成桌面和窄屏截图作为视觉验证回退 |

## 规划结论
- 开发计划已写入 task_plan.md。
- 计划分为 10 个实际开发阶段：工程脚手架、前端基础、sidecar/后端基础、媒体探测、任务系统、格式转换、三个基础处理功能、字幕与倍速、批量/设置/预设、测试打包文档。
- M2 可作为 MVP 可用节点，M4 可作为 Windows 首版交付节点。
- 阶段 1 已完成。
- 阶段 2 已完成，下一阶段应进入“FFmpeg sidecar 与 Rust 后端基础”。

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

import {
  Captions,
  Gauge,
  Image as ImageIcon,
  ListChecks,
  Music,
  Scissors,
  Settings,
  Shuffle,
} from "lucide-react";
import type { FeatureConfig, LogEntry, MediaSummary, TaskItem } from "./types";

export const featureConfigs: FeatureConfig[] = [
  {
    id: "convert",
    label: "转换",
    description: "设置输出格式、编码和保存位置，后续阶段接入 FFmpeg 任务。",
    icon: Shuffle,
    summary: "容器与编码预设",
  },
  {
    id: "trim",
    label: "截取",
    description: "输入开始和结束时间，选择快速截取或精确截取模式。",
    icon: Scissors,
    summary: "片段时间范围",
  },
  {
    id: "screenshot",
    label: "截图",
    description: "指定时间点导出 PNG 或 JPG 图片，后续扩展批量截图。",
    icon: ImageIcon,
    summary: "单帧导出",
  },
  {
    id: "audio",
    label: "音频",
    description: "从视频提取音频，或在常用音频格式之间转换。",
    icon: Music,
    summary: "音频提取",
  },
  {
    id: "subtitle",
    label: "字幕",
    description: "区分外挂字幕封装和硬字幕烧录，避免处理模式混淆。",
    icon: Captions,
    summary: "封装与烧录",
  },
  {
    id: "speed",
    label: "倍速",
    description: "导出 0.5x、1.25x、1.5x、2x 等倍速处理后的文件。",
    icon: Gauge,
    summary: "导出倍速文件",
  },
  {
    id: "jobs",
    label: "任务",
    description: "查看队列、进度、取消状态和结果记录。",
    icon: ListChecks,
    summary: "队列与日志",
  },
  {
    id: "settings",
    label: "设置",
    description: "管理默认输出目录、重名策略、日志保留和工具状态。",
    icon: Settings,
    summary: "偏好与状态",
  },
];

export const mockMedia: MediaSummary = {
  fileName: "sample demo 中文路径.mp4",
  path: "D:\\Media Tests\\中文路径\\sample demo 中文路径.mp4",
  mediaKind: "视频",
  duration: "00:03:42",
  container: "MP4",
  resolution: "1920 x 1080",
  videoCodec: "H.264",
  audioCodec: "AAC",
  subtitleTracks: 1,
  size: "128.4 MB",
};

export const mockTasks: TaskItem[] = [
  {
    id: "task-001",
    title: "转换为 MP4",
    feature: "convert",
    status: "running",
    progress: 64,
    inputName: "sample demo 中文路径.mp4",
    outputName: "sample demo 输出.mp4",
    updatedAt: "刚刚",
  },
  {
    id: "task-002",
    title: "导出截图",
    feature: "screenshot",
    status: "queued",
    progress: 0,
    inputName: "presentation.mov",
    outputName: "frame_00_45.png",
    updatedAt: "等待中",
  },
  {
    id: "task-003",
    title: "提取音频",
    feature: "audio",
    status: "done",
    progress: 100,
    inputName: "interview.mkv",
    outputName: "interview.wav",
    updatedAt: "2 分钟前",
  },
];

export const mockLogs: LogEntry[] = [
  {
    id: "log-001",
    level: "info",
    time: "00:12:04",
    message: "任务队列 UI 已进入 mock 模式，等待阶段 5 接入真实进度事件。",
  },
  {
    id: "log-002",
    level: "warn",
    time: "00:12:08",
    message: "文件选择按钮仅用于界面占位，阶段 4 才会调用 Tauri dialog。",
  },
  {
    id: "log-003",
    level: "info",
    time: "00:12:11",
    message: "参数摘要只展示结构化配置，不生成命令行字符串。",
  },
];

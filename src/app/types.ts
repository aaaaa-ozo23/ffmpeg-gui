import type { LucideIcon } from "lucide-react";

export type FeatureId =
  | "convert"
  | "trim"
  | "screenshot"
  | "audio"
  | "subtitle"
  | "speed"
  | "jobs"
  | "settings";

export type JobStatus = "queued" | "running" | "done" | "failed" | "paused";

export type InspectorTab = "tasks" | "logs";

export type FeatureConfig = {
  id: FeatureId;
  label: string;
  description: string;
  icon: LucideIcon;
  summary: string;
};

export type MediaSummary = {
  fileName: string;
  path: string;
  duration: string;
  container: string;
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  subtitleTracks: number;
  size: string;
};

export type TaskItem = {
  id: string;
  title: string;
  feature: FeatureId;
  status: JobStatus;
  progress: number;
  inputName: string;
  outputName: string;
  updatedAt: string;
};

export type LogEntry = {
  id: string;
  level: "info" | "warn" | "error";
  time: string;
  message: string;
};

export type ToolVersion = {
  name: string;
  versionLine: string;
  configurationLine?: string;
};

export type FfmpegHealth = {
  targetTriple: string;
  ffmpeg: ToolVersion;
  ffprobe: ToolVersion;
};

export type AppErrorPayload = {
  category: string;
  message: string;
  detail?: string;
};

export type SidecarHealthState =
  | { status: "loading" }
  | { status: "ready"; health: FfmpegHealth }
  | { status: "error"; error: AppErrorPayload };

export type AppShellState = {
  activeFeatureId: FeatureId;
  inspectorTab: InspectorTab;
};

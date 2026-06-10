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
  mediaKind: string;
  duration: string;
  container: string;
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  subtitleTracks: number;
  size: string;
};

export type VideoStream = {
  index: number;
  codecName: string;
  width?: number;
  height?: number;
};

export type AudioStream = {
  index: number;
  codecName: string;
  sampleRate?: number;
  channels?: number;
};

export type SubtitleStream = {
  index: number;
  codecName: string;
  language?: string;
};

export type MediaInfo = {
  path: string;
  durationSec?: number;
  sizeBytes?: number;
  formatName?: string;
  videoStreams: VideoStream[];
  audioStreams: AudioStream[];
  subtitleStreams: SubtitleStream[];
};

export type MediaProbeState =
  | { status: "empty" }
  | { status: "loading"; path: string }
  | { status: "ready"; media: MediaInfo; summary: MediaSummary }
  | { status: "error"; path?: string; error: AppErrorPayload };

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

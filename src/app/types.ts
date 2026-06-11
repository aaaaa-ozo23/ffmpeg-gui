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

export type JobStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "canceling"
  | "canceled";

export type JobKind = "nullOutput";

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

export type JobRecord = {
  id: string;
  kind: JobKind;
  title: string;
  status: JobStatus;
  progressPct?: number;
  durationSec?: number;
  inputPath: string;
  outputPath?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  args: string[];
  stdout: string[];
  stderr: string[];
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  exitCode?: number;
  errorCategory?: string;
  errorMessage?: string;
};

export type JobQueueConfig = {
  maxConcurrent: number;
};

export type JobLogStream = "stdout" | "stderr";

export type JobLogEntry = {
  stream: JobLogStream;
  line: string;
  timestamp: number;
  truncated: boolean;
};

export type JobsEvent = {
  type: string;
  job: JobRecord;
  log?: JobLogEntry;
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

export type JobsRuntimeState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; error: AppErrorPayload };

export type SidecarHealthState =
  | { status: "loading" }
  | { status: "ready"; health: FfmpegHealth }
  | { status: "error"; error: AppErrorPayload };

export type AppShellState = {
  activeFeatureId: FeatureId;
  inspectorTab: InspectorTab;
};

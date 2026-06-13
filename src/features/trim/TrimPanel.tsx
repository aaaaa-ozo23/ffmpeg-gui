import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  FileOutput,
  FolderOpen,
  Play,
  Scissors,
  Settings2,
} from "lucide-react";
import type {
  AppErrorPayload,
  ConvertOutputFormat,
  JobsRuntimeState,
  MediaProbeState,
  TrimMediaKind,
  TrimMode,
  TrimRequest,
} from "../../app/types";
import { MediaSummaryPanel } from "../../components/MediaSummaryPanel";
import { getOutputFormats, selectOutputDirectory } from "../../lib";

type TrimPanelProps = {
  mediaState: MediaProbeState;
  jobsRuntime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onEnqueueTrimJob: (request: TrimRequest) => Promise<void>;
};

const MODE_OPTIONS: Array<{
  value: TrimMode;
  label: string;
  description: string;
}> = [
  {
    value: "copy",
    label: "快速截取",
    description: "stream copy，速度快但切点可能不完全精确。",
  },
  {
    value: "accurate",
    label: "精确截取",
    description: "重编码，切点更准但耗时更长。",
  },
];

export function TrimPanel({
  mediaState,
  jobsRuntime,
  commandError,
  onSelectMedia,
  onEnqueueTrimJob,
}: TrimPanelProps) {
  const [startInput, setStartInput] = useState("0");
  const [endInput, setEndInput] = useState("");
  const [mode, setMode] = useState<TrimMode>("copy");
  const [outputFormat, setOutputFormat] =
    useState<ConvertOutputFormat>("mp4");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [localError, setLocalError] = useState<AppErrorPayload | undefined>();

  const trimMediaKind = useMemo(() => inferTrimMediaKind(mediaState), [mediaState]);
  const outputFormats = useMemo(
    () => getOutputFormats(trimMediaKind),
    [trimMediaKind],
  );
  const startTime = useMemo(() => parseTimeInput(startInput), [startInput]);
  const endTime = useMemo(() => parseTimeInput(endInput), [endInput]);
  const outputPath = useMemo(
    () => buildOutputPath(mediaState, outputDirectory, outputFormat),
    [mediaState, outputDirectory, outputFormat],
  );
  const validationError = useMemo(
    () =>
      buildValidationError(
        mediaState,
        trimMediaKind,
        startTime,
        endTime,
      ),
    [endTime, mediaState, startTime, trimMediaKind],
  );
  const currentError =
    localError ??
    validationError ??
    commandError ??
    (jobsRuntime.status === "error" ? jobsRuntime.error : undefined);
  const canTrim = Boolean(
    mediaState.status === "ready" &&
      trimMediaKind &&
      outputDirectory.trim() &&
      outputPath &&
      startTime.value !== undefined &&
      endTime.value !== undefined &&
      !validationError &&
      jobsRuntime.status === "ready",
  );

  useEffect(() => {
    if (outputFormats.length === 0) {
      return;
    }

    setOutputFormat((currentFormat) =>
      outputFormats.some((format) => format.value === currentFormat)
        ? currentFormat
        : outputFormats[0].value,
    );
  }, [outputFormats]);

  useEffect(() => {
    if (mediaState.status !== "ready") {
      return;
    }

    setStartInput("0");
    setEndInput(formatTimeInput(mediaState.media.durationSec));
    setLocalError(undefined);
  }, [mediaState]);

  const handleSelectOutputDirectory = useCallback(async () => {
    try {
      const selectedPath = await selectOutputDirectory();
      if (selectedPath) {
        setOutputDirectory(selectedPath);
        setLocalError(undefined);
      }
    } catch (error) {
      setLocalError(error as AppErrorPayload);
    }
  }, []);

  const handleStartTrim = useCallback(async () => {
    if (
      mediaState.status !== "ready" ||
      !trimMediaKind ||
      !outputPath ||
      startTime.value === undefined ||
      endTime.value === undefined ||
      !canTrim
    ) {
      return;
    }

    setLocalError(undefined);
    await onEnqueueTrimJob({
      inputPath: mediaState.media.path,
      outputPath,
      mediaKind: trimMediaKind,
      outputFormat,
      mode,
      startSec: startTime.value,
      endSec: endTime.value,
      overwrite,
      sourceDurationSec: mediaState.media.durationSec,
    });
  }, [
    canTrim,
    endTime.value,
    mediaState,
    mode,
    onEnqueueTrimJob,
    outputFormat,
    outputPath,
    overwrite,
    startTime.value,
    trimMediaKind,
  ]);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="trim-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入文件</p>
            <h2 id="trim-file-title">选择单个音视频文件</h2>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={mediaState.status === "loading"}
            onClick={onSelectMedia}
          >
            <FolderOpen size={16} aria-hidden="true" />
            {mediaState.status === "loading" ? "读取中" : "选择文件"}
          </button>
        </div>

        <MediaSummaryPanel mediaState={mediaState} />
      </section>

      <section className="tool-panel" aria-labelledby="trim-settings-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">截取参数</p>
            <h2 id="trim-settings-title">时间范围与输出</h2>
          </div>
          <span className="mode-chip">{mediaKindLabel(trimMediaKind)}</span>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>开始时间</span>
            <input
              type="text"
              value={startInput}
              placeholder="0 或 00:00:00"
              onChange={(event) => {
                setStartInput(event.target.value);
                setLocalError(undefined);
              }}
            />
          </label>

          <label className="field">
            <span>结束时间</span>
            <input
              type="text"
              value={endInput}
              placeholder="例如 10.5 或 00:00:10.5"
              onChange={(event) => {
                setEndInput(event.target.value);
                setLocalError(undefined);
              }}
            />
          </label>

          <label className="field">
            <span>输出格式</span>
            <select
              value={outputFormat}
              disabled={outputFormats.length === 0}
              onChange={(event) =>
                setOutputFormat(event.target.value as ConvertOutputFormat)
              }
            >
              {outputFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="trim-mode-grid" aria-label="截取模式">
          {MODE_OPTIONS.map((option) => (
            <label
              className={
                mode === option.value
                  ? "trim-mode-option trim-mode-option-active"
                  : "trim-mode-option"
              }
              key={option.value}
            >
              <input
                type="radio"
                name="trim-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              <Scissors size={16} aria-hidden="true" />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="output-row">
          <div className="output-icon" aria-hidden="true">
            <FileOutput size={18} />
          </div>
          <div>
            <span>输出目录</span>
            <p>{outputDirectory || "请选择截取输出目录"}</p>
            <small>{outputPath ? `输出文件：${fileNameFromPath(outputPath)}` : "命名规则：<原文件名>-trimmed.<格式>"}</small>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="选择输出目录"
            disabled={mediaState.status !== "ready" || !trimMediaKind}
            onClick={handleSelectOutputDirectory}
          >
            <FolderOpen size={17} aria-hidden="true" />
          </button>
        </div>

        <details className="advanced-settings">
          <summary>
            <Settings2 size={16} aria-hidden="true" />
            高级设置
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(event) => setOverwrite(event.target.checked)}
            />
            <span>允许覆盖已有输出文件</span>
          </label>
        </details>

        <div className="parameter-summary">
          <span>参数摘要</span>
          <p>
            {parameterSummary(
              mediaState,
              trimMediaKind,
              startTime.value,
              endTime.value,
              mode,
              outputFormat,
              outputDirectory,
            )}
          </p>
        </div>

        {currentError ? (
          <div className="job-runtime-message job-runtime-error">
            <AlertTriangle size={15} aria-hidden="true" />
            <strong>{currentError.message}</strong>
            <span>{currentError.detail ?? "截取任务暂不可用。"}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          disabled={!canTrim}
          onClick={handleStartTrim}
        >
          <Play size={17} aria-hidden="true" />
          {jobsRuntime.status === "error" ? "需要 Tauri 任务系统" : "开始截取"}
        </button>
      </section>
    </div>
  );
}

function inferTrimMediaKind(mediaState: MediaProbeState): TrimMediaKind | undefined {
  if (mediaState.status !== "ready") {
    return undefined;
  }

  if (mediaState.summary.mediaKind === "视频") {
    return "video";
  }

  if (mediaState.summary.mediaKind === "音频") {
    return "audio";
  }

  return undefined;
}

function parseTimeInput(input: string): { value?: number; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "请输入时间。" };
  }

  const parts = trimmed.split(":");
  if (parts.length > 3) {
    return { error: "时间格式只支持 SS、MM:SS 或 HH:MM:SS。" };
  }

  if (parts.some((part) => !part.trim())) {
    return { error: "时间格式不完整。" };
  }

  const values = parts.map((part) => Number(part));
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return { error: "时间必须是非负数字。" };
  }

  if (
    values
      .slice(0, -1)
      .some((value) => !Number.isInteger(value))
  ) {
    return { error: "小时和分钟必须是整数。" };
  }

  if (parts.length > 1 && values[values.length - 1] >= 60) {
    return { error: "秒数必须小于 60。" };
  }

  if (parts.length === 3 && values[1] >= 60) {
    return { error: "分钟数必须小于 60。" };
  }

  const value =
    parts.length === 1
      ? values[0]
      : parts.length === 2
        ? values[0] * 60 + values[1]
        : values[0] * 3600 + values[1] * 60 + values[2];

  return { value };
}

function buildValidationError(
  mediaState: MediaProbeState,
  trimMediaKind: TrimMediaKind | undefined,
  startTime: { value?: number; error?: string },
  endTime: { value?: number; error?: string },
): AppErrorPayload | undefined {
  if (mediaState.status === "error") {
    return mediaState.error;
  }

  if (mediaState.status === "ready" && !trimMediaKind) {
    return {
      category: "unsupportedTrimMediaKind",
      message: "截取只支持视频或音频文件。",
      detail: `当前媒体类型：${mediaState.summary.mediaKind}`,
    };
  }

  if (mediaState.status !== "ready") {
    return undefined;
  }

  if (startTime.error) {
    return { category: "invalidTrimStart", message: startTime.error };
  }

  if (endTime.error) {
    return { category: "invalidTrimEnd", message: endTime.error };
  }

  if (startTime.value === undefined || endTime.value === undefined) {
    return undefined;
  }

  if (endTime.value <= startTime.value) {
    return {
      category: "invalidTrimRange",
      message: "结束时间必须大于开始时间。",
    };
  }

  const durationSec = mediaState.media.durationSec;
  if (
    durationSec !== undefined &&
    Number.isFinite(durationSec) &&
    endTime.value > durationSec + 0.001
  ) {
    return {
      category: "invalidTrimRange",
      message: "结束时间不能超过媒体总时长。",
      detail: `媒体时长：${formatTimeInput(durationSec)}`,
    };
  }

  return undefined;
}

function buildOutputPath(
  mediaState: MediaProbeState,
  outputDirectory: string,
  outputFormat: ConvertOutputFormat,
) {
  if (mediaState.status !== "ready" || !outputDirectory.trim()) {
    return "";
  }

  return joinPath(
    outputDirectory,
    `${fileBaseName(mediaState.summary.fileName)}-trimmed.${outputFormat}`,
  );
}

function parameterSummary(
  mediaState: MediaProbeState,
  trimMediaKind: TrimMediaKind | undefined,
  startSec: number | undefined,
  endSec: number | undefined,
  mode: TrimMode,
  outputFormat: ConvertOutputFormat,
  outputDirectory: string,
) {
  if (mediaState.status === "empty") {
    return "选择单个视频或音频文件后，可创建截取任务。";
  }

  if (mediaState.status === "loading") {
    return "正在读取媒体信息。";
  }

  if (mediaState.status === "error") {
    return "当前文件读取失败，无法截取。";
  }

  if (!trimMediaKind) {
    return "当前媒体类型不支持截取。";
  }

  const range =
    startSec !== undefined && endSec !== undefined
      ? `${formatTimeInput(startSec)} -> ${formatTimeInput(endSec)}`
      : "未设置完整时间范围";
  const modeLabel = mode === "copy" ? "快速 stream copy" : "精确重编码";
  const output = outputDirectory || "未选择输出目录";

  return `${mediaKindLabel(trimMediaKind)}截取 ${range}，输出 ${outputFormat.toUpperCase()}；${modeLabel}；输出目录：${output}`;
}

function mediaKindLabel(mediaKind: TrimMediaKind | undefined) {
  if (mediaKind === "video") {
    return "视频";
  }

  if (mediaKind === "audio") {
    return "音频";
  }

  return "等待媒体";
}

function formatTimeInput(durationSec?: number) {
  if (durationSec === undefined || !Number.isFinite(durationSec)) {
    return "";
  }

  const totalMs = Math.max(0, Math.round(durationSec * 1000));
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);
  const millis = totalMs % 1000;
  const secondsText =
    millis > 0
      ? `${seconds.toString().padStart(2, "0")}.${millis
          .toString()
          .padStart(3, "0")
          .replace(/0+$/, "")}`
      : seconds.toString().padStart(2, "0");

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secondsText,
  ].join(":");
}

function fileNameFromPath(path: string) {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path || "未命名文件";
}

function fileBaseName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName || "output";
}

function joinPath(directory: string, fileName: string) {
  if (!directory) {
    return fileName;
  }

  const separator = directory.includes("/") && !directory.includes("\\") ? "/" : "\\";
  return `${directory.replace(/[\\/]+$/, "")}${separator}${fileName}`;
}

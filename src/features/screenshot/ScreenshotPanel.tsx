import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  ChevronDown,
  FileOutput,
  FolderOpen,
  Play,
  Settings2,
} from "lucide-react";
import type {
  AppErrorPayload,
  JobsRuntimeState,
  MediaProbeState,
  ScreenshotOutputFormat,
  ScreenshotRequest,
} from "../../app/types";
import { MediaSummaryPanel } from "../../components/MediaSummaryPanel";
import { selectOutputDirectory } from "../../lib";

type ScreenshotPanelProps = {
  mediaState: MediaProbeState;
  jobsRuntime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onEnqueueScreenshotJob: (request: ScreenshotRequest) => Promise<void>;
};

type ParsedTime =
  | { ok: true; seconds: number }
  | { ok: false; error: string };

const SCREENSHOT_FORMATS: Array<{
  value: ScreenshotOutputFormat;
  label: string;
}> = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
];

export function ScreenshotPanel({
  mediaState,
  jobsRuntime,
  commandError,
  onSelectMedia,
  onEnqueueScreenshotJob,
}: ScreenshotPanelProps) {
  const [timestampInput, setTimestampInput] = useState("0");
  const [outputFormat, setOutputFormat] =
    useState<ScreenshotOutputFormat>("png");
  const [overwrite, setOverwrite] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState("");
  const [localError, setLocalError] = useState<AppErrorPayload | undefined>();

  const selectedPath =
    mediaState.status === "ready"
      ? mediaState.media.path
      : mediaState.status === "loading"
        ? mediaState.path
        : "";
  const parsedTimestamp = useMemo(
    () => parseTimeInput(timestampInput),
    [timestampInput],
  );
  const readyMedia = mediaState.status === "ready" ? mediaState : undefined;
  const isVideo = readyMedia?.summary.mediaKind === "视频";
  const generatedOutputPath = useMemo(() => {
    if (!readyMedia || !parsedTimestamp.ok || !outputDirectory.trim()) {
      return "";
    }

    return joinPath(
      outputDirectory,
      `${fileBaseName(readyMedia.summary.fileName)}-screenshot-${formatTimestampForFile(
        parsedTimestamp.seconds,
      )}.${outputFormat}`,
    );
  }, [outputDirectory, outputFormat, parsedTimestamp, readyMedia]);
  const validationError = buildValidationError(mediaState, parsedTimestamp);
  const currentError =
    localError ??
    validationError ??
    commandError ??
    (jobsRuntime.status === "error" ? jobsRuntime.error : undefined);
  const canScreenshot = Boolean(
    readyMedia &&
      isVideo &&
      parsedTimestamp.ok &&
      outputDirectory.trim() &&
      jobsRuntime.status === "ready" &&
      !validationError,
  );
  const isProbing = mediaState.status === "loading";

  useEffect(() => {
    setLocalError(undefined);
    if (mediaState.status === "ready") {
      setTimestampInput("0");
    }
  }, [mediaState.status, selectedPath]);

  const handleSelectOutputDirectory = useCallback(async () => {
    try {
      const selectedOutputDirectory = await selectOutputDirectory();
      if (selectedOutputDirectory) {
        setOutputDirectory(selectedOutputDirectory);
        setLocalError(undefined);
      }
    } catch (error) {
      setLocalError(error as AppErrorPayload);
    }
  }, []);

  const handleStartScreenshot = useCallback(async () => {
    if (!readyMedia || !parsedTimestamp.ok || !generatedOutputPath) {
      return;
    }

    setLocalError(undefined);
    await onEnqueueScreenshotJob({
      inputPath: readyMedia.media.path,
      outputPath: generatedOutputPath,
      outputFormat,
      timestampSec: parsedTimestamp.seconds,
      overwrite,
      sourceDurationSec: readyMedia.media.durationSec,
    });
  }, [
    generatedOutputPath,
    onEnqueueScreenshotJob,
    outputFormat,
    overwrite,
    parsedTimestamp,
    readyMedia,
  ]);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="screenshot-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入视频</p>
            <h2 id="screenshot-file-title">选择单个视频</h2>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={isProbing}
            onClick={onSelectMedia}
          >
            <FolderOpen size={16} aria-hidden="true" />
            {isProbing ? "读取中" : "选择视频"}
          </button>
        </div>

        <MediaSummaryPanel mediaState={mediaState} />
      </section>

      <section
        className="tool-panel"
        aria-labelledby="screenshot-settings-title"
      >
        <div className="panel-heading">
          <div>
            <p className="section-label">截图参数</p>
            <h2 id="screenshot-settings-title">输出配置</h2>
          </div>
          <span className="mode-chip">{isVideo ? "视频截图" : "等待视频"}</span>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>时间点</span>
            <input
              type="text"
              value={timestampInput}
              placeholder="例如 12.5 或 01:02:03"
              disabled={!readyMedia}
              onChange={(event) => setTimestampInput(event.target.value)}
            />
          </label>

          <label className="field">
            <span>输出格式</span>
            <select
              value={outputFormat}
              disabled={!readyMedia}
              onChange={(event) =>
                setOutputFormat(event.target.value as ScreenshotOutputFormat)
              }
            >
              {SCREENSHOT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="output-row">
          <div className="output-icon" aria-hidden="true">
            <FileOutput size={18} />
          </div>
          <div>
            <span>输出目录</span>
            <p>{outputDirectory || "请选择截图输出目录"}</p>
            <small>{outputPreview(generatedOutputPath, outputFormat)}</small>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="选择输出目录"
            disabled={!readyMedia}
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
            <span>允许覆盖已有截图文件</span>
          </label>
        </details>

        <div className="parameter-summary">
          <span>参数摘要</span>
          <p>
            {parameterSummary(
              mediaState,
              parsedTimestamp,
              outputFormat,
              outputDirectory,
            )}
          </p>
        </div>

        {currentError ? (
          <div className="job-runtime-message job-runtime-error">
            <strong>{currentError.message}</strong>
            <span>{currentError.detail ?? "截图任务暂不可用。"}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          disabled={!canScreenshot}
          onClick={handleStartScreenshot}
        >
          <Play size={17} aria-hidden="true" />
          {jobsRuntime.status === "error" ? "需要 Tauri 任务系统" : "导出截图"}
        </button>
      </section>

      <section className="tool-panel" aria-labelledby="screenshot-note-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">处理方式</p>
            <h2 id="screenshot-note-title">单帧导出</h2>
          </div>
          <div className="panel-icon" aria-hidden="true">
            <Camera size={18} />
          </div>
        </div>
        <div className="parameter-summary">
          <span>FFmpeg 参数</span>
          <p>
            截图任务使用指定时间点、第一路视频流、单帧输出，并忽略音频和字幕轨。
          </p>
        </div>
      </section>
    </div>
  );
}

function parseTimeInput(value: string): ParsedTime {
  const input = value.trim();
  if (!input) {
    return { ok: false, error: "请输入截图时间点。" };
  }

  const parts = input.split(":");
  if (parts.length > 3 || parts.some((part) => part.trim() === "")) {
    return { ok: false, error: "时间格式应为 SS、MM:SS 或 HH:MM:SS。" };
  }

  const numberPattern = /^\d+(?:\.\d+)?$/;
  const integerPattern = /^\d+$/;
  if (!parts.every((part) => numberPattern.test(part.trim()))) {
    return { ok: false, error: "时间只能包含数字、冒号和小数秒。" };
  }

  let seconds = 0;
  if (parts.length === 1) {
    seconds = Number(parts[0]);
  } else if (parts.length === 2) {
    if (!integerPattern.test(parts[0])) {
      return { ok: false, error: "分钟必须是整数。" };
    }
    const minutes = Number(parts[0]);
    const secondPart = Number(parts[1]);
    if (secondPart >= 60) {
      return { ok: false, error: "秒数必须小于 60。" };
    }
    seconds = minutes * 60 + secondPart;
  } else {
    if (!integerPattern.test(parts[0]) || !integerPattern.test(parts[1])) {
      return { ok: false, error: "小时和分钟必须是整数。" };
    }
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const secondPart = Number(parts[2]);
    if (minutes >= 60 || secondPart >= 60) {
      return { ok: false, error: "分钟和秒数必须小于 60。" };
    }
    seconds = hours * 3600 + minutes * 60 + secondPart;
  }

  return Number.isFinite(seconds) && seconds >= 0
    ? { ok: true, seconds }
    : { ok: false, error: "时间点必须是不小于 0 的秒数。" };
}

function buildValidationError(
  mediaState: MediaProbeState,
  parsedTimestamp: ParsedTime,
): AppErrorPayload | undefined {
  if (mediaState.status === "error") {
    return mediaState.error;
  }

  if (mediaState.status !== "ready") {
    return undefined;
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return {
      category: "unsupportedScreenshotMediaKind",
      message: "当前媒体不可截图。",
      detail: "截图功能只支持视频文件；音频、图片和未知媒体请使用对应功能处理。",
    };
  }

  if (!parsedTimestamp.ok) {
    return {
      category: "invalidScreenshotTimestamp",
      message: parsedTimestamp.error,
    };
  }

  const durationSec = mediaState.media.durationSec;
  if (
    durationSec !== undefined &&
    Number.isFinite(durationSec) &&
    parsedTimestamp.seconds > durationSec + 0.001
  ) {
    return {
      category: "screenshotTimestampOutOfRange",
      message: "截图时间点不能超过媒体时长。",
      detail: `当前视频时长约 ${formatTimeForDisplay(durationSec)}。`,
    };
  }

  return undefined;
}

function parameterSummary(
  mediaState: MediaProbeState,
  parsedTimestamp: ParsedTime,
  outputFormat: ScreenshotOutputFormat,
  outputDirectory: string,
) {
  if (mediaState.status === "empty") {
    return "选择一个视频后可导出指定时间点的 PNG 或 JPG 单帧截图。";
  }

  if (mediaState.status === "loading") {
    return "正在读取视频信息。";
  }

  if (mediaState.status === "error") {
    return "当前文件无法读取，不能创建截图任务。";
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return "截图只支持视频输入；当前文件请使用转换或后续对应处理功能。";
  }

  if (!parsedTimestamp.ok) {
    return parsedTimestamp.error;
  }

  if (!outputDirectory.trim()) {
    return "选择输出目录后将自动生成截图文件名。";
  }

  return `在 ${formatTimeForDisplay(
    parsedTimestamp.seconds,
  )} 导出 ${outputFormat.toUpperCase()}；输出目录：${outputDirectory}`;
}

function outputPreview(
  generatedOutputPath: string,
  outputFormat: ScreenshotOutputFormat,
) {
  if (!generatedOutputPath) {
    return `<原文件名>-screenshot-<时间戳>.${outputFormat}`;
  }

  return `文件：${fileNameFromPath(generatedOutputPath)}`;
}

function formatTimestampForFile(seconds: number) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const totalSeconds = Math.floor(totalMs / 1000);
  const milliseconds = totalMs % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secondPart = totalSeconds % 60;
  const base = [hours, minutes, secondPart]
    .map((part) => part.toString().padStart(2, "0"))
    .join("-");

  return milliseconds > 0
    ? `${base}-${milliseconds.toString().padStart(3, "0")}`
    : base;
}

function formatTimeForDisplay(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const wholeSeconds = Math.floor(safeSeconds);
  const milliseconds = Math.round((safeSeconds - wholeSeconds) * 1000);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const secondPart = wholeSeconds % 60;
  const base = [hours, minutes, secondPart]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");

  return milliseconds > 0
    ? `${base}.${milliseconds.toString().padStart(3, "0")}`
    : base;
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

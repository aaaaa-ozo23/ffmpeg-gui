import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  FileOutput,
  FolderOpen,
  Music,
  Play,
  Settings2,
} from "lucide-react";
import type {
  AppErrorPayload,
  AudioExtractOutputFormat,
  AudioExtractRequest,
  JobsRuntimeState,
  MediaProbeState,
} from "../../app/types";
import { MediaSummaryPanel } from "../../components/MediaSummaryPanel";
import { selectOutputDirectory } from "../../lib";

type AudioExtractPanelProps = {
  mediaState: MediaProbeState;
  jobsRuntime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onEnqueueAudioExtractJob: (request: AudioExtractRequest) => Promise<void>;
};

const AUDIO_EXTRACT_FORMATS: Array<{
  value: AudioExtractOutputFormat;
  label: string;
}> = [
  { value: "mp3", label: "MP3" },
  { value: "aac", label: "AAC" },
  { value: "wav", label: "WAV" },
  { value: "flac", label: "FLAC" },
];

export function AudioExtractPanel({
  mediaState,
  jobsRuntime,
  commandError,
  onSelectMedia,
  onEnqueueAudioExtractJob,
}: AudioExtractPanelProps) {
  const [outputFormat, setOutputFormat] =
    useState<AudioExtractOutputFormat>("mp3");
  const [overwrite, setOverwrite] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState("");
  const [localError, setLocalError] = useState<AppErrorPayload | undefined>();

  const selectedPath =
    mediaState.status === "ready"
      ? mediaState.media.path
      : mediaState.status === "loading"
        ? mediaState.path
        : "";
  const readyMedia = mediaState.status === "ready" ? mediaState : undefined;
  const isVideo = readyMedia?.summary.mediaKind === "视频";
  const audioStreamCount = readyMedia?.media.audioStreams.length ?? 0;
  const hasAudioStream = audioStreamCount > 0;
  const generatedOutputPath = useMemo(() => {
    if (!readyMedia || !outputDirectory.trim()) {
      return "";
    }

    return joinPath(
      outputDirectory,
      `${fileBaseName(readyMedia.summary.fileName)}-audio.${outputFormat}`,
    );
  }, [outputDirectory, outputFormat, readyMedia]);
  const validationError = buildValidationError(mediaState);
  const currentError =
    localError ??
    validationError ??
    commandError ??
    (jobsRuntime.status === "error" ? jobsRuntime.error : undefined);
  const canExtract = Boolean(
    readyMedia &&
      isVideo &&
      hasAudioStream &&
      outputDirectory.trim() &&
      jobsRuntime.status === "ready" &&
      !validationError,
  );
  const isProbing = mediaState.status === "loading";

  useEffect(() => {
    setLocalError(undefined);
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

  const handleStartExtract = useCallback(async () => {
    if (!readyMedia || !generatedOutputPath) {
      return;
    }

    setLocalError(undefined);
    await onEnqueueAudioExtractJob({
      inputPath: readyMedia.media.path,
      outputPath: generatedOutputPath,
      outputFormat,
      overwrite,
      durationSec: readyMedia.media.durationSec,
      sourceAudioStreamCount: readyMedia.media.audioStreams.length,
    });
  }, [
    generatedOutputPath,
    onEnqueueAudioExtractJob,
    outputFormat,
    overwrite,
    readyMedia,
  ]);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="audio-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入视频</p>
            <h2 id="audio-file-title">选择单个视频</h2>
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

      <section className="tool-panel" aria-labelledby="audio-settings-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">音频提取</p>
            <h2 id="audio-settings-title">输出配置</h2>
          </div>
          <span className="mode-chip">
            {isVideo && hasAudioStream
              ? `${audioStreamCount} 路音频`
              : "等待视频"}
          </span>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>输出格式</span>
            <select
              value={outputFormat}
              disabled={!readyMedia}
              onChange={(event) =>
                setOutputFormat(event.target.value as AudioExtractOutputFormat)
              }
            >
              {AUDIO_EXTRACT_FORMATS.map((format) => (
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
            <p>{outputDirectory || "请选择音频输出目录"}</p>
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
            <span>允许覆盖已有音频文件</span>
          </label>
        </details>

        <div className="parameter-summary">
          <span>参数摘要</span>
          <p>
            {parameterSummary(
              mediaState,
              outputFormat,
              outputDirectory,
              audioStreamCount,
            )}
          </p>
        </div>

        {currentError ? (
          <div className="job-runtime-message job-runtime-error">
            <strong>{currentError.message}</strong>
            <span>{currentError.detail ?? "音频提取任务暂不可用。"}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          disabled={!canExtract}
          onClick={handleStartExtract}
        >
          <Play size={17} aria-hidden="true" />
          {jobsRuntime.status === "error" ? "需要 Tauri 任务系统" : "提取音频"}
        </button>
      </section>

      <section className="tool-panel" aria-labelledby="audio-note-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">处理方式</p>
            <h2 id="audio-note-title">第一路音频</h2>
          </div>
          <div className="panel-icon" aria-hidden="true">
            <Music size={18} />
          </div>
        </div>
        <div className="parameter-summary">
          <span>FFmpeg 参数</span>
          <p>音频提取任务使用第一路音频流，忽略视频和字幕轨。</p>
        </div>
      </section>
    </div>
  );
}

function buildValidationError(
  mediaState: MediaProbeState,
): AppErrorPayload | undefined {
  if (mediaState.status === "error") {
    return mediaState.error;
  }

  if (mediaState.status !== "ready") {
    return undefined;
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return {
      category: "unsupportedAudioExtractMediaKind",
      message: "当前媒体不可提取音频。",
      detail: "音频提取只支持视频输入；音频转码请继续使用转换功能。",
    };
  }

  if (mediaState.media.audioStreams.length === 0) {
    return {
      category: "audioStreamMissing",
      message: "当前视频没有可提取的音频流。",
      detail: "请选择包含音频轨的视频文件。",
    };
  }

  return undefined;
}

function parameterSummary(
  mediaState: MediaProbeState,
  outputFormat: AudioExtractOutputFormat,
  outputDirectory: string,
  audioStreamCount: number,
) {
  if (mediaState.status === "empty") {
    return "选择一个带音频流的视频后可提取 MP3、AAC、WAV 或 FLAC。";
  }

  if (mediaState.status === "loading") {
    return "正在读取视频信息。";
  }

  if (mediaState.status === "error") {
    return "当前文件无法读取，不能创建音频提取任务。";
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return "当前输入不是视频；音频转码请使用转换功能。";
  }

  if (audioStreamCount === 0) {
    return "当前视频没有可提取的音频流。";
  }

  if (!outputDirectory.trim()) {
    return "选择输出目录后将自动生成音频文件名。";
  }

  return `提取第一路音频为 ${outputFormat.toUpperCase()}；输出目录：${outputDirectory}`;
}

function outputPreview(
  generatedOutputPath: string,
  outputFormat: AudioExtractOutputFormat,
) {
  if (!generatedOutputPath) {
    return `<原文件名>-audio.${outputFormat}`;
  }

  return `文件：${fileNameFromPath(generatedOutputPath)}`;
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

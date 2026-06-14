import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Captions,
  ChevronDown,
  FileOutput,
  FileText,
  FolderOpen,
  Play,
  Settings2,
} from "lucide-react";
import type {
  AppErrorPayload,
  JobsRuntimeState,
  MediaProbeState,
  SubtitleEncoding,
  SubtitleInputFormat,
  SubtitleMode,
  SubtitleOutputFormat,
  SubtitleRequest,
} from "../../app/types";
import { MediaSummaryPanel } from "../../components/MediaSummaryPanel";
import {
  selectFontsDirectory,
  selectOutputDirectory,
  selectSubtitleFile,
} from "../../lib";

type SubtitlePanelProps = {
  mediaState: MediaProbeState;
  jobsRuntime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onEnqueueSubtitleJob: (request: SubtitleRequest) => Promise<void>;
};

const MODE_OPTIONS: Array<{
  value: SubtitleMode;
  label: string;
  description: string;
}> = [
  {
    value: "embed",
    label: "封装字幕",
    description: "把外挂字幕作为可开关字幕轨写入 MP4 或 MKV。",
  },
  {
    value: "burn",
    label: "烧录字幕",
    description: "把字幕压进画面，导出后不能再关闭字幕。",
  },
];

const OUTPUT_FORMATS: Array<{
  value: SubtitleOutputFormat;
  label: string;
}> = [
  { value: "mp4", label: "MP4" },
  { value: "mkv", label: "MKV" },
];

const ENCODING_OPTIONS: Array<{
  value: SubtitleEncoding;
  label: string;
}> = [
  { value: "auto", label: "自动" },
  { value: "utf8", label: "UTF-8" },
  { value: "gbk", label: "GBK" },
];

export function SubtitlePanel({
  mediaState,
  jobsRuntime,
  commandError,
  onSelectMedia,
  onEnqueueSubtitleJob,
}: SubtitlePanelProps) {
  const [subtitlePath, setSubtitlePath] = useState("");
  const [inputFormat, setInputFormat] = useState<SubtitleInputFormat>("srt");
  const [mode, setMode] = useState<SubtitleMode>("embed");
  const [outputFormat, setOutputFormat] =
    useState<SubtitleOutputFormat>("mkv");
  const [encoding, setEncoding] = useState<SubtitleEncoding>("auto");
  const [fontsDir, setFontsDir] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [localError, setLocalError] = useState<AppErrorPayload | undefined>();

  const selectedPath =
    mediaState.status === "ready"
      ? mediaState.media.path
      : mediaState.status === "loading"
        ? mediaState.path
        : "";
  const readyMedia = mediaState.status === "ready" ? mediaState : undefined;
  const isVideo = readyMedia?.summary.mediaKind === "视频";
  const subtitleFormatError = useMemo(
    () => subtitleInputFormatError(subtitlePath, inputFormat),
    [inputFormat, subtitlePath],
  );
  const generatedOutputPath = useMemo(() => {
    if (!readyMedia || !outputDirectory.trim()) {
      return "";
    }

    const suffix = mode === "embed" ? "subtitled" : "burned-subtitles";
    return joinPath(
      outputDirectory,
      `${fileBaseName(readyMedia.summary.fileName)}-${suffix}.${outputFormat}`,
    );
  }, [mode, outputDirectory, outputFormat, readyMedia]);
  const validationError = buildValidationError(mediaState, subtitleFormatError);
  const currentError =
    localError ??
    validationError ??
    commandError ??
    (jobsRuntime.status === "error" ? jobsRuntime.error : undefined);
  const canCreateSubtitleJob = Boolean(
    readyMedia &&
      isVideo &&
      subtitlePath &&
      !subtitleFormatError &&
      outputDirectory.trim() &&
      generatedOutputPath &&
      jobsRuntime.status === "ready" &&
      !validationError,
  );
  const isProbing = mediaState.status === "loading";

  useEffect(() => {
    setLocalError(undefined);
  }, [mediaState.status, selectedPath]);

  const handleSelectSubtitleFile = useCallback(async () => {
    try {
      const selectedSubtitlePath = await selectSubtitleFile();
      if (!selectedSubtitlePath) {
        return;
      }

      setSubtitlePath(selectedSubtitlePath);
      const inferredFormat = inferSubtitleInputFormat(selectedSubtitlePath);
      if (inferredFormat) {
        setInputFormat(inferredFormat);
      }
      setLocalError(undefined);
    } catch (error) {
      setLocalError(error as AppErrorPayload);
    }
  }, []);

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

  const handleSelectFontsDirectory = useCallback(async () => {
    try {
      const selectedFontsDirectory = await selectFontsDirectory();
      if (selectedFontsDirectory) {
        setFontsDir(selectedFontsDirectory);
        setLocalError(undefined);
      }
    } catch (error) {
      setLocalError(error as AppErrorPayload);
    }
  }, []);

  const handleStartSubtitleJob = useCallback(async () => {
    if (!readyMedia || !generatedOutputPath || !subtitlePath) {
      return;
    }

    setLocalError(undefined);
    await onEnqueueSubtitleJob({
      inputPath: readyMedia.media.path,
      subtitlePath,
      outputPath: generatedOutputPath,
      mode,
      outputFormat,
      inputFormat,
      encoding,
      fontsDir: mode === "burn" && fontsDir.trim() ? fontsDir : undefined,
      overwrite,
      durationSec: readyMedia.media.durationSec,
      sourceVideoStreamCount: readyMedia.media.videoStreams.length,
    });
  }, [
    encoding,
    fontsDir,
    generatedOutputPath,
    inputFormat,
    mode,
    onEnqueueSubtitleJob,
    outputFormat,
    overwrite,
    readyMedia,
    subtitlePath,
  ]);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="subtitle-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入视频</p>
            <h2 id="subtitle-file-title">选择单个视频</h2>
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
        aria-labelledby="subtitle-settings-title"
      >
        <div className="panel-heading">
          <div>
            <p className="section-label">字幕参数</p>
            <h2 id="subtitle-settings-title">封装或烧录</h2>
          </div>
          <span className="mode-chip">
            {isVideo ? `${readyMedia?.media.subtitleStreams.length ?? 0} 路原字幕` : "等待视频"}
          </span>
        </div>

        <div className="trim-mode-grid" aria-label="字幕处理模式">
          {MODE_OPTIONS.map((option) => (
            <label
              className={
                mode === option.value
                  ? "trim-mode-option trim-mode-option-active"
                  : "trim-mode-option"
              }
              key={option.value}
            >
              {option.value === "embed" ? (
                <Captions size={18} aria-hidden="true" />
              ) : (
                <FileText size={18} aria-hidden="true" />
              )}
              <input
                type="radio"
                name="subtitle-mode"
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>

        <div className="output-row">
          <div className="output-icon" aria-hidden="true">
            <Captions size={18} />
          </div>
          <div>
            <span>外挂字幕</span>
            <p>{subtitlePath || "请选择 SRT 或 ASS 字幕文件"}</p>
            <small>{subtitleFilePreview(subtitlePath, inputFormat)}</small>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="选择字幕文件"
            disabled={!readyMedia}
            onClick={handleSelectSubtitleFile}
          >
            <FolderOpen size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>字幕格式</span>
            <select
              value={inputFormat}
              disabled={!readyMedia}
              onChange={(event) =>
                setInputFormat(event.target.value as SubtitleInputFormat)
              }
            >
              <option value="srt">SRT</option>
              <option value="ass">ASS</option>
            </select>
          </label>

          <label className="field">
            <span>输出格式</span>
            <select
              value={outputFormat}
              disabled={!readyMedia}
              onChange={(event) =>
                setOutputFormat(event.target.value as SubtitleOutputFormat)
              }
            >
              {OUTPUT_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>字幕编码</span>
            <select
              value={encoding}
              disabled={!readyMedia}
              onChange={(event) =>
                setEncoding(event.target.value as SubtitleEncoding)
              }
            >
              {ENCODING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            <p>{outputDirectory || "请选择字幕输出目录"}</p>
            <small>{outputPreview(generatedOutputPath, mode, outputFormat)}</small>
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
            <span>允许覆盖已有字幕输出文件</span>
          </label>
          {mode === "burn" ? (
            <div className="output-row advanced-output-row">
              <div className="output-icon" aria-hidden="true">
                <FolderOpen size={18} />
              </div>
              <div>
                <span>字体目录</span>
                <p>{fontsDir || "未指定字体目录"}</p>
                <small>ASS 字体依赖和缺失提示会保留在任务 stderr 日志中。</small>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="选择字体目录"
                disabled={!readyMedia}
                onClick={handleSelectFontsDirectory}
              >
                <FolderOpen size={17} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </details>

        <div className="parameter-summary">
          <span>参数摘要</span>
          <p>
            {parameterSummary(
              mediaState,
              subtitlePath,
              inputFormat,
              mode,
              outputFormat,
              outputDirectory,
            )}
          </p>
        </div>

        {currentError ? (
          <div className="job-runtime-message job-runtime-error">
            <strong>{currentError.message}</strong>
            <span>{currentError.detail ?? "字幕任务暂不可用。"}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          disabled={!canCreateSubtitleJob}
          onClick={handleStartSubtitleJob}
        >
          <Play size={17} aria-hidden="true" />
          {jobsRuntime.status === "error" ? "需要 Tauri 任务系统" : "创建字幕任务"}
        </button>
      </section>

      <section className="tool-panel" aria-labelledby="subtitle-note-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">兼容性</p>
            <h2 id="subtitle-note-title">字幕模式差异</h2>
          </div>
          <div className="panel-icon" aria-hidden="true">
            <Captions size={18} />
          </div>
        </div>
        <div className="parameter-summary">
          <span>处理方式</span>
          <p>
            封装字幕保留可开关字幕轨；烧录字幕会重编码视频并把字幕写进画面。MP4 封装会把字幕转为 mov_text，ASS 样式可能被简化。
          </p>
        </div>
      </section>
    </div>
  );
}

function buildValidationError(
  mediaState: MediaProbeState,
  subtitleFormatError?: AppErrorPayload,
): AppErrorPayload | undefined {
  if (mediaState.status === "error") {
    return mediaState.error;
  }

  if (subtitleFormatError) {
    return subtitleFormatError;
  }

  if (mediaState.status !== "ready") {
    return undefined;
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return {
      category: "unsupportedSubtitleMediaKind",
      message: "当前媒体不可添加字幕。",
      detail: "字幕封装和烧录只支持视频输入。",
    };
  }

  if (mediaState.media.videoStreams.length === 0) {
    return {
      category: "videoStreamMissing",
      message: "当前媒体没有可处理的视频流。",
      detail: "请选择包含视频流的媒体文件。",
    };
  }

  return undefined;
}

function subtitleInputFormatError(
  subtitlePath: string,
  inputFormat: SubtitleInputFormat,
): AppErrorPayload | undefined {
  if (!subtitlePath) {
    return undefined;
  }

  const actualFormat = inferSubtitleInputFormat(subtitlePath);
  if (!actualFormat) {
    return {
      category: "unsupportedSubtitleFormat",
      message: "字幕文件格式不支持。",
      detail: "当前只支持 SRT 和 ASS 字幕文件。",
    };
  }

  if (actualFormat !== inputFormat) {
    return {
      category: "subtitleFormatMismatch",
      message: "字幕格式与文件扩展名不一致。",
      detail: `当前文件是 .${actualFormat}，请选择对应的字幕格式。`,
    };
  }

  return undefined;
}

function inferSubtitleInputFormat(path: string): SubtitleInputFormat | undefined {
  const extension = fileExtension(path);
  if (extension === "srt" || extension === "ass") {
    return extension;
  }

  return undefined;
}

function parameterSummary(
  mediaState: MediaProbeState,
  subtitlePath: string,
  inputFormat: SubtitleInputFormat,
  mode: SubtitleMode,
  outputFormat: SubtitleOutputFormat,
  outputDirectory: string,
) {
  if (mediaState.status === "empty") {
    return "选择一个视频后可封装 SRT/ASS 字幕，或烧录字幕导出新视频。";
  }

  if (mediaState.status === "loading") {
    return "正在读取视频信息。";
  }

  if (mediaState.status === "error") {
    return "当前文件无法读取，不能创建字幕任务。";
  }

  if (mediaState.summary.mediaKind !== "视频") {
    return "当前输入不是视频；字幕功能只处理视频文件。";
  }

  if (!subtitlePath) {
    return "选择 SRT 或 ASS 字幕文件后继续配置输出。";
  }

  if (!outputDirectory.trim()) {
    return "选择输出目录后将自动生成字幕输出文件名。";
  }

  if (mode === "embed") {
    return inputFormat === "ass" && outputFormat === "mp4"
      ? "封装为 MP4 时字幕会转为 mov_text，ASS 样式可能被简化。"
      : `封装 ${inputFormat.toUpperCase()} 字幕到 ${outputFormat.toUpperCase()}，视频和音频流保持 copy。`;
  }

  return `烧录 ${inputFormat.toUpperCase()} 字幕到 ${outputFormat.toUpperCase()}，视频会重编码，音频按输出容器自动处理。`;
}

function subtitleFilePreview(
  subtitlePath: string,
  inputFormat: SubtitleInputFormat,
) {
  if (!subtitlePath) {
    return `支持 .${inputFormat} 字幕文件`;
  }

  return `文件：${fileNameFromPath(subtitlePath)}`;
}

function outputPreview(
  generatedOutputPath: string,
  mode: SubtitleMode,
  outputFormat: SubtitleOutputFormat,
) {
  if (!generatedOutputPath) {
    const suffix = mode === "embed" ? "subtitled" : "burned-subtitles";
    return `<原文件名>-${suffix}.${outputFormat}`;
  }

  return `文件：${fileNameFromPath(generatedOutputPath)}`;
}

function fileExtension(path: string) {
  const fileName = fileNameFromPath(path);
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
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

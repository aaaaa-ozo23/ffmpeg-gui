import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  FileOutput,
  FolderOpen,
  LoaderCircle,
  Play,
  Settings2,
  Trash2,
} from "lucide-react";
import type {
  AppErrorPayload,
  BatchMoveDirection,
  BatchMediaItem,
  BatchMediaState,
  ConvertJobDraft,
  ConvertAudioCodec,
  ConvertMediaKind,
  ConvertMode,
  ConvertOutputFormat,
  ConvertVideoCodec,
  JobsRuntimeState,
  MediaProbeState,
} from "../../app/types";
import { getOutputFormats, selectOutputDirectory } from "../../lib";

type ConvertPanelProps = {
  mediaState: MediaProbeState;
  batchMediaState: BatchMediaState;
  jobsRuntime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onRemoveBatchItem: (itemId: string) => void;
  onMoveBatchItem: (itemId: string, direction: BatchMoveDirection) => void;
  onEnqueueConvertJobs: (drafts: ConvertJobDraft[]) => Promise<void>;
};

type ReadyBatchMediaItem = Extract<BatchMediaItem, { status: "ready" }>;

const VIDEO_CODEC_OPTIONS: Array<{ value: ConvertVideoCodec; label: string }> = [
  { value: "copy", label: "copy" },
  { value: "h264", label: "H.264" },
  { value: "h265", label: "H.265" },
  { value: "vp9", label: "VP9" },
];

const AUDIO_CODEC_OPTIONS: Array<{ value: ConvertAudioCodec; label: string }> = [
  { value: "copy", label: "copy" },
  { value: "aac", label: "AAC" },
  { value: "mp3", label: "MP3" },
  { value: "flac", label: "FLAC" },
  { value: "opus", label: "Opus" },
  { value: "vorbis", label: "Vorbis" },
  { value: "pcmS16le", label: "PCM 16-bit" },
];

const MODE_OPTIONS: Array<{ value: ConvertMode; label: string }> = [
  { value: "auto", label: "自动编码" },
  { value: "copy", label: "快速 remux" },
  { value: "custom", label: "自定义编码" },
];

export function ConvertPanel({
  mediaState,
  batchMediaState,
  jobsRuntime,
  commandError,
  onSelectMedia,
  onRemoveBatchItem,
  onMoveBatchItem,
  onEnqueueConvertJobs,
}: ConvertPanelProps) {
  const [outputFormat, setOutputFormat] =
    useState<ConvertOutputFormat>("mp4");
  const [mode, setMode] = useState<ConvertMode>("auto");
  const [videoCodec, setVideoCodec] =
    useState<ConvertVideoCodec>("h264");
  const [audioCodec, setAudioCodec] =
    useState<ConvertAudioCodec>("aac");
  const [overwrite, setOverwrite] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState("");
  const [localError, setLocalError] = useState<AppErrorPayload | undefined>();

  const readyItems = useMemo<ReadyBatchMediaItem[]>(
    () => {
      const items: ReadyBatchMediaItem[] = [];
      for (const item of batchMediaState.items) {
        if (item.status === "ready") {
          items.push(item);
        }
      }
      return items;
    },
    [batchMediaState.items],
  );
  const failedCount = batchMediaState.items.filter(
    (item) => item.status === "error",
  ).length;
  const pendingReadyItems = useMemo(
    () => readyItems.filter((item) => !item.jobId),
    [readyItems],
  );
  const enqueuedReadyCount = readyItems.length - pendingReadyItems.length;
  const enqueueFailedCount = pendingReadyItems.filter(
    (item) => item.enqueueError,
  ).length;
  const batchMediaKind = useMemo(() => inferBatchMediaKind(readyItems), [readyItems]);
  const hasMixedReadyKinds = useMemo(
    () => new Set(readyItems.map((item) => item.mediaKind)).size > 1,
    [readyItems],
  );
  const outputFormats = useMemo(
    () => getOutputFormats(batchMediaKind),
    [batchMediaKind],
  );
  const isOutputFormatAllowed = outputFormats.some(
    (format) => format.value === outputFormat,
  );
  const outputPathsByItemId = useMemo(
    () => buildBatchOutputPaths(readyItems, outputDirectory, outputFormat),
    [outputDirectory, outputFormat, readyItems],
  );
  const outputPreview = useMemo(
    () =>
      buildBatchOutputPreview(
        readyItems,
        pendingReadyItems,
        outputPathsByItemId,
      ),
    [outputPathsByItemId, pendingReadyItems, readyItems],
  );
  const canConvert = Boolean(
    pendingReadyItems.length > 0 &&
      batchMediaKind &&
      !hasMixedReadyKinds &&
      isOutputFormatAllowed &&
      outputDirectory.trim() &&
      jobsRuntime.status === "ready",
  );
  const isProbing = batchMediaState.status === "loading" || mediaState.status === "loading";
  const batchError = buildBatchError(batchMediaState, readyItems, hasMixedReadyKinds);
  const currentError =
    localError ??
    batchError ??
    commandError ??
    (jobsRuntime.status === "error" ? jobsRuntime.error : undefined);

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

  const handleStartConvert = useCallback(async () => {
    if (!batchMediaKind || !canConvert) {
      return;
    }

    const drafts = pendingReadyItems.map((item): ConvertJobDraft => {
      const outputPath =
        outputPathsByItemId.get(item.id) ??
        joinPath(
          outputDirectory,
          `${fileBaseName(item.summary.fileName)}-converted.${outputFormat}`,
        );

      return {
        itemId: item.id,
        request: {
          inputPath: item.media.path,
          outputPath,
          mediaKind: batchMediaKind,
          outputFormat,
          mode,
          videoCodec,
          audioCodec,
          overwrite,
          durationSec: item.media.durationSec,
        },
      };
    });

    setLocalError(undefined);
    await onEnqueueConvertJobs(drafts);
  }, [
    audioCodec,
    batchMediaKind,
    canConvert,
    mode,
    onEnqueueConvertJobs,
    outputDirectory,
    outputFormat,
    outputPathsByItemId,
    overwrite,
    pendingReadyItems,
    videoCodec,
  ]);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="convert-file-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">输入文件</p>
            <h2 id="convert-file-title">批量选择媒体</h2>
          </div>
          <button
            className="secondary-action"
            type="button"
            disabled={isProbing}
            onClick={onSelectMedia}
          >
            <FolderOpen size={16} aria-hidden="true" />
            {isProbing ? "读取中" : "选择多个文件"}
          </button>
        </div>

        <BatchMediaSummary
          items={batchMediaState.items}
          readyCount={readyItems.length}
          pendingCount={pendingReadyItems.length}
          enqueuedCount={enqueuedReadyCount}
          failedCount={failedCount}
          enqueueFailedCount={enqueueFailedCount}
          mediaKind={batchMediaKind}
          hasMixedReadyKinds={hasMixedReadyKinds}
          lifecycle={batchMediaState.lifecycle}
          onRemoveItem={onRemoveBatchItem}
          onMoveItem={onMoveBatchItem}
        />
      </section>

      <section className="tool-panel" aria-labelledby="convert-settings-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">转换参数</p>
            <h2 id="convert-settings-title">输出配置</h2>
          </div>
          <span className="mode-chip">{mediaKindLabel(batchMediaKind)}</span>
        </div>

        <div className="form-grid">
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

          <label className="field">
            <span>处理模式</span>
            <select
              value={mode}
              disabled={!batchMediaKind || hasMixedReadyKinds}
              onChange={(event) => setMode(event.target.value as ConvertMode)}
            >
              {MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {batchMediaKind === "video" ? (
            <label className="field">
              <span>视频编码</span>
              <select
                value={videoCodec}
                disabled={mode !== "custom"}
                onChange={(event) =>
                  setVideoCodec(event.target.value as ConvertVideoCodec)
                }
              >
                {VIDEO_CODEC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {batchMediaKind === "video" || batchMediaKind === "audio" ? (
            <label className="field">
              <span>音频编码</span>
              <select
                value={audioCodec}
                disabled={mode !== "custom"}
                onChange={(event) =>
                  setAudioCodec(event.target.value as ConvertAudioCodec)
                }
              >
                {AUDIO_CODEC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="output-row">
          <div className="output-icon" aria-hidden="true">
            <FileOutput size={18} />
          </div>
          <div>
            <span>输出目录</span>
            <p>{outputDirectory || "请选择批量输出目录"}</p>
            <small>{outputPreview}</small>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="选择输出目录"
            disabled={readyItems.length === 0}
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
              readyItems,
              pendingReadyItems.length,
              enqueuedReadyCount,
              failedCount,
              enqueueFailedCount,
              batchMediaKind,
              batchMediaState.lifecycle,
              hasMixedReadyKinds,
              outputFormat,
              mode,
              outputDirectory,
            )}
          </p>
        </div>

        {batchMediaState.lifecycle === "complete" &&
        pendingReadyItems.length === 0 &&
        readyItems.length > 0 ? (
          <div className="job-runtime-message">
            <strong>当前批次已完成</strong>
            <span>已选择文件保留显示；再次选择文件会替换当前批次。</span>
          </div>
        ) : null}

        {currentError ? (
          <div className="job-runtime-message job-runtime-error">
            <strong>{currentError.message}</strong>
            <span>{currentError.detail ?? "转换任务暂不可用。"}</span>
          </div>
        ) : null}

        <button
          className="primary-action"
          type="button"
          disabled={!canConvert}
          onClick={handleStartConvert}
        >
          <Play size={17} aria-hidden="true" />
          {jobsRuntime.status === "error"
            ? "需要 Tauri 任务系统"
            : startButtonLabel(
                pendingReadyItems.length,
                enqueuedReadyCount,
                batchMediaState.lifecycle,
              )}
        </button>
      </section>
    </div>
  );
}

function BatchMediaSummary({
  items,
  readyCount,
  pendingCount,
  enqueuedCount,
  failedCount,
  enqueueFailedCount,
  mediaKind,
  hasMixedReadyKinds,
  lifecycle,
  onRemoveItem,
  onMoveItem,
}: {
  items: BatchMediaItem[];
  readyCount: number;
  pendingCount: number;
  enqueuedCount: number;
  failedCount: number;
  enqueueFailedCount: number;
  mediaKind: ConvertMediaKind | undefined;
  hasMixedReadyKinds: boolean;
  lifecycle: BatchMediaState["lifecycle"];
  onRemoveItem: (itemId: string) => void;
  onMoveItem: (itemId: string, direction: BatchMoveDirection) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="empty-panel">
        <FolderOpen size={22} aria-hidden="true" />
        <p>支持一次选择多个同类视频、音频或图片文件。</p>
      </div>
    );
  }

  return (
    <div className="batch-media-panel">
      <div className="batch-media-stats" aria-label="批量媒体统计">
        <span>总数 {items.length}</span>
        <span>可转换 {readyCount}</span>
        <span>待入队 {pendingCount}</span>
        <span>已入队 {enqueuedCount}</span>
        <span>失败 {failedCount}</span>
        {enqueueFailedCount > 0 ? <span>入队失败 {enqueueFailedCount}</span> : null}
        <span>{batchLifecycleLabel(lifecycle)}</span>
        <span>{hasMixedReadyKinds ? "类型混选" : mediaKindLabel(mediaKind)}</span>
      </div>
      <div className="batch-media-list">
        {items.map((item, index) => {
          const canMove =
            item.status !== "loading" &&
            items[index - 1]?.status !== "loading" &&
            items[index + 1]?.status !== "loading";
          const canMoveUp = canMove && index > 0;
          const canMoveDown = canMove && index < items.length - 1;
          const canRemove = item.status !== "loading";

          return (
            <article className="batch-media-item" key={item.id}>
              <BatchMediaIcon item={item} />
              <div>
                <strong>{fileNameFromPath(item.path)}</strong>
                <span>{batchMediaDetail(item)}</span>
              </div>
              <div className="batch-media-actions" aria-label="媒体文件操作">
                <button
                  className="batch-media-action"
                  type="button"
                  aria-label={`上移 ${fileNameFromPath(item.path)}`}
                  disabled={!canMoveUp}
                  onClick={() => onMoveItem(item.id, "up")}
                >
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                  className="batch-media-action"
                  type="button"
                  aria-label={`下移 ${fileNameFromPath(item.path)}`}
                  disabled={!canMoveDown}
                  onClick={() => onMoveItem(item.id, "down")}
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button
                  className="batch-media-action batch-media-action-danger"
                  type="button"
                  aria-label={`删除 ${fileNameFromPath(item.path)}`}
                  disabled={!canRemove}
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function BatchMediaIcon({ item }: { item: BatchMediaItem }) {
  if (item.status === "loading") {
    return <LoaderCircle size={16} aria-hidden="true" />;
  }

  if (item.status === "ready" && !item.enqueueError) {
    return <CheckCircle2 size={16} aria-hidden="true" />;
  }

  return <AlertTriangle size={16} aria-hidden="true" />;
}

function batchMediaDetail(item: BatchMediaItem) {
  if (item.status === "loading") {
    return "正在读取媒体信息";
  }

  if (item.status === "error") {
    return item.error.detail
      ? `${item.error.message}：${item.error.detail}`
      : item.error.message;
  }

  const statusText = item.jobId
    ? "已创建任务"
    : item.enqueueError
      ? `入队失败：${item.enqueueError.message}`
      : "待转换";
  const outputText = item.outputPath
    ? ` · 输出 ${fileNameFromPath(item.outputPath)}`
    : "";

  return `${item.summary.mediaKind} · ${item.summary.duration} · ${item.summary.container} · ${statusText}${outputText}`;
}

function inferBatchMediaKind(
  readyItems: ReadyBatchMediaItem[],
): ConvertMediaKind | undefined {
  const kinds = new Set(readyItems.map((item) => item.mediaKind));
  return kinds.size === 1 ? readyItems[0]?.mediaKind : undefined;
}

function buildBatchError(
  batchMediaState: BatchMediaState,
  readyItems: ReadyBatchMediaItem[],
  hasMixedReadyKinds: boolean,
): AppErrorPayload | undefined {
  if (hasMixedReadyKinds) {
    return {
      category: "mixedBatchMediaKinds",
      message: "请分批处理不同类型媒体。",
      detail: "当前批量转换只支持同一批次全部为视频、音频或图片。",
    };
  }

  if (batchMediaState.status === "error" && readyItems.length === 0) {
    return batchMediaState.error;
  }

  return undefined;
}

function mediaKindLabel(mediaKind: ConvertMediaKind | undefined) {
  if (mediaKind === "video") {
    return "视频输出";
  }

  if (mediaKind === "audio") {
    return "音频输出";
  }

  if (mediaKind === "image") {
    return "图片输出";
  }

  return "等待媒体";
}

function batchLifecycleLabel(lifecycle: BatchMediaState["lifecycle"]) {
  if (lifecycle === "running") {
    return "转换中";
  }

  if (lifecycle === "complete") {
    return "已完成";
  }

  return "收集中";
}

function parameterSummary(
  readyItems: ReadyBatchMediaItem[],
  pendingCount: number,
  enqueuedCount: number,
  failedCount: number,
  enqueueFailedCount: number,
  mediaKind: ConvertMediaKind | undefined,
  lifecycle: BatchMediaState["lifecycle"],
  hasMixedReadyKinds: boolean,
  outputFormat: ConvertOutputFormat,
  mode: ConvertMode,
  outputDirectory: string,
) {
  if (readyItems.length === 0) {
    return "选择媒体后可批量创建真实格式转换任务。";
  }

  if (hasMixedReadyKinds || !mediaKind) {
    return "当前选择包含不同媒体类型，请分批处理。";
  }

  if (lifecycle === "complete" && pendingCount === 0) {
    return "当前批次已完成，选择新文件将替换列表。";
  }

  if (pendingCount === 0 && enqueuedCount > 0) {
    return "当前批次任务已创建；转换运行中可继续选择文件追加到当前列表。";
  }

  const modeLabel = MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
  const output = outputDirectory || "未选择输出目录";
  const imageNote = mediaKind === "image" ? "；动图输入按首帧导出" : "";
  const failedNote = failedCount > 0 ? `；${failedCount} 个文件读取失败将不会入队` : "";
  const enqueueFailedNote =
    enqueueFailedCount > 0 ? `；${enqueueFailedCount} 个入队失败文件可重试` : "";
  const enqueuedNote = enqueuedCount > 0 ? `；${enqueuedCount} 个文件已入队` : "";

  return `${pendingCount} 个${mediaKindText(mediaKind)}文件待转换 -> ${outputFormat.toUpperCase()}；${modeLabel}${imageNote}${failedNote}${enqueueFailedNote}${enqueuedNote}；输出目录：${output}`;
}

function startButtonLabel(
  count: number,
  enqueuedCount: number,
  lifecycle: BatchMediaState["lifecycle"],
) {
  if (count === 0 && lifecycle === "complete") {
    return "当前批次已完成";
  }

  if (count === 0 && enqueuedCount > 0) {
    return "等待新增文件";
  }

  if (lifecycle === "running" && enqueuedCount > 0) {
    return `开始转换新增 (${count})`;
  }

  if (count <= 1) {
    return "开始转换";
  }

  return `开始批量转换 (${count})`;
}

function mediaKindText(mediaKind: ConvertMediaKind) {
  if (mediaKind === "video") {
    return "视频";
  }

  if (mediaKind === "audio") {
    return "音频";
  }

  return "图片";
}

function buildBatchOutputPreview(
  readyItems: ReadyBatchMediaItem[],
  pendingItems: ReadyBatchMediaItem[],
  outputPathsByItemId: Map<string, string>,
) {
  if (readyItems.length === 0) {
    return "命名规则：<原文件名>-converted.<格式>";
  }

  const previewItems = pendingItems.length > 0 ? pendingItems : readyItems;
  const outputPaths = previewItems
    .slice(0, 2)
    .map((item) => outputPathsByItemId.get(item.id) ?? "");

  if (pendingItems.length === 0) {
    return `已创建任务：${fileNameFromPath(outputPaths[0])}`;
  }

  if (pendingItems.length === 1) {
    return `示例：${fileNameFromPath(outputPaths[0])}`;
  }

  return `示例：${fileNameFromPath(outputPaths[0])}，${fileNameFromPath(outputPaths[1])}`;
}

function buildBatchOutputPaths(
  readyItems: ReadyBatchMediaItem[],
  outputDirectory: string,
  outputFormat: ConvertOutputFormat,
) {
  const pathsByItemId = new Map<string, string>();
  const usedOutputNames = new Set(
    readyItems
      .map((item) => item.outputPath)
      .filter((outputPath): outputPath is string => Boolean(outputPath))
      .map((outputPath) => fileNameFromPath(outputPath).toLowerCase()),
  );

  for (const item of readyItems) {
    if (item.outputPath) {
      pathsByItemId.set(item.id, item.outputPath);
      continue;
    }

    const baseName = fileBaseName(item.summary.fileName);
    let suffixIndex = 0;
    let outputName = "";

    do {
      const suffix = suffixIndex === 0 ? "" : `-${suffixIndex + 1}`;
      outputName = `${baseName}-converted${suffix}.${outputFormat}`;
      suffixIndex += 1;
    } while (usedOutputNames.has(outputName.toLowerCase()));

    usedOutputNames.add(outputName.toLowerCase());
    const generatedPath = joinPath(outputDirectory, outputName);
    pathsByItemId.set(item.id, item.outputPath ?? generatedPath);
  }

  return pathsByItemId;
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

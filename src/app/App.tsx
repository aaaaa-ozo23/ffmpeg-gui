import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Cpu,
  FolderOpen,
  LoaderCircle,
} from "lucide-react";
import { featureConfigs } from "./mockData";
import type {
  AppErrorPayload,
  BatchMoveDirection,
  BatchMediaItem,
  BatchMediaState,
  ConvertJobDraft,
  ConvertMediaKind,
  FeatureId,
  InspectorTab,
  JobQueueConfig,
  JobRecord,
  JobStatus,
  JobsRuntimeState,
  MediaProbeState,
  ScreenshotRequest,
  SidecarHealthState,
  TrimRequest,
} from "./types";
import { AppSidebar } from "../components/AppSidebar";
import { InspectorPanel } from "../components/InspectorPanel";
import { FeatureWorkspace } from "../features/FeatureWorkspace";
import {
  cancelJob,
  checkFfmpegHealth,
  clearFinishedJobs,
  enqueueConvertJob,
  enqueueScreenshotJob,
  enqueueTrimJob,
  getJobQueueConfig,
  listenToJobEvents,
  listJobs,
  probeMedia,
  selectMediaFile,
  selectMediaFiles,
  setJobQueueConfig,
  toMediaSummary,
} from "../lib";

function App() {
  const [activeFeatureId, setActiveFeatureId] =
    useState<FeatureId>("convert");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("tasks");
  const [sidecarHealth, setSidecarHealth] = useState<SidecarHealthState>({
    status: "loading",
  });
  const [mediaProbeState, setMediaProbeState] = useState<MediaProbeState>({
    status: "empty",
  });
  const [trimMediaProbeState, setTrimMediaProbeState] =
    useState<MediaProbeState>({
      status: "empty",
    });
  const [batchMediaState, setBatchMediaState] = useState<BatchMediaState>({
    status: "empty",
    lifecycle: "collecting",
    items: [],
  });
  const [screenshotMediaProbeState, setScreenshotMediaProbeState] =
    useState<MediaProbeState>({
      status: "empty",
    });
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [jobQueueConfig, setJobQueueConfigState] = useState<JobQueueConfig>({
    maxConcurrent: 1,
  });
  const [jobsRuntime, setJobsRuntime] = useState<JobsRuntimeState>({
    status: "loading",
  });
  const [jobCommandError, setJobCommandError] =
    useState<AppErrorPayload | undefined>();

  const activeFeature = useMemo(
    () =>
      featureConfigs.find((feature) => feature.id === activeFeatureId) ??
      featureConfigs[0],
    [activeFeatureId],
  );

  useEffect(() => {
    let canceled = false;

    checkFfmpegHealth()
      .then((health) => {
        if (!canceled) {
          setSidecarHealth({ status: "ready", health });
        }
      })
      .catch((error: unknown) => {
        if (!canceled) {
          setSidecarHealth({
            status: "error",
            error: error as AppErrorPayload,
          });
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    async function connectJobs() {
      try {
        const [initialJobs, initialConfig] = await Promise.all([
          listJobs(),
          getJobQueueConfig(),
        ]);
        if (disposed) {
          return;
        }

        setJobs(sortJobs(initialJobs));
        setJobQueueConfigState(initialConfig);
        setJobsRuntime({ status: "ready" });

        unlisten = await listenToJobEvents((event) => {
          setJobs((currentJobs) => upsertJob(currentJobs, event.job));
          setJobCommandError(undefined);
        });
      } catch (error) {
        if (!disposed) {
          setJobsRuntime({
            status: "error",
            error: error as AppErrorPayload,
          });
        }
      }
    }

    void connectJobs();

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    setBatchMediaState((currentState) =>
      syncBatchLifecycle(currentState, jobs),
    );
  }, [jobs]);

  const handleSelectMedia = useCallback(async () => {
    try {
      const selectedPaths = await selectMediaFiles();
      if (selectedPaths.length === 0) {
        return;
      }

      const shouldReplaceBatch = batchMediaState.lifecycle === "complete";
      const baseItems = shouldReplaceBatch
        ? []
        : batchMediaState.items.filter((item) => item.status !== "loading");
      const existingPathKeys = new Set(
        baseItems.map((item) => normalizePathKey(item.path)),
      );
      const selectedPathKeys = new Set<string>();
      const newPaths = selectedPaths.filter((path) => {
        const pathKey = normalizePathKey(path);
        if (existingPathKeys.has(pathKey) || selectedPathKeys.has(pathKey)) {
          return false;
        }

        selectedPathKeys.add(pathKey);
        return true;
      });

      if (newPaths.length === 0) {
        setJobCommandError(undefined);
        return;
      }

      const nextLifecycle = shouldReplaceBatch
        ? "collecting"
        : batchMediaState.lifecycle;
      const loadingItems = newPaths.map((path) => ({
        id: mediaItemId(path),
        path,
        status: "loading" as const,
      }));
      setBatchMediaState(
        batchStateFromItems([...baseItems, ...loadingItems], nextLifecycle),
      );
      setMediaProbeState({ status: "loading", path: newPaths[0] });
      setJobCommandError(undefined);

      const items = await Promise.all(
        newPaths.map(async (path): Promise<BatchMediaItem> => {
          try {
            const media = await probeMedia(path);
            const summary = toMediaSummary(media);
            const mediaKind = inferConvertMediaKind(summary.mediaKind);
            if (!mediaKind) {
              return {
                id: mediaItemId(path),
                path,
                status: "error",
                error: {
                  category: "unsupportedMediaKind",
                  message: "当前媒体类型不在批量转换范围内。",
                  detail: summary.mediaKind,
                },
              };
            }

            return {
              id: mediaItemId(path),
              path,
              status: "ready",
              media,
              summary,
              mediaKind,
            };
          } catch (error) {
            return {
              id: mediaItemId(path),
              path,
              status: "error",
              error: error as AppErrorPayload,
            };
          }
        }),
      );

      const fallbackItems = [...baseItems, ...items];
      setBatchMediaState((currentState) => {
        const probedItemsById = new Map(items.map((item) => [item.id, item]));
        const mergedItems = currentState.items.map((item) =>
          probedItemsById.get(item.id) ?? item,
        );
        const existingIds = new Set(mergedItems.map((item) => item.id));

        for (const item of items) {
          if (!existingIds.has(item.id)) {
            mergedItems.push(item);
          }
        }

        return batchStateFromItems(mergedItems, currentState.lifecycle);
      });
      setMediaProbeState(mediaProbeStateFromBatchItems(fallbackItems));
    } catch (error) {
      const payload = error as AppErrorPayload;
      setMediaProbeState({
        status: "error",
        error: payload,
      });
      setBatchMediaState({
        status: "error",
        lifecycle: "collecting",
        items: [],
        error: payload,
      });
    }
  }, [batchMediaState.items, batchMediaState.lifecycle]);

  const handleSelectTrimMedia = useCallback(async () => {
    try {
      const selectedPath = await selectMediaFile();
      if (!selectedPath) {
        return;
      }

      setTrimMediaProbeState({ status: "loading", path: selectedPath });
      setJobCommandError(undefined);

      const media = await probeMedia(selectedPath);
      const summary = toMediaSummary(media);
      setTrimMediaProbeState({
        status: "ready",
        media,
        summary,
      });
    } catch (error) {
      setTrimMediaProbeState({
        status: "error",
        error: error as AppErrorPayload,
      });
    }
  }, []);

  const handleSelectScreenshotMedia = useCallback(async () => {
    let selectedPath: string | null = null;

    try {
      selectedPath = await selectMediaFile();
      if (!selectedPath) {
        return;
      }

      setScreenshotMediaProbeState({
        status: "loading",
        path: selectedPath,
      });
      setJobCommandError(undefined);

      const media = await probeMedia(selectedPath);
      setScreenshotMediaProbeState({
        status: "ready",
        media,
        summary: toMediaSummary(media),
      });
    } catch (error) {
      setScreenshotMediaProbeState({
        status: "error",
        path: selectedPath ?? undefined,
        error: error as AppErrorPayload,
      });
    }
  }, []);

  const handleEnqueueConvertJobs = useCallback(async (drafts: ConvertJobDraft[]) => {
    const createdJobs: Array<{
      draft: ConvertJobDraft;
      job: JobRecord;
    }> = [];
    const failures: Array<{
      draft: ConvertJobDraft;
      error: AppErrorPayload;
    }> = [];

    if (drafts.length === 0) {
      return;
    }

    try {
      for (const draft of drafts) {
        try {
          const job = await enqueueConvertJob(draft.request);
          createdJobs.push({ draft, job });
        } catch (error) {
          failures.push({ draft, error: error as AppErrorPayload });
        }
      }

      if (createdJobs.length > 0) {
        setJobs((currentJobs) =>
          createdJobs
            .map((createdJob) => createdJob.job)
            .reduce(upsertJob, currentJobs),
        );
      }

      setBatchMediaState((currentState) => {
        const createdJobsByItemId = new Map(
          createdJobs.map((createdJob) => [
            createdJob.draft.itemId,
            createdJob,
          ]),
        );
        const failuresByItemId = new Map(
          failures.map((failure) => [failure.draft.itemId, failure]),
        );
        const items = currentState.items.map((item) => {
          if (item.status !== "ready") {
            return item;
          }

          const createdJob = createdJobsByItemId.get(item.id);
          if (createdJob) {
            return {
              ...item,
              jobId: createdJob.job.id,
              outputPath: createdJob.draft.request.outputPath,
              enqueueError: undefined,
            };
          }

          const failure = failuresByItemId.get(item.id);
          if (failure) {
            return {
              ...item,
              enqueueError: failure.error,
            };
          }

          return item;
        });

        return batchStateFromItems(
          items,
          createdJobs.length > 0 ? "running" : currentState.lifecycle,
        );
      });

      setJobCommandError(
        failures.length > 0
          ? {
              category: "batchEnqueuePartialFailure",
              message: `有 ${failures.length} 个转换任务创建失败。`,
              detail: failures
                .map((failure) => failure.error.message)
                .join("\n"),
            }
          : undefined,
      );
      setInspectorTab("tasks");
      if (createdJobs.length > 0) {
        setActiveFeatureId("jobs");
      }
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, []);

  const handleEnqueueTrimJob = useCallback(async (request: TrimRequest) => {
    try {
      const job = await enqueueTrimJob(request);
      setJobs((currentJobs) => upsertJob(currentJobs, job));
      setJobCommandError(undefined);
      setInspectorTab("tasks");
      setActiveFeatureId("jobs");
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, []);

  const handleEnqueueScreenshotJob = useCallback(
    async (request: ScreenshotRequest) => {
      try {
        const job = await enqueueScreenshotJob(request);
        setJobs((currentJobs) => upsertJob(currentJobs, job));
        setJobCommandError(undefined);
        setInspectorTab("tasks");
        setActiveFeatureId("jobs");
      } catch (error) {
        setJobCommandError(error as AppErrorPayload);
      }
    },
    [],
  );

  const handleRemoveBatchItem = useCallback(
    async (itemId: string) => {
      const item = batchMediaState.items.find(
        (currentItem) => currentItem.id === itemId,
      );
      if (!item || item.status === "loading") {
        return;
      }

      if (item.status === "ready" && item.jobId) {
        const job = jobs.find((currentJob) => currentJob.id === item.jobId);
        if (!job || !isTerminalJobStatus(job.status)) {
          try {
            const canceledJob = await cancelJob(item.jobId);
            setJobs((currentJobs) => upsertJob(currentJobs, canceledJob));
          } catch (error) {
            const payload = error as AppErrorPayload;
            if (payload.category !== "jobAlreadyFinished") {
              setJobCommandError(payload);
              return;
            }
          }
        }
      }

      const nextItems = batchMediaState.items.filter(
        (currentItem) => currentItem.id !== itemId,
      );
      setBatchMediaState((currentState) =>
        syncBatchLifecycle(
          batchStateFromItems(
            currentState.items.filter(
              (currentItem) => currentItem.id !== itemId,
            ),
            currentState.lifecycle,
          ),
          jobs,
        ),
      );
      setMediaProbeState(mediaProbeStateFromBatchItems(nextItems));
      setJobCommandError(undefined);
    },
    [batchMediaState.items, jobs],
  );

  const handleMoveBatchItem = useCallback(
    (itemId: string, direction: BatchMoveDirection) => {
      const nextItems = moveBatchItem(
        batchMediaState.items,
        itemId,
        direction,
      );
      if (nextItems === batchMediaState.items) {
        return;
      }

      setBatchMediaState((currentState) =>
        batchStateFromItems(
          moveBatchItem(currentState.items, itemId, direction),
          currentState.lifecycle,
        ),
      );
      setMediaProbeState(mediaProbeStateFromBatchItems(nextItems));
      setJobCommandError(undefined);
    },
    [batchMediaState.items],
  );

  const handleCancelJob = useCallback(async (jobId: string) => {
    try {
      const job = await cancelJob(jobId);
      setJobs((currentJobs) => upsertJob(currentJobs, job));
      setJobCommandError(undefined);
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, []);

  const handleClearFinishedJobs = useCallback(async () => {
    try {
      const remainingJobs = await clearFinishedJobs();
      setJobs(sortJobs(remainingJobs));
      setJobCommandError(undefined);
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, []);

  const handleMaxConcurrentChange = useCallback(async (value: number) => {
    try {
      const config = await setJobQueueConfig(value);
      setJobQueueConfigState(config);
      setJobCommandError(undefined);
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, []);

  const handleCopyJobLog = useCallback((job: JobRecord) => {
    void navigator.clipboard?.writeText(formatJobLog(job));
  }, []);

  const handleCopyAllJobLogs = useCallback(() => {
    void navigator.clipboard?.writeText(jobs.map(formatJobLog).join("\n\n"));
  }, [jobs]);

  const sidecarStatusTitle = useMemo(() => {
    if (sidecarHealth.status === "ready") {
      return [
        `target: ${sidecarHealth.health.targetTriple}`,
        sidecarHealth.health.ffmpeg.versionLine,
        sidecarHealth.health.ffprobe.versionLine,
      ].join("\n");
    }

    if (sidecarHealth.status === "error") {
      return [sidecarHealth.error.message, sidecarHealth.error.detail]
        .filter(Boolean)
        .join("\n");
    }

    return "正在检查项目内 FFmpeg/FFprobe sidecar";
  }, [sidecarHealth]);

  const isHeaderMediaLoading =
    activeFeatureId === "trim"
      ? trimMediaProbeState.status === "loading"
      : activeFeatureId === "screenshot"
        ? screenshotMediaProbeState.status === "loading"
      : mediaProbeState.status === "loading";
  const handleHeaderSelectMedia =
    activeFeatureId === "trim"
      ? handleSelectTrimMedia
      : activeFeatureId === "screenshot"
        ? handleSelectScreenshotMedia
        : handleSelectMedia;

  return (
    <main className="app-window">
      <AppSidebar
        activeFeatureId={activeFeatureId}
        features={featureConfigs}
        onFeatureChange={setActiveFeatureId}
      />

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="section-label">当前功能</p>
            <h1 id="workspace-title">{activeFeature.label}</h1>
            <p className="workspace-summary">{activeFeature.description}</p>
          </div>

          <div className="header-actions" aria-label="工作区状态">
            <button
              className="icon-button"
              type="button"
              aria-label="打开文件"
              onClick={handleHeaderSelectMedia}
              disabled={isHeaderMediaLoading}
            >
              <FolderOpen size={18} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="任务清单"
              onClick={() => setActiveFeatureId("jobs")}
            >
              <ClipboardList size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="workspace-status" aria-label="开发状态">
          <div className="status-metric">
            <Activity size={16} aria-hidden="true" />
            <span>结构化参数 UI</span>
          </div>

          {sidecarHealth.status === "ready" ? (
            <>
              <div
                className="status-metric status-metric-ready"
                title={sidecarStatusTitle}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{sidecarHealth.health.ffmpeg.versionLine}</span>
              </div>
              <div
                className="status-metric status-metric-ready"
                title={sidecarStatusTitle}
              >
                <Cpu size={16} aria-hidden="true" />
                <span>{sidecarHealth.health.ffprobe.versionLine}</span>
              </div>
            </>
          ) : (
            <div
              className={`status-metric status-metric-${sidecarHealth.status}`}
              title={sidecarStatusTitle}
            >
              {sidecarHealth.status === "loading" ? (
                <LoaderCircle size={16} aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} aria-hidden="true" />
              )}
              <span>
                {sidecarHealth.status === "loading"
                  ? "正在检查 FFmpeg sidecar"
                  : `${sidecarHealth.error.message}：pnpm.cmd run sidecar:prepare`}
              </span>
            </div>
          )}
        </div>

        <FeatureWorkspace
          activeFeature={activeFeature}
          mediaState={mediaProbeState}
          trimMediaState={trimMediaProbeState}
          batchMediaState={batchMediaState}
          screenshotMediaState={screenshotMediaProbeState}
          jobs={jobs}
          jobQueueConfig={jobQueueConfig}
          jobsRuntime={jobsRuntime}
          jobCommandError={jobCommandError}
          onSelectMedia={handleSelectMedia}
          onSelectTrimMedia={handleSelectTrimMedia}
          onSelectScreenshotMedia={handleSelectScreenshotMedia}
          onRemoveBatchItem={handleRemoveBatchItem}
          onMoveBatchItem={handleMoveBatchItem}
          onEnqueueConvertJobs={handleEnqueueConvertJobs}
          onEnqueueTrimJob={handleEnqueueTrimJob}
          onEnqueueScreenshotJob={handleEnqueueScreenshotJob}
          onCancelJob={handleCancelJob}
          onClearFinishedJobs={handleClearFinishedJobs}
          onMaxConcurrentChange={handleMaxConcurrentChange}
          onCopyJobLog={handleCopyJobLog}
          onCopyAllJobLogs={handleCopyAllJobLogs}
        />
      </section>

      <InspectorPanel
        activeTab={inspectorTab}
        jobs={jobs}
        queueConfig={jobQueueConfig}
        runtime={jobsRuntime}
        commandError={jobCommandError}
        onTabChange={setInspectorTab}
        onCancelJob={handleCancelJob}
        onClearFinished={handleClearFinishedJobs}
        onMaxConcurrentChange={handleMaxConcurrentChange}
        onCopyJobLog={handleCopyJobLog}
        onCopyAllLogs={handleCopyAllJobLogs}
      />
    </main>
  );
}

export default App;

function mediaItemId(path: string) {
  return normalizePathKey(path);
}

function normalizePathKey(path: string) {
  return path.replace(/\\/g, "/").toLowerCase();
}

function inferConvertMediaKind(mediaKind: string): ConvertMediaKind | undefined {
  if (mediaKind === "视频") {
    return "video";
  }

  if (mediaKind === "音频") {
    return "audio";
  }

  if (mediaKind === "图片") {
    return "image";
  }

  return undefined;
}

function batchStateFromItems(
  items: BatchMediaItem[],
  lifecycle: BatchMediaState["lifecycle"] = "collecting",
): BatchMediaState {
  if (items.length === 0) {
    return { status: "empty", lifecycle: "collecting", items: [] };
  }

  const hasLoading = items.some((item) => item.status === "loading");
  const hasReady = items.some((item) => item.status === "ready");
  const hasError = items.some((item) => item.status === "error");

  if (hasLoading) {
    return { status: "loading", lifecycle, items };
  }

  if (hasReady) {
    return { status: "ready", lifecycle, items };
  }

  if (hasError) {
    return {
      status: "error",
      lifecycle,
      items,
      error: {
        category: "batchProbeFailed",
        message: "所选文件均未能读取媒体信息。",
      },
    };
  }

  return { status: "empty", lifecycle: "collecting", items: [] };
}

function syncBatchLifecycle(
  batchMediaState: BatchMediaState,
  jobs: JobRecord[],
): BatchMediaState {
  const jobIds = batchMediaState.items.flatMap((item) =>
    item.status === "ready" && item.jobId ? [item.jobId] : [],
  );

  if (jobIds.length === 0) {
    if (batchMediaState.lifecycle === "collecting") {
      return batchMediaState;
    }

    return { ...batchMediaState, lifecycle: "collecting" };
  }

  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const allJobsTerminal = jobIds.every((jobId) => {
    const job = jobsById.get(jobId);
    return !job || isTerminalJobStatus(job.status);
  });
  const nextLifecycle = allJobsTerminal ? "complete" : "running";

  return batchMediaState.lifecycle === nextLifecycle
    ? batchMediaState
    : { ...batchMediaState, lifecycle: nextLifecycle };
}

function isTerminalJobStatus(status: JobStatus) {
  return status === "success" || status === "failed" || status === "canceled";
}

function moveBatchItem(
  items: BatchMediaItem[],
  itemId: string,
  direction: BatchMoveDirection,
) {
  const itemIndex = items.findIndex((item) => item.id === itemId);
  if (itemIndex === -1 || items[itemIndex].status === "loading") {
    return items;
  }

  const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
  if (
    targetIndex < 0 ||
    targetIndex >= items.length ||
    items[targetIndex].status === "loading"
  ) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[itemIndex], nextItems[targetIndex]] = [
    nextItems[targetIndex],
    nextItems[itemIndex],
  ];
  return nextItems;
}

function mediaProbeStateFromBatchItems(items: BatchMediaItem[]): MediaProbeState {
  const firstReady = items.find((item) => item.status === "ready");
  if (firstReady?.status === "ready") {
    return {
      status: "ready",
      media: firstReady.media,
      summary: firstReady.summary,
    };
  }

  const firstError = items.find((item) => item.status === "error");
  if (firstError?.status === "error") {
    return {
      status: "error",
      path: firstError.path,
      error: firstError.error,
    };
  }

  return { status: "empty" };
}

function upsertJob(jobs: JobRecord[], job: JobRecord) {
  const existingIndex = jobs.findIndex((currentJob) => currentJob.id === job.id);
  if (existingIndex === -1) {
    return sortJobs([...jobs, job]);
  }

  const nextJobs = [...jobs];
  nextJobs[existingIndex] = job;
  return sortJobs(nextJobs);
}

function sortJobs(jobs: JobRecord[]) {
  return [...jobs].sort((left, right) => left.createdAt - right.createdAt);
}

function formatJobLog(job: JobRecord) {
  return [
    `jobId=${job.id}`,
    `title=${job.title}`,
    `status=${job.status}`,
    `inputPath=${job.inputPath}`,
    `outputPath=${job.outputPath ?? ""}`,
    `exitCode=${job.exitCode ?? ""}`,
    `errorCategory=${job.errorCategory ?? ""}`,
    `errorMessage=${job.errorMessage ?? ""}`,
    `args=${job.args.join(" ")}`,
    "stdout:",
    ...job.stdout,
    job.stdoutTruncated ? "[stdout truncated]" : "",
    "stderr:",
    ...job.stderr,
    job.stderrTruncated ? "[stderr truncated]" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

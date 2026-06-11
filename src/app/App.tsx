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
  FeatureId,
  InspectorTab,
  JobQueueConfig,
  JobRecord,
  JobsRuntimeState,
  MediaProbeState,
  SidecarHealthState,
} from "./types";
import { AppSidebar } from "../components/AppSidebar";
import { InspectorPanel } from "../components/InspectorPanel";
import { FeatureWorkspace } from "../features/FeatureWorkspace";
import {
  cancelJob,
  checkFfmpegHealth,
  clearFinishedJobs,
  enqueueNullJob,
  getJobQueueConfig,
  listenToJobEvents,
  listJobs,
  probeMedia,
  selectMediaFile,
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

  const handleSelectMedia = useCallback(async () => {
    let selectedPath: string | null = null;

    try {
      selectedPath = await selectMediaFile();
      if (!selectedPath) {
        return;
      }

      setMediaProbeState({ status: "loading", path: selectedPath });

      const media = await probeMedia(selectedPath);
      setMediaProbeState({
        status: "ready",
        media,
        summary: toMediaSummary(media),
      });
    } catch (error) {
      setMediaProbeState({
        status: "error",
        path: selectedPath ?? undefined,
        error: error as AppErrorPayload,
      });
    }
  }, []);

  const handleEnqueueNullJob = useCallback(async () => {
    if (mediaProbeState.status !== "ready") {
      return;
    }

    try {
      const job = await enqueueNullJob(
        mediaProbeState.media.path,
        mediaProbeState.media.durationSec,
      );
      setJobs((currentJobs) => upsertJob(currentJobs, job));
      setJobCommandError(undefined);
      setInspectorTab("tasks");
      setActiveFeatureId("jobs");
    } catch (error) {
      setJobCommandError(error as AppErrorPayload);
    }
  }, [mediaProbeState]);

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
              onClick={handleSelectMedia}
              disabled={mediaProbeState.status === "loading"}
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
          jobs={jobs}
          jobQueueConfig={jobQueueConfig}
          jobsRuntime={jobsRuntime}
          jobCommandError={jobCommandError}
          onSelectMedia={handleSelectMedia}
          onEnqueueNullJob={handleEnqueueNullJob}
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

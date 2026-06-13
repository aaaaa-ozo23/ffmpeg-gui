import type {
  AppErrorPayload,
  BatchMoveDirection,
  BatchMediaState,
  ConvertJobDraft,
  FeatureConfig,
  JobQueueConfig,
  JobRecord,
  JobsRuntimeState,
  MediaProbeState,
  ScreenshotRequest,
} from "../app/types";
import { ConvertPanel } from "./convert/ConvertPanel";
import { FeaturePlaceholder } from "./FeaturePlaceholder";
import { JobsPanel } from "./jobs/JobsPanel";
import { ScreenshotPanel } from "./screenshot/ScreenshotPanel";

type FeatureWorkspaceProps = {
  activeFeature: FeatureConfig;
  mediaState: MediaProbeState;
  batchMediaState: BatchMediaState;
  screenshotMediaState: MediaProbeState;
  jobs: JobRecord[];
  jobQueueConfig: JobQueueConfig;
  jobsRuntime: JobsRuntimeState;
  jobCommandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onSelectScreenshotMedia: () => void;
  onRemoveBatchItem: (itemId: string) => void;
  onMoveBatchItem: (itemId: string, direction: BatchMoveDirection) => void;
  onEnqueueConvertJobs: (drafts: ConvertJobDraft[]) => Promise<void>;
  onEnqueueScreenshotJob: (request: ScreenshotRequest) => Promise<void>;
  onCancelJob: (jobId: string) => void;
  onClearFinishedJobs: () => void;
  onMaxConcurrentChange: (value: number) => void;
  onCopyJobLog: (job: JobRecord) => void;
  onCopyAllJobLogs: () => void;
};

export function FeatureWorkspace({
  activeFeature,
  mediaState,
  batchMediaState,
  screenshotMediaState,
  jobs,
  jobQueueConfig,
  jobsRuntime,
  jobCommandError,
  onSelectMedia,
  onSelectScreenshotMedia,
  onRemoveBatchItem,
  onMoveBatchItem,
  onEnqueueConvertJobs,
  onEnqueueScreenshotJob,
  onCancelJob,
  onClearFinishedJobs,
  onMaxConcurrentChange,
  onCopyJobLog,
  onCopyAllJobLogs,
}: FeatureWorkspaceProps) {
  if (activeFeature.id === "convert") {
    return (
      <ConvertPanel
        mediaState={mediaState}
        batchMediaState={batchMediaState}
        jobsRuntime={jobsRuntime}
        commandError={jobCommandError}
        onSelectMedia={onSelectMedia}
        onRemoveBatchItem={onRemoveBatchItem}
        onMoveBatchItem={onMoveBatchItem}
        onEnqueueConvertJobs={onEnqueueConvertJobs}
      />
    );
  }

  if (activeFeature.id === "jobs") {
    return (
      <JobsPanel
        jobs={jobs}
        queueConfig={jobQueueConfig}
        runtime={jobsRuntime}
        commandError={jobCommandError}
        onCancelJob={onCancelJob}
        onClearFinished={onClearFinishedJobs}
        onMaxConcurrentChange={onMaxConcurrentChange}
        onCopyJobLog={onCopyJobLog}
        onCopyAllLogs={onCopyAllJobLogs}
      />
    );
  }

  if (activeFeature.id === "screenshot") {
    return (
      <ScreenshotPanel
        mediaState={screenshotMediaState}
        jobsRuntime={jobsRuntime}
        commandError={jobCommandError}
        onSelectMedia={onSelectScreenshotMedia}
        onEnqueueScreenshotJob={onEnqueueScreenshotJob}
      />
    );
  }

  return <FeaturePlaceholder feature={activeFeature} mediaState={mediaState} />;
}

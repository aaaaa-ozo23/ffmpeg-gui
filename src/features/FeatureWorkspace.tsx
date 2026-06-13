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
  TrimRequest,
} from "../app/types";
import { ConvertPanel } from "./convert/ConvertPanel";
import { FeaturePlaceholder } from "./FeaturePlaceholder";
import { JobsPanel } from "./jobs/JobsPanel";
import { TrimPanel } from "./trim/TrimPanel";

type FeatureWorkspaceProps = {
  activeFeature: FeatureConfig;
  mediaState: MediaProbeState;
  trimMediaState: MediaProbeState;
  batchMediaState: BatchMediaState;
  jobs: JobRecord[];
  jobQueueConfig: JobQueueConfig;
  jobsRuntime: JobsRuntimeState;
  jobCommandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onSelectTrimMedia: () => void;
  onRemoveBatchItem: (itemId: string) => void;
  onMoveBatchItem: (itemId: string, direction: BatchMoveDirection) => void;
  onEnqueueConvertJobs: (drafts: ConvertJobDraft[]) => Promise<void>;
  onEnqueueTrimJob: (request: TrimRequest) => Promise<void>;
  onCancelJob: (jobId: string) => void;
  onClearFinishedJobs: () => void;
  onMaxConcurrentChange: (value: number) => void;
  onCopyJobLog: (job: JobRecord) => void;
  onCopyAllJobLogs: () => void;
};

export function FeatureWorkspace({
  activeFeature,
  mediaState,
  trimMediaState,
  batchMediaState,
  jobs,
  jobQueueConfig,
  jobsRuntime,
  jobCommandError,
  onSelectMedia,
  onSelectTrimMedia,
  onRemoveBatchItem,
  onMoveBatchItem,
  onEnqueueConvertJobs,
  onEnqueueTrimJob,
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

  if (activeFeature.id === "trim") {
    return (
      <TrimPanel
        mediaState={trimMediaState}
        jobsRuntime={jobsRuntime}
        commandError={jobCommandError}
        onSelectMedia={onSelectTrimMedia}
        onEnqueueTrimJob={onEnqueueTrimJob}
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

  return <FeaturePlaceholder feature={activeFeature} mediaState={mediaState} />;
}

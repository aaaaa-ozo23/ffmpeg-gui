import type {
  AppErrorPayload,
  AudioExtractRequest,
  BatchMoveDirection,
  BatchMediaState,
  ConvertJobDraft,
  FeatureConfig,
  JobQueueConfig,
  JobRecord,
  JobsRuntimeState,
  MediaProbeState,
  ScreenshotRequest,
  SubtitleRequest,
  TrimRequest,
} from "../app/types";
import { AudioExtractPanel } from "./audio/AudioExtractPanel";
import { ConvertPanel } from "./convert/ConvertPanel";
import { FeaturePlaceholder } from "./FeaturePlaceholder";
import { JobsPanel } from "./jobs/JobsPanel";
import { ScreenshotPanel } from "./screenshot/ScreenshotPanel";
import { SubtitlePanel } from "./subtitle/SubtitlePanel";
import { TrimPanel } from "./trim/TrimPanel";

type FeatureWorkspaceProps = {
  activeFeature: FeatureConfig;
  mediaState: MediaProbeState;
  trimMediaState: MediaProbeState;
  batchMediaState: BatchMediaState;
  screenshotMediaState: MediaProbeState;
  audioMediaState: MediaProbeState;
  subtitleMediaState: MediaProbeState;
  jobs: JobRecord[];
  jobQueueConfig: JobQueueConfig;
  jobsRuntime: JobsRuntimeState;
  jobCommandError?: AppErrorPayload;
  onSelectMedia: () => void;
  onSelectTrimMedia: () => void;
  onSelectScreenshotMedia: () => void;
  onSelectAudioMedia: () => void;
  onSelectSubtitleMedia: () => void;
  onRemoveBatchItem: (itemId: string) => void;
  onMoveBatchItem: (itemId: string, direction: BatchMoveDirection) => void;
  onEnqueueConvertJobs: (drafts: ConvertJobDraft[]) => Promise<void>;
  onEnqueueTrimJob: (request: TrimRequest) => Promise<void>;
  onEnqueueScreenshotJob: (request: ScreenshotRequest) => Promise<void>;
  onEnqueueAudioExtractJob: (request: AudioExtractRequest) => Promise<void>;
  onEnqueueSubtitleJob: (request: SubtitleRequest) => Promise<void>;
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
  screenshotMediaState,
  audioMediaState,
  subtitleMediaState,
  jobs,
  jobQueueConfig,
  jobsRuntime,
  jobCommandError,
  onSelectMedia,
  onSelectTrimMedia,
  onSelectScreenshotMedia,
  onSelectAudioMedia,
  onSelectSubtitleMedia,
  onRemoveBatchItem,
  onMoveBatchItem,
  onEnqueueConvertJobs,
  onEnqueueTrimJob,
  onEnqueueScreenshotJob,
  onEnqueueAudioExtractJob,
  onEnqueueSubtitleJob,
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

  if (activeFeature.id === "audio") {
    return (
      <AudioExtractPanel
        mediaState={audioMediaState}
        jobsRuntime={jobsRuntime}
        commandError={jobCommandError}
        onSelectMedia={onSelectAudioMedia}
        onEnqueueAudioExtractJob={onEnqueueAudioExtractJob}
      />
    );
  }

  if (activeFeature.id === "subtitle") {
    return (
      <SubtitlePanel
        mediaState={subtitleMediaState}
        jobsRuntime={jobsRuntime}
        commandError={jobCommandError}
        onSelectMedia={onSelectSubtitleMedia}
        onEnqueueSubtitleJob={onEnqueueSubtitleJob}
      />
    );
  }

  return <FeaturePlaceholder feature={activeFeature} mediaState={mediaState} />;
}

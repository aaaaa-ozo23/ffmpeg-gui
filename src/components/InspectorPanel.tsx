import { Copy, FileText, ListChecks, Trash2 } from "lucide-react";
import type {
  AppErrorPayload,
  InspectorTab,
  JobQueueConfig,
  JobRecord,
  JobsRuntimeState,
} from "../app/types";
import { StatusPill } from "./StatusPill";
import { TaskRow } from "./TaskRow";

type InspectorPanelProps = {
  activeTab: InspectorTab;
  jobs: JobRecord[];
  queueConfig: JobQueueConfig;
  runtime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onTabChange: (tab: InspectorTab) => void;
  onCancelJob: (jobId: string) => void;
  onClearFinished: () => void;
  onMaxConcurrentChange: (value: number) => void;
  onCopyJobLog: (job: JobRecord) => void;
  onCopyAllLogs: () => void;
};

export function InspectorPanel({
  activeTab,
  jobs,
  queueConfig,
  runtime,
  commandError,
  onTabChange,
  onCancelJob,
  onClearFinished,
  onMaxConcurrentChange,
  onCopyJobLog,
  onCopyAllLogs,
}: InspectorPanelProps) {
  const runningCount = jobs.filter((job) =>
    job.status === "running" || job.status === "canceling"
  ).length;
  const queuedCount = jobs.filter((job) => job.status === "queued").length;
  const finishedCount = jobs.filter((job) =>
    ["success", "failed", "canceled"].includes(job.status)
  ).length;
  const status = getQueueStatus(runningCount, queuedCount);
  const statusLabel =
    runningCount > 0
      ? `${runningCount} 个运行中`
      : queuedCount > 0
        ? `${queuedCount} 个排队`
        : "空闲";

  return (
    <aside className="inspector" aria-label="任务和日志">
      <div className="inspector-header">
        <div>
          <p className="section-label">队列</p>
          <h2>任务状态</h2>
        </div>
        <StatusPill status={status} label={statusLabel} />
      </div>

      <div className="queue-controls">
        <label className="field compact-field">
          <span>并发</span>
          <select
            value={queueConfig.maxConcurrent}
            disabled={runtime.status !== "ready"}
            onChange={(event) => onMaxConcurrentChange(Number(event.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        <button
          className="secondary-action compact-action"
          type="button"
          disabled={finishedCount === 0}
          onClick={onClearFinished}
        >
          <Trash2 size={14} aria-hidden="true" />
          清理
        </button>
      </div>

      <div className="tab-list" role="tablist" aria-label="任务与日志切换">
        <button
          className={activeTab === "tasks" ? "tab tab-active" : "tab"}
          type="button"
          role="tab"
          aria-selected={activeTab === "tasks"}
          onClick={() => onTabChange("tasks")}
        >
          <ListChecks size={16} aria-hidden="true" />
          任务
        </button>
        <button
          className={activeTab === "logs" ? "tab tab-active" : "tab"}
          type="button"
          role="tab"
          aria-selected={activeTab === "logs"}
          onClick={() => onTabChange("logs")}
        >
          <FileText size={16} aria-hidden="true" />
          日志
        </button>
      </div>

      <JobRuntimeMessage runtime={runtime} commandError={commandError} />

      {activeTab === "tasks" ? (
        <div className="task-list" role="tabpanel">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <TaskRow
                key={job.id}
                task={job}
                onCancel={onCancelJob}
                onCopyLog={onCopyJobLog}
              />
            ))
          ) : (
            <p className="empty-state">暂无任务。导入媒体后可创建媒体处理任务。</p>
          )}
        </div>
      ) : (
        <div className="log-list" role="tabpanel">
          <button
            className="secondary-action compact-action"
            type="button"
            disabled={jobs.length === 0}
            onClick={onCopyAllLogs}
          >
            <Copy size={15} aria-hidden="true" />
            复制全部日志
          </button>
          {jobsWithLogs(jobs).map((job) => (
            <article className="log-entry" key={job.id}>
              <span>{job.title}</span>
              <p>{formatLogPreview(job)}</p>
            </article>
          ))}
          {jobsWithLogs(jobs).length === 0 ? (
            <p className="empty-state">暂无 stdout/stderr 输出。</p>
          ) : null}
        </div>
      )}
    </aside>
  );
}

function JobRuntimeMessage({
  runtime,
  commandError,
}: {
  runtime: JobsRuntimeState;
  commandError?: AppErrorPayload;
}) {
  const error = commandError ?? (runtime.status === "error" ? runtime.error : undefined);
  if (!error && runtime.status !== "loading") {
    return null;
  }

  return (
    <div className={error ? "job-runtime-message job-runtime-error" : "job-runtime-message"}>
      {error ? (
        <>
          <strong>{error.message}</strong>
          <span>{error.detail ?? "请确认正在 Tauri 桌面运行时中使用。"}</span>
        </>
      ) : (
        <span>正在连接任务系统...</span>
      )}
    </div>
  );
}

function getQueueStatus(runningCount: number, queuedCount: number) {
  if (runningCount > 0) {
    return "running";
  }

  if (queuedCount > 0) {
    return "queued";
  }

  return "success";
}

function jobsWithLogs(jobs: JobRecord[]) {
  return jobs.filter(
    (job) => job.stdout.length > 0 || job.stderr.length > 0 || job.errorMessage,
  );
}

function formatLogPreview(job: JobRecord) {
  const lines = [
    ...job.stdout.map((line) => `stdout: ${line}`),
    ...job.stderr.map((line) => `stderr: ${line}`),
    job.errorMessage ? `error: ${job.errorMessage}` : "",
  ].filter(Boolean);

  return lines.slice(-4).join("\n");
}

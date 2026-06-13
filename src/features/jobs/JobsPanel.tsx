import { Copy, ListChecks, Settings2, Trash2 } from "lucide-react";
import type { AppErrorPayload, JobQueueConfig, JobRecord, JobsRuntimeState } from "../../app/types";
import { TaskRow } from "../../components/TaskRow";

type JobsPanelProps = {
  jobs: JobRecord[];
  queueConfig: JobQueueConfig;
  runtime: JobsRuntimeState;
  commandError?: AppErrorPayload;
  onCancelJob: (jobId: string) => void;
  onClearFinished: () => void;
  onMaxConcurrentChange: (value: number) => void;
  onCopyJobLog: (job: JobRecord) => void;
  onCopyAllLogs: () => void;
};

export function JobsPanel({
  jobs,
  queueConfig,
  runtime,
  commandError,
  onCancelJob,
  onClearFinished,
  onMaxConcurrentChange,
  onCopyJobLog,
  onCopyAllLogs,
}: JobsPanelProps) {
  const finishedCount = jobs.filter((job) =>
    ["success", "failed", "canceled"].includes(job.status),
  ).length;
  const error = commandError ?? (runtime.status === "error" ? runtime.error : undefined);

  return (
    <div className="feature-stack">
      <section className="tool-panel" aria-labelledby="jobs-panel-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">任务系统</p>
            <h2 id="jobs-panel-title">队列与并发</h2>
          </div>
          <div className="panel-actions">
            <label className="field compact-field inline-field">
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
              清理完成项
            </button>
          </div>
        </div>

        {error ? (
          <div className="job-runtime-message job-runtime-error">
            <strong>{error.message}</strong>
            <span>{error.detail ?? "任务系统暂不可用。"}</span>
          </div>
        ) : null}

        <div className="jobs-page-list">
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
            <div className="empty-panel">
              <ListChecks size={22} aria-hidden="true" />
              <p>暂无任务。导入媒体后，可在转换页创建格式转换任务。</p>
            </div>
          )}
        </div>
      </section>

      <section className="tool-panel" aria-labelledby="jobs-logs-title">
        <div className="panel-heading">
          <div>
            <p className="section-label">日志</p>
            <h2 id="jobs-logs-title">stdout / stderr</h2>
          </div>
          <button
            className="secondary-action compact-action"
            type="button"
            disabled={jobs.length === 0}
            onClick={onCopyAllLogs}
          >
            <Copy size={14} aria-hidden="true" />
            复制全部
          </button>
        </div>

        <div className="job-log-grid">
          {jobs.map((job) => (
            <article className="job-log-card" key={job.id}>
              <div>
                <Settings2 size={15} aria-hidden="true" />
                <strong>{job.title}</strong>
              </div>
              <code>{formatJobLogPreview(job)}</code>
            </article>
          ))}
          {jobs.length === 0 ? <p className="empty-state">暂无日志。</p> : null}
        </div>
      </section>
    </div>
  );
}

function formatJobLogPreview(job: JobRecord) {
  const lines = [
    `status=${job.status}`,
    `args=${job.args.join(" ")}`,
    ...job.stdout.map((line) => `stdout: ${line}`),
    ...job.stderr.map((line) => `stderr: ${line}`),
    job.errorMessage ? `error: ${job.errorMessage}` : "",
  ].filter(Boolean);

  return lines.slice(-12).join("\n");
}

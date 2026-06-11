import { Copy, Square } from "lucide-react";
import type { JobRecord } from "../app/types";
import { StatusPill } from "./StatusPill";

type TaskRowProps = {
  task: JobRecord;
  onCancel: (jobId: string) => void;
  onCopyLog: (job: JobRecord) => void;
};

const statusLabels: Record<JobRecord["status"], string> = {
  queued: "排队",
  running: "运行中",
  success: "完成",
  failed: "失败",
  canceling: "取消中",
  canceled: "已取消",
};

export function TaskRow({ task, onCancel, onCopyLog }: TaskRowProps) {
  const canCancel = task.status === "queued" || task.status === "running";
  const progress = task.progressPct ?? 0;
  const isIndeterminate =
    task.status === "running" && task.progressPct === undefined;

  return (
    <article className="task-row">
      <div className="task-row-top">
        <h3>{task.title}</h3>
        <StatusPill status={task.status} label={statusLabels[task.status]} />
      </div>

      <p className="task-file">{task.inputPath}</p>

      <div
        className={
          isIndeterminate ? "progress-track progress-indeterminate" : "progress-track"
        }
        aria-label={`${task.title} 进度`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="task-row-bottom">
        <span>{task.outputPath ?? "无输出文件"}</span>
        <span>{formatJobTime(task)}</span>
      </div>

      <div className="task-actions">
        <button
          className="secondary-action compact-action"
          type="button"
          disabled={!canCancel}
          onClick={() => onCancel(task.id)}
        >
          <Square size={14} aria-hidden="true" />
          {task.status === "canceling" ? "取消中" : "取消"}
        </button>
        <button
          className="secondary-action compact-action"
          type="button"
          onClick={() => onCopyLog(task)}
        >
          <Copy size={14} aria-hidden="true" />
          复制日志
        </button>
      </div>

      <details className="job-details">
        <summary>参数与输出</summary>
        <div className="job-detail-block">
          <span>Args</span>
          <code>{task.args.join(" ")}</code>
        </div>
        <JobLogBlock title="stdout" lines={task.stdout} truncated={task.stdoutTruncated} />
        <JobLogBlock title="stderr" lines={task.stderr} truncated={task.stderrTruncated} />
        {task.errorMessage ? (
          <div className="job-detail-block job-error">
            <span>{task.errorCategory ?? "error"}</span>
            <code>{task.errorMessage}</code>
          </div>
        ) : null}
      </details>
    </article>
  );
}

function JobLogBlock({
  title,
  lines,
  truncated,
}: {
  title: string;
  lines: string[];
  truncated: boolean;
}) {
  return (
    <div className="job-detail-block">
      <span>{truncated ? `${title}（已截断）` : title}</span>
      <code>{lines.length > 0 ? lines.join("\n") : "暂无输出"}</code>
    </div>
  );
}

function formatJobTime(task: JobRecord) {
  const timestamp = task.finishedAt ?? task.startedAt ?? task.createdAt;
  return new Date(timestamp).toLocaleTimeString();
}

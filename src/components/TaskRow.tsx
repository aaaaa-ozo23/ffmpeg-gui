import type { TaskItem } from "../app/types";
import { StatusPill } from "./StatusPill";

type TaskRowProps = {
  task: TaskItem;
};

const statusLabels: Record<TaskItem["status"], string> = {
  queued: "排队",
  running: "运行中",
  done: "完成",
  failed: "失败",
  paused: "暂停",
};

export function TaskRow({ task }: TaskRowProps) {
  return (
    <article className="task-row">
      <div className="task-row-top">
        <h3>{task.title}</h3>
        <StatusPill status={task.status} label={statusLabels[task.status]} />
      </div>
      <p className="task-file">{task.inputName}</p>
      <div className="progress-track" aria-label={`${task.title} 进度`}>
        <span style={{ width: `${task.progress}%` }} />
      </div>
      <div className="task-row-bottom">
        <span>{task.outputName}</span>
        <span>{task.updatedAt}</span>
      </div>
    </article>
  );
}

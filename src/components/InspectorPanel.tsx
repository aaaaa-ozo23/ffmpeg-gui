import { Copy, FileText, ListChecks } from "lucide-react";
import type { InspectorTab, LogEntry, TaskItem } from "../app/types";
import { StatusPill } from "./StatusPill";
import { TaskRow } from "./TaskRow";

type InspectorPanelProps = {
  activeTab: InspectorTab;
  logs: LogEntry[];
  tasks: TaskItem[];
  onTabChange: (tab: InspectorTab) => void;
};

export function InspectorPanel({
  activeTab,
  logs,
  tasks,
  onTabChange,
}: InspectorPanelProps) {
  return (
    <aside className="inspector" aria-label="任务和日志">
      <div className="inspector-header">
        <div>
          <p className="section-label">队列</p>
          <h2>任务状态</h2>
        </div>
        <StatusPill status="running" label="1 个运行中" />
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

      {activeTab === "tasks" ? (
        <div className="task-list" role="tabpanel">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="log-list" role="tabpanel">
          <button className="secondary-action" type="button">
            <Copy size={15} aria-hidden="true" />
            复制日志
          </button>
          {logs.map((log) => (
            <article className={`log-entry log-${log.level}`} key={log.id}>
              <span>{log.time}</span>
              <p>{log.message}</p>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

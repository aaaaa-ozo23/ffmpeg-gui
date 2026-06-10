import type { JobStatus } from "../app/types";

type StatusPillProps = {
  label: string;
  status: JobStatus;
};

export function StatusPill({ label, status }: StatusPillProps) {
  return <span className={`status-pill status-${status}`}>{label}</span>;
}

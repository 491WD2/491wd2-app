import type { ChoreTaskStatus } from "../../types/cleaning";
import { statusTone } from "../../lib/choreScheduleUtils";

const LABEL: Record<ChoreTaskStatus, string> = {
  "To Do": "To do",
  "In Progress": "In progress",
  Done: "Done",
  Overdue: "Overdue",
  Skipped: "Skipped",
};

export function ChoreStatusBadge({
  status,
  taskTitle,
}: {
  status: ChoreTaskStatus;
  taskTitle?: string;
}) {
  const tone = statusTone(status);
  const label = LABEL[status];
  return (
    <span
      className={`wd-chore-hh__badge wd-chore-hh__badge--${tone}`}
      role="status"
      aria-label={taskTitle ? `Status for ${taskTitle}: ${label}` : label}
    >
      {label}
    </span>
  );
}

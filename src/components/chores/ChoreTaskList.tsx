import { memo, useCallback } from "react";
import type { ChoreCompleteVia } from "../../types/kioskAnalytics";
import type { ChoreTask } from "../../types/cleaning";
import { useChoreShell } from "../../context/ChoreShellContext";
import { choreClasses, choreLayout } from "../../lib/choreUi";
import { ChoreTaskCard } from "./ChoreTaskCard";

export type ChoreTaskListProps = {
  tasks: ChoreTask[];
  surface: string;
  onEdit?: (task: ChoreTask) => void;
  enableSwipeDone?: boolean;
  draggable?: boolean;
  onDragStart?: (task: ChoreTask) => void;
  emptyMessage?: string;
};

function ChoreTaskListInner({
  tasks,
  surface,
  onEdit,
  enableSwipeDone = false,
  draggable = false,
  onDragStart,
  emptyMessage = "No tasks.",
}: ChoreTaskListProps) {
  const { markDone, completingIds, assignFlashIds, highlightedTaskId } = useChoreShell();

  const handleDone = useCallback(
    (task: ChoreTask, via: ChoreCompleteVia = "button") =>
      markDone(task, { surface, via }),
    [markDone, surface],
  );

  if (tasks.length === 0) {
    return <p className={choreClasses.empty}>{emptyMessage}</p>;
  }

  return (
    <ul className={choreLayout.taskList}>
      {tasks.map((task) => (
        <li
          key={task.id}
          id={`chore-task-${task.id}`}
          className={
            completingIds.has(task.id) ? choreClasses.taskItemCompleting : choreClasses.taskItem
          }
        >
          <ChoreTaskCard
            task={task}
            surface={surface}
            draggable={draggable}
            onDragStart={onDragStart}
            enableSwipeDone={enableSwipeDone}
            isCompleting={completingIds.has(task.id)}
            assignFlash={assignFlashIds.has(task.id)}
            aiHighlight={highlightedTaskId === task.id}
            onEdit={onEdit}
            onMarkDone={handleDone}
          />
        </li>
      ))}
    </ul>
  );
}

export const ChoreTaskList = memo(ChoreTaskListInner);

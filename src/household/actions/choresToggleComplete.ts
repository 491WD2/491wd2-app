import type { FamilyData, Task } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import { getNextDueDate } from "../../lib/utils";
import type { HouseholdActionResult } from "./types";

function isDoneToday(task: Task, todayIso: string): boolean {
  return (
    task.lastCompletedDate === todayIso ||
    task.status === "Done" ||
    task.status === "Completed"
  );
}

export type ChoreToggleCompleteOutcome = {
  data: FamilyData;
  toggled: "completed" | "reopened";
  task: Task;
};

/**
 * Authoritative chore/task completion toggle for today's dashboard surfaces.
 */
export function applyChoreToggleComplete(
  data: FamilyData,
  task: Task,
  todayIso: string,
): HouseholdActionResult<ChoreToggleCompleteOutcome> {
  const existing = data.tasks.find((item) => item.id === task.id);
  if (!existing) {
    return { ok: false, error: "Task not found." };
  }

  const stamp = new Date().toISOString();
  const completedDate = todayIso;
  const alreadyDone = isDoneToday(existing, todayIso);

  const next = createActivity(
    {
      ...data,
      tasks: data.tasks.map((item) =>
        item.id === task.id
          ? alreadyDone
            ? {
                ...item,
                lastCompletedDate: "",
                status:
                  item.status === "Done" || item.status === "Completed"
                    ? "Not Started"
                    : item.status,
                updatedAt: stamp,
              }
            : {
                ...item,
                status: item.type === "chore" ? "Not Started" : "Done",
                isBrainDump: false,
                lastCompletedDate: completedDate,
                nextDueDate:
                  item.type === "chore"
                    ? getNextDueDate(completedDate, item.frequency)
                    : item.nextDueDate,
                updatedAt: stamp,
              }
          : item,
      ),
    },
    {
      type: alreadyDone ? "updated" : "completed",
      entityType: existing.type === "chore" ? "chore" : "task",
      entityId: existing.id,
      entityTitle: existing.title,
      memberId: existing.assignedMemberId || undefined,
      message: alreadyDone
        ? `Reopened: ${existing.title}.`
        : `Completed ${existing.type === "chore" ? "chore" : "task"}: ${existing.title}.`,
    },
  );

  return {
    ok: true,
    value: {
      data: next,
      toggled: alreadyDone ? "reopened" : "completed",
      task: existing,
    },
  };
}

export { isDoneToday };

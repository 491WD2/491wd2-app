import type { FamilyData, Task } from "../../data/familyData";
import { getChoreDueDate, isChoreDone } from "../choreTrackerUtils";

export type DashboardChoreAttention =
  | "due-today"
  | "overdue"
  | "completed-today"
  | "upcoming";

export type DashboardChoreRow = {
  task: Task;
  attention: DashboardChoreAttention;
  attentionLabel: string;
};

export type DashboardChoreSelection = {
  rows: DashboardChoreRow[];
  dueTodayCount: number;
  overdueCount: number;
  completedTodayCount: number;
  upcomingCount: number;
  /** Open chores that need action now: due today + overdue. */
  openCount: number;
  summaryLabel: string;
  emptyLabel: string;
};

const ATTENTION_LABEL: Record<DashboardChoreAttention, string> = {
  "due-today": "Due today",
  overdue: "Overdue",
  "completed-today": "Completed",
  upcoming: "Upcoming",
};

function isSkipped(task: Task): boolean {
  return task.status === "Skipped";
}

function isOpenChore(task: Task): boolean {
  return task.type === "chore" && !isSkipped(task) && !isChoreDone(task);
}

function compareDueThenTitle(a: Task, b: Task): number {
  const dueCompare = getChoreDueDate(a).localeCompare(getChoreDueDate(b));
  if (dueCompare !== 0) return dueCompare;
  return a.title.localeCompare(b.title);
}

function toRow(task: Task, attention: DashboardChoreAttention): DashboardChoreRow {
  return {
    task,
    attention,
    attentionLabel: ATTENTION_LABEL[attention],
  };
}

function formatSummary(input: {
  dueTodayCount: number;
  overdueCount: number;
  completedTodayCount: number;
  upcomingCount: number;
  shownCount: number;
}): string {
  if (input.shownCount === 0) {
    return "No chores need attention";
  }
  if (input.dueTodayCount + input.overdueCount > 0) {
    const parts: string[] = [];
    if (input.dueTodayCount > 0) {
      parts.push(
        input.dueTodayCount === 1 ? "1 due today" : `${input.dueTodayCount} due today`,
      );
    }
    if (input.overdueCount > 0) {
      parts.push(input.overdueCount === 1 ? "1 overdue" : `${input.overdueCount} overdue`);
    }
    return parts.join(" · ");
  }
  if (input.completedTodayCount > 0) {
    return input.completedTodayCount === 1
      ? "1 completed today"
      : `${input.completedTodayCount} completed today`;
  }
  return "Next up";
}

/**
 * Read-only chore selection for Dashboard Preview.
 * Priority: due today → overdue open → completed today → nearest upcoming (only if needed).
 */
export function selectDashboardChores(
  data: FamilyData,
  todayIso: string,
  limit = 6,
): DashboardChoreSelection {
  const chores = (data.tasks ?? []).filter((task) => task && task.type === "chore" && !isSkipped(task));

  const dueToday = chores
    .filter(
      (task) =>
        isOpenChore(task) &&
        task.lastCompletedDate !== todayIso &&
        getChoreDueDate(task) === todayIso,
    )
    .sort(compareDueThenTitle);
  const overdue = chores
    .filter((task) => {
      const due = getChoreDueDate(task);
      return (
        isOpenChore(task) &&
        task.lastCompletedDate !== todayIso &&
        Boolean(due) &&
        due < todayIso
      );
    })
    .sort(compareDueThenTitle);
  const completedToday = chores
    .filter((task) => task.lastCompletedDate === todayIso)
    .sort((a, b) => a.title.localeCompare(b.title));
  const upcoming = chores
    .filter((task) => {
      const due = getChoreDueDate(task);
      return (
        isOpenChore(task) &&
        task.lastCompletedDate !== todayIso &&
        due > todayIso
      );
    })
    .sort(compareDueThenTitle);

  const primary = [
    ...dueToday.map((task) => toRow(task, "due-today")),
    ...overdue.map((task) => toRow(task, "overdue")),
    ...completedToday.map((task) => toRow(task, "completed-today")),
  ];

  const rows =
    primary.length > 0
      ? primary.slice(0, limit)
      : upcoming.slice(0, limit).map((task) => toRow(task, "upcoming"));

  const emptyLabel = "No chores need attention";
  const summaryLabel = formatSummary({
    dueTodayCount: dueToday.length,
    overdueCount: overdue.length,
    completedTodayCount: completedToday.length,
    upcomingCount: upcoming.length,
    shownCount: rows.length,
  });

  return {
    rows,
    dueTodayCount: dueToday.length,
    overdueCount: overdue.length,
    completedTodayCount: completedToday.length,
    upcomingCount: upcoming.length,
    openCount: dueToday.length + overdue.length,
    summaryLabel,
    emptyLabel,
  };
}

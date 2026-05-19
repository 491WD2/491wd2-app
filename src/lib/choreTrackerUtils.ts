import type { Task, TaskFrequency, TaskStatus } from "../data/familyData";
import { addDaysToIso, addMonthsToIso, mondayIsoForContainingWeek } from "./dashboardWeek";

export function getChoreDueDate(task: Task): string {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}

export function isChoreDone(task: Task): boolean {
  return task.status === "Done" || task.status === "Completed";
}

/** Sunday (end) of the ISO week that contains `todayIso` (week starts Monday). */
export function sundayIsoEndOfWeekContaining(todayIso: string): string {
  return addDaysToIso(mondayIsoForContainingWeek(todayIso), 6);
}

export type ChoreWhenPreset = "today" | "tomorrow" | "this-week" | "custom";

export function inferChoreWhenPreset(task: Task, todayIso: string): ChoreWhenPreset {
  const due = getChoreDueDate(task);
  const tomorrow = addDaysToIso(todayIso, 1);
  const weekEnd = sundayIsoEndOfWeekContaining(todayIso);

  if (due === todayIso) {
    return "today";
  }
  if (due === tomorrow) {
    return "tomorrow";
  }
  if (due > todayIso && due <= weekEnd) {
    return "this-week";
  }
  return "custom";
}

export function dueDateForWhenPreset(
  preset: ChoreWhenPreset,
  todayIso: string,
  customIso: string,
): string {
  switch (preset) {
    case "today":
      return todayIso;
    case "tomorrow":
      return addDaysToIso(todayIso, 1);
    case "this-week":
      return sundayIsoEndOfWeekContaining(todayIso);
    case "custom":
      return customIso.slice(0, 10) || todayIso;
    default:
      return todayIso;
  }
}

/** Recurring cadences that reschedule after Done; one-time & as-needed stay completed until reopened. */
export function choreFrequencySchedulesNextOccurrence(frequency: TaskFrequency): boolean {
  switch (frequency) {
    case "daily":
    case "weekly":
    case "monthly":
    case "quarterly":
      return true;
    case "one-time":
    case "as-needed":
      return false;
  }
}

/**
 * Next due date after a completion (local calendar day). Returns null when the chore should remain Done.
 */
export function computeNextChoreDueAfterCompletion(
  completionLocalDateIso: string,
  frequency: TaskFrequency,
): string | null {
  if (!choreFrequencySchedulesNextOccurrence(frequency)) {
    return null;
  }
  const base = completionLocalDateIso.slice(0, 10);
  switch (frequency) {
    case "daily":
      return addDaysToIso(base, 1);
    case "weekly":
      return addDaysToIso(base, 7);
    case "monthly":
      return addMonthsToIso(base, 1);
    case "quarterly":
      return addMonthsToIso(base, 3);
    default:
      return null;
  }
}

/**
 * Fields to persist when marking a chore Done: recurring chores reopen with the next due date;
 * one-time / as-needed stay Done.
 */
export function patchTaskAfterChoreMarkedDone(
  frequency: TaskFrequency,
  completionLocalDateIso: string,
  completionTimestampIso: string,
  completedByMemberId: string | undefined,
  fallbackDueDate: string,
  fallbackNextDueDate: string,
): Partial<Task> & { status: TaskStatus } {
  const datePart = completionLocalDateIso.slice(0, 10);
  const nextDue = computeNextChoreDueAfterCompletion(datePart, frequency);
  const completionMeta = {
    lastCompletedDate: datePart,
    lastCompletedAt: completionTimestampIso,
    lastCompletedByMemberId: completedByMemberId,
  };
  if (nextDue != null) {
    return {
      ...completionMeta,
      status: "Not Started",
      dueDate: nextDue,
      nextDueDate: nextDue,
    };
  }
  return {
    ...completionMeta,
    status: "Done",
    dueDate: fallbackDueDate.slice(0, 10),
    nextDueDate: fallbackNextDueDate.slice(0, 10),
  };
}

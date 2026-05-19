import type { ChoreTask } from "../types/cleaning";
import type { HouseholdMember } from "../types/chore";
import { HOUSEHOLD_MEMBERS } from "../types/chore";
import { buildTasksForDate } from "./choreData";
import type { PersistedChoreNotes, PersistedChoreState } from "../types/cleaning";

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatChoreDayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) {
    return "Today";
  }
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function getWeekDates(anchorIso: string): string[] {
  const anchor = new Date(`${anchorIso}T12:00:00`);
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function buildWeekTaskMap(
  weekDates: string[],
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
): Record<string, ChoreTask[]> {
  const map: Record<string, ChoreTask[]> = {};
  for (const iso of weekDates) {
    map[iso] = buildTasksForDate(iso, state, notes);
  }
  return map;
}

export function groupTasksByMember(tasks: ChoreTask[]): Record<HouseholdMember | "Unassigned", ChoreTask[]> {
  const groups = Object.fromEntries(
    [...HOUSEHOLD_MEMBERS, "Unassigned"].map((m) => [m, [] as ChoreTask[]]),
  ) as Record<HouseholdMember | "Unassigned", ChoreTask[]>;

  for (const task of tasks) {
    const key = task.assignedTo || "Unassigned";
    groups[key].push(task);
  }
  return groups;
}

export function choreSummaryCounts(tasks: ChoreTask[]) {
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "Done").length,
    overdue: tasks.filter((t) => t.status === "Overdue").length,
    todo: tasks.filter((t) => t.status === "To Do" || t.status === "In Progress").length,
  };
}

export function statusTone(status: ChoreTask["status"]): "todo" | "progress" | "done" | "overdue" | "skipped" {
  switch (status) {
    case "In Progress":
      return "progress";
    case "Done":
      return "done";
    case "Overdue":
      return "overdue";
    case "Skipped":
      return "skipped";
    default:
      return "todo";
  }
}

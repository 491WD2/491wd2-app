import type { FamilyData, PlannerEvent, Task } from "../data/familyData";
import { getChoreDueDate } from "./choreTrackerUtils";
import { findMemberById, getMemberFullName } from "./utils";

export type WeeklyActivityRow = {
  day: string;
  chores: number;
  events: number;
};

export type HouseholdOverviewSlice = {
  name: string;
  value: number;
  color: string;
};

export type TodayScheduleRow = {
  id: string;
  time: string;
  title: string;
  assignee: string;
  done: boolean;
  type: "event" | "chore" | "routine";
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function localTodayIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isOpenTask(status: string | undefined): boolean {
  return status !== "Done" && status !== "Completed" && status !== "Skipped";
}

function mondayOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function assigneeLabel(data: FamilyData, event: PlannerEvent): string {
  if (event.assignedMemberId) {
    const member = findMemberById(data, event.assignedMemberId);
    if (member) return getMemberFullName(member);
  }
  return event.assignedPerson?.trim() || "Household";
}

function taskAssigneeLabel(data: FamilyData, task: Task): string {
  if (task.assignedMemberId) {
    const member = findMemberById(data, task.assignedMemberId);
    if (member) return getMemberFullName(member);
  }
  return task.owner?.trim() || "Unassigned";
}

export function buildWeeklyActivityRows(
  data: FamilyData,
  todayIso: string,
): WeeklyActivityRow[] {
  const anchor = new Date(`${todayIso}T12:00:00`);
  const monday = mondayOfWeek(anchor);
  const tasks = data.tasks ?? [];
  const planner = data.planner ?? [];

  return WEEKDAY_LABELS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = localTodayIso(date);
    const chores = tasks.filter(
      (task) => task && isOpenTask(task.status) && getChoreDueDate(task) === iso,
    ).length;
    const events = planner.filter((event) => event && event.date === iso).length;
    return { day, chores, events };
  });
}

export function buildHouseholdOverviewSlices(input: {
  upcomingEvents: number;
  openTasks: number;
  needToBuy: number;
  pantryAlerts: number;
  routines: number;
}): HouseholdOverviewSlice[] {
  const slices: HouseholdOverviewSlice[] = [
    { name: "Events", value: input.upcomingEvents, color: "#1E3A8A" },
    { name: "Chores", value: input.openTasks, color: "#14B8A6" },
    { name: "Shopping", value: input.needToBuy, color: "#FACC15" },
    { name: "Pantry", value: input.pantryAlerts, color: "#8b5cf6" },
    { name: "Routines", value: input.routines, color: "#f59e0b" },
  ];
  return slices.filter((slice) => slice.value > 0);
}

export function buildTodayScheduleRows(
  data: FamilyData,
  todayIso: string,
  openTasks: Task[],
): TodayScheduleRow[] {
  const rows: TodayScheduleRow[] = [];

  for (const event of data.planner ?? []) {
    if (!event || event.date !== todayIso) continue;
    rows.push({
      id: `event-${event.id}`,
      time: event.time?.trim() || event.startTime?.trim() || "All day",
      title: event.title,
      assignee: assigneeLabel(data, event),
      done: false,
      type: "event",
    });
  }

  for (const task of openTasks) {
    const due = getChoreDueDate(task);
    if (due !== todayIso) continue;
    rows.push({
      id: `task-${task.id}`,
      time: "Due today",
      title: task.title,
      assignee: taskAssigneeLabel(data, task),
      done: task.status === "Completed" || task.status === "Done",
      type: task.type === "chore" ? "chore" : "routine",
    });
  }

  rows.sort((a, b) => a.time.localeCompare(b.time));
  return rows.slice(0, 8);
}

/** Home “Today” rows — chores/routines due today only (no calendar planner events). */
export function buildTodayHomeRows(
  data: FamilyData,
  todayIso: string,
  openTasks: Task[],
): TodayScheduleRow[] {
  return buildTodayScheduleRows(data, todayIso, openTasks).filter(
    (row) => row.type !== "event",
  );
}

export function dashboardGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning! 👋";
  if (hour < 17) return "Good afternoon! 👋";
  return "Good evening! 👋";
}

export function countAttentionMessages(data: FamilyData, todayIso: string): number {
  return (data.messageBoard ?? []).filter((message) => {
    if (message.expiresAt && message.expiresAt < todayIso) return false;
    return (
      message.pinned ||
      message.priority === "important" ||
      message.priority === "urgent"
    );
  }).length;
}

export function selectRecentMessagesForHome(data: FamilyData, limit = 4) {
  const today = todayIsoFromDate(new Date());
  return [...(data.messageBoard ?? [])]
    .filter((message) => !message.expiresAt || message.expiresAt >= today)
    .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
    .slice(0, limit);
}

function todayIsoFromDate(date: Date): string {
  return localTodayIso(date);
}

/**
 * Behavior signals for chore AI — completion timing, pace, and household load.
 */
import type { ChoreTimeOfDay } from "../types/choreAi";
import type { ChoreTask, PersistedChoreState, ScheduleBundle } from "../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../types/chore";
import { resolveTimeOfDay } from "./chorePersonalization";

export type CompletionPace = "ahead" | "on_track" | "behind";

export type MemberCompletionStats = {
  member: HouseholdMember;
  completedToday: number;
  openToday: number;
  weekRate: number;
  completionsLast7d: number;
  preferredHour: number | null;
};

export type ChoreAiSignals = {
  timeOfDay: ChoreTimeOfDay;
  hour: number;
  pace: CompletionPace;
  householdOpenToday: number;
  householdDoneToday: number;
  memberStats: MemberCompletionStats[];
  dominantCompleter: HouseholdMember | null;
  eveningPush: boolean;
  morningKitchenFocus: boolean;
};

function parseHour(iso: string): number | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getHours();
}

function memberCompletionsLast7d(
  member: HouseholdMember,
  weekTasks: ChoreTask[],
  state: PersistedChoreState,
): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const task of weekTasks) {
    if (task.assignedTo !== member) {
      continue;
    }
    const at = state.completions[task.id]?.completedAt;
    if (at && new Date(at).getTime() >= weekAgo) {
      count += 1;
    }
  }
  for (const [taskId, entry] of Object.entries(state.completions)) {
    if (weekTasks.some((t) => t.id === taskId)) {
      continue;
    }
    const task = weekTasks.find((t) => t.id === taskId && t.assignedTo === member);
    if (task && new Date(entry.completedAt).getTime() >= weekAgo) {
      count += 1;
    }
  }
  return count;
}

function preferredCompletionHour(
  member: HouseholdMember,
  weekTasks: ChoreTask[],
  state: PersistedChoreState,
): number | null {
  const hours: number[] = [];
  for (const task of weekTasks) {
    if (task.assignedTo !== member) {
      continue;
    }
    const at = state.completions[task.id]?.completedAt;
    const h = at ? parseHour(at) : null;
    if (h != null) {
      hours.push(h);
    }
  }
  if (hours.length < 2) {
    return null;
  }
  const buckets = new Array(24).fill(0) as number[];
  for (const h of hours) {
    buckets[h] += 1;
  }
  let best = 0;
  let bestH = 0;
  for (let h = 0; h < 24; h += 1) {
    if (buckets[h] > best) {
      best = buckets[h];
      bestH = h;
    }
  }
  return bestH;
}

function memberWeekRate(
  member: HouseholdMember,
  weekTasks: ChoreTask[],
  state: PersistedChoreState,
): number {
  const assigned = weekTasks.filter((t) => t.assignedTo === member);
  if (assigned.length === 0) {
    return 1;
  }
  const done = assigned.filter(
    (t) => t.status === "Done" || Boolean(state.completions[t.id]),
  ).length;
  return done / assigned.length;
}

export function buildChoreAiSignals(
  schedule: ScheduleBundle,
  state: PersistedChoreState,
): ChoreAiSignals {
  const timeOfDay = resolveTimeOfDay();
  const hour = new Date().getHours();
  const todayOpen = schedule.today.filter(
    (t) => t.status !== "Done" && t.status !== "Skipped",
  );
  const todayDone = schedule.today.filter((t) => t.status === "Done");
  const total = schedule.today.length;
  const doneRatio = total > 0 ? todayDone.length / total : 1;

  let pace: CompletionPace = "on_track";
  if (timeOfDay === "evening" && doneRatio < 0.5 && todayOpen.length >= 3) {
    pace = "behind";
  } else if (doneRatio >= 0.75 && todayOpen.length <= 2) {
    pace = "ahead";
  } else if (timeOfDay === "morning" && doneRatio >= 0.4) {
    pace = "ahead";
  }

  const memberStats: MemberCompletionStats[] = HOUSEHOLD_MEMBERS.map((member) => {
    const openToday = schedule.today.filter(
      (t) =>
        t.assignedTo === member && t.status !== "Done" && t.status !== "Skipped",
    ).length;
    const completedToday = schedule.today.filter(
      (t) => t.assignedTo === member && t.status === "Done",
    ).length;
    return {
      member,
      openToday,
      completedToday,
      weekRate: memberWeekRate(member, schedule.thisWeek, state),
      completionsLast7d: memberCompletionsLast7d(member, schedule.thisWeek, state),
      preferredHour: preferredCompletionHour(member, schedule.thisWeek, state),
    };
  });

  const dominantCompleter =
    [...memberStats].sort((a, b) => b.completionsLast7d - a.completionsLast7d)[0]
      ?.completionsLast7d > 0
      ? [...memberStats].sort((a, b) => b.completionsLast7d - a.completionsLast7d)[0]!.member
      : null;

  return {
    timeOfDay,
    hour,
    pace,
    householdOpenToday: todayOpen.length,
    householdDoneToday: todayDone.length,
    memberStats,
    dominantCompleter,
    eveningPush: timeOfDay === "evening" && (pace === "behind" || todayOpen.some((t) => t.status === "Overdue")),
    morningKitchenFocus: timeOfDay === "morning" && Boolean(schedule.kitchenDutyToday),
  };
}

export function timeOfDayCategoryBoost(
  category: string,
  signals: ChoreAiSignals,
): number {
  const { timeOfDay } = signals;
  const boosts: Record<string, Partial<Record<typeof timeOfDay, number>>> = {
    personal: { morning: 0.06, afternoon: 0.03, evening: 0.04 },
    role: { morning: 0.08, afternoon: 0.02, evening: 0.01 },
    complete: { morning: 0.02, afternoon: 0.04, evening: 0.1 },
    assign: { morning: 0.03, afternoon: 0.07, evening: 0.05 },
    balance: { morning: 0.02, afternoon: 0.08, evening: 0.04 },
    history: { morning: 0.01, afternoon: 0.03, evening: 0.03 },
  };
  return boosts[category]?.[timeOfDay] ?? 0;
}

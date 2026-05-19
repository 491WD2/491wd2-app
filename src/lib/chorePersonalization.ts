/**
 * Client-side personalization for the chore kiosk — greetings, focus tasks, and session member.
 * Maps family app session (first name) to {@link HouseholdMember} roster names.
 */
import { FAMILY_DATA_STORAGE_KEY } from "../data/localFamilyRepository";
import type { ChorePersonalization, ChoreTimeOfDay } from "../types/choreAi";
import type { PersistedChoreState, ScheduleBundle } from "../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../types/chore";
import { buildChoreAiSignals } from "./choreAiSignals";
import { choreSummaryCounts } from "./choreScheduleUtils";

export const CHORE_ACTIVE_MEMBER_KEY = "491wd-chore-active-member";

export function resolveTimeOfDay(date = new Date()): ChoreTimeOfDay {
  const hour = date.getHours();
  if (hour < 12) {
    return "morning";
  }
  if (hour < 17) {
    return "afternoon";
  }
  return "evening";
}

function timeGreeting(time: ChoreTimeOfDay): string {
  switch (time) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    default:
      return "Good evening";
  }
}

function matchHouseholdMemberFromName(fullName: string): HouseholdMember | null {
  const first = fullName.trim().split(/\s+/)[0]?.toLowerCase();
  if (!first) {
    return null;
  }
  return HOUSEHOLD_MEMBERS.find((m) => m.toLowerCase() === first) ?? null;
}

/** Active member: kiosk pin in localStorage, else family session first name. */
export function resolveActiveHouseholdMember(): HouseholdMember | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const pinned = window.localStorage.getItem(CHORE_ACTIVE_MEMBER_KEY);
    if (pinned && (HOUSEHOLD_MEMBERS as readonly string[]).includes(pinned)) {
      return pinned as HouseholdMember;
    }
  } catch {
    /* ignore */
  }

  try {
    const raw = window.localStorage.getItem(FAMILY_DATA_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as {
      adminSettings?: { activeMemberId?: string; activePreferencesMemberId?: string };
      familyMembers?: Array<{ id: string; name: string; status?: string }>;
    };
    const memberId =
      data.adminSettings?.activeMemberId ?? data.adminSettings?.activePreferencesMemberId;
    const roster = data.familyMembers?.filter((m) => m.status !== "inactive") ?? [];
    const member = memberId
      ? roster.find((m) => m.id === memberId)
      : roster[0];
    if (!member?.name) {
      return null;
    }
    return matchHouseholdMemberFromName(member.name);
  } catch {
    return null;
  }
}

export function setActiveHouseholdMember(member: HouseholdMember | null): void {
  if (typeof window === "undefined") {
    return;
  }
  if (member) {
    window.localStorage.setItem(CHORE_ACTIVE_MEMBER_KEY, member);
  } else {
    window.localStorage.removeItem(CHORE_ACTIVE_MEMBER_KEY);
  }
  window.dispatchEvent(new CustomEvent("491wd-chore-member-changed", { detail: member }));
}

export function buildChorePersonalization(
  schedule: ScheduleBundle,
  state: PersistedChoreState,
  todayIso: string,
  activeMember: HouseholdMember | null,
): ChorePersonalization {
  const timeOfDay = resolveTimeOfDay();
  const signals = buildChoreAiSignals(schedule, state);
  const counts = choreSummaryCounts(schedule.today);
  const completionRateToday =
    counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 100;

  const openForMember = (member: HouseholdMember) =>
    schedule.today.filter(
      (t) =>
        t.assignedTo === member && t.status !== "Done" && t.status !== "Skipped",
    );

  const doneForMember = (member: HouseholdMember) =>
    schedule.today.filter((t) => t.assignedTo === member && t.status === "Done").length;

  let greeting = `${timeGreeting(timeOfDay)}, household!`;
  let subtitle = `${counts.todo} open today · ${counts.done} completed · ${todayIso}`;
  let householdInsight: string | undefined;
  let focusTaskId: string | undefined;
  let focusTaskTitle: string | undefined;

  if (activeMember) {
    const myOpen = openForMember(activeMember);
    const myDone = doneForMember(activeMember);
    greeting = `${timeGreeting(timeOfDay)}, ${activeMember}!`;

    if (myOpen.length === 0 && myDone > 0) {
      subtitle = `All ${myDone} of your assigned chores are done for today.`;
    } else if (myOpen.length === 1) {
      subtitle = `One chore left — finish strong.`;
    } else {
      subtitle = `${myOpen.length} on your list · ${myDone} already done today.`;
    }

    if (schedule.kitchenDutyToday === activeMember) {
      subtitle += " You're on kitchen duty.";
    }

    const weekAssigned = schedule.thisWeek.filter((t) => t.assignedTo === activeMember);
    const weekDone = weekAssigned.filter(
      (t) => t.status === "Done" || Boolean(state.completions[t.id]),
    ).length;
    if (weekAssigned.length > 0) {
      const weekPct = Math.round((weekDone / weekAssigned.length) * 100);
      householdInsight = `Your week: ${weekPct}% complete (${weekDone}/${weekAssigned.length} tasks).`;
    }

    const next =
      myOpen.find((t) => t.status === "Overdue") ??
      myOpen.find((t) => t.isKitchenDuty) ??
      myOpen[0];
    if (next) {
      focusTaskId = next.id;
      focusTaskTitle = next.title;
    }
  } else {
    const overdue = schedule.today.filter((t) => t.status === "Overdue");
    if (overdue.length > 0) {
      householdInsight = `${overdue.length} overdue — tackle these first for a smoother evening.`;
      focusTaskId = overdue[0]?.id;
      focusTaskTitle = overdue[0]?.title;
    } else if (counts.todo === 0 && counts.done > 0) {
      householdInsight = "Everyone's on track — great teamwork today.";
    }
  }

  if (signals.pace === "behind" && !householdInsight) {
    householdInsight = "Household pace is behind for today — focus on overdue tasks first.";
  } else if (signals.pace === "ahead" && counts.todo <= 2 && counts.done > 0) {
    householdInsight = householdInsight ?? "Strong pace today — keep the momentum going.";
  }

  if (timeOfDay === "evening" && counts.todo > 0 && counts.overdue > 0) {
    subtitle = `${counts.overdue} overdue · ${counts.todo} open — wrap up before the day ends.`;
  }

  return {
    greeting,
    subtitle,
    activeMember,
    timeOfDay,
    focusTaskId,
    focusTaskTitle,
    householdInsight,
    completionRateToday,
    completionPace: signals.pace,
  };
}

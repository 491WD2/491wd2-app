/**
 * AI-style chore recommendations — completion patterns, time of day, roles, feedback loop.
 * Client-side heuristics (no external API).
 */
import type { ChoreSuggestion, ChoreSuggestionCategory } from "../types/choreAi";
import type { ChoreTask, PersistedChoreState, ScheduleBundle } from "../types/cleaning";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "../types/chore";
import {
  getCategoryFeedbackBoost,
  isSuggestionDismissed,
} from "./choreAiFeedback";
import {
  buildChoreAiSignals,
  timeOfDayCategoryBoost,
  type ChoreAiSignals,
} from "./choreAiSignals";

function memberOpenCount(tasks: ChoreTask[], member: HouseholdMember): number {
  return tasks.filter(
    (t) => t.assignedTo === member && t.status !== "Done" && t.status !== "Skipped",
  ).length;
}

function roomAffinity(
  member: HouseholdMember,
  weekTasks: ChoreTask[],
  state: PersistedChoreState,
): string | null {
  const completed = weekTasks.filter(
    (t) =>
      t.assignedTo === member &&
      (t.status === "Done" || Boolean(state.completions[t.id])),
  );
  if (completed.length < 2) {
    return null;
  }
  const counts: Record<string, number> = {};
  for (const t of completed) {
    counts[t.room] = (counts[t.room] ?? 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? null;
}

function applyConfidence(
  base: number,
  category: ChoreSuggestionCategory,
  signals: ChoreAiSignals,
): number {
  const feedback = getCategoryFeedbackBoost(category);
  const tod = timeOfDayCategoryBoost(category, signals);
  return Math.min(0.99, Math.max(0.45, base * feedback + tod));
}

function pushSuggestion(
  list: ChoreSuggestion[],
  suggestion: Omit<ChoreSuggestion, "confidence" | "highlight"> & { confidence: number },
) {
  if (isSuggestionDismissed(suggestion.id)) {
    return;
  }
  list.push({ ...suggestion, highlight: false });
}

export function generateChoreSuggestions(
  schedule: ScheduleBundle,
  state: PersistedChoreState,
  todayIso: string,
  activeMember: HouseholdMember | null = null,
): ChoreSuggestion[] {
  const signals = buildChoreAiSignals(schedule, state);
  const suggestions: ChoreSuggestion[] = [];
  const todayOpen = schedule.today.filter((t) => t.status !== "Done" && t.status !== "Skipped");
  const unassigned = todayOpen.filter((t) => !t.assignedTo);
  const overdue = schedule.today.filter((t) => t.status === "Overdue");

  if (signals.pace === "behind" && todayOpen.length > 0) {
    pushSuggestion(suggestions, {
      id: "ai-pace-behind",
      priority: "high",
      category: "complete",
      reason: "completion_pace",
      title:
        signals.timeOfDay === "evening"
          ? "Evening push — finish strong"
          : "Pick up the pace today",
      detail: `${todayOpen.length} still open · ${signals.householdDoneToday} done so far. Tackle overdue or kitchen tasks first.`,
      confidence: applyConfidence(0.9, "complete", signals),
      actionLabel: "View today",
      action: "focus_task",
      taskId: overdue[0]?.id ?? todayOpen[0]?.id,
    });
  }

  if (activeMember) {
    const stats = signals.memberStats.find((s) => s.member === activeMember);
    const myOpen = todayOpen.filter((t) => t.assignedTo === activeMember);
    const myNext =
      myOpen.find((t) => t.status === "Overdue") ??
      myOpen.find((t) => t.isKitchenDuty) ??
      myOpen[0];

    if (myNext) {
      let detail = `${myNext.room} · ${myNext.status === "Overdue" ? "Overdue — " : ""}tap to view on today's list.`;
      if (stats?.preferredHour != null && signals.timeOfDay !== "evening") {
        const label =
          stats.preferredHour < 12
            ? "mornings"
            : stats.preferredHour < 17
              ? "afternoons"
              : "evenings";
        detail += ` You often complete chores in the ${label}.`;
      }
      pushSuggestion(suggestions, {
        id: `ai-personal-next-${activeMember}`,
        priority: "high",
        category: "personal",
        reason: "next_task",
        title: `Your next: ${myNext.title}`,
        detail,
        confidence: applyConfidence(0.94, "personal", signals),
        personalized: true,
        member: activeMember,
        taskId: myNext.id,
        actionLabel: "View task",
        action: "focus_task",
      });
    }

    if (
      signals.morningKitchenFocus &&
      schedule.kitchenDutyToday === activeMember &&
      myOpen.some((t) => t.room === "Kitchen" || t.isKitchenDuty)
    ) {
      pushSuggestion(suggestions, {
        id: `ai-morning-kitchen-${activeMember}`,
        priority: "high",
        category: "role",
        reason: "time_of_day",
        title: "Morning kitchen focus",
        detail: "Kitchen duty is active — finishing kitchen tasks before noon keeps the household on track.",
        confidence: applyConfidence(0.88, "role", signals),
        personalized: true,
        member: activeMember,
        actionLabel: "My tasks",
        action: "focus_member",
      });
    }

    const affinity = roomAffinity(activeMember, schedule.thisWeek, state);
    if (affinity && myOpen.some((t) => t.room === affinity)) {
      pushSuggestion(suggestions, {
        id: `ai-personal-room-${activeMember}`,
        priority: "low",
        category: "history",
        reason: "room_affinity",
        title: `You often finish ${affinity}`,
        detail: `Based on this week's completions — consider ${affinity} while you're in flow.`,
        confidence: applyConfidence(0.72, "history", signals),
        personalized: true,
        member: activeMember,
      });
    }

    if (stats && stats.weekRate >= 0.85 && stats.openToday <= 1 && signals.pace === "ahead") {
      pushSuggestion(suggestions, {
        id: `ai-personal-ahead-${activeMember}`,
        priority: "low",
        category: "personal",
        reason: "completion_pace",
        title: "You're ahead today",
        detail: `Great rhythm — ${Math.round(stats.weekRate * 100)}% of your week tasks complete.`,
        confidence: applyConfidence(0.68, "personal", signals),
        personalized: true,
        member: activeMember,
      });
    }
  }

  if (unassigned.length > 0) {
    const boost =
      signals.timeOfDay === "afternoon" ? 0.95 : signals.eveningPush ? 0.88 : 0.92;
    pushSuggestion(suggestions, {
      id: "ai-unassigned",
      priority: "high",
      category: "assign",
      reason: "unassigned",
      title: `${unassigned.length} unassigned today`,
      detail: "Drag tasks to household members on the Assign board for balanced load.",
      confidence: applyConfidence(boost, "assign", signals),
      actionLabel: "Open assign board",
      action: "navigate_schedule",
    });
  }

  if (overdue.length > 0) {
    pushSuggestion(suggestions, {
      id: "ai-overdue",
      priority: "high",
      category: "complete",
      reason: "overdue",
      title: `${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
      detail:
        overdue.map((t) => t.title).slice(0, 2).join(", ") + (overdue.length > 2 ? "…" : ""),
      confidence: applyConfidence(signals.eveningPush ? 0.93 : 0.88, "complete", signals),
      actionLabel: "Review today",
      taskId: overdue[0]?.id,
      action: "focus_task",
    });
  }

  if (schedule.kitchenDutyToday) {
    const kitchenTasks = todayOpen.filter((t) => t.room === "Kitchen" || t.isKitchenDuty);
    const isYou = activeMember && schedule.kitchenDutyToday === activeMember;
    if (!isYou || !suggestions.some((s) => s.id === `ai-morning-kitchen-${activeMember}`)) {
      pushSuggestion(suggestions, {
        id: "ai-kitchen",
        priority: isYou ? "high" : "medium",
        category: "role",
        reason: "kitchen_duty",
        title: isYou ? "Your kitchen duty today" : `${schedule.kitchenDutyToday} has kitchen duty`,
        detail:
          kitchenTasks.length > 0
            ? `Prioritize ${kitchenTasks.length} kitchen task(s) before other rooms.`
            : "Kitchen rotation is active — other chores may be deferred.",
        confidence: applyConfidence(isYou ? 0.9 : 0.85, "role", signals),
        personalized: Boolean(isYou),
        member: schedule.kitchenDutyToday,
        actionLabel: isYou ? "My tasks" : "View member",
        action: "focus_member",
      });
    }
  }

  const loads = HOUSEHOLD_MEMBERS.map((m) => {
    const stats = signals.memberStats.find((s) => s.member === m)!;
    return {
      member: m,
      open: memberOpenCount(schedule.today, m),
      rate: stats.weekRate,
      last7: stats.completionsLast7d,
    };
  }).sort((a, b) => b.open - a.open);

  const heaviest = loads[0];
  const lightest = loads[loads.length - 1];

  if (heaviest && heaviest.open >= 3 && lightest && lightest.open < heaviest.open - 2) {
    pushSuggestion(suggestions, {
      id: "ai-balance",
      priority: "medium",
      category: "balance",
      reason: "load_balance",
      title: "Balance today's load",
      detail: `${heaviest.member} has ${heaviest.open} open vs ${lightest.member} with ${lightest.open}. Consider reassigning.`,
      confidence: applyConfidence(0.8, "balance", signals),
      actionLabel: "Assign chores",
      action: "navigate_schedule",
      member: heaviest.member,
    });
  }

  const struggling = loads.filter((l) => l.rate < 0.45 && l.open >= 2);
  for (const entry of struggling.slice(0, 1)) {
    pushSuggestion(suggestions, {
      id: `ai-support-${entry.member}`,
      priority: "medium",
      category: "history",
      reason: "support_member",
      title: `Support ${entry.member}`,
      detail: `Week completion ~${Math.round(entry.rate * 100)}% with ${entry.open} still open today.${entry.last7 < 2 ? " Few completions this week." : ""}`,
      confidence: applyConfidence(0.74, "history", signals),
      actionLabel: `View ${entry.member}`,
      action: "focus_member",
      member: entry.member,
    });
  }

  const star = loads.find((l) => l.rate >= 0.8 && l.open <= 1);
  if (star && todayOpen.length > 0 && unassigned.length > 0) {
    pushSuggestion(suggestions, {
      id: `ai-star-${star.member}`,
      priority: "low",
      category: "balance",
      reason: "star_performer",
      title: `${star.member} can take one more`,
      detail: "Strong weekly completion — good candidate for an extra room or unassigned task.",
      confidence: applyConfidence(0.68, "balance", signals),
      member: star.member,
      actionLabel: "Assign task",
      action: "navigate_schedule",
    });
  }

  if (suggestions.length === 0 && todayOpen.length > 0) {
    pushSuggestion(suggestions, {
      id: "ai-steady",
      priority: "low",
      category: "complete",
      reason: "steady",
      title: "On track for today",
      detail: `${todayOpen.length} task(s) remaining · ${signals.householdDoneToday} done · ${todayIso}.`,
      confidence: applyConfidence(0.62, "complete", signals),
    });
  }

  const sorted = suggestions
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      if (p[a.priority] !== p[b.priority]) {
        return p[a.priority] - p[b.priority];
      }
      if (a.personalized && !b.personalized) {
        return -1;
      }
      if (!a.personalized && b.personalized) {
        return 1;
      }
      return b.confidence - a.confidence;
    })
    .slice(0, 6);

  if (sorted.length > 0) {
    const highlightIdx = sorted.findIndex(
      (s) => s.priority === "high" && (s.personalized || s.taskId),
    );
    const idx = highlightIdx >= 0 ? highlightIdx : 0;
    sorted[idx] = { ...sorted[idx]!, highlight: true };
  }

  return sorted;
}

export function getHighlightedTaskId(suggestions: readonly ChoreSuggestion[]): string | null {
  const top = suggestions.find((s) => s.highlight && s.taskId);
  return top?.taskId ?? suggestions.find((s) => s.taskId)?.taskId ?? null;
}

/**
 * Predictive chore schedule — heuristics from completion history, roles, and peak hours.
 */
import type {
  PredictedChoreItem,
  PredictiveDayGroup,
  PredictiveLikelihood,
  PredictivePriority,
  PredictiveScheduleReport,
} from "../types/chorePredictive";
import type { ChoreTask, PersistedChoreState, ScheduleBundle } from "../types/cleaning";
import type { HouseholdMember } from "../types/chore";
import { buildChoreAiSignals } from "./choreAiSignals";
import { getCategoryFeedbackBoost } from "./choreAiFeedback";
import {
  getMemberPeakHour,
  getPeakActivityHours,
  getTaskTimingBias,
  loadPredictiveModel,
} from "./chorePredictiveModel";
import { buildWeekTaskMap, formatChoreDayLabel, getWeekDates } from "./choreScheduleUtils";
import type { PersistedChoreNotes } from "../types/cleaning";

function likelihoodFromScore(score: number): PredictiveLikelihood {
  if (score >= 0.72) {
    return "likely";
  }
  if (score >= 0.48) {
    return "moderate";
  }
  return "at_risk";
}

function priorityFromScore(score: number, task: ChoreTask): PredictivePriority {
  if (task.status === "Overdue" || score >= 0.85) {
    return "high";
  }
  if (score >= 0.55 || task.isKitchenDuty) {
    return "medium";
  }
  return "low";
}

function scoreTask(
  task: ChoreTask,
  dateIso: string,
  todayIso: string,
  signals: ReturnType<typeof buildChoreAiSignals>,
  activeMember: HouseholdMember | null,
): Omit<PredictedChoreItem, "kind"> {
  const model = loadPredictiveModel();
  const peakHours = getPeakActivityHours(model);
  const hour = new Date().getHours();
  const member = task.assignedTo;
  const stats = member
    ? signals.memberStats.find((s) => s.member === member)
    : undefined;

  let score = 0.55;
  let reason = "On today's schedule";

  if (task.status === "Overdue") {
    score = 0.92;
    reason = "Overdue — complete soon";
  } else if (dateIso > todayIso) {
    score = 0.5;
    reason = "Upcoming this week";
  }

  if (task.isKitchenDuty) {
    score += 0.12;
    reason = "Kitchen duty priority";
  }

  if (stats) {
    score += stats.weekRate * 0.2;
    if (stats.openToday >= 3) {
      score += 0.08;
      reason = `${member} has ${stats.openToday} open today`;
    }
    const peak =
      (member ? getMemberPeakHour(member) : null) ?? stats.preferredHour;
    if (peak != null && Math.abs(hour - peak) <= 2) {
      score += 0.1;
      reason = `Peak activity around ${peak}:00`;
    }
  }

  if (peakHours.includes(hour) && dateIso === todayIso) {
    score += 0.06;
  }

  if (activeMember && member === activeMember) {
    score += 0.08;
    reason = "Assigned to you";
  }

  if (!member) {
    score -= 0.1;
    reason = "Unassigned — assign for better odds";
  }

  score -= getTaskTimingBias(task.id) * 0.15;
  score *= getCategoryFeedbackBoost(task.isKitchenDuty ? "role" : "complete");
  score = Math.min(0.98, Math.max(0.2, score));

  const suggestedHour =
    (member ? getMemberPeakHour(member) : null) ??
    stats?.preferredHour ??
    peakHours[0] ??
    null;

  return {
    task,
    dateIso,
    priority: priorityFromScore(score, task),
    likelihood: likelihoodFromScore(score),
    score,
    completionProbability: score,
    reason,
    suggestedHour,
    member,
  };
}

function openTasks(tasks: ChoreTask[]): ChoreTask[] {
  return tasks.filter((t) => t.status !== "Done" && t.status !== "Skipped");
}

function buildItemsForDay(
  tasks: ChoreTask[],
  dateIso: string,
  todayIso: string,
  signals: ReturnType<typeof buildChoreAiSignals>,
  activeMember: HouseholdMember | null,
): PredictedChoreItem[] {
  return openTasks(tasks)
    .map((task) => {
      const scored = scoreTask(task, dateIso, todayIso, signals, activeMember);
      return {
        ...scored,
        kind: "scheduled" as const,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function buildPredictiveSchedule(
  schedule: ScheduleBundle,
  state: PersistedChoreState,
  notes: PersistedChoreNotes,
  todayIso: string,
  activeMember: HouseholdMember | null = null,
): PredictiveScheduleReport {
  const signals = buildChoreAiSignals(schedule, state);
  const model = loadPredictiveModel();
  const peakActivityHours = getPeakActivityHours(model);

  const todayItems = buildItemsForDay(
    schedule.today,
    todayIso,
    todayIso,
    signals,
    activeMember,
  );

  const weekDates = getWeekDates(todayIso);
  const weekMap = buildWeekTaskMap(weekDates, state, notes);

  const week: PredictiveDayGroup[] = weekDates.map((dateIso) => ({
    dateIso,
    label: formatChoreDayLabel(dateIso, todayIso),
    isToday: dateIso === todayIso,
    items: buildItemsForDay(weekMap[dateIso] ?? [], dateIso, todayIso, signals, activeMember),
  }));

  const suggestedExtra: PredictedChoreItem[] = [];
  if (
    signals.eveningPush &&
    todayItems.length > 0 &&
    !todayItems.some((i) => i.priority === "high")
  ) {
    const top = todayItems[0]!;
    suggestedExtra.push({
      ...top,
      kind: "suggested",
      priority: "high",
      reason: "Evening push — household behind pace",
      score: Math.min(0.95, top.score + 0.1),
      likelihood: "at_risk",
      completionProbability: top.completionProbability,
    });
  }

  const today = [...suggestedExtra, ...todayItems].slice(0, 12);
  const topFocus = today[0] ?? week.flatMap((d) => d.items)[0] ?? null;

  return {
    generatedAt: Date.now(),
    peakActivityHours,
    today,
    week,
    topFocus,
  };
}

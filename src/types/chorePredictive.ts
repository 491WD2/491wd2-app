import type { ChoreTask } from "./cleaning";
import type { HouseholdMember } from "./chore";

export type PredictivePriority = "high" | "medium" | "low";

export type PredictiveLikelihood = "likely" | "moderate" | "at_risk";

export type PredictiveTimingFeedback = "early" | "on_time" | "late" | "skipped";

export type PredictedChoreItem = {
  task: ChoreTask;
  dateIso: string;
  /** Scheduled task vs. AI-suggested focus (same task, extra nudge). */
  kind: "scheduled" | "suggested";
  priority: PredictivePriority;
  likelihood: PredictiveLikelihood;
  /** 0–1 for sorting and badges */
  score: number;
  completionProbability: number;
  reason: string;
  suggestedHour: number | null;
  member: HouseholdMember | "";
};

export type PredictiveDayGroup = {
  dateIso: string;
  label: string;
  isToday: boolean;
  items: PredictedChoreItem[];
};

export type PredictiveScheduleReport = {
  generatedAt: number;
  peakActivityHours: number[];
  today: PredictedChoreItem[];
  week: PredictiveDayGroup[];
  topFocus: PredictedChoreItem | null;
};

export type ChoreReminderPrefs = {
  version: 1;
  enabled: boolean;
  pushNotifications: boolean;
  /** Minutes before suggested window to surface reminder */
  leadMinutes: number;
  /** Empty = all members */
  members: HouseholdMember[];
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
};

export type ChoreReminder = {
  id: string;
  taskId: string;
  title: string;
  dateIso: string;
  member: HouseholdMember | "";
  message: string;
  priority: PredictivePriority;
  suggestedAt: number;
  expiresAt: number;
};

export type PredictiveModelRecord = {
  version: 1;
  /** taskId → rolling early/late/skip counts */
  taskTiming: Record<
    string,
    { early: number; onTime: number; late: number; skipped: number }
  >;
  /** member → preferred completion hour (0–23) */
  memberPeakHour: Partial<Record<HouseholdMember, number>>;
  /** Global hour histogram from completions */
  hourHistogram: number[];
  lastUpdated: number;
};

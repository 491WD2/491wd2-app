/**
 * Member dashboard — chore suggestions and progress (no personal notes in analytics).
 */

export type MemberSuggestionKind =
  | "overdue"
  | "due_today"
  | "pattern_match"
  | "streak"
  | "quick_win";

export type MemberChoreSuggestion = {
  id: string;
  kind: MemberSuggestionKind;
  title: string;
  detail: string;
  taskId?: string;
  priority: "high" | "medium" | "low";
  actionLabel?: string;
  emoji?: string;
};

export type MemberProgressPeriod = {
  label: string;
  completed: number;
  target: number;
  percent: number;
  emoji: string;
};

export type MemberTaskProgress = {
  weekly: MemberProgressPeriod;
  monthly: MemberProgressPeriod;
  /** Weekday labels where member completes most often */
  peakDays: string[];
};

import type { HouseholdMember } from "./chore";

export type ChoreSuggestionPriority = "high" | "medium" | "low";

export type ChoreSuggestionCategory =
  | "assign"
  | "complete"
  | "balance"
  | "role"
  | "history"
  | "personal";

export type ChoreSuggestionAction =
  | "navigate_schedule"
  | "navigate_users"
  | "assign"
  | "focus_member"
  | "focus_task";

export type ChoreSuggestionReason =
  | "next_task"
  | "room_affinity"
  | "unassigned"
  | "overdue"
  | "kitchen_duty"
  | "load_balance"
  | "support_member"
  | "star_performer"
  | "time_of_day"
  | "completion_pace"
  | "steady";

export type ChoreSuggestion = {
  id: string;
  priority: ChoreSuggestionPriority;
  category: ChoreSuggestionCategory;
  title: string;
  detail: string;
  /** 0–1 heuristic confidence (displayed as smart match %) */
  confidence: number;
  /** Stable code for feedback + documentation */
  reason: ChoreSuggestionReason;
  actionLabel?: string;
  action?: ChoreSuggestionAction;
  taskId?: string;
  member?: HouseholdMember;
  /** When true, copy is tailored to the active kiosk member */
  personalized?: boolean;
  /** Primary card — pulse highlight + optional task focus on Home */
  highlight?: boolean;
};

export type ChoreTimeOfDay = "morning" | "afternoon" | "evening";

export type ChorePersonalization = {
  greeting: string;
  subtitle: string;
  activeMember: HouseholdMember | null;
  timeOfDay: ChoreTimeOfDay;
  focusTaskId?: string;
  focusTaskTitle?: string;
  householdInsight?: string;
  completionRateToday: number;
  /** Short AI nudge shown under greeting when a highlight suggestion exists */
  aiNudge?: string;
  completionPace?: "ahead" | "on_track" | "behind";
};

export type ChoreToastTone = "success" | "info" | "warning";

export type ChoreToast = {
  id: string;
  tone: ChoreToastTone;
  message: string;
  taskId?: string;
};

/** Anonymized kiosk analytics — no free-text notes or PII beyond household role labels. */

export type KioskAnalyticsCategory =
  | "page"
  | "chore"
  | "gesture"
  | "modal"
  | "performance"
  | "interaction"
  | "system";

export type ChoreCompleteVia = "button" | "swipe" | "modal" | "keyboard" | "unknown";

export type KioskAnalyticsEvent = {
  id: string;
  ts: number;
  sessionId: string;
  category: KioskAnalyticsCategory;
  action: string;
  /** Screen or component surface, e.g. chores:schedule */
  surface?: string;
  metadata?: Record<string, string | number | boolean>;
  durationMs?: number;
};

export type KioskAnalyticsSummary = {
  sessionId: string;
  sessionStartedAt: number;
  totalEvents: number;
  pageViews: Record<string, number>;
  eventsByCategory: Record<KioskAnalyticsCategory, number>;
  choreCompletions: number;
  choreCompletionsByVia: Record<ChoreCompleteVia, number>;
  choreSkips: number;
  assignments: number;
  dragStarts: number;
  dragDrops: number;
  swipes: number;
  modalOpens: number;
  tabChanges: number;
  aiSuggestionAccepts: number;
  choreEditOpens: number;
  activeMemberChanges: number;
  performanceSamples: number;
  avgPerformanceMs: number | null;
  maxPerformanceMs: number | null;
  lastEventAt: number | null;
};

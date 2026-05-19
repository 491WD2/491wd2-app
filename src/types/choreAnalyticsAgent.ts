import type { HouseholdMember } from "./chore";
import type { KioskAnalyticsEvent } from "./kioskAnalytics";

/** Filter state for the analytics agent dashboard. */
export type AnalyticsAgentDateRange = "all" | "today" | "7d" | "30d";

export type AnalyticsChoreStatusFilter = "all" | "complete" | "skip" | "assign";

export type AnalyticsAgentFilters = {
  /** Page/surface filter — `all` or exact surface string */
  pageSurface: string;
  /** Household member or `all` */
  member: HouseholdMember | "all";
  choreStatus: AnalyticsChoreStatusFilter;
  dateRange: AnalyticsAgentDateRange;
};

export type AnalyticsBarDatum = {
  label: string;
  value: number;
  /** 0–100 width percent for bar chart */
  percent: number;
};

export type AnalyticsPieSlice = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type AnalyticsTimelineBucket = {
  /** Hour 0–23 label */
  label: string;
  hour: number;
  dragDrop: number;
  swipe: number;
  total: number;
};

export type AnalyticsMemberActivity = {
  member: string;
  assignments: number;
  completions: number;
  skips: number;
  score: number;
};

/** Aggregated metrics from filtered events. */
export type AnalyticsAgentReport = {
  filters: AnalyticsAgentFilters;
  events: readonly KioskAnalyticsEvent[];
  totalFiltered: number;
  pageViewBars: AnalyticsBarDatum[];
  choreOutcomeSlices: AnalyticsPieSlice[];
  gestureTimeline: AnalyticsTimelineBucket[];
  memberActivity: AnalyticsMemberActivity[];
  peakActivityHour: number | null;
  topPage: string | null;
  completions: number;
  skips: number;
  assignments: number;
  swipes: number;
  dragDrops: number;
};

/** Client-side AI insight bullets (no external API). */
export type AnalyticsAiInsight = {
  id: string;
  tone: "positive" | "neutral" | "warning";
  title: string;
  body: string;
};

export type AnalyticsAiBriefing = {
  summary: string;
  insights: AnalyticsAiInsight[];
  generatedAt: number;
};

export type ChoreAnalyticsAgentProps = {
  /** Close panel (e.g. hide analytics on ChoresPage) */
  onClose?: () => void;
  /** Initial AI insights panel visibility */
  defaultAiInsights?: boolean;
};

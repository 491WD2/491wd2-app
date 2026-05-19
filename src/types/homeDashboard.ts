/** Household home hub (My Build) — static planning types. */

export type HomeDashboardCardId =
  | "pantry"
  | "add-pantry"
  | "shopping"
  | "chores"
  | "calendar"
  | "messages"
  | "notes"
  | "scan";

/** User-facing My Build screens (App-level, not Backend Console). */
export type BuildUserModuleId =
  | "home"
  | "pantry"
  | "shopping"
  | "chores"
  | "calendar"
  | "messages"
  | "notes";

export type BuildUserView =
  | { screen: "home" }
  | { screen: "module"; moduleId: BuildUserModuleId; path: string }
  | { screen: "planned"; moduleId: BuildUserModuleId; pageLabel: string };

export type HomeCardNavigationTarget =
  | { kind: "module"; moduleId: BuildUserModuleId; path: string; pageLabel: string }
  | { kind: "planned"; moduleId: BuildUserModuleId; pageLabel: string };

export type HomeDashboardCardTier = "primary" | "secondary";

/** `live` = navigate into CurrentBuild route; `planned` = show inline “will be built next” copy. */
export type HomeDashboardCardSurface = "live" | "planned";

export type HomeDashboardQuickCard = {
  id: HomeDashboardCardId;
  tier: HomeDashboardCardTier;
  category: string;
  surface: HomeDashboardCardSurface;
  /** Short pill next to category, e.g. “Live” or “Soon”. */
  statusLabel: string;
  /** Optional headline count line (sample data until wired to real counts). */
  countLabel?: string;
  /** CTA line on the card footer. */
  nextAction: string;
  title: string;
  description: string;
  icon: string;
  /** Set when `surface` is `live`; opens in CurrentBuild. */
  href?: string;
  /** For `surface: "planned"` — used in “[name] will be built next.” */
  plannedName?: string;
};

export type HomeDashboardMetricTone = "orange" | "blue" | "green" | "purple" | "red" | "yellow";

export type HomeDashboardAssistantAction = {
  id: HomeDashboardCardId;
  label: string;
  emphasis?: "primary" | "secondary";
};

export type HomeDashboardHouseholdMetric = {
  id: string;
  label: string;
  value: number | string;
  chip: string;
  tone: HomeDashboardMetricTone;
  icon: string;
};

export type HomeDashboardShoppingRow = {
  id: string;
  name: string;
  category: string;
  checked?: boolean;
};

export type HomeDashboardPantryRow = {
  id: string;
  item: string;
  category: string;
  quantity: string;
  status: string;
};

export type HomeDashboardEventRow = {
  id: string;
  dateLabel: string;
  title: string;
  time: string;
  tone: "blue" | "green" | "purple" | "orange";
};

export type HomeDashboardMessageRow = {
  id: string;
  name: string;
  avatarPath?: string;
  preview: string;
  time: string;
  unread?: boolean;
};

export type HomeDashboardRecommendationRow = {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetId: HomeDashboardCardId;
};

export type HomeDashboardActivityFeedRow = {
  id: string;
  title: string;
  detail: string;
  tone: HomeDashboardMetricTone;
  icon: string;
};

export type HomeDashboardSnapshotMetric = {
  id: string;
  label: string;
  value: number;
  tone?: "default" | "warn";
};

export type HomeDashboardSuggestion = {
  id: string;
  label: string;
};

export type HomeDashboardActivityRow = {
  id: string;
  time: string;
  label: string;
  detail: string;
};

export type HomeDashboardSearchSuggestion = {
  id: string;
  title: string;
  category: string;
  description: string;
  actionLabel?: string;
  targetId?: HomeDashboardCardId;
};

export type HomeSimpleActionCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: HomeDashboardMetricTone;
  primaryAction: string;
  secondaryAction: string;
  primaryActionIcon: string;
  secondaryActionIcon: string;
  primaryTargetId?: HomeDashboardCardId;
  secondaryTargetId?: HomeDashboardCardId;
  primaryFallbackStatus: string;
  secondaryFallbackStatus: string;
};

export type HomeSimpleSideNote = {
  id: string;
  text: string;
};

export type HomeSimpleSideLink = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  targetId?: HomeDashboardCardId;
  fallbackStatus?: string;
};

import type {
  HomeDashboardActivityFeedRow,
  HomeDashboardActivityRow,
  HomeDashboardAssistantAction,
  HomeDashboardCardId,
  HomeCardNavigationTarget,
  HomeDashboardEventRow,
  HomeDashboardHouseholdMetric,
  HomeDashboardPantryRow,
  HomeDashboardQuickCard,
  HomeDashboardRecommendationRow,
  HomeDashboardSearchSuggestion,
  HomeDashboardShoppingRow,
  HomeDashboardSnapshotMetric,
  HomeDashboardSuggestion,
  HomeSimpleActionCard,
  HomeSimpleSideLink,
  HomeSimpleSideNote,
} from "../types/homeDashboard";
import { PANTRY_SAMPLE_ITEMS } from "./pantryData";

/** Map a Home quick-action card to a module route or planned placeholder. */
export function resolveHomeCardNavigation(cardId: HomeDashboardCardId): HomeCardNavigationTarget {
  switch (cardId) {
    case "pantry":
      return { kind: "module", moduleId: "pantry", path: "/pantry", pageLabel: "Pantry" };
    case "add-pantry":
      return {
        kind: "module",
        moduleId: "pantry",
        path: "/quick-add?type=pantry&name=New%20item",
        pageLabel: "Pantry",
      };
    case "scan":
      return { kind: "module", moduleId: "pantry", path: "/pantry", pageLabel: "Pantry" };
    case "shopping":
      return { kind: "module", moduleId: "shopping", path: "/shopping", pageLabel: "Shopping list" };
    case "chores":
      return { kind: "module", moduleId: "chores", path: "/tasks", pageLabel: "Chores" };
    case "calendar":
      return { kind: "module", moduleId: "calendar", path: "/calendar", pageLabel: "Calendar" };
    case "notes":
    default:
      return { kind: "planned", moduleId: "notes", pageLabel: "Notes" };
  }
}

/** Primary household workflows — larger visual weight on Home. */
export const HOME_DASHBOARD_QUICK_PRIMARY: HomeDashboardQuickCard[] = [
  {
    id: "pantry",
    tier: "primary",
    category: "Inventory",
    surface: "live",
    statusLabel: "Live",
    countLabel: "4 low stock · 2 expiring",
    nextAction: "Open pantry",
    title: "Pantry",
    description: "Check inventory, low stock, and expiring items.",
    icon: "▣",
    href: "/pantry",
  },
  {
    id: "shopping",
    tier: "primary",
    category: "Groceries",
    surface: "live",
    statusLabel: "Live",
    countLabel: "12 open items",
    nextAction: "Review shopping list",
    title: "Shopping list",
    description: "Add or review household shopping items.",
    icon: "☰",
    href: "/shopping",
  },
  {
    id: "chores",
    tier: "primary",
    category: "Household",
    surface: "live",
    statusLabel: "Live",
    countLabel: "7 open chores",
    nextAction: "Open chore board",
    title: "Chores",
    description: "Track cleaning and household responsibilities.",
    icon: "✓",
    href: "/tasks",
  },
  {
    id: "calendar",
    tier: "primary",
    category: "Schedule",
    surface: "live",
    statusLabel: "Live",
    countLabel: "This week",
    nextAction: "View calendar",
    title: "Calendar",
    description: "View appointments, plans, and household events.",
    icon: "◷",
    href: "/calendar",
  },
];

/** Secondary shortcuts — same card family, slightly quieter chrome. */
export const HOME_DASHBOARD_QUICK_SECONDARY: HomeDashboardQuickCard[] = [
  {
    id: "notes",
    tier: "secondary",
    category: "Reference",
    surface: "planned",
    statusLabel: "Soon",
    countLabel: undefined,
    nextAction: "Save notes (coming)",
    title: "Notes",
    description: "Save household reminders and documents.",
    icon: "≡",
    plannedName: "Notes",
  },
  {
    id: "add-pantry",
    tier: "secondary",
    category: "Inventory",
    surface: "live",
    statusLabel: "Live",
    countLabel: "Quick add",
    nextAction: "Start new row",
    title: "Add pantry item",
    description: "Start a new pantry inventory row.",
    icon: "+",
    href: "/quick-add?type=pantry&name=New%20item",
  },
  {
    id: "scan",
    tier: "secondary",
    category: "Inventory",
    surface: "live",
    statusLabel: "Live",
    countLabel: "Camera / barcode",
    nextAction: "Open scanner in Pantry",
    title: "Scan item",
    description: "Use Pantry’s barcode or camera flow to capture an item.",
    icon: "◎",
    href: "/pantry",
  },
];

export const HOME_DASHBOARD_QUICK_CARDS: HomeDashboardQuickCard[] = [
  ...HOME_DASHBOARD_QUICK_PRIMARY,
  ...HOME_DASHBOARD_QUICK_SECONDARY,
];

export const HOME_DASHBOARD_SNAPSHOT: HomeDashboardSnapshotMetric[] = [
  { id: "low-stock", label: "Low stock", value: 4, tone: "warn" },
  { id: "expiring", label: "Expiring soon", value: 2, tone: "warn" },
  { id: "chores", label: "Open chores", value: 7, tone: "default" },
  { id: "shopping", label: "Shopping items", value: 12, tone: "default" },
];

export const HOME_DASHBOARD_ASSISTANT_ACTIONS: HomeDashboardAssistantAction[] = [
  { id: "chores", label: "Add chore" },
  { id: "shopping", label: "Add shopping item", emphasis: "primary" },
  { id: "calendar", label: "Add calendar event" },
  { id: "add-pantry", label: "Add pantry item" },
  { id: "notes", label: "Add household note" },
  { id: "scan", label: "Scan item" },
];

export const HOME_DASHBOARD_METRICS: HomeDashboardHouseholdMetric[] = [
  {
    id: "pantry-total",
    label: "Total pantry items",
    value: PANTRY_SAMPLE_ITEMS.length,
    chip: "+8 this week",
    tone: "orange",
    icon: "▣",
  },
  {
    id: "shopping-total",
    label: "Shopping list items",
    value: 12,
    chip: "+5 today",
    tone: "blue",
    icon: "☰",
  },
  {
    id: "chores-open",
    label: "Open chores",
    value: 7,
    chip: "3 due today",
    tone: "green",
    icon: "✓",
  },
  {
    id: "events-upcoming",
    label: "Upcoming events",
    value: 4,
    chip: "Next: trash night",
    tone: "purple",
    icon: "◷",
  },
  {
    id: "notes-pinned",
    label: "Notes",
    value: 6,
    chip: "2 pinned",
    tone: "yellow",
    icon: "≡",
  },
];

export const HOME_DASHBOARD_SHOPPING_ROWS: HomeDashboardShoppingRow[] = [
  { id: "s1", name: "Milk", category: "Dairy" },
  { id: "s2", name: "Eggs", category: "Dairy" },
  { id: "s3", name: "Bananas", category: "Produce" },
  { id: "s4", name: "Laundry detergent", category: "Household" },
  { id: "s5", name: "Paper towels", category: "Household", checked: true },
];

export const HOME_DASHBOARD_PANTRY_ROWS: HomeDashboardPantryRow[] = PANTRY_SAMPLE_ITEMS.slice(0, 6).map((row) => ({
  id: row.id,
  item: row.name,
  category: row.category,
  quantity: `${row.quantity} ${row.unit}`,
  status: row.status,
}));

export const HOME_DASHBOARD_EVENTS: HomeDashboardEventRow[] = [
  { id: "e1", dateLabel: "Thu", title: "Trash night", time: "7:00 PM", tone: "orange" },
  { id: "e2", dateLabel: "Sat", title: "Grocery pickup", time: "10:30 AM", tone: "blue" },
  { id: "e3", dateLabel: "Sun", title: "Family calendar review", time: "6:00 PM", tone: "purple" },
];

export const HOME_DASHBOARD_ACTIVITY_FEED: HomeDashboardActivityFeedRow[] = [
  { id: "af1", title: "Shopping", detail: "Added paper towels", tone: "blue", icon: "☰" },
  { id: "af2", title: "Chores", detail: "Completed kitchen counters", tone: "green", icon: "✓" },
  { id: "af3", title: "Calendar", detail: "Trash night reminder set", tone: "purple", icon: "◷" },
  { id: "af4", title: "Pantry", detail: "Adjusted quantity · Oats", tone: "orange", icon: "▣" },
];

export const HOME_DASHBOARD_RECOMMENDATIONS: HomeDashboardRecommendationRow[] = [
  {
    id: "r1",
    title: "Review expiring pantry items",
    description: "Check low stock and expiration dates before shopping.",
    icon: "▣",
    targetId: "pantry",
  },
  {
    id: "r2",
    title: "Add shopping item",
    description: "Capture groceries while planning the week.",
    icon: "☰",
    targetId: "shopping",
  },
  {
    id: "r3",
    title: "Check chore board",
    description: "See what is due today and who is assigned.",
    icon: "✓",
    targetId: "chores",
  },
  {
    id: "r4",
    title: "Open calendar",
    description: "Review upcoming household events.",
    icon: "◷",
    targetId: "calendar",
  },
];

export const HOME_DASHBOARD_SUGGESTIONS: HomeDashboardSuggestion[] = [
  { id: "s1", label: "Review expiring pantry items" },
  { id: "s2", label: "Add shopping item" },
  { id: "s3", label: "Check chore board" },
  { id: "s4", label: "Open calendar" },
];

export const HOME_DASHBOARD_ACTIVITY: HomeDashboardActivityRow[] = [
  { id: "a1", time: "9:12a", label: "Pantry", detail: "Adjusted quantity · Oats" },
  { id: "a2", time: "Yesterday", label: "Shopping", detail: "Added · Paper towels" },
  { id: "a4", time: "Mon", label: "Chores", detail: "Completed · Kitchen counters" },
];

export function buildHomeDashboardSearchSuggestions(): HomeDashboardSearchSuggestion[] {
  const quickCards = HOME_DASHBOARD_QUICK_CARDS.map((card) => ({
    id: `quick-${card.id}`,
    title: card.title,
    category: card.surface === "planned" ? "Planned" : "Page",
    description: card.description,
    actionLabel: card.nextAction,
    targetId: card.id,
  }));

  const assistantActions = HOME_DASHBOARD_ASSISTANT_ACTIONS.map((action) => ({
    id: `action-${action.id}`,
    title: action.label,
    category: "Action",
    description: "Household quick action",
    actionLabel: action.label,
    targetId: action.id,
  }));

  const pantryItems = PANTRY_SAMPLE_ITEMS.map((item) => ({
    id: `pantry-${item.id}`,
    title: item.name,
    category: "Pantry",
    description: `${item.category} · ${item.status}`,
    actionLabel: "Open pantry",
    targetId: "pantry" as const,
  }));

  const shoppingItems = HOME_DASHBOARD_SHOPPING_ROWS.map((row) => ({
    id: `shopping-${row.id}`,
    title: row.name,
    category: "Shopping",
    description: row.category,
    actionLabel: "Open shopping list",
    targetId: "shopping" as const,
  }));

  const events = HOME_DASHBOARD_EVENTS.map((event) => ({
    id: `event-${event.id}`,
    title: event.title,
    category: "Calendar",
    description: `${event.dateLabel} · ${event.time}`,
    actionLabel: "Open calendar",
    targetId: "calendar" as const,
  }));

  const recommendations = HOME_DASHBOARD_RECOMMENDATIONS.map((item) => ({
    id: `recommend-${item.id}`,
    title: item.title,
    category: "Recommendation",
    description: item.description,
    actionLabel: item.title,
    targetId: item.targetId,
  }));

  const activity = HOME_DASHBOARD_ACTIVITY_FEED.map((row) => ({
    id: `activity-${row.id}`,
    title: row.title,
    category: "Activity",
    description: row.detail,
  }));

  const chores = [
    {
      id: "chore-open",
      title: "Open chores",
      category: "Chores",
      description: "7 open chores · 3 due today",
      actionLabel: "Open chore board",
      targetId: "chores" as const,
    },
  ];

  return [
    ...quickCards,
    ...assistantActions,
    ...pantryItems,
    ...shoppingItems,
    ...events,
    ...recommendations,
    ...activity,
    ...chores,
  ];
}

export function filterHomeDashboardSearchSuggestions(
  query: string,
  limit = 8,
): HomeDashboardSearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return buildHomeDashboardSearchSuggestions()
    .filter((item) => {
      const haystack = `${item.title} ${item.category} ${item.description} ${item.actionLabel ?? ""}`.toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit);
}

export const HOME_SIMPLE_ACTIONS: HomeSimpleActionCard[] = [
  {
    id: "scan-item",
    title: "Scan Item",
    description: "Barcode or camera in pantry",
    icon: "▌",
    tone: "orange",
    primaryAction: "Scan Barcode",
    secondaryAction: "Open Camera",
    primaryActionIcon: "▌",
    secondaryActionIcon: "◎",
    primaryTargetId: "scan",
    secondaryTargetId: "scan",
    primaryFallbackStatus: "Scanner will open in Pantry.",
    secondaryFallbackStatus: "Scanner will open in Pantry.",
  },
  {
    id: "add-shopping-item",
    title: "Add Shopping Item",
    description: "Household shopping list",
    icon: "☰",
    tone: "blue",
    primaryAction: "Quick Add",
    secondaryAction: "Open List",
    primaryActionIcon: "+",
    secondaryActionIcon: "☰",
    primaryTargetId: "shopping",
    secondaryTargetId: "shopping",
    primaryFallbackStatus: "Shopping list will open next.",
    secondaryFallbackStatus: "Shopping list will open next.",
  },
  {
    id: "add-pantry-item",
    title: "Add Pantry Item",
    description: "New inventory row",
    icon: "▣",
    tone: "orange",
    primaryAction: "Manual Entry",
    secondaryAction: "Recent Items",
    primaryActionIcon: "✎",
    secondaryActionIcon: "▣",
    primaryTargetId: "add-pantry",
    secondaryTargetId: "pantry",
    primaryFallbackStatus: "Pantry quick add will open next.",
    secondaryFallbackStatus: "Pantry will open next.",
  },
  {
    id: "add-chore",
    title: "Add Chore",
    description: "Chore tracker — assign and due dates",
    icon: "✓",
    tone: "green",
    primaryAction: "Today",
    secondaryAction: "In the Future",
    primaryActionIcon: "◷",
    secondaryActionIcon: "→",
    primaryTargetId: "chores",
    secondaryTargetId: "chores",
    primaryFallbackStatus: "Chore board will open next.",
    secondaryFallbackStatus: "Chore board will open next.",
  },
  {
    id: "add-calendar-event",
    title: "Add Calendar Event",
    description: "Planner activities",
    icon: "◷",
    tone: "purple",
    primaryAction: "Today",
    secondaryAction: "Future Event",
    primaryActionIcon: "◷",
    secondaryActionIcon: "→",
    primaryTargetId: "calendar",
    secondaryTargetId: "calendar",
    primaryFallbackStatus: "Planner will open next.",
    secondaryFallbackStatus: "Planner will open next.",
  },
];

export const HOME_SIMPLE_SIDE_NOTES: HomeSimpleSideNote[] = [
  { id: "note-1", text: "Dinner at 6:00" },
  { id: "note-2", text: "Need paper towels" },
  { id: "note-3", text: "Trash goes out tonight." },
];

export const HOME_SIMPLE_SIDE_LINKS: HomeSimpleSideLink[] = [
  {
    id: "family-hub",
    label: "Family Hub",
    description: "Stay connected and on the same page.",
    icon: "⌂",
    fallbackStatus: "Family Hub opens in the full household app.",
  },
  {
    id: "pantry",
    label: "Pantry",
    description: "View inventory and manage supplies.",
    icon: "▣",
    targetId: "pantry",
  },
  {
    id: "planner",
    label: "Planner",
    description: "See schedules and upcoming events.",
    icon: "◷",
    targetId: "calendar",
    fallbackStatus: "Planner will open next.",
  },
];

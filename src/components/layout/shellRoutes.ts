import {
  BookOpen,
  Bell,
  CalendarDays,
  CalendarRange,
  Camera,
  FolderKanban,
  Home,
  LayoutDashboard,
  MessageCircle,
  Package,
  PawPrint,
  Repeat,
  Settings,
  Shield,
  ShoppingCart,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

export type RouteKey =
  | "dashboard"
  | "adminux"
  | "messages"
  | "kiosk"
  | "family"
  | "tasks"
  | "kitchen"
  | "kitchenSchedule"
  | "notifications"
  | "subscriptions"
  | "pets"
  | "projects"
  | "pantry"
  | "shopping"
  | "calendar"
  | "planner"
  | "docs"
  | "photos"
  | "routines"
  | "emergency"
  | "settings";

/** Sidebar-only / deep links — not in compact mobile header strip. */
export const PRIMARY_NAV_EXCLUDED = new Set<RouteKey>([
  "family",
  "projects",
  "docs",
  "planner",
  "photos",
  "routines",
  /** Dedicated checklist — sidebar + deep links, not the compact bottom strip. */
  "kitchen",
  "notifications",
  "subscriptions",
  /** Pets lives in sidebar Household tools, not the compact bottom strip. */
  "pets",
  /** AdminUX command center — sidebar Home; keep bottom strip on short labels. */
  "adminux",
  "dashboard",
  "kitchenSchedule",
  "emergency",
]);

export function isPrimaryNavRoute(key: RouteKey): boolean {
  return !PRIMARY_NAV_EXCLUDED.has(key);
}

/**
 * Main sidebar modules — wake/command stays lean; tools live under Household tools.
 * Household roster lives under Settings → Members & PINs.
 */
export const SIDEBAR_ROUTE_KEYS = [
  "adminux",
  "messages",
  "calendar",
  "shopping",
  "pantry",
  "tasks",
  "emergency",
  "pets",
  "subscriptions",
  "projects",
  "photos",
  "planner",
  "routines",
  "settings",
] as const satisfies readonly RouteKey[];

/** Daily household surfaces on the wake page + primary sidebar. */
export const SIDEBAR_PRIMARY_KEYS = [
  "adminux",
  "messages",
  "calendar",
  "shopping",
  "pantry",
  "tasks",
  "emergency",
] as const satisfies readonly RouteKey[];

/** Kept off the wake/command large cards; available in sidebar. */
export const SIDEBAR_HOUSEHOLD_TOOL_KEYS = [
  "pets",
  "subscriptions",
  "projects",
  "photos",
  "planner",
  "routines",
] as const satisfies readonly RouteKey[];

const SIDEBAR_ROUTE_SET = new Set<RouteKey>(SIDEBAR_ROUTE_KEYS);

export function isSidebarRoute(key: RouteKey): boolean {
  return SIDEBAR_ROUTE_SET.has(key);
}

/** Includes routes that are not main module tabs (e.g. login). */
export type ShellRoute = RouteKey | "login" | "cloud-login" | "not-found" | "quick-add";

export const routes: Array<{
  key: RouteKey;
  label: string;
  icon: typeof Home;
}> = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "adminux", label: "Home", icon: LayoutDashboard },
  { key: "messages", label: "Messages", icon: MessageCircle },
  { key: "pantry", label: "Pantry & Inventory", icon: Package },
  { key: "shopping", label: "Shopping", icon: ShoppingCart },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  /** Combined cleaning + kitchen workflows — single household surface. */
  { key: "tasks", label: "Cleaning / Kitchen", icon: Sparkles },
  { key: "kitchen", label: "Kitchen Assignments", icon: UtensilsCrossed },
  { key: "kitchenSchedule", label: "Kitchen Schedule", icon: CalendarRange },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "subscriptions", label: "Subscriptions", icon: Wallet },
  { key: "pets", label: "Pets", icon: PawPrint },
  { key: "family", label: "Members", icon: Users },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "planner", label: "Planner", icon: CalendarDays },
  { key: "docs", label: "Notes", icon: BookOpen },
  { key: "photos", label: "Photos", icon: Camera },
  { key: "routines", label: "Routines", icon: Repeat },
  { key: "emergency", label: "Emergency Planning", icon: Shield },
  { key: "settings", label: "Settings", icon: Settings },
];

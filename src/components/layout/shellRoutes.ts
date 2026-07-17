import {
  BookOpen,
  Bell,
  CalendarDays,
  CalendarRange,
  FolderKanban,
  Home,
  LayoutDashboard,
  Package,
  PawPrint,
  Settings,
  ShoppingCart,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

export type RouteKey =
  | "dashboard"
  | "adminux"
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
  | "settings";

/** Sidebar-only / deep links — not in compact mobile header strip. */
export const PRIMARY_NAV_EXCLUDED = new Set<RouteKey>([
  "family",
  "projects",
  "docs",
  "planner",
  /** Dedicated checklist — sidebar + deep links, not the compact bottom strip. */
  "kitchen",
  "notifications",
  "subscriptions",
  /** Pets lives in sidebar + More menu, not the compact header strip. */
  "pets",
  /** AdminUX command center — sidebar primary; keep bottom strip uncluttered. */
  "adminux",
]);

export function isPrimaryNavRoute(key: RouteKey): boolean {
  return !PRIMARY_NAV_EXCLUDED.has(key);
}

/**
 * Main sidebar modules. Household roster / members live under Settings → Members & PINs (not here).
 */
export const SIDEBAR_ROUTE_KEYS = [
  "dashboard",
  "adminux",
  "pantry",
  "shopping",
  "calendar",
  "notifications",
  "subscriptions",
  "tasks",
  "pets",
  "settings",
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
  { key: "adminux", label: "Command Center", icon: LayoutDashboard },
  { key: "pantry", label: "Inventory", icon: Package },
  { key: "shopping", label: "Shopping", icon: ShoppingCart },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
  /** Combined cleaning + kitchen workflows — single household surface. */
  { key: "tasks", label: "Cleaning", icon: Sparkles },
  { key: "kitchen", label: "Kitchen Assignments", icon: UtensilsCrossed },
  { key: "kitchenSchedule", label: "Kitchen Schedule", icon: CalendarRange },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "subscriptions", label: "Subscriptions", icon: Wallet },
  { key: "pets", label: "Pets", icon: PawPrint },
  { key: "family", label: "Members", icon: Users },
  { key: "projects", label: "Workspace", icon: FolderKanban },
  { key: "planner", label: "Calendar", icon: CalendarDays },
  { key: "docs", label: "Notes", icon: BookOpen },
  { key: "settings", label: "Settings", icon: Settings },
];

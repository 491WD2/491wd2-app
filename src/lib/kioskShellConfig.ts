import type { ShellRoute } from "../components/layout/shellRoutes";

export type KioskNavId =
  | "dashboard"
  | "shopping"
  | "pantry"
  | "calendar"
  | "notifications"
  | "subscriptions"
  | "chores"
  | "pets"
  | "settings";

export const KIOSK_NAV_ORDER: KioskNavId[] = [
  "dashboard",
  "shopping",
  "pantry",
  "calendar",
  "notifications",
  "subscriptions",
  "chores",
  "pets",
  "settings",
];

const UNIFIED_SHELL_ROUTES = new Set<ShellRoute>([
  "dashboard",
  "shopping",
  "pantry",
  "tasks",
  "kitchen",
  "kitchenSchedule",
  "family",
  "calendar",
  "planner",
  "notifications",
  "subscriptions",
  "pets",
  "quick-add",
  "settings",
]);

/** Routes that use the unified kiosk shell (sidebar + header + warm panel). */
export function usesUnifiedKioskShell(route: ShellRoute): boolean {
  return UNIFIED_SHELL_ROUTES.has(route);
}

export function resolveKioskNavFromShell(
  route: ShellRoute,
  locationHref?: string,
): KioskNavId {
  const href = locationHref ?? "";
  const search = href.includes("?") ? href.slice(href.indexOf("?")) : "";
  if (search.includes("analytics=1")) {
    return "chores";
  }
  if (route === "pantry" || href.includes("view=pantry")) {
    return "pantry";
  }
  if (route === "shopping") {
    return "shopping";
  }
  if (route === "notifications") {
    return "notifications";
  }
  if (route === "subscriptions") {
    return "subscriptions";
  }
  if (route === "pets") {
    return "pets";
  }
  if (route === "quick-add") {
    return "dashboard";
  }
  if (route === "tasks" || route === "kitchen") {
    return "chores";
  }
  if (route === "kitchenSchedule") {
    return "chores";
  }
  if (route === "calendar" || route === "planner") {
    return "calendar";
  }
  if (route === "settings") {
    return "settings";
  }
  return "dashboard";
}

export function resolveKioskNavFromPath(pathname: string, search = ""): KioskNavId {
  if (search.includes("analytics=1") || pathname === "/chores") {
    return "chores";
  }
  if (pathname.startsWith("/pantry")) {
    return "pantry";
  }
  if (pathname.startsWith("/shopping")) {
    return "shopping";
  }
  if (pathname.startsWith("/notifications")) {
    return "notifications";
  }
  if (pathname.startsWith("/subscriptions")) {
    return "subscriptions";
  }
  if (pathname.startsWith("/pets")) {
    return "pets";
  }
  if (pathname.startsWith("/quick-add")) {
    return "dashboard";
  }
  if (pathname.startsWith("/chores") || pathname.startsWith("/cleaning")) {
    return "chores";
  }
  if (pathname.startsWith("/kitchen-schedule")) {
    return "chores";
  }
  if (pathname.startsWith("/calendar")) {
    return "calendar";
  }
  if (pathname.startsWith("/settings")) {
    return "settings";
  }
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return "dashboard";
  }
  return "dashboard";
}

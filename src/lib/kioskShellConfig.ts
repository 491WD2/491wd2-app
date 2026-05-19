import type { ShellRoute } from "../components/layout/shellRoutes";
import type { MyBuildUserView } from "./appNavigation";

export type KioskNavId =
  | "dashboard"
  | "pantry"
  | "chores"
  | "members"
  | "calendar"
  | "analytics"
  | "settings";

export const KIOSK_NAV_ORDER: KioskNavId[] = [
  "dashboard",
  "pantry",
  "chores",
  "members",
  "calendar",
  "analytics",
  "settings",
];

const UNIFIED_SHELL_ROUTES = new Set<ShellRoute>([
  "dashboard",
  "pantry",
  "tasks",
  "kitchen",
  "family",
  "calendar",
  "planner",
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
    return "analytics";
  }
  if (route === "pantry" || href.includes("view=pantry")) {
    return "pantry";
  }
  if (route === "tasks" || route === "kitchen") {
    return "chores";
  }
  if (route === "family") {
    return "members";
  }
  if (route === "calendar" || route === "planner") {
    return "calendar";
  }
  if (route === "settings") {
    return "settings";
  }
  return "dashboard";
}

export function resolveKioskNavFromBuildView(view: MyBuildUserView): KioskNavId {
  if (view.screen === "home" || view.screen === "planned") {
    return "dashboard";
  }
  if (view.screen === "chores" || view.screen === "cleaning") {
    return "chores";
  }
  if (view.screen === "product-library") {
    return "pantry";
  }
  if (view.screen === "release-checklist") {
    return "analytics";
  }
  if (view.screen === "module") {
    if (view.moduleId === "pantry" || view.path.includes("view=pantry")) {
      return "pantry";
    }
    if (view.moduleId === "calendar") {
      return "calendar";
    }
    if (view.moduleId === "shopping") {
      return "dashboard";
    }
  }
  return "dashboard";
}

export function resolveKioskNavFromPath(pathname: string, search = ""): KioskNavId {
  if (search.includes("analytics=1") || pathname === "/chores") {
    return pathname === "/chores" ? "chores" : "analytics";
  }
  if (pathname.startsWith("/pantry")) {
    return "pantry";
  }
  if (pathname.startsWith("/chores") || pathname.startsWith("/cleaning")) {
    return "chores";
  }
  if (pathname.startsWith("/family")) {
    return "members";
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

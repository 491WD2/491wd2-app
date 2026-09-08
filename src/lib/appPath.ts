import {
  type RouteKey,
  type ShellRoute,
} from "../components/layout/shellRoutes";

export const CANONICAL_HOME_PATH = "/adminux";
export const CANONICAL_TASKS_PATH = "/tasks";

export const routePathMap: Record<RouteKey, string> = {
  dashboard: CANONICAL_HOME_PATH,
  adminux: CANONICAL_HOME_PATH,
  messages: "/messages",
  kiosk: "/kiosk",
  family: "/family",
  tasks: CANONICAL_TASKS_PATH,
  kitchen: "/kitchen",
  kitchenSchedule: "/kitchen-schedule",
  notifications: "/notifications",
  subscriptions: "/subscriptions",
  pets: "/pets",
  projects: "/projects",
  pantry: "/pantry",
  shopping: "/shopping",
  calendar: "/calendar",
  planner: "/planner",
  docs: "/docs",
  photos: "/photos",
  routines: "/routines",
  emergency: "/emergency",
  settings: "/settings",
};

const HOME_ALIAS_PATHS = new Set([
  "/",
  "/home",
  "/dashboard",
  "/login",
  "/kiosk-login",
]);

export function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function isHomeAliasPath(pathname: string): boolean {
  return HOME_ALIAS_PATHS.has(normalizePathname(pathname));
}

/** Unmounted legacy kiosk paths. Do not treat these as live product routes. */
export function isLegacyChorePath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === "/chores" || path.startsWith("/cleaning");
}

/**
 * Compatibility replace targets. Home aliases → `/adminux`.
 * Dead `/chores` and `/cleaning/*` → live Cleaning / Kitchen (`/tasks`).
 */
export function compatibilityRedirectPath(pathname: string): string | null {
  const path = normalizePathname(pathname);
  if (isHomeAliasPath(path)) {
    return CANONICAL_HOME_PATH;
  }
  if (isLegacyChorePath(path)) {
    return CANONICAL_TASKS_PATH;
  }
  return null;
}

export function parseAppPath(pathname: string): {
  activeRoute: ShellRoute;
  memberId?: string;
} {
  const path = normalizePathname(pathname);
  const [, firstSegment, secondSegment] = path.split("/");

  if (!firstSegment || isHomeAliasPath(path)) {
    return { activeRoute: "adminux" };
  }

  if (isLegacyChorePath(path)) {
    return { activeRoute: "tasks" };
  }

  if (firstSegment === "cloud-login") {
    return { activeRoute: "cloud-login" };
  }

  if (firstSegment === "quick-add") {
    return { activeRoute: "quick-add" };
  }

  if (firstSegment === "kiosk") {
    return { activeRoute: "kiosk" };
  }

  if (firstSegment === "kitchen-schedule") {
    return { activeRoute: "kitchenSchedule" };
  }

  if (firstSegment === "planner") {
    return { activeRoute: "planner" };
  }

  if (firstSegment === "family") {
    return {
      activeRoute: "family",
      memberId: secondSegment ? decodeURIComponent(secondSegment) : undefined,
    };
  }

  if (isRouteKey(firstSegment)) {
    return { activeRoute: firstSegment };
  }

  return { activeRoute: "not-found" };
}

function isRouteKey(value: string): value is RouteKey {
  return Object.keys(routePathMap).includes(value);
}

/** Paths used by live sidebar / bottom-nav destinations. */
export function liveNavPaths(): string[] {
  return Object.values(routePathMap);
}

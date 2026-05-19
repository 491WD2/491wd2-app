import type { BuildUserView } from "../types/homeDashboard";
import type { CleaningPageId } from "../types/chore";

export const MY_BUILD_NAV_EXPANDED_CATEGORIES_KEY = "491wd-my-build-nav-expanded-categories";
export const MY_BUILD_SIDEBAR_COLLAPSED_KEY = "491wd-my-build-sidebar-collapsed";

/** When `"1"`, sidebar shows Tools/Admin links (Release Checklist, Backend Console). */
export const APP_NAV_SHOW_ADMIN_KEY = "491wd-show-admin-nav";

export const ADMIN_BACKEND_PATH = "/admin/backend";

export type AppShellView = "build" | "backend";

export type AppNavCategoryId = "home" | "grocery" | "household" | "family" | "tools";

/**
 * kiosk — household Surface Pro navigation
 * admin — internal tools (still registered; URL + flag)
 * hidden — registered for deep links only (cleaning sub-routes, legacy hubs)
 */
export type AppNavAudience = "kiosk" | "admin" | "hidden";

export type AppNavView =
  | {
      kind: "build";
      build: MyBuildUserView;
    }
  | { kind: "backend" };

export type AppNavPageRegistration = {
  id: string;
  label: string;
  category: AppNavCategoryId;
  icon: string;
  view: AppNavView;
  /** Defaults to kiosk when omitted. */
  audience?: AppNavAudience;
};

export type AppNavCategoryGroup = {
  categoryId: AppNavCategoryId;
  label: string;
  pages: AppNavPageRegistration[];
};

type AppNavCategoryDefinition = {
  id: AppNavCategoryId;
  label: string;
};

const APP_NAV_CATEGORIES: AppNavCategoryDefinition[] = [
  { id: "home", label: "Home" },
  { id: "grocery", label: "Grocery" },
  { id: "household", label: "Household" },
  { id: "family", label: "Family" },
  { id: "tools", label: "Tools" },
];

const registeredPages: AppNavPageRegistration[] = [];

export function registerAppPage(page: AppNavPageRegistration): AppNavPageRegistration {
  registeredPages.push(page);
  return page;
}

export function isAdminNavEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(APP_NAV_SHOW_ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminNavEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(APP_NAV_SHOW_ADMIN_KEY, enabled ? "1" : "0");
}

export type AppNavigationOptions = {
  /** Include admin-audience pages (Release Checklist, Backend Console). */
  includeAdmin?: boolean;
  /** Include hidden-audience pages (normally omitted from sidebar). */
  includeHidden?: boolean;
};

function pageVisibleInSidebar(
  page: AppNavPageRegistration,
  options: AppNavigationOptions,
): boolean {
  const audience = page.audience ?? "kiosk";
  if (audience === "hidden") {
    return options.includeHidden === true;
  }
  if (audience === "admin") {
    return options.includeAdmin === true;
  }
  return true;
}

export function getAppNavigation(options: AppNavigationOptions = {}): AppNavCategoryGroup[] {
  const includeAdmin = options.includeAdmin ?? isAdminNavEnabled();
  const filterOptions = { ...options, includeAdmin };

  return APP_NAV_CATEGORIES.map((category) => ({
    categoryId: category.id,
    label: category.label,
    pages: registeredPages.filter(
      (page) => page.category === category.id && pageVisibleInSidebar(page, filterOptions),
    ),
  })).filter((group) => group.pages.length > 0);
}

/** Kiosk-first sidebar (default for AppSidebar). */
export function getKioskNavigation(): AppNavCategoryGroup[] {
  return getAppNavigation({ includeAdmin: isAdminNavEnabled(), includeHidden: false });
}

export function getAllRegisteredPages(): readonly AppNavPageRegistration[] {
  return registeredPages;
}

export function getAppNavigationAudit(): Array<{
  id: string;
  label: string;
  category: AppNavCategoryId;
  audience: AppNavAudience;
  sidebarDefault: boolean;
}> {
  return registeredPages.map((page) => {
    const audience = page.audience ?? "kiosk";
    return {
      id: page.id,
      label: page.label,
      category: page.category,
      audience,
      sidebarDefault: pageVisibleInSidebar(page, { includeAdmin: false, includeHidden: false }),
    };
  });
}

export function findAppNavPage(pageId: string): AppNavPageRegistration | undefined {
  return registeredPages.find((page) => page.id === pageId);
}

export function findAppNavCategoryForPage(pageId: string): AppNavCategoryId | undefined {
  return findAppNavPage(pageId)?.category;
}

export type MyBuildUserView =
  | BuildUserView
  | { screen: "product-library" }
  | { screen: "release-checklist" }
  | { screen: "chores" }
  | { screen: "cleaning"; page: CleaningPageId; roomSlug?: string };

const CLEANING_PAGE_IDS: CleaningPageId[] = [
  "today",
  "this-week",
  "calendar",
  "unscheduled",
  "archive",
  "weekly-reset",
  "rotation",
  "daily",
  "weekly",
  "monthly",
  "seasonal",
  "yearly",
  "deep",
  "recurring",
  "supplies",
  "rooms",
  "room",
];

export function resolveCleaningFromPathname(pathname: string): {
  page: CleaningPageId;
  roomSlug?: string;
} | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  if (normalized === "/chores") {
    return null;
  }
  if (!normalized.startsWith("/cleaning")) {
    return null;
  }
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] !== "cleaning") {
    return null;
  }
  if (parts[1] === "room" && parts[2]) {
    return { page: "room", roomSlug: parts[2] };
  }
  const page = parts[1] as CleaningPageId | undefined;
  if (page && CLEANING_PAGE_IDS.includes(page) && page !== "room") {
    return { page };
  }
  return null;
}

export function cleaningHistoryPath(page: CleaningPageId, roomSlug?: string): string {
  if (page === "room" && roomSlug) {
    return `/cleaning/room/${roomSlug}`;
  }
  return `/cleaning/${page}`;
}

export function resolveAppNavActivePageId({
  activeView,
  buildUserView,
}: {
  activeView: AppShellView;
  buildUserView: MyBuildUserView;
}): string {
  if (activeView === "backend") {
    return "backend-console";
  }

  if (buildUserView.screen === "home") {
    return "home";
  }

  if (buildUserView.screen === "product-library") {
    return "product-library";
  }

  if (buildUserView.screen === "release-checklist") {
    return "release-checklist";
  }

  if (buildUserView.screen === "chores") {
    return "chores";
  }

  if (buildUserView.screen === "cleaning") {
    if (buildUserView.page === "room" && buildUserView.roomSlug) {
      return `cleaning-room-${buildUserView.roomSlug}`;
    }
    return `cleaning-${buildUserView.page}`;
  }

  if (buildUserView.screen === "planned") {
    if (buildUserView.moduleId === "notes") {
      return "notes";
    }
    return "home";
  }

  if (buildUserView.screen === "module") {
    const path = buildUserView.path.split("?")[0] ?? buildUserView.path;
    if (buildUserView.path.includes("action=scan") || buildUserView.path.includes("scan=1")) {
      return "scan-product";
    }
    if (path === "/shopping") {
      return "shopping";
    }
    if (path === "/pantry") {
      if (buildUserView.path.includes("view=pantry")) {
        return "pantry";
      }
      return "inventory";
    }
    if (path === "/tasks") {
      return "chores";
    }
    if (path === "/calendar") {
      return "calendar";
    }
    if (path === "/messages") {
      return "messages";
    }
    if (path === "/family") {
      return "members";
    }
    if (path === "/" && buildUserView.moduleId === "home") {
      return "family-hub";
    }
  }

  return "home";
}

export function applyAppNavPageNavigation(pageId: string): {
  activeView: AppShellView;
  buildUserView: MyBuildUserView;
  historyPath: string;
} | null {
  const page = findAppNavPage(pageId);
  if (!page) {
    return null;
  }

  if (page.view.kind === "backend") {
    return {
      activeView: "backend",
      buildUserView: { screen: "home" },
      historyPath: ADMIN_BACKEND_PATH,
    };
  }

  const buildView = page.view.build;
  if (buildView.screen === "home") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: "/",
    };
  }

  if (buildView.screen === "product-library") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: "/product-library",
    };
  }

  if (buildView.screen === "release-checklist") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: "/release-checklist",
    };
  }

  if (buildView.screen === "chores") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: "/chores",
    };
  }

  if (buildView.screen === "cleaning") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: cleaningHistoryPath(buildView.page, buildView.roomSlug),
    };
  }

  if (buildView.screen === "planned") {
    return {
      activeView: "build",
      buildUserView: buildView,
      historyPath: "/",
    };
  }

  return {
    activeView: "build",
    buildUserView: buildView,
    historyPath: buildView.path,
  };
}

export function readAppLocationHref(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function splitAppHref(href: string): { pathname: string; search: string } {
  const url = new URL(href, "http://localhost");
  const pathname = url.pathname.replace(/\/$/, "") || "/";
  return { pathname, search: url.search };
}

function hrefMatchesRegisteredHistoryPath(
  pathname: string,
  search: string,
  historyPath: string,
): boolean {
  const target = splitAppHref(historyPath);
  if (target.pathname !== pathname) {
    return false;
  }

  if (target.search) {
    return search === target.search;
  }

  if (pathname === "/pantry") {
    return !search.includes("view=pantry");
  }

  if (pathname === "/shopping") {
    return !search.includes("action=scan") && !search.includes("scan=1");
  }

  return search === "";
}

export function resolveAppShellFromHref(
  href: string = readAppLocationHref(),
): {
  activeView: AppShellView;
  buildUserView: MyBuildUserView;
} {
  const { pathname, search } = splitAppHref(href);

  if (pathname === ADMIN_BACKEND_PATH) {
    return {
      activeView: "backend",
      buildUserView: { screen: "home" },
    };
  }

  if (search.includes("admin=1") || search.includes("admin=true")) {
    setAdminNavEnabled(true);
  }

  const cleaningTarget = resolveCleaningFromPathname(pathname);
  if (cleaningTarget) {
    return {
      activeView: "build",
      buildUserView: {
        screen: "cleaning",
        page: cleaningTarget.page,
        roomSlug: cleaningTarget.roomSlug,
      },
    };
  }

  const match = registeredPages
    .map((page) => ({
      page,
      target: applyAppNavPageNavigation(page.id),
    }))
    .filter(
      (
        entry,
      ): entry is {
        page: AppNavPageRegistration;
        target: NonNullable<ReturnType<typeof applyAppNavPageNavigation>>;
      } => {
        if (!entry.target) {
          return false;
        }
        return hrefMatchesRegisteredHistoryPath(pathname, search, entry.target.historyPath);
      },
    )
    .sort((left, right) => {
      const lengthDiff = right.target.historyPath.length - left.target.historyPath.length;
      if (lengthDiff !== 0) {
        return lengthDiff;
      }
      if (left.page.id === "home") {
        return -1;
      }
      if (right.page.id === "home") {
        return 1;
      }
      return 0;
    })[0];

  if (match) {
    return {
      activeView: match.target.activeView,
      buildUserView: match.target.buildUserView,
    };
  }

  return {
    activeView: "build",
    buildUserView: { screen: "home" },
  };
}

export function loadMyBuildExpandedCategories(): Record<string, boolean> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(MY_BUILD_NAV_EXPANDED_CATEGORIES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveMyBuildExpandedCategories(state: Record<string, boolean>) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MY_BUILD_NAV_EXPANDED_CATEGORIES_KEY, JSON.stringify(state));
}

export function loadMyBuildSidebarCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(MY_BUILD_SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMyBuildSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(MY_BUILD_SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
}

registerAppPage({
  id: "home",
  label: "Home",
  category: "home",
  icon: "home",
  view: { kind: "build", build: { screen: "home" } },
});

registerAppPage({
  id: "shopping",
  label: "Shopping",
  category: "grocery",
  icon: "shopping-cart",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "shopping", path: "/shopping" },
  },
});

registerAppPage({
  id: "pantry",
  label: "Pantry",
  category: "grocery",
  icon: "package",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "pantry", path: "/pantry?view=pantry" },
  },
});

registerAppPage({
  id: "inventory",
  label: "Inventory",
  category: "grocery",
  icon: "boxes",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "pantry", path: "/pantry" },
  },
});

registerAppPage({
  id: "product-library",
  label: "Product Library",
  category: "grocery",
  icon: "library",
  view: { kind: "build", build: { screen: "product-library" } },
});

registerAppPage({
  id: "scan-product",
  label: "Scan Product",
  category: "grocery",
  icon: "scan-line",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "shopping", path: "/shopping?action=scan" },
  },
});

registerAppPage({
  id: "chores",
  label: "Chores",
  category: "household",
  icon: "list-checks",
  view: {
    kind: "build",
    build: { screen: "chores" },
  },
});

const cleaningNavPages: Array<{ id: string; label: string; page: CleaningPageId }> = [
  { id: "cleaning-today", label: "Today", page: "today" },
  { id: "cleaning-this-week", label: "This Week", page: "this-week" },
  { id: "cleaning-calendar", label: "Calendar", page: "calendar" },
  { id: "cleaning-unscheduled", label: "Unscheduled", page: "unscheduled" },
  { id: "cleaning-weekly-reset", label: "Weekly Reset", page: "weekly-reset" },
  { id: "cleaning-rotation", label: "Rotation Mapping", page: "rotation" },
  { id: "cleaning-archive", label: "Archive", page: "archive" },
];

for (const entry of cleaningNavPages) {
  registerAppPage({
    id: entry.id,
    label: entry.label,
    category: "household",
    icon: "list-checks",
    audience: "hidden",
    view: {
      kind: "build",
      build: { screen: "cleaning", page: entry.page },
    },
  });
}

registerAppPage({
  id: "calendar",
  label: "Calendar",
  category: "household",
  icon: "calendar",
  audience: "hidden",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "calendar", path: "/calendar" },
  },
});

registerAppPage({
  id: "messages",
  label: "Messages",
  category: "household",
  icon: "message-square",
  audience: "hidden",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "messages", path: "/messages" },
  },
});

registerAppPage({
  id: "notes",
  label: "Notes",
  category: "household",
  icon: "sticky-note",
  audience: "hidden",
  view: {
    kind: "build",
    build: { screen: "planned", moduleId: "notes", pageLabel: "Notes" },
  },
});

registerAppPage({
  id: "family-hub",
  label: "Family Hub",
  category: "family",
  icon: "layout-dashboard",
  audience: "hidden",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "home", path: "/" },
  },
});

registerAppPage({
  id: "members",
  label: "Members",
  category: "family",
  icon: "users",
  audience: "kiosk",
  view: {
    kind: "build",
    build: { screen: "module", moduleId: "home", path: "/family" },
  },
});

registerAppPage({
  id: "release-checklist",
  label: "Release Checklist",
  category: "tools",
  icon: "list-checks",
  audience: "admin",
  view: { kind: "build", build: { screen: "release-checklist" } },
});

registerAppPage({
  id: "backend-console",
  label: "Backend Console",
  category: "tools",
  icon: "wrench",
  audience: "admin",
  view: { kind: "backend" },
});

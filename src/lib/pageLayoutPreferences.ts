import {
  readSidebarCollapsedPreference,
  writeSidebarCollapsedPreference,
} from "./sidebarUi";
import { PAGE_LAYOUT_STORAGE_KEY } from "./uiCustomizationKeys";

export type PageLayoutRouteKey =
  | "home"
  | "calendar"
  | "shopping"
  | "pantry"
  | "tasks"
  | "pets"
  | "settings";

export type CardDensity = "compact" | "comfortable";
export type PageWidthMode = "standard" | "wide";

export type PageLayoutGlobal = {
  sidebarCollapsed: boolean;
  pageWidth: PageWidthMode;
  cardDensity: CardDensity;
};

export type PageLayoutEntry = {
  cardDensity?: CardDensity;
  pageWidth?: PageWidthMode;
  /** Reserved for safe per-route section toggles */
  sections?: Record<string, boolean>;
};

export type PageLayoutPreferences = {
  version: 1;
  global: PageLayoutGlobal;
  pages: Partial<Record<PageLayoutRouteKey, PageLayoutEntry>>;
};

export const DEFAULT_PAGE_LAYOUT: PageLayoutPreferences = {
  version: 1,
  global: {
    sidebarCollapsed: false,
    pageWidth: "standard",
    cardDensity: "comfortable",
  },
  pages: {},
};

export function mergePageLayout(
  partial: Partial<PageLayoutPreferences> | null | undefined,
): PageLayoutPreferences {
  const base: PageLayoutPreferences = {
    version: 1,
    global: { ...DEFAULT_PAGE_LAYOUT.global },
    pages: {},
  };
  if (!partial || typeof partial !== "object") {
    return base;
  }
  return {
    version: 1,
    global: { ...base.global, ...partial.global },
    pages: { ...base.pages, ...partial.pages },
  };
}

export function readPageLayoutFromStorage(): PageLayoutPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PAGE_LAYOUT;
  }
  try {
    const raw = localStorage.getItem(PAGE_LAYOUT_STORAGE_KEY);
    if (!raw?.trim()) {
      const merged = mergePageLayout(null);
      merged.global.sidebarCollapsed = readSidebarCollapsedPreference();
      return merged;
    }
    const parsed = JSON.parse(raw) as Partial<PageLayoutPreferences>;
    const merged = mergePageLayout(parsed);
    if (parsed.global?.sidebarCollapsed === undefined) {
      merged.global.sidebarCollapsed = readSidebarCollapsedPreference();
    }
    return merged;
  } catch {
    const merged = mergePageLayout(null);
    merged.global.sidebarCollapsed = readSidebarCollapsedPreference();
    return merged;
  }
}

export function writePageLayoutToStorage(prefs: PageLayoutPreferences): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(PAGE_LAYOUT_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

/** Keep legacy sidebar key in sync for older code paths. */
export function persistSidebarCollapsed(collapsed: boolean): void {
  writeSidebarCollapsedPreference(collapsed);
  const current = readPageLayoutFromStorage();
  writePageLayoutToStorage({
    ...current,
    global: { ...current.global, sidebarCollapsed: collapsed },
  });
}

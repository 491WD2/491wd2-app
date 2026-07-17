import type { PageLayoutPreferences, PageLayoutRouteKey } from "./pageLayoutPreferences";

export type PageSectionDef = { id: string; label: string; description?: string };

/** Optional section toggles (UI-only, `familysite-491:page-layouts` → `pages.*.sections`). */
export const PAGE_SECTIONS_BY_ROUTE: Record<PageLayoutRouteKey, PageSectionDef[] | null> = {
  home: [
    { id: "todaySnapshot", label: "Today snapshot", description: "Strip under the header" },
    { id: "layoutControls", label: "Edit layout controls", description: "Home grid editor" },
  ],
  calendar: null,
  shopping: null,
  pantry: null,
  tasks: null,
  pets: null,
  settings: null,
};

export function isPageSectionVisible(
  prefs: PageLayoutPreferences,
  route: PageLayoutRouteKey,
  sectionId: string,
): boolean {
  const v = prefs.pages[route]?.sections?.[sectionId];
  return v !== false;
}

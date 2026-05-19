/** UI-only preference — not part of household FamilyData backup/import. */
export const SIDEBAR_COLLAPSED_STORAGE_KEY = "familysite.sidebarCollapsed";

export function readSidebarCollapsedPreference(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsedPreference(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Last-selected Home dashboard view (Family vs member id). UI-only; not FamilyData. */
export const ACTIVE_DASHBOARD_VIEW_STORAGE_KEY = "familysite-491:active-dashboard-view";

/** @deprecated Read {@link ACTIVE_DASHBOARD_VIEW_STORAGE_KEY}; kept for one-time migration. */
export const LEGACY_DASHBOARD_HOME_VIEW_STORAGE_KEY = "familysite-491:dashboard-home-view";

/** @deprecated Use {@link ACTIVE_DASHBOARD_VIEW_STORAGE_KEY}. */
export const DASHBOARD_HOME_VIEW_STORAGE_KEY = ACTIVE_DASHBOARD_VIEW_STORAGE_KEY;

export type DashboardHomeViewScope = "family" | string;

export function readDashboardHomeViewScope(): DashboardHomeViewScope {
  if (typeof window === "undefined") {
    return "family";
  }
  try {
    let raw = window.localStorage.getItem(ACTIVE_DASHBOARD_VIEW_STORAGE_KEY);
    if (!raw?.trim()) {
      raw = window.localStorage.getItem(LEGACY_DASHBOARD_HOME_VIEW_STORAGE_KEY);
      if (raw?.trim()) {
        try {
          window.localStorage.setItem(ACTIVE_DASHBOARD_VIEW_STORAGE_KEY, raw);
        } catch {
          /* quota */
        }
      }
    }
    if (!raw?.trim()) {
      return "family";
    }
    const parsed = JSON.parse(raw) as { scope?: unknown };
    const s = parsed?.scope;
    if (s === "family" || (typeof s === "string" && s.trim().length > 0)) {
      return s === "family" ? "family" : s.trim();
    }
  } catch {
    /* ignore */
  }
  return "family";
}

export function writeDashboardHomeViewScope(scope: DashboardHomeViewScope): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      ACTIVE_DASHBOARD_VIEW_STORAGE_KEY,
      JSON.stringify({ scope }),
    );
  } catch {
    /* quota */
  }
}

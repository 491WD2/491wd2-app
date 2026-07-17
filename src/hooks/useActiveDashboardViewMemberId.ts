import { useEffect, useState } from "react";
import { readDashboardHomeViewScope } from "../lib/dashboardHomeViewStorage";

export const DASHBOARD_MEMBER_SCOPE_SESSION_KEY = "familysite-491:dashboard-member-scope-explicit";

let dashboardMemberScopeExplicitForRuntime = false;

export function setDashboardMemberScopeExplicitThisSession(isExplicit: boolean): void {
  dashboardMemberScopeExplicitForRuntime = isExplicit;
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (isExplicit) {
      window.sessionStorage.setItem(DASHBOARD_MEMBER_SCOPE_SESSION_KEY, "1");
    } else {
      window.sessionStorage.removeItem(DASHBOARD_MEMBER_SCOPE_SESSION_KEY);
    }
  } catch {
    /* ignore unavailable sessionStorage */
  }
}

function memberScopeExplicitThisSession(): boolean {
  return dashboardMemberScopeExplicitForRuntime;
}

function scopeToMemberId(scope: ReturnType<typeof readDashboardHomeViewScope>): string | null {
  if (!memberScopeExplicitThisSession()) {
    return null;
  }
  return scope === "family" ? null : scope;
}

/**
 * Mirrors Home member landing (Family vs member) from UI-only localStorage.
 * Refreshes when the Tasks chore tracker tab opens, on window focus, and on `storage` (other tabs).
 */
export function useActiveDashboardViewMemberId(refreshKey?: string | number): string | null {
  const [memberId, setMemberId] = useState<string | null>(() =>
    scopeToMemberId(readDashboardHomeViewScope()),
  );

  useEffect(() => {
    function sync() {
      setMemberId(scopeToMemberId(readDashboardHomeViewScope()));
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, [refreshKey]);

  return memberId;
}

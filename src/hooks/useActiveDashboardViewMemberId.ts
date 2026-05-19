import { useEffect, useState } from "react";
import { readDashboardHomeViewScope } from "../lib/dashboardHomeViewStorage";

function scopeToMemberId(scope: ReturnType<typeof readDashboardHomeViewScope>): string | null {
  return scope === "family" ? null : scope;
}

/**
 * Mirrors Home member landing (Family vs member) from UI-only localStorage.
 * Refreshes when the Tasks chore tracker tab opens, on window focus, and on `storage` (other tabs).
 */
export function useActiveDashboardViewMemberId(refreshKey?: string | number): string | null {
  const [memberId, setMemberId] = useState<string | null>(() => scopeToMemberId(readDashboardHomeViewScope()));

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

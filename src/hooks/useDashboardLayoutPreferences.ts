import { useCallback, useEffect, useMemo, useState } from "react";
import type { SmartDashboardWidgetLayout, SmartDashboardWidgetSize } from "../lib/smartDashboardLayout";
import { sortDashboardWidgets } from "../lib/smartDashboardLayout";
import {
  clearDashboardLayoutPrefsForScope,
  mergeDashboardLayoutPrefs,
  readDashboardLayoutPrefsForScope,
  writeDashboardLayoutPrefsForScope,
} from "../lib/dashboardLayoutPreferences";

function reorderWidgets(
  widgets: SmartDashboardWidgetLayout[],
  id: string,
  dir: "up" | "down",
): SmartDashboardWidgetLayout[] {
  const sorted = sortDashboardWidgets(widgets);
  const idx = sorted.findIndex((w) => w.id === id);
  if (idx < 0) {
    return widgets;
  }
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) {
    return widgets;
  }
  const a = sorted[idx];
  const b = sorted[swapIdx];
  const orderA = a.order;
  const orderB = b.order;
  return widgets.map((w) => {
    if (w.id === a.id) {
      return { ...w, order: orderB };
    }
    if (w.id === b.id) {
      return { ...w, order: orderA };
    }
    return w;
  });
}

/** @param layoutScopeId `family` or a roster member id — storage key `familysite-491:dashboard-layout:<encodedId>`. */
export function useDashboardLayoutPreferences(layoutScopeId: string) {
  const [widgets, setWidgets] = useState<SmartDashboardWidgetLayout[]>(() =>
    readDashboardLayoutPrefsForScope(layoutScopeId),
  );
  const [editLayout, setEditLayout] = useState(false);

  useEffect(() => {
    setWidgets(readDashboardLayoutPrefsForScope(layoutScopeId));
    setEditLayout(false);
  }, [layoutScopeId]);

  const setWidgetVisible = useCallback(
    (id: string, visible: boolean) => {
      setWidgets((prev) => {
        const mapped = prev.map((w) => (w.id === id ? { ...w, visible } : w));
        const merged = mergeDashboardLayoutPrefs(mapped);
        writeDashboardLayoutPrefsForScope(layoutScopeId, merged);
        return merged;
      });
    },
    [layoutScopeId],
  );

  const setWidgetSize = useCallback(
    (id: string, size: SmartDashboardWidgetSize) => {
      setWidgets((prev) => {
        const mapped = prev.map((w) => (w.id === id ? { ...w, size } : w));
        const merged = mergeDashboardLayoutPrefs(mapped);
        writeDashboardLayoutPrefsForScope(layoutScopeId, merged);
        return merged;
      });
    },
    [layoutScopeId],
  );

  const moveWidgetOrder = useCallback(
    (id: string, dir: "up" | "down") => {
      setWidgets((prev) => {
        const reordered = reorderWidgets(prev, id, dir);
        const merged = mergeDashboardLayoutPrefs(reordered);
        writeDashboardLayoutPrefsForScope(layoutScopeId, merged);
        return merged;
      });
    },
    [layoutScopeId],
  );

  /** Reorder by sorted indices (same order as `sortDashboardWidgets`). Persists immediately. */
  const reorderWidgetsByDrag = useCallback(
    (fromIndex: number, toIndex: number) => {
      setWidgets((prev) => {
        const sorted = sortDashboardWidgets(prev);
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= sorted.length ||
          toIndex >= sorted.length
        ) {
          return prev;
        }
        const arr = [...sorted];
        const [removed] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, removed);
        const orderMap = new Map(arr.map((w, i) => [w.id, (i + 1) * 10]));
        const mapped = prev.map((w) => ({ ...w, order: orderMap.get(w.id) ?? w.order }));
        const merged = mergeDashboardLayoutPrefs(mapped);
        writeDashboardLayoutPrefsForScope(layoutScopeId, merged);
        return merged;
      });
    },
    [layoutScopeId],
  );

  const resetLayout = useCallback(() => {
    clearDashboardLayoutPrefsForScope(layoutScopeId);
    const fresh = mergeDashboardLayoutPrefs(null);
    setWidgets(fresh);
  }, [layoutScopeId]);

  const sortedGridWidgets = useMemo(() => sortDashboardWidgets(widgets), [widgets]);

  return {
    widgets,
    sortedGridWidgets,
    editLayout,
    setEditLayout,
    setWidgetVisible,
    setWidgetSize,
    moveWidgetOrder,
    reorderWidgetsByDrag,
    resetLayout,
  };
}

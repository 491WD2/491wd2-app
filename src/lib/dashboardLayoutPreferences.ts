import type { SmartDashboardWidgetLayout, SmartDashboardWidgetSize } from "./smartDashboardLayout";
import { smartDashboardSizeToLgSpan } from "./smartDashboardLayout";

/** Isolated from household snapshot (`familysite-491:first-family-build`). */
export const DASHBOARD_LAYOUT_STORAGE_KEY = "familysite-491:dashboard-layout";

/** Family-wide Home layout; member layouts use {@link dashboardLayoutStorageKey}. */
export const DASHBOARD_LAYOUT_SCOPE_FAMILY = "family";

const DASHBOARD_LAYOUT_KEY_PREFIX = "familysite-491:dashboard-layout:";

/** `familysite-491:dashboard-layout:<memberId-or-family>` (scope segment is URI-encoded). */
export function dashboardLayoutStorageKey(scopeId: string): string {
  return `${DASHBOARD_LAYOUT_KEY_PREFIX}${encodeURIComponent(scopeId)}`;
}

/** User-facing size labels — maps to `SmartDashboardWidgetSize` tokens. */
export const DASHBOARD_WIDGET_SIZE_OPTIONS: readonly {
  value: SmartDashboardWidgetSize;
  label: string;
}[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "full", label: "Full width" },
] as const;

/**
 * Home command-center tiles (kitchen week lives in Today snapshot + Calendar; Quick Add in header / snapshot).
 */
export const FAMILY_DASHBOARD_LAYOUT_DEFAULTS: readonly SmartDashboardWidgetLayout[] = [
  { id: "messages", title: "Messages", size: "full", order: 10, visible: true },
  { id: "calendar", title: "Calendar", size: "lg", order: 20, visible: true },
  { id: "shopping", title: "Shopping", size: "md", order: 30, visible: true },
  { id: "pantry", title: "Pantry & Inventory", size: "lg", order: 40, visible: true },
  { id: "choresDueToday", title: "Chores due today", size: "sm", order: 45, visible: true },
  { id: "cleaning", title: "Cleaning", size: "md", order: 50, visible: true },
  { id: "notifications", title: "Notifications", size: "md", order: 60, visible: true },
] as const;

/** Widgets rendered in the main 12-column grid (ordered by `order`). */
export const DASHBOARD_GRID_WIDGET_IDS = new Set<string>([
  "messages",
  "calendar",
  "shopping",
  "pantry",
  "choresDueToday",
  "cleaning",
  "notifications",
]);

export type DashboardLayoutPersistedV1 = {
  version: 1;
  widgets: SmartDashboardWidgetLayout[];
};

function isValidSize(s: unknown): s is SmartDashboardWidgetSize {
  return (
    s === "xs" ||
    s === "sm" ||
    s === "md" ||
    s === "lg" ||
    s === "xl" ||
    s === "full"
  );
}

function coerceFiniteOrder(n: unknown, fallback: number): number {
  if (typeof n === "number" && Number.isFinite(n)) {
    return n;
  }
  return fallback;
}

function coerceBoolean(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Normalize a loose saved row; returns null if id is unusable. */
function coerceWidgetRow(o: unknown, fallbackOrder: number): SmartDashboardWidgetLayout | null {
  if (!o || typeof o !== "object") {
    return null;
  }
  const r = o as Record<string, unknown>;
  const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : "";
  if (!id) {
    return null;
  }
  const title =
    typeof r.title === "string" && r.title.trim() ? r.title.trim() : id;
  const size = isValidSize(r.size) ? r.size : "full";
  return {
    id,
    title,
    size,
    order: coerceFiniteOrder(r.order, fallbackOrder),
    visible: coerceBoolean(r.visible, true),
  };
}

/**
 * Converts pre-v2 saved ids (snake / hub names) into the current seven-widget model.
 */
function migrateLegacyWidgetRows(rows: SmartDashboardWidgetLayout[]): SmartDashboardWidgetLayout[] {
  const out: SmartDashboardWidgetLayout[] = [];

  for (const w of rows) {
    switch (w.id) {
      case "kitchen_duty":
        out.push({ ...w, id: "cleaning", title: "Cleaning", order: w.order });
        break;
      case "kitchenDuty":
      case "kitchenWeek":
        break;
      case "home_glance":
        out.push({ ...w, id: "messages", title: "Messages" });
        break;
      case "pantry_hub":
        out.push({ ...w, id: "pantry", title: "Pantry" });
        break;
      case "shopping_hub":
        out.push({ ...w, id: "shopping", title: "Shopping" });
        break;
      case "week_calendar":
        out.push({ ...w, id: "calendar", title: "Calendar" });
        break;
      default:
        out.push(w);
    }
  }

  const byId = new Map<string, SmartDashboardWidgetLayout>();
  for (const w of out) {
    byId.set(w.id, w);
  }
  return [...byId.values()];
}

function parseSavedWidgetsLoose(raw: unknown): SmartDashboardWidgetLayout[] | null {
  let arr: unknown[] | null = null;
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (raw && typeof raw === "object" && "widgets" in raw) {
    const w = (raw as DashboardLayoutPersistedV1).widgets;
    arr = Array.isArray(w) ? w : null;
  }
  if (!arr) {
    return null;
  }

  const coerced: SmartDashboardWidgetLayout[] = [];
  arr.forEach((item, i) => {
    const row = coerceWidgetRow(item, (i + 1) * 10);
    if (row) {
      coerced.push(row);
    }
  });

  if (coerced.length === 0) {
    return null;
  }

  return coerced;
}

function parseSaved(raw: string | null): SmartDashboardWidgetLayout[] | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseSavedWidgetsLoose(parsed);
  } catch {
    return null;
  }
}

/** Map legacy / extra sizes onto the four UI preset sizes (Small–Full width). */
function normalizeSizeForUi(s: SmartDashboardWidgetSize): SmartDashboardWidgetSize {
  switch (s) {
    case "xs":
      return "sm";
    case "sm":
      return "sm";
    case "md":
      return "md";
    case "lg":
      return "lg";
    case "xl":
      return "lg";
    case "full":
      return "full";
    default:
      return "full";
  }
}

function normalizeWidgetPatch(p: Partial<SmartDashboardWidgetLayout>, fallback: SmartDashboardWidgetLayout) {
  const raw = (p.size ?? fallback.size) as SmartDashboardWidgetSize;
  const coerced = raw in smartDashboardSizeToLgSpan ? raw : fallback.size;
  const size = normalizeSizeForUi(coerced);
  return {
    id: fallback.id,
    title: typeof p.title === "string" && p.title.trim() ? p.title.trim() : fallback.title,
    order: typeof p.order === "number" && Number.isFinite(p.order) ? p.order : fallback.order,
    size,
    visible: typeof p.visible === "boolean" ? p.visible : fallback.visible,
  };
}

/** Merge saved widgets onto defaults so new widget ids appear automatically. */
export function mergeDashboardLayoutPrefs(
  saved: SmartDashboardWidgetLayout[] | null | undefined,
): SmartDashboardWidgetLayout[] {
  const migrated = saved?.length ? migrateLegacyWidgetRows(saved) : saved;
  const byId = new Map((migrated ?? []).map((w) => [w.id, w]));
  return FAMILY_DASHBOARD_LAYOUT_DEFAULTS.map((d) => {
    const patch = byId.get(d.id);
    return patch ? normalizeWidgetPatch(patch, d) : { ...d };
  });
}

export function readDashboardLayoutPrefs(): SmartDashboardWidgetLayout[] {
  return readDashboardLayoutPrefsForScope(DASHBOARD_LAYOUT_SCOPE_FAMILY);
}

/**
 * Per-view Home tile layout. Scope is `family` or a `FamilyMember.id`.
 * Falls back to legacy `familysite-491:dashboard-layout` only when scope is `family` and the scoped key is empty.
 */
export function readDashboardLayoutPrefsForScope(scopeId: string): SmartDashboardWidgetLayout[] {
  if (typeof window === "undefined") {
    return mergeDashboardLayoutPrefs(null);
  }
  try {
    const scopedRaw = window.localStorage.getItem(dashboardLayoutStorageKey(scopeId));
    let parsed = parseSaved(scopedRaw);
    if (
      parsed == null &&
      scopeId === DASHBOARD_LAYOUT_SCOPE_FAMILY &&
      typeof window !== "undefined"
    ) {
      const legacyRaw = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
      parsed = parseSaved(legacyRaw);
    }
    return mergeDashboardLayoutPrefs(parsed);
  } catch {
    return mergeDashboardLayoutPrefs(null);
  }
}

export function writeDashboardLayoutPrefs(widgets: SmartDashboardWidgetLayout[]): void {
  writeDashboardLayoutPrefsForScope(DASHBOARD_LAYOUT_SCOPE_FAMILY, widgets);
}

export function writeDashboardLayoutPrefsForScope(
  scopeId: string,
  widgets: SmartDashboardWidgetLayout[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: DashboardLayoutPersistedV1 = { version: 1, widgets };
    window.localStorage.setItem(dashboardLayoutStorageKey(scopeId), JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function clearDashboardLayoutPrefs(): void {
  clearDashboardLayoutPrefsForScope(DASHBOARD_LAYOUT_SCOPE_FAMILY);
}

/** Clears layout for one view. Family reset also removes the legacy undecorated key so defaults apply cleanly. */
export function clearDashboardLayoutPrefsForScope(scopeId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(dashboardLayoutStorageKey(scopeId));
    if (scopeId === DASHBOARD_LAYOUT_SCOPE_FAMILY) {
      window.localStorage.removeItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/** Legacy-friendly spans for the original hub (lg breakpoint). */
const LEGACY_LG_SPAN_BY_WIDGET_ID: Record<string, number> = {
  pantry: 7,
  shopping: 5,
  calendar: 8,
  cleaning: 6,
  notifications: 4,
};

export function dashboardWidgetLgColSpan(widget: SmartDashboardWidgetLayout): number {
  const legacy = LEGACY_LG_SPAN_BY_WIDGET_ID[widget.id];
  if (legacy !== undefined) {
    return legacy;
  }
  return smartDashboardSizeToLgSpan[widget.size];
}

const SPAN_TW: Record<number, string> = {
  12: "lg:col-span-12",
  11: "lg:col-span-11",
  10: "lg:col-span-10",
  9: "lg:col-span-9",
  8: "lg:col-span-8",
  7: "lg:col-span-7",
  6: "lg:col-span-6",
  5: "lg:col-span-5",
  4: "lg:col-span-4",
  3: "lg:col-span-3",
  2: "lg:col-span-2",
  1: "lg:col-span-1",
};

export function dashboardWidgetLgSpanClass(widget: SmartDashboardWidgetLayout): string {
  const n = dashboardWidgetLgColSpan(widget);
  return SPAN_TW[n] ?? "lg:col-span-12";
}

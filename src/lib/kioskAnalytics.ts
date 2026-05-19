/**
 * Client-side kiosk analytics — anonymized events in localStorage.
 * Fire-and-forget (queueMicrotask); does not block chore store or UI updates.
 */
import type {
  ChoreCompleteVia,
  KioskAnalyticsCategory,
  KioskAnalyticsEvent,
  KioskAnalyticsSummary,
} from "../types/kioskAnalytics";

export type { ChoreCompleteVia, KioskAnalyticsCategory, KioskAnalyticsEvent, KioskAnalyticsSummary };

export const KIOSK_ANALYTICS_EVENTS_KEY = "491wd-kiosk-analytics-events";
export const KIOSK_ANALYTICS_SESSION_KEY = "491wd-kiosk-analytics-session";
export const KIOSK_ANALYTICS_ENABLED_KEY = "491wd-kiosk-analytics-enabled";
export const KIOSK_ANALYTICS_CONSOLE_KEY = "491wd-kiosk-analytics-console-open";
/** Max events retained in localStorage; older rows are rolled into hourly aggregates. */
export const KIOSK_ANALYTICS_MAX_EVENTS = 1000;
export const KIOSK_ANALYTICS_ROLLUP_KEY = "491wd-kiosk-analytics-rollup";

const MAX_EVENTS = KIOSK_ANALYTICS_MAX_EVENTS;
const listeners = new Set<() => void>();

type AnalyticsRollupBucket = Record<string, number>;

type AnalyticsRollupStore = {
  version: 1;
  droppedTotal: number;
  /** Key: hour bucket ISO-ish `YYYY-MM-DDTHH` */
  hours: Record<string, AnalyticsRollupBucket>;
};

const EMPTY_CATEGORY_COUNTS: Record<KioskAnalyticsCategory, number> = {
  page: 0,
  chore: 0,
  gesture: 0,
  modal: 0,
  performance: 0,
  interaction: 0,
  system: 0,
};

const EMPTY_VIA_COUNTS: Record<ChoreCompleteVia, number> = {
  button: 0,
  swipe: 0,
  modal: 0,
  keyboard: 0,
  unknown: 0,
};

type SessionRecord = { id: string; startedAt: number };

function notify() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      /* ignore subscriber errors */
    }
  }
}

function scheduleFlush(fn: () => void) {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(fn);
    return;
  }
  setTimeout(fn, 0);
}

export function isKioskAnalyticsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(KIOSK_ANALYTICS_ENABLED_KEY);
    return raw !== "0";
  } catch {
    return true;
  }
}

export function setKioskAnalyticsEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KIOSK_ANALYTICS_ENABLED_KEY, enabled ? "1" : "0");
  trackKioskEvent({
    category: "system",
    action: enabled ? "analytics_enabled" : "analytics_disabled",
  });
}

export function isAnalyticsConsoleOpen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(KIOSK_ANALYTICS_CONSOLE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAnalyticsConsoleOpen(open: boolean) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KIOSK_ANALYTICS_CONSOLE_KEY, open ? "1" : "0");
  notify();
}

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }
  try {
    const raw = window.localStorage.getItem(KIOSK_ANALYTICS_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SessionRecord;
      if (parsed.id) {
        return parsed.id;
      }
    }
  } catch {
    /* ignore */
  }
  const session: SessionRecord = {
    id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    startedAt: Date.now(),
  };
  window.localStorage.setItem(KIOSK_ANALYTICS_SESSION_KEY, JSON.stringify(session));
  return session.id;
}

function loadEvents(): KioskAnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(KIOSK_ANALYTICS_EVENTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as KioskAnalyticsEvent[];
  } catch {
    return [];
  }
}

function hourBucket(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}`;
}

function loadRollup(): AnalyticsRollupStore {
  if (typeof window === "undefined") {
    return { version: 1, droppedTotal: 0, hours: {} };
  }
  try {
    const raw = window.localStorage.getItem(KIOSK_ANALYTICS_ROLLUP_KEY);
    if (!raw) {
      return { version: 1, droppedTotal: 0, hours: {} };
    }
    const parsed = JSON.parse(raw) as AnalyticsRollupStore;
    if (parsed.version !== 1) {
      return { version: 1, droppedTotal: 0, hours: {} };
    }
    return parsed;
  } catch {
    return { version: 1, droppedTotal: 0, hours: {} };
  }
}

function compressDroppedEvents(dropped: KioskAnalyticsEvent[]) {
  if (dropped.length === 0 || typeof window === "undefined") {
    return;
  }
  const rollup = loadRollup();
  rollup.droppedTotal += dropped.length;
  for (const event of dropped) {
    const bucket = hourBucket(event.ts);
    if (!rollup.hours[bucket]) {
      rollup.hours[bucket] = {};
    }
    const key = `${event.category}:${event.action}`;
    rollup.hours[bucket][key] = (rollup.hours[bucket][key] ?? 0) + 1;
  }
  const hourKeys = Object.keys(rollup.hours).sort();
  if (hourKeys.length > 168) {
    const keep = new Set(hourKeys.slice(-168));
    rollup.hours = Object.fromEntries(
      Object.entries(rollup.hours).filter(([k]) => keep.has(k)),
    );
  }
  window.localStorage.setItem(KIOSK_ANALYTICS_ROLLUP_KEY, JSON.stringify(rollup));
}

function saveEvents(events: KioskAnalyticsEvent[]) {
  if (typeof window === "undefined") {
    return;
  }
  let trimmed = events;
  if (events.length > MAX_EVENTS) {
    const dropped = events.slice(0, events.length - MAX_EVENTS);
    compressDroppedEvents(dropped);
    trimmed = events.slice(-MAX_EVENTS);
  }
  window.localStorage.setItem(KIOSK_ANALYTICS_EVENTS_KEY, JSON.stringify(trimmed));
  notify();
}

export function getAnalyticsRollupSummary(): { droppedTotal: number; hourBuckets: number } {
  const rollup = loadRollup();
  return {
    droppedTotal: rollup.droppedTotal,
    hourBuckets: Object.keys(rollup.hours).length,
  };
}

export function getKioskAnalyticsEvents(): readonly KioskAnalyticsEvent[] {
  return loadEvents();
}

export function subscribeKioskAnalytics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type TrackKioskEventInput = {
  category: KioskAnalyticsCategory;
  action: string;
  surface?: string;
  metadata?: Record<string, string | number | boolean>;
  durationMs?: number;
};

export function trackKioskEvent(input: TrackKioskEventInput): void {
  if (typeof window === "undefined" || !isKioskAnalyticsEnabled()) {
    return;
  }

  scheduleFlush(() => {
    const event: KioskAnalyticsEvent = {
      id: `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      sessionId: getAnalyticsSessionId(),
      category: input.category,
      action: input.action,
      surface: input.surface,
      metadata: input.metadata,
      durationMs: input.durationMs,
    };
    const events = loadEvents();
    events.push(event);
    saveEvents(events);
  });
}

export function trackKioskPageView(surface: string, metadata?: Record<string, string | number | boolean>) {
  trackKioskEvent({
    category: "page",
    action: "page_view",
    surface,
    metadata,
  });
}

export function trackInteraction(
  surface: string,
  action: string,
  metadata?: Record<string, string | number | boolean>,
) {
  trackKioskEvent({
    category: "interaction",
    action,
    surface,
    metadata,
  });
}

export function trackChoreTaskMeta(task: {
  id: string;
  room: string;
  status: string;
  source?: string;
  assignedTo?: string;
}) {
  return {
    taskKey: task.id.slice(0, 16),
    room: task.room,
    status: task.status,
    source: task.source ?? "unknown",
    hasAssignee: Boolean(task.assignedTo),
    ...(task.assignedTo ? { member: task.assignedTo } : {}),
  };
}

export function trackChoreComplete(
  task: { id: string; room: string; status: string; source?: string; assignedTo?: string },
  surface: string,
  via: ChoreCompleteVia = "unknown",
) {
  trackKioskEvent({
    category: "chore",
    action: "chore_complete",
    surface,
    metadata: { ...trackChoreTaskMeta(task), via },
  });
}

export function trackChoreSkip(
  task: { id: string; room: string; status: string; source?: string },
  surface: string,
) {
  trackKioskEvent({
    category: "chore",
    action: "chore_skip",
    surface,
    metadata: trackChoreTaskMeta(task),
  });
}

export function trackChoreAssign(
  taskId: string,
  member: string,
  surface: string,
  via: "drag_drop" | "modal" | "other",
) {
  trackKioskEvent({
    category: "chore",
    action: "chore_assign",
    surface,
    metadata: { taskKey: taskId.slice(0, 16), member, via },
  });
}

export function trackDragStart(surface: string, taskId: string) {
  trackKioskEvent({
    category: "gesture",
    action: "drag_start",
    surface,
    metadata: { taskKey: taskId.slice(0, 16) },
  });
}

export function trackDragDrop(surface: string, taskId: string, targetMember: string) {
  trackKioskEvent({
    category: "gesture",
    action: "drag_drop",
    surface,
    metadata: { taskKey: taskId.slice(0, 16), targetMember },
  });
}

export function trackSwipe(surface: string, direction: "left" | "right" | "up" | "down", intent: string) {
  trackKioskEvent({
    category: "gesture",
    action: "swipe",
    surface,
    metadata: { direction, intent },
  });
}

export function trackModal(surface: string, action: "open" | "close" | "save" | "skip", taskId?: string) {
  trackKioskEvent({
    category: "modal",
    action: `modal_${action}`,
    surface,
    metadata: taskId ? { taskKey: taskId.slice(0, 16) } : undefined,
  });
}

export function trackPerformance(surface: string, action: string, durationMs: number) {
  trackKioskEvent({
    category: "performance",
    action,
    surface,
    durationMs,
  });
}

export function trackActiveMemberChange(member: string | "household", surface: string) {
  trackInteraction(surface, "active_member_change", { member });
}

export function trackAnalyticsConsoleToggle(open: boolean) {
  trackInteraction("chores:analytics", open ? "console_open" : "console_close");
}

export function clearKioskAnalytics() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KIOSK_ANALYTICS_EVENTS_KEY);
  window.localStorage.removeItem(KIOSK_ANALYTICS_ROLLUP_KEY);
  notify();
}

export function exportKioskAnalyticsJson(): string {
  const events = loadEvents();
  let sessionStartedAt = 0;
  try {
    const raw = window.localStorage.getItem(KIOSK_ANALYTICS_SESSION_KEY);
    if (raw) {
      sessionStartedAt = (JSON.parse(raw) as SessionRecord).startedAt ?? 0;
    }
  } catch {
    /* ignore */
  }
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      sessionId: getAnalyticsSessionId(),
      sessionStartedAt,
      summary: computeAnalyticsSummary(events),
      events,
    },
    null,
    2,
  );
}

function parseVia(metadata?: Record<string, string | number | boolean>): ChoreCompleteVia {
  const via = metadata?.via;
  if (
    via === "button" ||
    via === "swipe" ||
    via === "modal" ||
    via === "keyboard" ||
    via === "unknown"
  ) {
    return via;
  }
  return "unknown";
}

export function computeAnalyticsSummary(events: readonly KioskAnalyticsEvent[]): KioskAnalyticsSummary {
  let sessionStartedAt = 0;
  const sessionId = getAnalyticsSessionId();
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(KIOSK_ANALYTICS_SESSION_KEY);
      if (raw) {
        sessionStartedAt = (JSON.parse(raw) as SessionRecord).startedAt ?? 0;
      }
    } catch {
      /* ignore */
    }
  }

  const pageViews: Record<string, number> = {};
  const eventsByCategory = { ...EMPTY_CATEGORY_COUNTS };
  const choreCompletionsByVia = { ...EMPTY_VIA_COUNTS };
  let choreCompletions = 0;
  let choreSkips = 0;
  let assignments = 0;
  let dragStarts = 0;
  let dragDrops = 0;
  let swipes = 0;
  let modalOpens = 0;
  let tabChanges = 0;
  let aiSuggestionAccepts = 0;
  let choreEditOpens = 0;
  let activeMemberChanges = 0;
  let performanceSamples = 0;
  let performanceTotalMs = 0;
  let maxPerformanceMs: number | null = null;
  let lastEventAt: number | null = null;

  for (const event of events) {
    eventsByCategory[event.category] = (eventsByCategory[event.category] ?? 0) + 1;

    if (event.action === "page_view" && event.surface) {
      pageViews[event.surface] = (pageViews[event.surface] ?? 0) + 1;
    }
    if (event.action === "chore_complete") {
      choreCompletions += 1;
      const via = parseVia(event.metadata);
      choreCompletionsByVia[via] = (choreCompletionsByVia[via] ?? 0) + 1;
    }
    if (event.action === "chore_skip") {
      choreSkips += 1;
    }
    if (event.action === "chore_assign") {
      assignments += 1;
    }
    if (event.action === "drag_start") {
      dragStarts += 1;
    }
    if (event.action === "drag_drop") {
      dragDrops += 1;
    }
    if (event.action === "swipe") {
      swipes += 1;
    }
    if (event.action === "modal_open") {
      modalOpens += 1;
    }
    if (event.action === "tab_change") {
      tabChanges += 1;
    }
    if (event.action === "ai_suggestion_accept") {
      aiSuggestionAccepts += 1;
    }
    if (event.action === "chore_edit_open") {
      choreEditOpens += 1;
    }
    if (event.action === "active_member_change") {
      activeMemberChanges += 1;
    }
    if (event.category === "performance" && event.durationMs != null) {
      performanceSamples += 1;
      performanceTotalMs += event.durationMs;
      if (maxPerformanceMs == null || event.durationMs > maxPerformanceMs) {
        maxPerformanceMs = event.durationMs;
      }
    }
    if (!lastEventAt || event.ts > lastEventAt) {
      lastEventAt = event.ts;
    }
  }

  return {
    sessionId,
    sessionStartedAt,
    totalEvents: events.length,
    pageViews,
    eventsByCategory,
    choreCompletions,
    choreCompletionsByVia,
    choreSkips,
    assignments,
    dragStarts,
    dragDrops,
    swipes,
    modalOpens,
    tabChanges,
    aiSuggestionAccepts,
    choreEditOpens,
    activeMemberChanges,
    performanceSamples,
    avgPerformanceMs:
      performanceSamples > 0 ? Math.round(performanceTotalMs / performanceSamples) : null,
    maxPerformanceMs,
    lastEventAt,
  };
}

export function getKioskAnalyticsSummary(): KioskAnalyticsSummary {
  return computeAnalyticsSummary(loadEvents());
}

/**
 * Analytics Agent — filter & aggregate kiosk events for charts.
 */
import type {
  AnalyticsAgentFilters,
  AnalyticsAgentReport,
  AnalyticsBarDatum,
  AnalyticsMemberActivity,
  AnalyticsPieSlice,
  AnalyticsTimelineBucket,
} from "../types/choreAnalyticsAgent";
import type { KioskAnalyticsEvent } from "../types/kioskAnalytics";
import { HOUSEHOLD_MEMBERS } from "../types/chore";

const PIE_COLORS = {
  complete: "#0d7a45",
  skip: "#ff4b6c",
  assign: "#735dff",
  other: "#574f66",
};

const PAGE_LABELS: Record<string, string> = {
  "chores:app": "App",
  "chores:home": "Home",
  "chores:dashboard": "Dashboard",
  "chores:schedule": "Schedule",
  "chores:users": "Users",
  "chores:assign-board": "Assign board",
  "chores:edit-modal": "Edit modal",
  "chores:ai": "AI suggestions",
  "chores:greeting": "Greeting",
  "chores:analytics": "Analytics",
  "chores:onboarding": "Onboarding",
};

function pageLabel(surface: string): string {
  return PAGE_LABELS[surface] ?? surface.replace(/^chores:/, "");
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inDateRange(ts: number, range: AnalyticsAgentFilters["dateRange"]): boolean {
  const now = Date.now();
  switch (range) {
    case "today":
      return ts >= startOfToday();
    case "7d":
      return ts >= now - 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return ts >= now - 30 * 24 * 60 * 60 * 1000;
    default:
      return true;
  }
}

function eventMember(event: KioskAnalyticsEvent): string | null {
  const m = event.metadata?.member;
  if (typeof m === "string" && m) {
    return m;
  }
  const target = event.metadata?.targetMember;
  if (typeof target === "string" && target) {
    return target;
  }
  return null;
}

function matchesChoreStatus(event: KioskAnalyticsEvent, filter: AnalyticsAgentFilters["choreStatus"]): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "complete") {
    return event.action === "chore_complete";
  }
  if (filter === "skip") {
    return event.action === "chore_skip";
  }
  if (filter === "assign") {
    return event.action === "chore_assign";
  }
  return true;
}

function matchesPage(event: KioskAnalyticsEvent, pageSurface: string): boolean {
  if (pageSurface === "all") {
    return true;
  }
  if (event.action === "page_view" && event.surface === pageSurface) {
    return true;
  }
  if (event.surface === pageSurface) {
    return true;
  }
  if (event.surface?.startsWith(pageSurface)) {
    return true;
  }
  return false;
}

function matchesMember(event: KioskAnalyticsEvent, member: AnalyticsAgentFilters["member"]): boolean {
  if (member === "all") {
    return true;
  }
  const em = eventMember(event);
  if (em === member) {
    return true;
  }
  if (event.action === "active_member_change" && event.metadata?.member === member) {
    return true;
  }
  return false;
}

export function filterAnalyticsEvents(
  events: readonly KioskAnalyticsEvent[],
  filters: AnalyticsAgentFilters,
): KioskAnalyticsEvent[] {
  return events.filter((event) => {
    if (!inDateRange(event.ts, filters.dateRange)) {
      return false;
    }
    if (!matchesPage(event, filters.pageSurface)) {
      return false;
    }
    if (!matchesMember(event, filters.member)) {
      return false;
    }
    if (filters.choreStatus !== "all") {
      const isChoreAction =
        event.action === "chore_complete" ||
        event.action === "chore_skip" ||
        event.action === "chore_assign";
      if (!isChoreAction) {
        return false;
      }
      return matchesChoreStatus(event, filters.choreStatus);
    }
    return true;
  });
}

function toBarData(counts: Record<string, number>, maxBars = 8): AnalyticsBarDatum[] {
  const entries = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxBars);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return entries.map(([label, value]) => ({
    label: pageLabel(label),
    value,
    percent: Math.round((value / max) * 100),
  }));
}

function buildPieSlices(complete: number, skip: number, assign: number): AnalyticsPieSlice[] {
  const total = complete + skip + assign;
  if (total === 0) {
    return [
      { label: "No chore actions", value: 1, percent: 100, color: PIE_COLORS.other },
    ];
  }
  const slices: AnalyticsPieSlice[] = [];
  const add = (label: string, value: number, color: string) => {
    if (value > 0) {
      slices.push({
        label,
        value,
        percent: Math.round((value / total) * 100),
        color,
      });
    }
  };
  add("Completed", complete, PIE_COLORS.complete);
  add("Skipped", skip, PIE_COLORS.skip);
  add("Assigned", assign, PIE_COLORS.assign);
  return slices;
}

function buildGestureTimeline(events: readonly KioskAnalyticsEvent[]): AnalyticsTimelineBucket[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? "a" : "p"}`,
    hour,
    dragDrop: 0,
    swipe: 0,
    total: 0,
  }));

  for (const event of events) {
    const hour = new Date(event.ts).getHours();
    const b = buckets[hour];
    if (!b) {
      continue;
    }
    if (event.action === "drag_drop" || event.action === "drag_start") {
      if (event.action === "drag_drop") {
        b.dragDrop += 1;
      }
    }
    if (event.action === "swipe") {
      b.swipe += 1;
    }
    if (event.action === "drag_drop" || event.action === "swipe") {
      b.total += 1;
    }
  }

  return buckets;
}

function buildMemberActivity(events: readonly KioskAnalyticsEvent[]): AnalyticsMemberActivity[] {
  const map = new Map<string, AnalyticsMemberActivity>();
  for (const name of HOUSEHOLD_MEMBERS) {
    map.set(name, { member: name, assignments: 0, completions: 0, skips: 0, score: 0 });
  }

  for (const event of events) {
    const m = eventMember(event);
    if (!m || !map.has(m)) {
      continue;
    }
    const row = map.get(m)!;
    if (event.action === "chore_assign") {
      row.assignments += 1;
      row.score += 2;
    }
    if (event.action === "chore_skip") {
      row.skips += 1;
      row.score -= 1;
    }
    if (event.action === "chore_complete") {
      row.completions += 1;
      row.score += 3;
    }
  }

  return [...map.values()]
    .filter((r) => r.assignments + r.completions + r.skips > 0)
    .sort((a, b) => b.score - a.score);
}

export function buildAnalyticsAgentReport(
  events: readonly KioskAnalyticsEvent[],
  filters: AnalyticsAgentFilters,
): AnalyticsAgentReport {
  const filtered = filterAnalyticsEvents(events, filters);

  const pageViews: Record<string, number> = {};
  let completions = 0;
  let skips = 0;
  let assignments = 0;
  let swipes = 0;
  let dragDrops = 0;
  const hourCounts = new Array(24).fill(0) as number[];

  for (const event of filtered) {
    const h = new Date(event.ts).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;

    if (event.action === "page_view" && event.surface) {
      pageViews[event.surface] = (pageViews[event.surface] ?? 0) + 1;
    }
    if (event.action === "chore_complete") {
      completions += 1;
    }
    if (event.action === "chore_skip") {
      skips += 1;
    }
    if (event.action === "chore_assign") {
      assignments += 1;
    }
    if (event.action === "swipe") {
      swipes += 1;
    }
    if (event.action === "drag_drop") {
      dragDrops += 1;
    }
  }

  let peakActivityHour: number | null = null;
  let peakCount = 0;
  hourCounts.forEach((c, hour) => {
    if (c > peakCount) {
      peakCount = c;
      peakActivityHour = hour;
    }
  });

  const topPageEntry = Object.entries(pageViews).sort((a, b) => b[1] - a[1])[0];

  const memberActivity = buildMemberActivity(filtered);

  return {
    filters,
    events: filtered,
    totalFiltered: filtered.length,
    pageViewBars: toBarData(pageViews),
    choreOutcomeSlices: buildPieSlices(completions, skips, assignments),
    gestureTimeline: buildGestureTimeline(filtered),
    memberActivity,
    peakActivityHour,
    topPage: topPageEntry ? pageLabel(topPageEntry[0]) : null,
    completions,
    skips,
    assignments,
    swipes,
    dragDrops,
  };
}

export function listPageSurfaces(events: readonly KioskAnalyticsEvent[]): string[] {
  const set = new Set<string>();
  for (const e of events) {
    if (e.action === "page_view" && e.surface) {
      set.add(e.surface);
    }
    if (e.surface?.startsWith("chores:")) {
      set.add(e.surface);
    }
  }
  return [...set].sort();
}

import type { FamilyData } from "../../data/familyData";
import {
  selectUpcomingEventsForHousehold,
  type UpcomingEventRow,
} from "../upcomingEvents";

export type DashboardUpcomingRow = {
  id: string;
  title: string;
  date: string;
  meta: string;
  isToday: boolean;
};

export type DashboardUpcomingSelection = {
  rows: DashboardUpcomingRow[];
  todayCount: number;
  upcomingCount: number;
  relevantCount: number;
  heading: string;
  emptyLabel: string;
};

const GENERIC_ASSIGNEES = new Set(["", "family", "household", "everyone", "all"]);

function cleanMeta(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(" · ");
}

function isGenericAssignee(label: string | undefined): boolean {
  return GENERIC_ASSIGNEES.has((label ?? "").trim().toLowerCase());
}

function skipCategory(category: string | undefined): boolean {
  const value = category?.trim();
  return !value || value.toLowerCase() === "other";
}

function agendaWhen(event: UpcomingEventRow): string | null {
  if (event.time.trim()) return event.time.trim();
  if (event.event.isAllDay || event.whenLabel.toLowerCase().includes("all day")) {
    return "All day";
  }
  return null;
}

function toRow(event: UpcomingEventRow): DashboardUpcomingRow {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    isToday: event.isToday,
    meta: cleanMeta([
      agendaWhen(event),
      skipCategory(event.category) ? null : event.category,
      isGenericAssignee(event.assigneeLabel) ? null : event.assigneeLabel,
    ]),
  };
}

/**
 * Dashboard agenda over the shared upcoming selector.
 * Today first, then nearest upcoming. No stale history, no invented events.
 */
export function selectDashboardUpcoming(
  data: FamilyData,
  todayIso: string,
  limit = 6,
): DashboardUpcomingSelection {
  const events = selectUpcomingEventsForHousehold(data, todayIso, 64);
  const seen = new Set<string>();
  const unique = events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });

  const today = unique.filter((event) => event.isToday);
  const upcoming = unique.filter((event) => !event.isToday);
  const rows = unique.slice(0, limit).map(toRow);
  const todayCount = today.length;
  const upcomingCount = upcoming.length;

  return {
    rows,
    todayCount,
    upcomingCount,
    relevantCount: todayCount + upcomingCount,
    heading: todayCount > 0 ? "Today" : "Upcoming",
    emptyLabel: "No upcoming events on the planner.",
  };
}

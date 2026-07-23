import type { FamilyData, FamilyMember, PlannerEvent } from "../data/familyData";
import {
  expandWeeklyUpcoming,
  formatPlannerRangeLabel,
  plannerEventIsUpcoming,
} from "./plannerRecurrence";
import { findMemberById, getMemberFullName } from "./utils";

export type UpcomingEventRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  whenLabel: string;
  category: string;
  location?: string;
  assigneeLabel: string;
  isToday: boolean;
  scope: "member" | "household";
  event: PlannerEvent;
};

function samePerson(value: string | undefined, memberName: string): boolean {
  return (value ?? "").trim().toLowerCase() === memberName.trim().toLowerCase();
}

/** True when the event is assigned to this roster member. */
export function isPlannerAssignedToMember(
  event: PlannerEvent,
  member: FamilyMember,
): boolean {
  if (!event || !member) return false;
  if (event.assignedMemberIds?.includes(member.id)) {
    return true;
  }
  if (event.assignedMemberId === member.id) {
    return true;
  }
  if (!event.assignedMemberId?.trim() && samePerson(event.assignedPerson, member.name)) {
    return true;
  }
  if (!event.assignedMemberId?.trim() && samePerson(event.assignedPerson, getMemberFullName(member))) {
    return true;
  }
  return false;
}

/**
 * Household-wide events: no specific member assignee (Family / Everyone / blank).
 */
export function isHouseholdWidePlannerEvent(event: PlannerEvent): boolean {
  if (!event) return false;
  const multi = (event.assignedMemberIds ?? []).filter((id) => Boolean(id?.trim()));
  if (event.assignedMemberId?.trim()) {
    return false;
  }
  if (multi.length > 0) {
    return false;
  }
  const person = (event.assignedPerson ?? "").trim().toLowerCase();
  if (!person) {
    return true;
  }
  return (
    person === "family" ||
    person === "household" ||
    person === "everyone" ||
    person === "all"
  );
}

export function formatPlannerEventWhen(event: PlannerEvent): string {
  const range =
    event.endDate && event.endDate !== event.date
      ? formatPlannerRangeLabel(event)
      : event.date;
  const time = event.time?.trim() || event.startTime?.trim();
  if (time) {
    return `${range} · ${time}`;
  }
  if (event.isAllDay) {
    return `${range} · All day`;
  }
  return range;
}

export function formatPlannerAssigneeLabel(
  data: FamilyData,
  event: PlannerEvent,
): string {
  const ids = [
    event.assignedMemberId,
    ...(event.assignedMemberIds ?? []),
  ].filter((id): id is string => Boolean(id?.trim()));
  const unique = [...new Set(ids)];
  const names = unique
    .map((id) => {
      const member = findMemberById(data, id);
      return member ? getMemberFullName(member) : "";
    })
    .filter(Boolean);
  if (names.length > 0) {
    return names.join(", ");
  }
  const person = event.assignedPerson?.trim();
  return person || "Household";
}

function toUpcomingEventRow(
  data: FamilyData,
  event: PlannerEvent,
  todayIso: string,
  scope: "member" | "household",
): UpcomingEventRow {
  return {
    id: event.id,
    title: event.title?.trim() || "Untitled event",
    date: event.date,
    time: event.time?.trim() || event.startTime?.trim() || "",
    whenLabel: formatPlannerEventWhen(event),
    category: event.category || "Other",
    location: event.location?.trim() || undefined,
    assigneeLabel: formatPlannerAssigneeLabel(data, event),
    isToday:
      event.date === todayIso ||
      (Boolean(event.endDate) &&
        event.date <= todayIso &&
        (event.endDate as string) >= todayIso),
    scope,
    event,
  };
}

function sortUpcomingEventRows(rows: UpcomingEventRow[]): UpcomingEventRow[] {
  return [...rows].sort((a, b) => {
    if (a.isToday !== b.isToday) {
      return a.isToday ? -1 : 1;
    }
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (a.time || "").localeCompare(b.time || "");
  });
}

function flattenUpcomingPlanner(planner: PlannerEvent[], todayIso: string): PlannerEvent[] {
  const out: PlannerEvent[] = [];
  for (const event of planner) {
    if (!event?.date) continue;
    if (event.id === "plan-pack-lebanon-2026-27") continue;
    if (!plannerEventIsUpcoming(event, todayIso)) continue;
    if (event.repeatEnabled && event.repeatRule === "Weekly") {
      out.push(...expandWeeklyUpcoming(event, todayIso, 4));
      continue;
    }
    // Multi-day travel: surface as one upcoming row starting on max(start, today) display
    if (event.endDate && event.endDate >= todayIso && event.date < todayIso) {
      out.push({ ...event, date: todayIso });
      continue;
    }
    if (event.date >= todayIso || (event.endDate && event.endDate >= todayIso)) {
      out.push(event);
    }
  }
  return out;
}

/**
 * Household command dashboard: all upcoming planner events.
 * Today first, then next. Sorted by date then time.
 */
export function selectUpcomingEventsForHousehold(
  data: FamilyData,
  todayIso: string,
  limit = 12,
): UpcomingEventRow[] {
  const flattened = flattenUpcomingPlanner(data.planner ?? [], todayIso);
  const rows: UpcomingEventRow[] = [];

  for (const event of flattened) {
    const household = isHouseholdWidePlannerEvent(event);
    rows.push(
      toUpcomingEventRow(data, event, todayIso, household ? "household" : "member"),
    );
  }

  return sortUpcomingEventRows(rows).slice(0, limit);
}

/**
 * Member home upcoming events: that member’s events + household-wide events.
 * Today first, then next upcoming. Sorted by date then time.
 */
export function selectUpcomingEventsForMemberHome(
  data: FamilyData,
  member: FamilyMember,
  todayIso: string,
  limit = 12,
): UpcomingEventRow[] {
  const flattened = flattenUpcomingPlanner(data.planner ?? [], todayIso);
  const rows: UpcomingEventRow[] = [];

  for (const event of flattened) {
    const forMember = isPlannerAssignedToMember(event, member);
    const household = isHouseholdWidePlannerEvent(event);
    if (!forMember && !household) {
      continue;
    }
    rows.push(
      toUpcomingEventRow(
        data,
        event,
        todayIso,
        forMember ? "member" : "household",
      ),
    );
  }

  return sortUpcomingEventRows(rows).slice(0, limit);
}

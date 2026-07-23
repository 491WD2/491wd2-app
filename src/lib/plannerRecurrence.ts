import type { PlannerEvent } from "../data/familyData";
import { addDaysToIso, formatIsoLocal } from "./dashboardWeek";

function parseLocalNoon(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

function weekdayOfIso(iso: string): number {
  return parseLocalNoon(iso).getDay();
}

/**
 * Expand weekly masters and multi-day ranges into dated rows for a visible window.
 * Virtual rows use `${masterId}__occ__${iso}` and are display-only (not persisted).
 */
export function expandPlannerEventsForRange(
  events: PlannerEvent[],
  rangeStart: string,
  rangeEnd: string,
): PlannerEvent[] {
  const start = rangeStart.slice(0, 10);
  const end = rangeEnd.slice(0, 10);
  const out: PlannerEvent[] = [];

  for (const event of events) {
    if (!event?.date) continue;
    const eventStart = event.date.slice(0, 10);
    const eventEnd = (event.endDate ?? event.date).slice(0, 10);

    if (event.repeatEnabled && event.repeatRule === "Weekly") {
      const targetDow = weekdayOfIso(eventStart);
      let cursor = start;
      // Align to first matching weekday on/after range start
      while (cursor <= end) {
        if (weekdayOfIso(cursor) === targetDow && cursor >= eventStart) {
          out.push({
            ...event,
            id: `${event.id}__occ__${cursor}`,
            date: cursor,
            endDate: undefined,
            repeatEnabled: false,
          });
        }
        cursor = addDaysToIso(cursor, 1);
      }
      continue;
    }

    // Multi-day span: emit one row per day in the overlap with the visible range
    if (eventEnd > eventStart) {
      let cursor = eventStart < start ? start : eventStart;
      const last = eventEnd > end ? end : eventEnd;
      while (cursor <= last) {
        out.push({
          ...event,
          id: `${event.id}__day__${cursor}`,
          date: cursor,
          endDate: eventEnd,
        });
        cursor = addDaysToIso(cursor, 1);
      }
      continue;
    }

    if (eventStart >= start && eventStart <= end) {
      out.push(event);
    }
  }

  return out;
}

/** Next N weekly occurrences on/after today for upcoming lists. */
export function expandWeeklyUpcoming(
  event: PlannerEvent,
  todayIso: string,
  count = 8,
): PlannerEvent[] {
  if (!event.repeatEnabled || event.repeatRule !== "Weekly") {
    return [event];
  }
  const targetDow = weekdayOfIso(event.date);
  const out: PlannerEvent[] = [];
  let cursor = todayIso.slice(0, 10);
  const masterStart = event.date.slice(0, 10);
  let guard = 0;
  while (out.length < count && guard < 400) {
    guard += 1;
    if (weekdayOfIso(cursor) === targetDow && cursor >= masterStart) {
      out.push({
        ...event,
        id: `${event.id}__occ__${cursor}`,
        date: cursor,
        endDate: undefined,
        repeatEnabled: false,
      });
    }
    cursor = addDaysToIso(cursor, 1);
  }
  return out;
}

/** True when today falls on or between date and endDate (inclusive). */
export function plannerEventTouchesDay(event: PlannerEvent, dayIso: string): boolean {
  const day = dayIso.slice(0, 10);
  const start = event.date.slice(0, 10);
  const end = (event.endDate ?? event.date).slice(0, 10);
  return day >= start && day <= end;
}

export function plannerEventIsUpcoming(event: PlannerEvent, todayIso: string): boolean {
  const today = todayIso.slice(0, 10);
  if (event.repeatEnabled && event.repeatRule === "Weekly") {
    return true;
  }
  const end = (event.endDate ?? event.date).slice(0, 10);
  return end >= today;
}

export function formatPlannerRangeLabel(event: PlannerEvent): string {
  const start = event.date.slice(0, 10);
  const end = event.endDate?.slice(0, 10);
  if (end && end !== start) {
    return `${start} → ${end}`;
  }
  return start;
}

/** Local today helper for seed/display windows. */
export function localTodayIso(date = new Date()): string {
  return formatIsoLocal(date);
}

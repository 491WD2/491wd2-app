import type { KitchenWeekday } from "../data/familyData";

const ORDER: KitchenWeekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** Monday-based index 0–6 for a calendar date in local time. */
function mondayIndexFromIso(isoDate: string): number {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  const dow = d.getDay(); // Sun=0
  return dow === 0 ? 6 : dow - 1;
}

/** JS `Date#getDay()` value for each kitchen weekday (local time). */
function jsDayFromKitchenWeekday(day: KitchenWeekday): number {
  const map: Record<KitchenWeekday, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return map[day];
}

function isoFromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Next calendar occurrence of `day` on or after `anchorIso` (local midnight-safe via noon parsing).
 * Past weekdays in the same calendar week roll forward to the upcoming week (e.g. after Saturday,
 * Monday shows next Monday, not last Monday).
 */
export function isoDateForNextKitchenWeekdayOccurrence(
  anchorIso: string,
  day: KitchenWeekday,
): string {
  const anchor = new Date(`${anchorIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(anchor.getTime())) {
    return anchorIso.slice(0, 10);
  }
  const todayJs = anchor.getDay();
  const targetJs = jsDayFromKitchenWeekday(day);
  const diff = (targetJs - todayJs + 7) % 7;
  const result = new Date(anchor);
  result.setDate(anchor.getDate() + diff);
  return isoFromLocalDate(result);
}

/** Calendar ISO (YYYY-MM-DD) for the given weekday column within the week that contains `anchorIso`. */
export function isoDateForKitchenWeekdayInContainingWeek(
  anchorIso: string,
  day: KitchenWeekday,
): string {
  const dayIdx = ORDER.indexOf(day);
  if (dayIdx < 0) {
    return anchorIso.slice(0, 10);
  }
  const anchor = new Date(`${anchorIso.slice(0, 10)}T12:00:00`);
  const monIdx = mondayIndexFromIso(anchorIso.slice(0, 10));
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - monIdx);
  const target = new Date(monday);
  target.setDate(monday.getDate() + dayIdx);
  return isoFromLocalDate(target);
}

export const KITCHEN_DAY_ORDER = ORDER;

/** Short uppercase labels for kitchen weekday tiles (MON … SUN). */
export const KITCHEN_WEEKDAY_ABBR: Record<KitchenWeekday, string> = {
  monday: "MON",
  tuesday: "TUE",
  wednesday: "WED",
  thursday: "THU",
  friday: "FRI",
  saturday: "SAT",
  sunday: "SUN",
};

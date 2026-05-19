import type { KitchenWeekday } from "../data/familyData";

export function formatIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 local of the week containing `iso` (YYYY-MM-DD). */
export function mondayIsoForContainingWeek(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10);
  }
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return formatIsoLocal(d);
}

export function addDaysToIso(iso: string, delta: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10);
  }
  d.setDate(d.getDate() + delta);
  return formatIsoLocal(d);
}

/** Calendar month step in local time (for recurring monthly chores). */
export function addMonthsToIso(iso: string, months: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10);
  }
  d.setMonth(d.getMonth() + months);
  return formatIsoLocal(d);
}

const JS_TO_KITCHEN: Record<number, KitchenWeekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

export function kitchenWeekdayFromIso(iso: string): KitchenWeekday | null {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return JS_TO_KITCHEN[d.getDay()] ?? null;
}

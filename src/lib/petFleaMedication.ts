import type { FamilyData, HouseholdNotification, Pet, PetMedicationEntry } from "../data/familyData";
import { siteNotificationEnabled } from "./notificationPreferences";
import { formatShortDate } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;

export type FleaMedicationUiStatus =
  | "none"
  | "upToDate"
  | "dueSoon"
  | "dueToday"
  | "overdue";

export function msDaysAfter(iso: string, days: number): number {
  return new Date(iso).getTime() + days * DAY_MS;
}

export function daysSinceLastDose(lastGivenIso: string, nowMs = Date.now()): number {
  const t = new Date(lastGivenIso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.floor((nowMs - t) / DAY_MS);
}

/** True when local calendar day of (last + 29 days) equals today's local calendar day. */
export function isFleaDueCalendarDay(lastGivenIso: string, now = new Date()): boolean {
  const last = new Date(lastGivenIso);
  if (!Number.isFinite(last.getTime())) return false;
  const due = new Date(last);
  due.setDate(due.getDate() + 29);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/** Status chips: under 25 days up to date; 25–28 due soon; day 29 or calendar due date due today; over 29 overdue. */
export function computeFleaMedicationUiStatus(
  lastGivenIso: string | undefined,
  nowMs = Date.now(),
): FleaMedicationUiStatus {
  if (!lastGivenIso?.trim()) return "none";
  const days = daysSinceLastDose(lastGivenIso, nowMs);
  const dueTodayCal = isFleaDueCalendarDay(lastGivenIso, new Date(nowMs));

  if (days < 25) return "upToDate";
  if (days > 29) return "overdue";
  if (days === 29 || dueTodayCal) return "dueToday";
  if (days >= 25 && days <= 28) return "dueSoon";
  return "upToDate";
}

export function latestFleaEntryForPet(
  petId: string,
  entries: PetMedicationEntry[],
): PetMedicationEntry | undefined {
  const flea = entries.filter((e) => e.petId === petId && e.medicationType === "flea");
  if (flea.length === 0) return undefined;
  return flea.reduce((best, e) =>
    new Date(e.givenAt).getTime() >= new Date(best.givenAt).getTime() ? e : best,
  );
}

/**
 * Ensures one active `pet_flea_med_due` household notification per latest flea cycle (entry id).
 * Creates when now >= lastGivenAt + 29d; dismisses stale cycles and pre-due stray rows.
 */
export function syncPetFleaDueNotifications(data: FamilyData): FamilyData {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const pets = data.pets ?? [];
  const entries = data.petMedicationEntries ?? [];
  const site = data.adminSettings.siteNotificationDefaults;

  if (
    !siteNotificationEnabled(site, "enableReminders") ||
    !siteNotificationEnabled(site, "petMedicationDue")
  ) {
    let notifications = [...data.notifications];
    let changed = false;
    for (let i = 0; i < notifications.length; i++) {
      const n = notifications[i];
      if (n.type === "pet_flea_med_due" && !n.dismissedAt) {
        notifications[i] = { ...n, dismissedAt: nowIso };
        changed = true;
      }
    }
    if (!changed) {
      return data;
    }
    return { ...data, notifications };
  }

  let notifications = [...data.notifications];
  let changed = false;

  function dismissById(id: string) {
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx === -1 || notifications[idx].dismissedAt) return;
    notifications[idx] = { ...notifications[idx], dismissedAt: nowIso };
    changed = true;
  }

  // Drop stale rows (unknown entry, or not the latest flea entry for that pet).
  for (const n of notifications) {
    if (n.type !== "pet_flea_med_due" || n.dismissedAt || !n.relatedEntityId) continue;
    const entry = entries.find((e) => e.id === n.relatedEntityId);
    if (!entry) {
      dismissById(n.id);
      continue;
    }
    const latest = latestFleaEntryForPet(entry.petId, entries);
    if (!latest || latest.id !== entry.id) {
      dismissById(n.id);
    }
  }

  for (const pet of pets) {
    if (!pet.active) continue;
    const latest = latestFleaEntryForPet(pet.id, entries);
    if (!latest) continue;

    const dueAtMs = msDaysAfter(latest.givenAt, 29);

    if (nowMs < dueAtMs) {
      for (const n of notifications) {
        if (
          n.type === "pet_flea_med_due" &&
          !n.dismissedAt &&
          n.relatedEntityId === latest.id
        ) {
          dismissById(n.id);
        }
      }
      continue;
    }

    const exists = notifications.some(
      (n) =>
        n.type === "pet_flea_med_due" &&
        !n.dismissedAt &&
        n.relatedEntityId === latest.id,
    );
    if (!exists) {
      const created: HouseholdNotification = {
        id: crypto.randomUUID(),
        recipientMemberId: "",
        type: "pet_flea_med_due",
        title: `${pet.name} is due for flea medication.`,
        body: `Last dose ${formatShortDate(latest.givenAt)}.`,
        relatedEntityType: "pet_medication_entry",
        relatedEntityId: latest.id,
        petId: pet.id,
        dueAt: new Date(dueAtMs).toISOString(),
        createdAt: nowIso,
      };
      notifications = [created, ...notifications].slice(0, 500);
      changed = true;
    }
  }

  if (!changed) {
    return data;
  }

  return { ...data, notifications };
}

export function sortMedicationEntriesDesc(entries: PetMedicationEntry[]): PetMedicationEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime(),
  );
}

export function resolvePet(pets: Pet[], petId: string): Pet | undefined {
  return pets.find((p) => p.id === petId);
}

export const DEFAULT_HOUSEHOLD_CAT_ACCENTS: Record<string, string> = {
  ginny: "rose",
  stubby: "amber",
  cleo: "teal",
  pickeles: "violet",
};

export function accentRingClassForPet(pet: Pet): string {
  const key = pet.name.trim().toLowerCase();
  const mapped = DEFAULT_HOUSEHOLD_CAT_ACCENTS[key];
  switch (mapped) {
    case "rose":
      return "border-rose-200 bg-rose-50/90 shadow-[inset_0_1px_0_rgba(244,63,94,0.12)]";
    case "amber":
      return "border-amber-200 bg-amber-50/90 shadow-[inset_0_1px_0_rgba(245,158,11,0.12)]";
    case "teal":
      return "border-[#FE9F43]/40 bg-[#FFF4EC] shadow-[inset_0_1px_0_rgba(242,101,34,0.12)]";
    case "violet":
      return "border-violet-200 bg-violet-50/90 shadow-[inset_0_1px_0_rgba(139,92,246,0.12)]";
    default:
      return "border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.08)]";
  }
}

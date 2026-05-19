import type {
  FamilyMember,
  HouseholdNotification,
  KitchenChecklistItem,
  KitchenDutyCompletion,
  KitchenSchedule,
  KitchenWeekday,
  UserMemberPreferences,
} from "../data/familyData";
import { memberIdsByFirstNames } from "./householdNotify";

export function kitchenDutyRelatedNotificationId(dutyDate: string): string {
  return `kitchen-duty:${dutyDate}`;
}

export function isKitchenDutyCompleteForDate(
  completions: KitchenDutyCompletion[],
  dutyDate: string,
): boolean {
  return completions.some((c) => c.dutyDate === dutyDate);
}

export function kitchenChecklistProgressForDate(
  items: KitchenChecklistItem[],
  today: string,
): { completed: number; total: number } {
  const total = items.length;
  const completed = items.filter((i) => i.checkedDate === today).length;
  return { completed, total };
}

/** Next calendar day with a kitchen assignment (weekends included when scheduled). */
export function getNextWeekdayKitchenAssignment(
  schedule: KitchenSchedule,
  from: Date = new Date(),
): { dutyDate: string; day: KitchenWeekday; memberId: string } | null {
  for (let add = 1; add <= 8; add++) {
    const d = new Date(from);
    d.setDate(from.getDate() + add);
    const iso = d.toISOString().slice(0, 10);
    const day = calendarIsoToKitchenWeekday(iso);
    if (!day) {
      continue;
    }
    const memberId = schedule.weekdays.find((w) => w.day === day)?.memberId;
    if (!memberId) {
      continue;
    }
    return { dutyDate: iso, day, memberId };
  }
  return null;
}

export function getTodayKitchenWeekdayLocal(date: Date = new Date()): KitchenWeekday | null {
  const js = date.getDay();
  const map: Record<number, KitchenWeekday> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return map[js] ?? null;
}

export function labelKitchenWeekday(day: KitchenWeekday): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

export function calendarIsoToKitchenWeekday(isoDate: string): KitchenWeekday | null {
  const d = new Date(`${isoDate.trim()}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const map: Record<number, KitchenWeekday> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return map[d.getDay()] ?? null;
}

export function buildKitchenDutyReminderNotifications(input: {
  dutyDate: string;
  assigneeMemberId: string;
  assigneeDisplayName: string;
  familyMembers: FamilyMember[];
  userPreferencesByMemberId: Record<string, UserMemberPreferences> | undefined;
  /** Site-wide default from admin settings. When false, skip everyone. */
  siteKitchenDutyRemindersEnabled: boolean | undefined;
}): HouseholdNotification[] {
  if (input.siteKitchenDutyRemindersEnabled === false) {
    return [];
  }

  const relatedEntityId = kitchenDutyRelatedNotificationId(input.dutyDate);
  const recipients = new Set<string>();
  recipients.add(input.assigneeMemberId);

  const watchIds = memberIdsByFirstNames(input.familyMembers, ["Lorraine", "Stella"]);
  for (const id of watchIds) {
    const prefs = input.userPreferencesByMemberId?.[id]?.notificationPreferences;
    if (prefs?.enableReminders === false) {
      continue;
    }
    if (prefs?.kitchenDutyReminders === false) {
      continue;
    }
    recipients.add(id);
  }

  const now = new Date().toISOString();
  const title = `Kitchen duty is assigned to ${input.assigneeDisplayName} today.`;
  const body = "";

  return [...recipients].map((recipientMemberId) => ({
    id: crypto.randomUUID(),
    recipientMemberId,
    type: "kitchen_duty" as const,
    title,
    body,
    relatedEntityType: "kitchenDuty",
    relatedEntityId,
    createdAt: now,
  }));
}

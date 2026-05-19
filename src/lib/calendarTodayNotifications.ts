import type { FamilyData, HouseholdNotification } from "../data/familyData";
import { siteNotificationEnabled } from "./notificationPreferences";
import { prependNotifications } from "./householdNotify";

export const CALENDAR_TODAY_RELATED_PREFIX = "calendar-today:";

export function calendarTodayRelatedId(eventId: string, todayIso: string): string {
  return `${CALENDAR_TODAY_RELATED_PREFIX}${eventId}:${todayIso}`;
}

export function isCalendarTodayReminderNotification(n: HouseholdNotification): boolean {
  return (
    n.type === "calendar_reminder" &&
    (n.relatedEntityId ?? "").startsWith(CALENDAR_TODAY_RELATED_PREFIX)
  );
}

function stripCalendarTodayReminders(
  notifications: HouseholdNotification[],
): HouseholdNotification[] {
  return notifications.filter((n) => !isCalendarTodayReminderNotification(n));
}

function fingerprintCalendarToday(notifications: HouseholdNotification[]): string {
  return notifications
    .filter(isCalendarTodayReminderNotification)
    .map((n) => `${n.relatedEntityId}|${n.title}|${n.body}`)
    .sort()
    .join("\n");
}

export function buildCalendarTodayReminderNotifications(
  data: FamilyData,
  todayIso: string,
): HouseholdNotification[] {
  const site = data.adminSettings.siteNotificationDefaults;
  if (!siteNotificationEnabled(site, "enableReminders")) {
    return [];
  }
  if (!siteNotificationEnabled(site, "calendarEventsToday")) {
    return [];
  }

  const now = new Date().toISOString();
  const out: HouseholdNotification[] = [];

  for (const e of data.planner) {
    if (e.date !== todayIso) {
      continue;
    }
    out.push({
      id: crypto.randomUUID(),
      recipientMemberId: "",
      type: "calendar_reminder",
      title: `Today: ${e.title}`,
      body: [e.time, e.category].filter(Boolean).join(" · ") || "Calendar",
      relatedEntityType: "plannerEvent",
      relatedEntityId: calendarTodayRelatedId(e.id, todayIso),
      createdAt: now,
    });
  }
  return out;
}

export function applyCalendarTodayReminderSync(cur: FamilyData, todayIso: string): FamilyData {
  const filtered = stripCalendarTodayReminders(cur.notifications);

  if (!siteNotificationEnabled(cur.adminSettings.siteNotificationDefaults, "enableReminders")) {
    if (filtered.length === cur.notifications.length) {
      return cur;
    }
    return { ...cur, notifications: filtered };
  }

  if (!siteNotificationEnabled(cur.adminSettings.siteNotificationDefaults, "calendarEventsToday")) {
    if (filtered.length === cur.notifications.length) {
      return cur;
    }
    return { ...cur, notifications: filtered };
  }

  const incoming = buildCalendarTodayReminderNotifications(cur, todayIso);
  const merged =
    incoming.length > 0 ? prependNotifications(filtered, incoming) : filtered;

  if (
    merged.length === cur.notifications.length &&
    fingerprintCalendarToday(cur.notifications) === fingerprintCalendarToday(merged)
  ) {
    return cur;
  }

  return { ...cur, notifications: merged };
}

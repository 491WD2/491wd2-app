import type { FamilyData, HouseholdNotification } from "../data/familyData";
import { prependNotifications } from "./householdNotify";
import { getChoreDueDate, isChoreDone } from "./choreTrackerUtils";
import { siteNotificationEnabled } from "./notificationPreferences";

export const CHORE_DIGEST_RELATED_PREFIX = "chore-digest-day:";

export function choreDigestRelatedId(todayIso: string): string {
  return `${CHORE_DIGEST_RELATED_PREFIX}${todayIso}`;
}

/** True if a digest row was ever created for this calendar day (even if dismissed). */
export function hasChoreDigestRowForDate(
  notifications: HouseholdNotification[],
  todayIso: string,
): boolean {
  const id = choreDigestRelatedId(todayIso);
  return notifications.some((n) => n.type === "chore_due" && n.relatedEntityId === id);
}

export function buildTodayChoreDigestNotification(
  data: FamilyData,
  todayIso: string,
): HouseholdNotification | null {
  const site = data.adminSettings.siteNotificationDefaults;
  if (!siteNotificationEnabled(site, "enableReminders")) {
    return null;
  }
  if (!siteNotificationEnabled(site, "choresDue")) {
    return null;
  }
  const lines: string[] = [];
  for (const t of data.tasks) {
    if (t.type !== "chore" || isChoreDone(t)) {
      continue;
    }
    if (getChoreDueDate(t) !== todayIso) {
      continue;
    }
    lines.push(`• ${t.title}`);
  }
  if (lines.length === 0) {
    return null;
  }
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    recipientMemberId: "",
    type: "chore_due",
    title: `Chores due today (${lines.length})`,
    body: lines.join("\n"),
    relatedEntityType: "choreDigest",
    relatedEntityId: choreDigestRelatedId(todayIso),
    createdAt: now,
  };
}

export function prependChoreDigestIfNeeded(
  data: FamilyData,
  todayIso: string,
): FamilyData | null {
  if (hasChoreDigestRowForDate(data.notifications, todayIso)) {
    return null;
  }
  const n = buildTodayChoreDigestNotification(data, todayIso);
  if (!n) {
    return null;
  }
  return {
    ...data,
    notifications: prependNotifications(data.notifications, [n]),
  };
}

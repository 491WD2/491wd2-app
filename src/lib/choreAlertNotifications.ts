import type { FamilyData, HouseholdNotification } from "../data/familyData";
import { getChoreDueDate, isChoreDone } from "./choreTrackerUtils";
import { prependNotifications } from "./householdNotify";
import { siteNotificationEnabled } from "./notificationPreferences";
import { findMemberById, getMemberFullName } from "./utils";

/** Synthetic chore reminders — stripped and rebuilt on each sync so refresh never piles duplicates. */
export const CHORE_REMINDER_RELATED_PREFIX = "chore-reminder:";

export function choreReminderRelatedIdToday(taskId: string, todayIso: string): string {
  return `${CHORE_REMINDER_RELATED_PREFIX}${taskId}:today:${todayIso}`;
}

export function choreReminderRelatedIdOverdue(taskId: string): string {
  return `${CHORE_REMINDER_RELATED_PREFIX}${taskId}:overdue`;
}

export function isChoreReminderNotification(n: HouseholdNotification): boolean {
  return (
    n.type === "chore_due" && (n.relatedEntityId ?? "").startsWith(CHORE_REMINDER_RELATED_PREFIX)
  );
}

function stripChoreReminders(notifications: HouseholdNotification[]): HouseholdNotification[] {
  return notifications.filter((n) => !isChoreReminderNotification(n));
}

function reminderFingerprint(notifications: HouseholdNotification[]): string {
  return notifications
    .filter(isChoreReminderNotification)
    .map((n) => `${n.relatedEntityId}|${n.title}|${n.body}`)
    .sort()
    .join("\n");
}

export function buildChoreReminderNotifications(
  data: FamilyData,
  todayIso: string,
): HouseholdNotification[] {
  const site = data.adminSettings.siteNotificationDefaults;
  if (!siteNotificationEnabled(site, "enableReminders")) {
    return [];
  }
  const allowDue = siteNotificationEnabled(site, "choresDue");
  const allowOverdue = siteNotificationEnabled(site, "choresOverdue");
  if (!allowDue && !allowOverdue) {
    return [];
  }
  const now = new Date().toISOString();
  const out: HouseholdNotification[] = [];

  for (const t of data.tasks) {
    if (t.type !== "chore" || isChoreDone(t)) {
      continue;
    }
    const due = getChoreDueDate(t);
    const assignee = t.assignedMemberId ? findMemberById(data, t.assignedMemberId) : undefined;
    const assigneeLabel = assignee ? getMemberFullName(assignee) : "Family";

    if (due < todayIso && !allowOverdue) {
      continue;
    }
    if (due === todayIso && !allowDue) {
      continue;
    }

    if (due < todayIso) {
      out.push({
        id: crypto.randomUUID(),
        recipientMemberId: "",
        type: "chore_due",
        title: `Overdue chore: ${t.title}`,
        body: `Was due ${due}. Assigned: ${assigneeLabel}.`,
        relatedEntityType: "chore",
        relatedEntityId: choreReminderRelatedIdOverdue(t.id),
        createdAt: now,
      });
    } else if (due === todayIso) {
      out.push({
        id: crypto.randomUUID(),
        recipientMemberId: "",
        type: "chore_due",
        title: `Due today: ${t.title}`,
        body: `Due ${due}. Assigned: ${assigneeLabel}.`,
        relatedEntityType: "chore",
        relatedEntityId: choreReminderRelatedIdToday(t.id, todayIso),
        createdAt: now,
      });
    }
  }
  return out;
}

/**
 * Replaces all synthetic chore reminder rows with a fresh set derived from current tasks.
 * Idempotent for identical chore state — avoids churn when nothing changed.
 */
export function applyChoreReminderSync(cur: FamilyData, todayIso: string): FamilyData {
  const filtered = stripChoreReminders(cur.notifications);

  const site = cur.adminSettings.siteNotificationDefaults;
  if (!siteNotificationEnabled(site, "enableReminders")) {
    if (filtered.length === cur.notifications.length) {
      return cur;
    }
    return { ...cur, notifications: filtered };
  }
  if (
    !siteNotificationEnabled(site, "choresDue") &&
    !siteNotificationEnabled(site, "choresOverdue")
  ) {
    if (filtered.length === cur.notifications.length) {
      return cur;
    }
    return { ...cur, notifications: filtered };
  }

  const incoming = buildChoreReminderNotifications(cur, todayIso);
  const merged =
    incoming.length > 0 ? prependNotifications(filtered, incoming) : filtered;

  if (
    merged.length === cur.notifications.length &&
    reminderFingerprint(cur.notifications) === reminderFingerprint(merged)
  ) {
    return cur;
  }

  return { ...cur, notifications: merged };
}

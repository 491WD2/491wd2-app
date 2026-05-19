/**
 * In-app and optional push reminders for predicted chores.
 */
import type { ChoreReminder, ChoreReminderPrefs } from "../types/chorePredictive";
import type { PredictedChoreItem, PredictiveScheduleReport } from "../types/chorePredictive";
import type { HouseholdMember } from "../types/chore";
import { HOUSEHOLD_MEMBERS } from "../types/chore";

export const CHORE_REMINDER_PREFS_KEY = "491wd-chore-reminder-prefs";
export const CHORE_REMINDERS_DISMISSED_KEY = "491wd-chore-reminders-dismissed";

const DISMISS_TTL_MS = 12 * 60 * 60 * 1000;

export function defaultReminderPrefs(): ChoreReminderPrefs {
  return {
    version: 1,
    enabled: true,
    pushNotifications: false,
    leadMinutes: 30,
    members: [],
    quietHoursStart: 22,
    quietHoursEnd: 7,
  };
}

export function loadReminderPrefs(): ChoreReminderPrefs {
  if (typeof window === "undefined") {
    return defaultReminderPrefs();
  }
  try {
    const raw = window.localStorage.getItem(CHORE_REMINDER_PREFS_KEY);
    if (!raw) {
      return defaultReminderPrefs();
    }
    const parsed = JSON.parse(raw) as ChoreReminderPrefs;
    if (parsed.version !== 1) {
      return defaultReminderPrefs();
    }
    return { ...defaultReminderPrefs(), ...parsed };
  } catch {
    return defaultReminderPrefs();
  }
}

export function saveReminderPrefs(prefs: ChoreReminderPrefs) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CHORE_REMINDER_PREFS_KEY, JSON.stringify(prefs));
}

function loadDismissed(): Record<string, number> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(CHORE_REMINDERS_DISMISSED_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

function saveDismissed(map: Record<string, number>) {
  if (typeof window === "undefined") {
    return;
  }
  const now = Date.now();
  const pruned = Object.fromEntries(
    Object.entries(map).filter(([, at]) => now - at < DISMISS_TTL_MS),
  );
  window.localStorage.setItem(CHORE_REMINDERS_DISMISSED_KEY, JSON.stringify(pruned));
}

export function dismissReminder(reminderId: string) {
  const map = loadDismissed();
  map[reminderId] = Date.now();
  saveDismissed(map);
}

export function isReminderDismissed(reminderId: string): boolean {
  const at = loadDismissed()[reminderId];
  return at != null && Date.now() - at < DISMISS_TTL_MS;
}

function inQuietHours(prefs: ChoreReminderPrefs, hour: number): boolean {
  const { quietHoursStart, quietHoursEnd } = prefs;
  if (quietHoursStart == null || quietHoursEnd == null) {
    return false;
  }
  if (quietHoursStart < quietHoursEnd) {
    return hour >= quietHoursStart && hour < quietHoursEnd;
  }
  return hour >= quietHoursStart || hour < quietHoursEnd;
}

function memberAllowed(prefs: ChoreReminderPrefs, member: HouseholdMember | ""): boolean {
  if (prefs.members.length === 0) {
    return true;
  }
  if (!member) {
    return true;
  }
  return prefs.members.includes(member);
}

function itemToReminder(item: PredictedChoreItem, todayIso: string): ChoreReminder | null {
  if (item.dateIso > todayIso) {
    return null;
  }
  if (item.task.status === "Done" || item.task.status === "Skipped") {
    return null;
  }
  const hour = item.suggestedHour ?? new Date().getHours();
  const suggestedAt = new Date(`${item.dateIso}T12:00:00`);
  suggestedAt.setHours(hour, 0, 0, 0);
  const now = Date.now();
  if (suggestedAt.getTime() < now - 60 * 60 * 1000) {
    suggestedAt.setTime(now);
  }

  const id = `rem_${item.task.id}_${item.dateIso}`;
  if (isReminderDismissed(id)) {
    return null;
  }

  const priorityLabel =
    item.priority === "high" ? "Soon" : item.priority === "medium" ? "Upcoming" : "Reminder";

  return {
    id,
    taskId: item.task.id,
    title: item.task.title,
    dateIso: item.dateIso,
    member: item.member,
    message: `${priorityLabel}: ${item.task.title} — ${item.reason}`,
    priority: item.priority,
    suggestedAt: suggestedAt.getTime(),
    expiresAt: suggestedAt.getTime() + 4 * 60 * 60 * 1000,
  };
}

export function buildRemindersFromReport(
  report: PredictiveScheduleReport,
  prefs: ChoreReminderPrefs,
  todayIso: string,
  activeMember: HouseholdMember | null,
): ChoreReminder[] {
  if (!prefs.enabled) {
    return [];
  }
  const hour = new Date().getHours();
  if (inQuietHours(prefs, hour)) {
    return [];
  }

  const candidates = report.today.filter(
    (item) =>
      item.priority !== "low" &&
      memberAllowed(prefs, item.member) &&
      (!activeMember || !item.member || item.member === activeMember),
  );

  const reminders: ChoreReminder[] = [];
  for (const item of candidates.slice(0, 4)) {
    const rem = itemToReminder(item, todayIso);
    if (rem) {
      reminders.push(rem);
    }
  }
  return reminders;
}

export async function requestReminderPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "granted") {
    return "granted";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return Notification.requestPermission();
}

export function showPushReminder(reminder: ChoreReminder) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (Notification.permission !== "granted") {
    return;
  }
  try {
    new Notification("Chore reminder", {
      body: reminder.message,
      tag: reminder.id,
      silent: false,
    });
  } catch {
    /* ignore — kiosk may block */
  }
}

export function formatReminderTime(reminder: ChoreReminder): string {
  return new Date(reminder.suggestedAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export { HOUSEHOLD_MEMBERS };

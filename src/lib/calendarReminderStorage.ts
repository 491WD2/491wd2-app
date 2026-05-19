const KEY = "491wd-calendar-reminders-done";

export function loadCompletedReminderIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveCompletedReminderIds(ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    /* ignore quota */
  }
}

export function markReminderCompleted(itemId: string): Set<string> {
  const next = loadCompletedReminderIds();
  next.add(itemId);
  saveCompletedReminderIds(next);
  return next;
}

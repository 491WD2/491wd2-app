/**
 * Browser Notification API helpers — no backend, no keys.
 * Only runs after explicit permission; safe no-ops when unsupported or denied.
 */

export function browserNotificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!browserNotificationsSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!browserNotificationsSupported()) {
    return "unsupported";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function showBrowserNotificationTest(title: string, body: string, tag = "familysite-491-test"): boolean {
  if (!browserNotificationsSupported() || Notification.permission !== "granted") {
    return false;
  }
  try {
    new Notification(title, { body, tag });
    return true;
  } catch {
    return false;
  }
}

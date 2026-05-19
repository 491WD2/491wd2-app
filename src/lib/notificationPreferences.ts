import type { MemberNotificationPreferences } from "../data/familyData";

/**
 * Household-wide defaults + legacy fallbacks (no member-specific merge — use on sync paths).
 */
export function siteNotificationEnabled(
  site: MemberNotificationPreferences | undefined,
  key: keyof MemberNotificationPreferences,
): boolean {
  if (site && typeof site[key] === "boolean") {
    return site[key]!;
  }
  if (
    key === "calendarEventsToday" &&
    site &&
    typeof site.calendarReminders === "boolean"
  ) {
    return site.calendarReminders;
  }
  return true;
}

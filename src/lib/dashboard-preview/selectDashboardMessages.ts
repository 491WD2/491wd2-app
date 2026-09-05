import type { FamilyData, HouseholdNotification, MessageBoardItem } from "../../data/familyData";
import { selectImportantMessagesForHome } from "../familyDataSelectors";
import { dedupeNotificationsForDisplay } from "../householdNotify";

export type DashboardMessagesSelection = {
  messages: MessageBoardItem[];
  notifications: HouseholdNotification[];
  count: number;
  summaryLabel: string;
  emptyLabel: string;
};

function unreadNotifications(data: FamilyData): HouseholdNotification[] {
  return (data.notifications ?? []).filter((note) => note && !note.dismissedAt && !note.readAt);
}

/**
 * Important/pinned messages plus unread notifications.
 * Reuses shared home selectors; does not change persistence.
 */
export function selectDashboardMessages(
  data: FamilyData,
  messageLimit = 4,
  notificationLimit = 5,
): DashboardMessagesSelection {
  const messages = selectImportantMessagesForHome(data, messageLimit);
  const notifications = dedupeNotificationsForDisplay(unreadNotifications(data)).slice(
    0,
    notificationLimit,
  );
  const count = messages.length + notifications.length;
  const emptyLabel = "No pinned messages or unread alerts.";
  const summaryLabel =
    count === 0
      ? "Nothing unread"
      : count === 1
        ? "1 item pinned or unread"
        : `${count} items pinned or unread`;

  return {
    messages,
    notifications,
    count,
    summaryLabel,
    emptyLabel,
  };
}

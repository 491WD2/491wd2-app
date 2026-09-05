import {
  createDefaultFamilyData,
  type HouseholdNotification,
  type MessageBoardItem,
} from "../../data/familyData";
import { selectDashboardMessages } from "./selectDashboardMessages";

function message(
  overrides: Partial<MessageBoardItem> & Pick<MessageBoardItem, "id" | "title">,
): MessageBoardItem {
  return {
    message: overrides.title,
    category: "Family",
    colorKey: "blue",
    priority: "normal",
    pinned: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function notification(
  overrides: Partial<HouseholdNotification> & Pick<HouseholdNotification, "id" | "title">,
): HouseholdNotification {
  return {
    recipientMemberId: "member-1",
    type: "message",
    body: overrides.title,
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectDashboardMessages", () => {
  it("does not invent messages when the household inbox is empty", () => {
    const data = createDefaultFamilyData();
    const result = selectDashboardMessages(data);
    expect(result.messages).toEqual([]);
    expect(result.notifications).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.summaryLabel).toBe("Nothing unread");
    expect(result.emptyLabel).toBe("No pinned messages or unread alerts.");
  });

  it("keeps pinned or important messages and unread notifications", () => {
    const data = createDefaultFamilyData();
    data.messageBoard = [
      message({ id: "quiet", title: "Routine note", priority: "normal", pinned: false }),
      message({ id: "pin", title: "School pickup change", pinned: true }),
      message({ id: "urgent", title: "Need a ride", priority: "urgent" }),
    ];
    data.notifications = [
      notification({ id: "unread", title: "Milk is running low." }),
      notification({
        id: "read",
        title: "Already seen",
        readAt: "2026-09-04T12:00:00.000Z",
      }),
      notification({
        id: "dismissed",
        title: "Old alert",
        dismissedAt: "2026-09-03T12:00:00.000Z",
      }),
    ];

    const result = selectDashboardMessages(data);
    expect(result.messages.map((row) => row.id)).toEqual(["pin", "urgent"]);
    expect(result.notifications.map((row) => row.id)).toEqual(["unread"]);
    expect(result.count).toBe(3);
    expect(result.summaryLabel).toBe("3 items pinned or unread");
  });
});

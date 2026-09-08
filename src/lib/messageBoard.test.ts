import type { MessageBoardItem } from "../data/familyData";
import { selectImportantMessagesForHome } from "./familyDataSelectors";
import { createDefaultFamilyData } from "../data/familyData";
import {
  buildMessageBoardItem,
  emptyMessageBoardDraft,
  isExpiredMessage,
  isImportantMessage,
  sortMessageBoard,
} from "./messageBoard";

function sample(overrides: Partial<MessageBoardItem> = {}): MessageBoardItem {
  return {
    id: "msg-1",
    title: "Note",
    message: "Hello",
    category: "General",
    colorKey: "slate",
    priority: "normal",
    pinned: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("messageBoard helpers", () => {
  it("treats important and urgent as important", () => {
    expect(isImportantMessage(sample({ priority: "important" }))).toBe(true);
    expect(isImportantMessage(sample({ priority: "urgent" }))).toBe(true);
    expect(isImportantMessage(sample({ priority: "normal" }))).toBe(false);
  });

  it("detects expired messages by YYYY-MM-DD", () => {
    expect(isExpiredMessage(sample({ expiresAt: "2026-09-01" }), "2026-09-08")).toBe(true);
    expect(isExpiredMessage(sample({ expiresAt: "2026-09-08" }), "2026-09-08")).toBe(false);
    expect(isExpiredMessage(sample({ expiresAt: undefined }), "2026-09-08")).toBe(false);
  });

  it("sorts pinned first, then newest updated", () => {
    const older = sample({ id: "a", pinned: false, updatedAt: "2026-09-01T09:00:00.000Z" });
    const newer = sample({ id: "b", pinned: false, updatedAt: "2026-09-02T09:00:00.000Z" });
    const pinned = sample({ id: "c", pinned: true, updatedAt: "2026-08-01T09:00:00.000Z" });
    expect(sortMessageBoard([older, newer, pinned]).map((row) => row.id)).toEqual(["c", "b", "a"]);
  });

  it("requires title or body when building a message", () => {
    const result = buildMessageBoardItem(emptyMessageBoardDraft(), "2026-09-08T12:00:00.000Z");
    expect("error" in result).toBe(true);
  });

  it("builds a FamilyData-compatible item that home selectors can find", () => {
    const draft = emptyMessageBoardDraft("member-1", "School", "orange");
    draft.title = "Early dismissal";
    draft.message = "Pick up at 1pm";
    draft.priority = "important";
    draft.pinned = true;
    draft.relatedMemberIds = ["member-3"];
    draft.expiresAt = "2026-12-01";
    const item = buildMessageBoardItem(draft, "2026-09-08T12:00:00.000Z");
    expect("error" in item).toBe(false);
    if ("error" in item) return;

    const data = createDefaultFamilyData();
    data.messageBoard = [item];
    const home = selectImportantMessagesForHome(data, 5);
    expect(home).toHaveLength(1);
    expect(home[0]?.title).toBe("Early dismissal");
    expect(home[0]?.authorMemberId).toBe("member-1");
    expect(home[0]?.relatedMemberIds).toEqual(["member-3"]);
  });
});

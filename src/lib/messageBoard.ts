import type {
  MessageBoardColorKey,
  MessageBoardItem,
  MessageBoardPriority,
} from "../data/familyData";

export const MESSAGE_BOARD_PRIORITIES: readonly MessageBoardPriority[] = [
  "low",
  "normal",
  "important",
  "urgent",
];

export function isMessageBoardPriority(value: string): value is MessageBoardPriority {
  return (MESSAGE_BOARD_PRIORITIES as readonly string[]).includes(value);
}

export function createMessageBoardId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isImportantMessage(item: Pick<MessageBoardItem, "priority">): boolean {
  return item.priority === "important" || item.priority === "urgent";
}

/** `expiresAt` is stored as YYYY-MM-DD (same comparison as home selectors). */
export function isExpiredMessage(
  item: Pick<MessageBoardItem, "expiresAt">,
  todayIso: string,
): boolean {
  return Boolean(item.expiresAt && item.expiresAt < todayIso);
}

export function sortMessageBoard(items: MessageBoardItem[]): MessageBoardItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    const ta = a.updatedAt || a.createdAt || "";
    const tb = b.updatedAt || b.createdAt || "";
    return tb.localeCompare(ta);
  });
}

export type MessageBoardDraft = {
  title: string;
  message: string;
  category: string;
  colorKey: MessageBoardColorKey;
  priority: MessageBoardPriority;
  pinned: boolean;
  authorMemberId?: string;
  relatedMemberIds: string[];
  expiresAt: string;
};

export function emptyMessageBoardDraft(
  authorMemberId?: string,
  category = "General",
  colorKey: MessageBoardColorKey = "slate",
): MessageBoardDraft {
  return {
    title: "",
    message: "",
    category,
    colorKey,
    priority: "normal",
    pinned: false,
    authorMemberId,
    relatedMemberIds: [],
    expiresAt: "",
  };
}

export function draftFromMessageBoardItem(item: MessageBoardItem): MessageBoardDraft {
  return {
    title: item.title ?? "",
    message: item.message ?? "",
    category: item.category?.trim() || "General",
    colorKey: item.colorKey,
    priority: item.priority,
    pinned: item.pinned,
    authorMemberId: item.authorMemberId,
    relatedMemberIds: [...(item.relatedMemberIds ?? [])],
    expiresAt: (item.expiresAt ?? "").slice(0, 10),
  };
}

export function buildMessageBoardItem(
  draft: MessageBoardDraft,
  nowIso: string,
  existing?: MessageBoardItem,
): MessageBoardItem | { error: string } {
  const title = draft.title.trim().slice(0, 200);
  const message = draft.message.trim().slice(0, 2000);
  if (!title && !message) {
    return { error: "Add a title or message before saving." };
  }

  const related = draft.relatedMemberIds
    .map((id) => id.trim())
    .filter(Boolean);
  const expiresAt = draft.expiresAt.trim().slice(0, 10);

  return {
    id: existing?.id ?? createMessageBoardId(),
    title: title || "Family note",
    message,
    category: draft.category.trim() || "General",
    colorKey: draft.colorKey,
    priority: draft.priority,
    pinned: draft.pinned,
    authorMemberId: draft.authorMemberId?.trim() || undefined,
    relatedMemberIds: related.length > 0 ? related : undefined,
    startsAt: existing?.startsAt,
    expiresAt: expiresAt || undefined,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
}

export function localTodayIso(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

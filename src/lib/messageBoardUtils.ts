import type { MessageBoardItem } from "../data/familyData";
import { normalizeColorKey } from "./colorCoding";

export function createEmptyMessageBoardItem(prefs?: {
  authorMemberId?: string;
}): MessageBoardItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    message: "",
    category: "General",
    colorKey: normalizeColorKey("slate"),
    priority: "normal",
    pinned: false,
    authorMemberId: prefs?.authorMemberId?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function isMessageBoardItemActive(item: MessageBoardItem, nowMs = Date.now()): boolean {
  if (item.startsAt) {
    const t = new Date(item.startsAt).getTime();
    if (Number.isFinite(t) && t > nowMs) {
      return false;
    }
  }
  if (item.expiresAt) {
    const e = new Date(item.expiresAt).getTime();
    if (Number.isFinite(e) && e < nowMs) {
      return false;
    }
  }
  return true;
}

/** Pinned first (any), then active unpinned by newest created. */
export function sortMessagesForHome(messages: MessageBoardItem[], limit = 8): MessageBoardItem[] {
  const pinned = [...messages]
    .filter((m) => m.pinned)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const activeUnpinned = [...messages]
    .filter((m) => !m.pinned && isMessageBoardItemActive(m))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...pinned, ...activeUnpinned].slice(0, limit);
}

export function messagePreview(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max).trim()}…`;
}

export function displayMessageTitle(item: MessageBoardItem): string {
  const t = item.title?.trim();
  if (t) {
    return t;
  }
  return messagePreview(item.message, 56) || "Message";
}

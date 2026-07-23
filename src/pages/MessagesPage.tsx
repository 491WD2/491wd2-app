import { MessageCircle, Pin, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { MessageBoardItem } from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Field";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn, findMemberById, formatShortDate, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";
import "../styles/guided-kiosk.css";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#0f172a] [-webkit-font-smoothing:antialiased]";
const CARD =
  "rounded-[8px] border border-[#cbd5e1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]";
const LABEL =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#334155]";

function newMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isImportant(item: MessageBoardItem): boolean {
  return item.priority === "important" || item.priority === "urgent";
}

function sortMessages(items: MessageBoardItem[]): MessageBoardItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    const ta = a.createdAt || a.updatedAt || "";
    const tb = b.createdAt || b.updatedAt || "";
    return tb.localeCompare(ta);
  });
}

type Draft = {
  title: string;
  body: string;
  important: boolean;
  pinned: boolean;
};

const emptyDraft = (): Draft => ({
  title: "",
  body: "",
  important: false,
  pinned: false,
});

export function MessagesPage({
  data,
  setData,
  onOpenDashboard,
}: Pick<PageProps, "data" | "setData" | "onOpenDashboard">) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const authorId = resolveSessionMemberIdForUi(data);

  const messages = useMemo(
    () => sortMessages(data.messageBoard ?? []),
    [data.messageBoard],
  );

  function clearForm() {
    setDraft(emptyDraft());
    setFormError(null);
  }

  function saveMessage() {
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title && !body) {
      setFormError("Add a title or message before saving.");
      return;
    }
    const now = new Date().toISOString();
    const item: MessageBoardItem = {
      id: newMessageId(),
      title: title || "Family note",
      message: body,
      category: "General",
      colorKey: draft.important ? "pink" : "slate",
      priority: draft.important ? "important" : "normal",
      pinned: draft.pinned,
      authorMemberId: authorId,
      createdAt: now,
      updatedAt: now,
    };

    setData((prev) =>
      createActivity(
        {
          ...prev,
          messageBoard: [item, ...(prev.messageBoard ?? [])],
        },
        {
          type: "created",
          entityType: "messageBoard",
          entityId: item.id,
          entityTitle: item.title,
          memberId: authorId,
          message: `Posted message: ${item.title}`,
        },
      ),
    );
    clearForm();
  }

  function patchMessage(
    id: string,
    patch: Partial<Pick<MessageBoardItem, "pinned" | "priority" | "colorKey">>,
    activityMessage: string,
  ) {
    const now = new Date().toISOString();
    setData((prev) => {
      const nextBoard = (prev.messageBoard ?? []).map((row) =>
        row.id === id ? { ...row, ...patch, updatedAt: now } : row,
      );
      return createActivity(
        { ...prev, messageBoard: nextBoard },
        {
          type: "updated",
          entityType: "messageBoard",
          entityId: id,
          entityTitle: prev.messageBoard.find((m) => m.id === id)?.title,
          memberId: authorId,
          message: activityMessage,
        },
      );
    });
  }

  function togglePinned(item: MessageBoardItem) {
    patchMessage(
      item.id,
      { pinned: !item.pinned },
      item.pinned ? `Unpinned: ${item.title || "message"}` : `Pinned: ${item.title || "message"}`,
    );
  }

  function toggleImportant(item: MessageBoardItem) {
    const nextImportant = !isImportant(item);
    patchMessage(
      item.id,
      {
        priority: nextImportant ? "important" : "normal",
        colorKey: nextImportant ? "pink" : item.colorKey === "pink" ? "slate" : item.colorKey,
      },
      nextImportant
        ? `Marked important: ${item.title || "message"}`
        : `Removed important: ${item.title || "message"}`,
    );
  }

  function deleteMessage(item: MessageBoardItem) {
    const label = item.title?.trim() || "this message";
    if (!window.confirm(`Delete “${label}”? This cannot be undone on this device.`)) {
      return;
    }
    setData((prev) =>
      createActivity(
        {
          ...prev,
          messageBoard: (prev.messageBoard ?? []).filter((row) => row.id !== item.id),
        },
        {
          type: "deleted",
          entityType: "messageBoard",
          entityId: item.id,
          entityTitle: item.title,
          memberId: authorId,
          message: `Deleted message: ${item.title || "note"}`,
        },
      ),
    );
  }

  function authorLabel(item: MessageBoardItem): string {
    if (!item.authorMemberId) return "Household";
    const member = findMemberById(data, item.authorMemberId);
    return member ? getMemberFullName(member) : "Household";
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn(DS_MAIN_COLUMN, "space-y-5 px-4 pb-10 pt-4 sm:px-6 sm:pb-12")}
      >
        <ModuleWorkspaceHeader
          eyebrow="Household"
          title="Messages"
          description="Family notes for everyone at home — pinned and important messages stay on top."
          action={
            onOpenDashboard ? (
              <Button type="button" variant="secondary" onClick={onOpenDashboard}>
                Home
              </Button>
            ) : null
          }
        />

        <section className={cn(CARD, "p-4 sm:p-5")} aria-labelledby="compose-message-heading">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4ee] text-[#F26522]">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 id="compose-message-heading" className="text-base font-semibold text-[#1f1f1f]">
                New message
              </h2>
              <p className="text-sm text-[#334155]">Share a note with the household.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={LABEL} htmlFor="message-title">
                Title
              </label>
              <Input
                id="message-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Short headline"
                maxLength={200}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="message-body">
                Message
              </label>
              <Textarea
                id="message-body"
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                placeholder="What should the family know?"
                rows={4}
                maxLength={2000}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#F26522]"
                  checked={draft.important}
                  onChange={(e) => setDraft((d) => ({ ...d, important: e.target.checked }))}
                />
                Important
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1f1f1f]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#F26522]"
                  checked={draft.pinned}
                  onChange={(e) => setDraft((d) => ({ ...d, pinned: e.target.checked }))}
                />
                Pinned
              </label>
            </div>
            {formError ? (
              <p className="text-sm font-medium text-[#E2504E]" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="primary" onClick={saveMessage}>
                Save message
              </Button>
              <Button type="button" variant="secondary" onClick={clearForm}>
                Clear
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="message-list-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="message-list-heading" className="text-base font-semibold text-[#1f1f1f]">
                Household messages
              </h2>
              <p className="text-sm text-[#475569]">
                {messages.length === 0
                  ? "No messages yet"
                  : `${messages.length} message${messages.length === 1 ? "" : "s"} · pinned first`}
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className={cn(CARD, "px-5 py-10 text-center")}>
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#FE9F43]" aria-hidden />
              <p className="text-base font-semibold text-[#1f1f1f]">No household messages yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#475569]">
                Post the first note above — reminders, school updates, and family news all live here.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((item) => {
                const important = isImportant(item);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      CARD,
                      "p-4 sm:p-5",
                      item.pinned && "border-[#FE9F43]/35 ring-1 ring-[#FE9F43]/15",
                      important && !item.pinned && "border-rose-200/80",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {item.pinned ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                              <Pin className="h-3 w-3" aria-hidden />
                              Pinned
                            </span>
                          ) : null}
                          {important ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-900">
                              <Star className="h-3 w-3" aria-hidden />
                              Important
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-lg font-semibold text-[#1f1f1f]">
                          {item.title?.trim() || "Family note"}
                        </h3>
                        {item.message?.trim() ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
                            {item.message}
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs font-medium text-[#475569]">
                          {authorLabel(item)}
                          {" · "}
                          {formatShortDate(item.createdAt) || "Recently"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => togglePinned(item)}
                        >
                          {item.pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => toggleImportant(item)}
                        >
                          {important ? "Remove important" : "Mark important"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => deleteMessage(item)}
                          aria-label={`Delete ${item.title || "message"}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </WorkspacePageShell>
    </div>
  );
}

import { MessageCircle, Pencil, Pin, Plus, Star, Trash2, X } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import type { MessageBoardItem, MessageBoardPriority } from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerHeader,
  DrawerPanel,
} from "../components/workspace/DrawerShell";
import {
  ModuleWorkspaceHeader,
  WorkspacePageShell,
} from "../components/workspace/ModuleWorkspace";
import { createActivity } from "../lib/activity";
import { getCategoryChipClasses } from "../lib/colorCoding";
import { getMessageBoardCategoryDefinitions } from "../lib/customization";
import { resolveSessionMemberIdForUi } from "../lib/familyDataSelectors";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import {
  buildMessageBoardItem,
  draftFromMessageBoardItem,
  emptyMessageBoardDraft,
  isExpiredMessage,
  isImportantMessage,
  isMessageBoardPriority,
  localTodayIso,
  MESSAGE_BOARD_PRIORITIES,
  sortMessageBoard,
  type MessageBoardDraft,
} from "../lib/messageBoard";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { cn, findMemberById, formatShortDate, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

const PAGE_BG =
  "min-h-full bg-[#f7f7f7] text-[#0f172a] [-webkit-font-smoothing:antialiased]";
const CARD =
  "rounded-[8px] border border-[#cbd5e1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.12)]";
const LABEL =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#334155]";

function priorityLabel(priority: MessageBoardPriority): string {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "important":
      return "Important";
    case "low":
      return "Low";
    default:
      return "Normal";
  }
}

export function MessagesPage({
  data,
  setData,
  onOpenDashboard,
}: Pick<PageProps, "data" | "setData" | "onOpenDashboard">) {
  const titleId = useId();
  const sessionAuthorId = resolveSessionMemberIdForUi(data);
  const categories = useMemo(
    () => getMessageBoardCategoryDefinitions(data.adminSettings, data.messageBoard ?? []),
    [data.adminSettings, data.messageBoard],
  );
  const roster = useMemo(
    () =>
      membersForAssignmentSelect(
        data.familyMembers,
        sessionAuthorId,
        ...(data.messageBoard ?? []).flatMap((item) => [
          item.authorMemberId,
          ...(item.relatedMemberIds ?? []),
        ]),
      ),
    [data.familyMembers, data.messageBoard, sessionAuthorId],
  );

  const messages = useMemo(
    () => sortMessageBoard(data.messageBoard ?? []),
    [data.messageBoard],
  );
  const todayIso = localTodayIso();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MessageBoardDraft>(() =>
    emptyMessageBoardDraft(sessionAuthorId, categories[0]?.label ?? "General", categories[0]?.colorKey ?? "slate"),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingId(null);
    setFormError(null);
  }, []);

  useDrawerEscape(drawerOpen, closeDrawer);

  function openCreate() {
    const first = categories[0];
    setEditingId(null);
    setDraft(emptyMessageBoardDraft(sessionAuthorId, first?.label ?? "General", first?.colorKey ?? "slate"));
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(item: MessageBoardItem) {
    setEditingId(item.id);
    setDraft(draftFromMessageBoardItem(item));
    setFormError(null);
    setDrawerOpen(true);
  }

  function applyCategory(label: string) {
    const match = categories.find((c) => c.label === label);
    setDraft((current) => ({
      ...current,
      category: label,
      colorKey: match?.colorKey ?? current.colorKey,
    }));
  }

  function toggleRelatedMember(memberId: string) {
    setDraft((current) => {
      const has = current.relatedMemberIds.includes(memberId);
      return {
        ...current,
        relatedMemberIds: has
          ? current.relatedMemberIds.filter((id) => id !== memberId)
          : [...current.relatedMemberIds, memberId],
      };
    });
  }

  function saveMessage() {
    const now = new Date().toISOString();
    const existing = editingId
      ? (data.messageBoard ?? []).find((row) => row.id === editingId)
      : undefined;
    const result = buildMessageBoardItem(draft, now, existing);
    if ("error" in result) {
      setFormError(result.error);
      return;
    }

    setData((prev) => {
      const board = prev.messageBoard ?? [];
      const nextBoard = existing
        ? board.map((row) => (row.id === result.id ? result : row))
        : [result, ...board];
      return createActivity(
        { ...prev, messageBoard: nextBoard },
        {
          type: existing ? "updated" : "created",
          entityType: "messageBoard",
          entityId: result.id,
          entityTitle: result.title,
          memberId: result.authorMemberId,
          message: existing
            ? `Updated message: ${result.title}`
            : `Posted message: ${result.title}`,
        },
      );
    });
    closeDrawer();
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
          memberId: sessionAuthorId,
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
    const nextImportant = !isImportantMessage(item);
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
          memberId: sessionAuthorId,
          message: `Deleted message: ${item.title || "note"}`,
        },
      ),
    );
    if (editingId === item.id) {
      closeDrawer();
    }
  }

  function authorLabel(item: MessageBoardItem): string {
    if (!item.authorMemberId) return "Household";
    const member = findMemberById(data, item.authorMemberId);
    return member ? getMemberFullName(member) : "Household";
  }

  function audienceLabel(item: MessageBoardItem): string {
    const ids = item.relatedMemberIds ?? [];
    if (ids.length === 0) return "Everyone";
    const names = ids.map((id) => {
      const member = findMemberById(data, id);
      return member ? getMemberFullName(member) : "Former member";
    });
    return names.join(", ");
  }

  const drawer = drawerOpen ? (
    <>
      <DrawerBackdrop onClick={closeDrawer} ariaLabel="Close message composer" />
      <DrawerPanel role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <DrawerHeader
          eyebrow="Household"
          title={editingId ? "Edit message" : "New message"}
          titleId={titleId}
          subtitle="Notes stay on this device with the rest of your household data."
          trailing={
            <Button type="button" variant="ghost" onClick={closeDrawer} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          }
        />
        <DrawerBody>
          <div className="space-y-4 rounded-[12px] border border-[#cbd5e1] bg-white p-4 sm:p-5">
            <div>
              <label className={LABEL} htmlFor="message-title">
                Title
              </label>
              <Input
                id="message-title"
                value={draft.title}
                onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
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
                value={draft.message}
                onChange={(e) => setDraft((current) => ({ ...current, message: e.target.value }))}
                placeholder="What should the family know?"
                rows={5}
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="message-author">
                  Posted by
                </label>
                <Select
                  id="message-author"
                  value={draft.authorMemberId ?? ""}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      authorMemberId: e.target.value || undefined,
                    }))
                  }
                >
                  <option value="">Household</option>
                  {roster.map((member) => (
                    <option key={member.id} value={member.id}>
                      {getMemberFullName(member)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={LABEL} htmlFor="message-category">
                  Category
                </label>
                <Select
                  id="message-category"
                  value={draft.category}
                  onChange={(e) => applyCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={LABEL} htmlFor="message-priority">
                  Priority
                </label>
                <Select
                  id="message-priority"
                  value={draft.priority}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!isMessageBoardPriority(value)) return;
                    setDraft((current) => ({ ...current, priority: value }));
                  }}
                >
                  {MESSAGE_BOARD_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabel(priority)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className={LABEL} htmlFor="message-expires">
                  Expires
                </label>
                <Input
                  id="message-expires"
                  type="date"
                  value={draft.expiresAt}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, expiresAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <fieldset>
              <legend className={LABEL}>Share with</legend>
              <p className="mb-2 text-sm text-[#475569]">
                Leave everyone unchecked to post for the whole household.
              </p>
              <div className="flex flex-wrap gap-3">
                {roster
                  .filter((member) => member.status === "active")
                  .map((member) => (
                    <label
                      key={member.id}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-sm font-medium text-[#1f1f1f]"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#1f6fbf]"
                        checked={draft.relatedMemberIds.includes(member.id)}
                        onChange={() => toggleRelatedMember(member.id)}
                      />
                      {getMemberFullName(member)}
                    </label>
                  ))}
              </div>
            </fieldset>
            <label className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#1f1f1f]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#1f6fbf]"
                checked={draft.pinned}
                onChange={(e) => setDraft((current) => ({ ...current, pinned: e.target.checked }))}
              />
              Pin to the top of Messages and Home
            </label>
            {formError ? (
              <p className="text-sm font-medium text-[#E2504E]" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" variant="primary" onClick={saveMessage}>
                {editingId ? "Save changes" : "Save message"}
              </Button>
              <Button type="button" variant="secondary" onClick={closeDrawer}>
                Cancel
              </Button>
            </div>
          </div>
        </DrawerBody>
      </DrawerPanel>
    </>
  ) : null;

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
            <div className="flex flex-wrap gap-2">
              {onOpenDashboard ? (
                <Button type="button" variant="secondary" onClick={onOpenDashboard}>
                  Home
                </Button>
              ) : null}
              <Button type="button" variant="primary" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden />
                New message
              </Button>
            </div>
          }
        />

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
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#1f6fbf]" aria-hidden />
              <p className="text-base font-semibold text-[#1f1f1f]">No household messages yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#475569]">
                Post the first note — reminders, school updates, and family news all live here.
              </p>
              <div className="mt-4">
                <Button type="button" variant="primary" onClick={openCreate}>
                  <Plus className="h-4 w-4" aria-hidden />
                  New message
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((item) => {
                const important = isImportantMessage(item);
                const expired = isExpiredMessage(item, todayIso);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      CARD,
                      "p-4 sm:p-5",
                      item.pinned && "border-[#1f6fbf]/35 ring-1 ring-[#1f6fbf]/15",
                      important && !item.pinned && "border-rose-200/80",
                      expired && "opacity-75",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {item.pinned ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-900">
                              <Pin className="h-3 w-3" aria-hidden />
                              Pinned
                            </span>
                          ) : null}
                          {important ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-900">
                              <Star className="h-3 w-3" aria-hidden />
                              {priorityLabel(item.priority)}
                            </span>
                          ) : null}
                          {expired ? (
                            <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                              Expired
                            </span>
                          ) : null}
                          {item.category?.trim() ? (
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                                getCategoryChipClasses(item.category, item.colorKey),
                              )}
                            >
                              {item.category}
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
                          {" · "}
                          {audienceLabel(item)}
                          {item.expiresAt
                            ? ` · Expires ${formatShortDate(item.expiresAt) || item.expiresAt}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          onClick={() => togglePinned(item)}
                        >
                          {item.pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="min-h-10 px-3 text-xs"
                          onClick={() => toggleImportant(item)}
                        >
                          {important ? "Remove important" : "Mark important"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="min-h-10 px-3 text-xs"
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
      {drawer}
    </div>
  );
}

import { MessageSquare, MessageSquarePlus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MessageBoardItem } from "../data/familyData";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { MessageBoardDrawer } from "../components/messageBoard/MessageBoardDrawer";
import {
  WorkspacePageShell,
  WorkspaceFilterBar,
  WorkspaceRoutedSection,
} from "../components/workspace/ModuleWorkspace";
import { DS_MAIN_COLUMN } from "../lib/designSystem";
import { createActivity } from "../lib/activity";
import {
  getCategoryChipClasses,
  getPriorityColorClasses,
} from "../lib/colorCoding";
import { getMessageBoardCategoryDefinitions } from "../lib/customization";
import {
  createEmptyMessageBoardItem,
  displayMessageTitle,
  isMessageBoardItemActive,
  messagePreview,
} from "../lib/messageBoardUtils";
import { membersForAssignmentSelect } from "../lib/memberAssignment";
import { cn, formatShortDate, getMemberFullName } from "../lib/utils";
import type { PageProps } from "./pageTypes";

/** SmartHR HTML bundle tokens — matches Dashboard / hub cards */
const PAGE_BG = "min-h-full bg-[#f7f7f7] text-[#1f1f1f] [-webkit-font-smoothing:antialiased]";
const SM_LABEL = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]";
const SM_INPUT =
  "min-h-10 w-full rounded-[8px] border border-[#ededed] bg-white px-3 py-2 text-[14px] text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)] placeholder:text-[#8e8e8e] focus:border-[#FE9F43]/55 focus:outline-none focus:ring-2 focus:ring-[#FE9F43]/25";
/** SmartHR card radius — 8px */
const CARD_SHELL =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.2)]";

type ScopeFilter = "active" | "expired" | "all";

function isExpiredByDate(item: MessageBoardItem, nowMs = Date.now()): boolean {
  if (!item.expiresAt) {
    return false;
  }
  const e = new Date(item.expiresAt).getTime();
  return Number.isFinite(e) && e < nowMs;
}

export function MessagesPage({
  data,
  setData,
  onOpenDashboard,
}: Pick<PageProps, "data" | "setData" | "onOpenDashboard">) {
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [scope, setScope] = useState<ScopeFilter>("active");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [drawerDraft, setDrawerDraft] = useState<MessageBoardItem | null>(null);
  const composeOpened = useRef(false);

  useEffect(() => {
    if (composeOpened.current) {
      return;
    }
    const q = new URLSearchParams(window.location.search);
    if (q.get("compose") !== "1") {
      return;
    }
    composeOpened.current = true;
    setDrawerMode("create");
    setDrawerDraft(
      createEmptyMessageBoardItem({
        authorMemberId: data.adminSettings.activePreferencesMemberId ?? undefined,
      }),
    );
    setDrawerOpen(true);
  }, [data.adminSettings.activePreferencesMemberId]);

  const categories = useMemo(
    () => getMessageBoardCategoryDefinitions(data.adminSettings, data.messageBoard),
    [data.adminSettings, data.messageBoard],
  );

  const categoryLabels = useMemo(() => ["all", ...categories.map((c) => c.label)], [categories]);

  const roster = membersForAssignmentSelect(
    data.familyMembers,
    ...data.messageBoard.map((m) => m.authorMemberId),
  );

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let rows = [...data.messageBoard];

    if (q) {
      rows = rows.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      rows = rows.filter((m) => m.category === categoryFilter);
    }

    if (priorityFilter !== "all") {
      rows = rows.filter((m) => m.priority === priorityFilter);
    }

    if (pinnedOnly) {
      rows = rows.filter((m) => m.pinned);
    }

    if (authorFilter !== "all") {
      rows = rows.filter((m) => m.authorMemberId === authorFilter);
    }

    const now = Date.now();
    if (scope === "active") {
      rows = rows.filter((m) => isMessageBoardItemActive(m, now));
    } else if (scope === "expired") {
      rows = rows.filter((m) => isExpiredByDate(m, now));
    }

    rows.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return rows;
  }, [
    data.messageBoard,
    searchText,
    categoryFilter,
    priorityFilter,
    pinnedOnly,
    authorFilter,
    scope,
  ]);

  const activeMessageCount = useMemo(() => {
    const now = Date.now();
    return data.messageBoard.filter((m) => isMessageBoardItemActive(m, now)).length;
  }, [data.messageBoard]);

  const boardIsEmpty = data.messageBoard.length === 0;
  const filtersAreDefault =
    !searchText.trim() &&
    categoryFilter === "all" &&
    priorityFilter === "all" &&
    authorFilter === "all" &&
    !pinnedOnly &&
    scope === "active";

  function logBoard(message: string) {
    setData((current) =>
      createActivity(current, {
        type: "updated",
        entityType: "messageBoard",
        entityId: "message-board",
        entityTitle: "Message Board",
        message,
      }),
    );
  }

  function handleSave(item: MessageBoardItem, isNew: boolean) {
    const now = new Date().toISOString();
    if (isNew) {
      setData((current) =>
        createActivity(
          {
            ...current,
            messageBoard: [{ ...item, createdAt: now, updatedAt: now }, ...current.messageBoard],
          },
          {
            type: "updated",
            entityType: "messageBoard",
            entityId: "message-board",
            entityTitle: "Message Board",
            message: "Message posted.",
          },
        ),
      );
    } else {
      setData((current) => ({
        ...createActivity(current, {
          type: "updated",
          entityType: "messageBoard",
          entityId: "message-board",
          entityTitle: "Message Board",
          message: "Saved.",
        }),
        messageBoard: current.messageBoard.map((m) =>
          m.id === item.id ? { ...item, updatedAt: now } : m,
        ),
      }));
    }
    setDrawerOpen(false);
    setDrawerDraft(null);
  }

  function handleDelete(id: string) {
    logBoard("Message removed.");
    setData((current) => ({
      ...current,
      messageBoard: current.messageBoard.filter((m) => m.id !== id),
    }));
  }

  function openCreate() {
    setDrawerMode("create");
    setDrawerDraft(
      createEmptyMessageBoardItem({
        authorMemberId: data.adminSettings.activePreferencesMemberId ?? undefined,
      }),
    );
    setDrawerOpen(true);
  }

  function openEdit(item: MessageBoardItem) {
    setDrawerMode("edit");
    setDrawerDraft(item);
    setDrawerOpen(true);
  }

  return (
    <div className={PAGE_BG}>
      <WorkspacePageShell
        className={cn("flex flex-col gap-4 px-[15px] pb-10 pt-0 sm:gap-5 sm:px-[30px] md:pb-10", DS_MAIN_COLUMN)}
        tone="light"
      >
      <header className={cn(CARD_SHELL, "p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className="h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#FF6F28] to-[#FF5325]"
              aria-hidden
            />
            <div className="min-w-0">
              <p className={SM_LABEL}>Household</p>
              <h1 className="mt-1 text-[22px] font-medium leading-snug tracking-tight text-[#1f1f1f]">
                Message Board
              </h1>
              <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#575757]">
                Notes and reminders for the household.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <div
              className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(0,0,0,0.04)]"
              aria-live="polite"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#637381]">Active</p>
              <p className="text-xl font-semibold tabular-nums text-[#F26522]">{activeMessageCount}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa]"
              onClick={() => onOpenDashboard?.()}
            >
              Home
            </Button>
            <Button type="button" variant="primary" className="min-h-11 font-semibold shadow-[0_6px_15px_rgba(36,37,38,0.08)]" onClick={openCreate}>
              <MessageSquarePlus className="mr-1 h-4 w-4" />
              New Message
            </Button>
          </div>
        </div>
      </header>

      <WorkspaceFilterBar
        tone="light"
        className="rounded-[8px] border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.12)]"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
            <span className={SM_LABEL}>Search</span>
            <span className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#637381]" />
              <Input
                className={cn("pl-9", SM_INPUT)}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search title or message…"
              />
            </span>
          </label>
          <label className="flex min-w-[9rem] flex-col gap-1.5">
            <span className={SM_LABEL}>Category</span>
            <Select
              className={SM_INPUT}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categoryLabels.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1.5">
            <span className={SM_LABEL}>Priority</span>
            <Select
              className={SM_INPUT}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
          </label>
          <label className="flex min-w-[8rem] flex-col gap-1.5">
            <span className={SM_LABEL}>Author</span>
            <Select
              className={SM_INPUT}
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
            >
              <option value="all">Everyone</option>
              <option value="">Anonymous</option>
              {roster.map((m) => (
                <option key={m.id} value={m.id}>
                  {getMemberFullName(m)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#F26522]"
              checked={pinnedOnly}
              onChange={(e) => setPinnedOnly(e.target.checked)}
            />
            <span className="text-sm font-medium text-[#4B5563]">Pinned only</span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["active", "expired", "all"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              variant={scope === s ? "primary" : "secondary"}
              className={cn(
                "h-9 text-xs font-semibold",
                scope === s
                  ? ""
                  : "border-[#ededed] bg-white text-[#4B5563] hover:bg-[#f8f9fa]",
              )}
              onClick={() => setScope(s)}
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </WorkspaceFilterBar>

      <WorkspaceRoutedSection title="Messages" tone="light">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.length === 0 ? (
            <div className="col-span-full rounded-[8px] border border-dashed border-[#ededed] bg-white px-4 py-10 text-center shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#ededed] bg-[#f8f9fa] text-[#637381]">
                <MessageSquare className="h-6 w-6" aria-hidden />
              </div>
              {boardIsEmpty && filtersAreDefault ? (
                <>
                  <p className="mt-3 text-sm font-semibold text-[#1f1f1f]">No messages yet.</p>
                  <p className="mt-1 text-sm text-[#575757]">
                    Leave a quick note or reminder for the household.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm font-semibold text-[#1f1f1f]">
                    No messages match these filters.
                  </p>
                  <p className="mt-1 text-sm text-[#575757]">
                    Try widening your search or post something new.
                  </p>
                </>
              )}
              <div className="mt-4 flex justify-center">
                <Button type="button" variant="primary" className="font-semibold shadow-[0_6px_15px_rgba(36,37,38,0.08)]" onClick={openCreate}>
                  <MessageSquarePlus className="mr-1 h-4 w-4" />
                  New Message
                </Button>
              </div>
            </div>
          ) : (
            filtered.map((msg) => {
              const author = msg.authorMemberId
                ? roster.find((m) => m.id === msg.authorMemberId)
                : undefined;
              const catClass = getCategoryChipClasses(msg.category, msg.colorKey);
              const priClass = getPriorityColorClasses(msg.priority);
              const active = isMessageBoardItemActive(msg);
              return (
                <article
                  key={msg.id}
                  className={cn(
                    "flex flex-col rounded-[8px] border p-3 shadow-[0_1px_1px_rgba(0,0,0,0.2)] transition-colors duration-150 sm:p-4",
                    msg.pinned
                      ? "border-[#FE9F43]/40 bg-[#FEF0E9]/70"
                      : "border-[#ededed] bg-white",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                          catClass,
                        )}
                      >
                        {msg.category}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
                          priClass,
                        )}
                      >
                        {msg.priority}
                      </span>
                      {msg.pinned ? (
                        <Badge tone="amber" className="text-[0.6rem]">
                          Pinned
                        </Badge>
                      ) : null}
                      {!active ? (
                        <Badge tone="neutral" className="text-[0.6rem]">
                          Inactive
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 min-w-[3.25rem] px-3 text-sm font-semibold text-[#637381] hover:bg-[#f8f9fa]"
                        onClick={() => openEdit(msg)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 min-w-[3.75rem] px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                          if (window.confirm("Remove this message?")) {
                            handleDelete(msg.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-semibold leading-snug text-[#1f1f1f]">
                    {displayMessageTitle(msg)}
                  </h2>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[#575757]">
                    {messagePreview(msg.message, 280)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-[#ededed] pt-3 text-[0.75rem] text-[#637381]">
                    <span>
                      {author ? getMemberFullName(author) : "Anonymous"}
                    </span>
                    <span>·</span>
                    <span>Updated {formatShortDate(msg.updatedAt)}</span>
                  </div>
                  {(msg.relatedMemberIds?.length ?? 0) > 0 ? (
                    <p className="mt-2 text-[0.75rem] text-[#8e8e8e]">
                      Related:{" "}
                      {msg
                        .relatedMemberIds!.map((id) =>
                          getMemberFullName(roster.find((m) => m.id === id)),
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </WorkspaceRoutedSection>

      <MessageBoardDrawer
        open={drawerOpen}
        mode={drawerMode}
        draft={drawerDraft}
        categories={categories}
        familyMembers={data.familyMembers}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerDraft(null);
        }}
        onSave={handleSave}
        onDelete={drawerMode === "edit" ? handleDelete : undefined}
      />
      </WorkspacePageShell>
    </div>
  );
}

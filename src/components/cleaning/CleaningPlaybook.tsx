import {
  Bath,
  BedDouble,
  BedSingle,
  ClipboardList,
  DoorOpen,
  Refrigerator,
  Shirt,
  Sofa,
  Sparkles,
  Tv,
  Utensils,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type {
  CleaningCompletionRecord,
  CleaningCompletionStatus,
  CleaningRoom,
  CleaningRoomTaskGroupFrequency,
  FamilyMember,
  Task,
} from "../../data/familyData";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerHeader,
  DrawerPanel,
} from "../workspace/DrawerShell";
import { useDrawerEscape } from "../../hooks/useDrawerEscape";
import {
  choreDueDate,
  choreMatchesCleaningRoom,
  getCleaningRoomProgress,
  latestCleaningCompletionForRoom,
  roomCleaningCompletedToday,
  sortCleaningGroupsByFrequency,
} from "../../lib/cleaningPlaybook";
import { membersForAssignmentSelect } from "../../lib/memberAssignment";
import { cn, formatShortDate, getMemberFullName } from "../../lib/utils";

const BTN_PRIMARY_ORANGE =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]";
const CARD_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.06)]";
const TILE_SMARTHR =
  "rounded-[8px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ring-0 transition hover:border-[#FE9F43]/35 hover:shadow-md sm:p-5";

function completionReviewChip(
  status: CleaningCompletionStatus,
): { label: string; tone: "amber" | "green" | "red" } | null {
  if (status === "needs_review") return { label: "Needs review", tone: "amber" };
  if (status === "approved") return { label: "Approved", tone: "green" };
  if (status === "needs_redo") return { label: "Needs redo", tone: "red" };
  return null;
}

function PlaybookField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="w-full space-y-1">
      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function getCleaningRoomIcon(icon: string): LucideIcon {
  const lower = icon.trim().toLowerCase();
  if (lower === "bath" || lower === "bathroom") return Bath;
  if (lower === "utensils" || lower === "kitchen") return Utensils;
  if (lower === "sofa" || lower === "living room") return Sofa;
  if (lower === "utensilscrossed" || lower === "dining") return UtensilsCrossed;
  if (lower === "shirt" || lower === "laundry") return Shirt;
  if (lower === "dooropen" || lower === "entry") return DoorOpen;
  if (lower === "tv" || lower === "family room") return Tv;
  if (lower === "shelves" || lower === "pantry") return Refrigerator;
  if (lower === "warehouse" || lower === "garage") return Warehouse;
  if (lower === "beddouble" || lower === "main bedroom") return BedDouble;
  if (lower === "bedsingle" || lower === "kids bedroom") return BedSingle;
  return ClipboardList;
}

function groupPanelClass(frequency?: CleaningRoomTaskGroupFrequency): string {
  switch (frequency) {
    case "daily":
      return "rounded-[8px] border-sky-200/85 bg-sky-50/85";
    case "weekly":
      return "rounded-[8px] border-blue-200/80 bg-blue-50/75";
    case "monthly":
      return "rounded-[8px] border-[#ededed] bg-[#f8f9fa]";
    case "quarterly":
      return "rounded-[8px] border-violet-200/70 bg-violet-50/70";
    default:
      return "rounded-[8px] border-[#ededed] bg-white";
  }
}

export function CleaningHubTiles({
  rooms,
  chores,
  completionRecords,
  today,
  onOpenRoom,
}: {
  rooms: CleaningRoom[];
  chores: Task[];
  completionRecords: CleaningCompletionRecord[];
  today: string;
  onOpenRoom: (roomId: string) => void;
}) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[#ededed] bg-white p-8 text-center text-sm text-[#575757] shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
        No cleaning playbooks yet. They will appear here after data loads.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn(CARD_SMARTHR, "p-4 sm:p-5")}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
          Cleaning Hub
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#1f1f1f] sm:text-xl">
          Room playbooks
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#575757]">
          Tap a room for checklists, supplies, and your finished-clean reference. Progress saves on this device.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {rooms.map((room) => {
          const Icon = getCleaningRoomIcon(room.icon);
          const { total, completed } = getCleaningRoomProgress(room);
          const roomChores = chores.filter((task) => choreMatchesCleaningRoom(room, task));
          const overdue = roomChores.filter((task) => choreDueDate(task) < today).length;
          const dueToday = roomChores.filter((task) => choreDueDate(task) === today).length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const latest = latestCleaningCompletionForRoom(room.id, completionRecords);
          const reviewChip = latest ? completionReviewChip(latest.status) : null;
          const doneTodayLog = roomCleaningCompletedToday(room.id, completionRecords, today);

          return (
            <div key={room.id} className={cn("motion-card flex flex-col", TILE_SMARTHR)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#637381]">
                    Playbook
                  </p>
                  <p className="mt-1 font-semibold leading-snug text-[#1f1f1f]">{room.name}</p>
                </div>
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-[#ededed] bg-gradient-to-br from-orange-50 to-white text-[#F26522] shadow-inner">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">
                    Checklist {completed}/{total}
                  </Badge>
                  {total > 0 ? (
                    <Badge tone={pct === 100 ? "green" : "blue"}>{pct}% done</Badge>
                  ) : null}
                  {doneTodayLog ? <Badge tone="green">Cleaned today</Badge> : null}
                  {reviewChip ? <Badge tone={reviewChip.tone}>{reviewChip.label}</Badge> : null}
                  {dueToday > 0 ? <Badge tone="blue">{dueToday} chore{dueToday === 1 ? "" : "s"} due today</Badge> : null}
                  {overdue > 0 ? <Badge tone="red">{overdue} overdue chore{overdue === 1 ? "" : "s"}</Badge> : null}
                </div>
                <p className="text-xs text-slate-500">
                  {latest ? (
                    <>
                      Last cleaned{" "}
                      <span className="font-medium text-slate-700">
                        {formatShortDate(latest.completedAt)}
                      </span>
                    </>
                  ) : (
                    "No cleaning completions logged yet."
                  )}
                </p>
                <div className="h-2 overflow-hidden rounded-full bg-[#f0f0f0]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6F28] to-[#FF5325] transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <Button
                className={cn(BTN_PRIMARY_ORANGE, "mt-4 w-full")}
                onClick={() => onOpenRoom(room.id)}
                type="button"
                variant="primary"
              >
                Open playbook
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CleaningPlaybookDrawer({
  room,
  chores,
  completionRecords,
  today,
  familyMembers,
  preferenceMemberId,
  onClose,
  onUpdateRoom,
  onAppendCleaningCompletion,
  onPatchCleaningCompletion,
}: {
  room: CleaningRoom | null;
  chores: Task[];
  completionRecords: CleaningCompletionRecord[];
  today: string;
  familyMembers: FamilyMember[];
  preferenceMemberId?: string;
  onClose: () => void;
  onUpdateRoom: (roomId: string, updater: (room: CleaningRoom) => CleaningRoom) => void;
  onAppendCleaningCompletion: (
    record: CleaningCompletionRecord,
    roomTitle: string,
  ) => void;
  onPatchCleaningCompletion: (
    recordId: string,
    patch: Partial<CleaningCompletionRecord>,
  ) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CleaningRoom | null>(room);
  const [stampMemberId, setStampMemberId] = useState(preferenceMemberId ?? "");
  const [incompleteCompleteOpen, setIncompleteCompleteOpen] = useState(false);
  const playbookDrawerTitleId = useId();

  useEffect(() => {
    setEditing(false);
    setDraft(room);
    setIncompleteCompleteOpen(false);
  }, [room?.id]);

  useEffect(() => {
    setStampMemberId(preferenceMemberId ?? "");
  }, [preferenceMemberId, room?.id]);

  const open = Boolean(room);
  useDrawerEscape(open, onClose);

  if (!room || !draft) {
    return null;
  }
  const roomId = room.id;
  const roomTitle = room.name;

  const Icon = getCleaningRoomIcon(room.icon);
  const { total, completed } = getCleaningRoomProgress(room);
  const roomChores = chores.filter((task) => choreMatchesCleaningRoom(room, task));
  const overdue = roomChores.filter((task) => choreDueDate(task) < today).length;
  const dueToday = roomChores.filter((task) => choreDueDate(task) === today).length;

  const latestCompletion = latestCleaningCompletionForRoom(roomId, completionRecords);
  const cleanedTodayDrawer = roomCleaningCompletedToday(roomId, completionRecords, today);

  const referenceUrl = (room.referenceImageUrl ?? "").trim();
  const canPreview =
    referenceUrl.startsWith("http://") || referenceUrl.startsWith("https://");

  const stampRoster = membersForAssignmentSelect(familyMembers, stampMemberId);

  function resolveCompleterMemberId(): string | undefined {
    if (stampMemberId.trim() !== "") return stampMemberId.trim();
    if (preferenceMemberId?.trim()) return preferenceMemberId.trim();
    return undefined;
  }

  function appendRoomCompletion(status: CleaningCompletionStatus) {
    const now = new Date().toISOString();
    const record: CleaningCompletionRecord = {
      id: crypto.randomUUID(),
      roomId,
      completedByMemberId: resolveCompleterMemberId(),
      completedAt: now,
      checklistProgress: { completed, total },
      status,
      createdAt: now,
      updatedAt: now,
    };
    onAppendCleaningCompletion(record, roomTitle);
    setIncompleteCompleteOpen(false);
  }

  function handleMarkRoomCompleteClick() {
    if (total > 0 && completed < total) {
      setIncompleteCompleteOpen(true);
      return;
    }
    appendRoomCompletion("completed");
  }

  function toggleChecklist(groupId: string, taskId: string, next: boolean) {
    const now = new Date().toISOString();
    const byId =
      next && stampMemberId.trim() !== "" ? stampMemberId.trim() : null;
    onUpdateRoom(roomId, (r) => ({
      ...r,
      taskGroups: r.taskGroups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : {
                      ...t,
                      completed: next,
                      completedAt: next ? now : undefined,
                      completedByMemberId: next ? byId : null,
                    },
              ),
            },
      ),
      updatedAt: now,
    }));
  }

  function resetTaskGroup(groupId: string) {
    if (!window.confirm("Clear all checkboxes in this section for now?")) return;
    const now = new Date().toISOString();
    onUpdateRoom(roomId, (r) => ({
      ...r,
      taskGroups: r.taskGroups.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              tasks: g.tasks.map((t) => ({
                ...t,
                completed: false,
                completedAt: undefined,
                completedByMemberId: null,
              })),
            },
      ),
      updatedAt: now,
    }));
  }

  function saveDraft() {
    onUpdateRoom(roomId, () => ({
      ...(draft as CleaningRoom),
      updatedAt: new Date().toISOString(),
    }));
    setEditing(false);
  }

  function addDraftTask(groupId: string) {
    setDraft((d) =>
      d
        ? {
            ...d,
            taskGroups: d.taskGroups.map((g) =>
              g.id !== groupId
                ? g
                : {
                    ...g,
                    tasks: [
                      ...g.tasks,
                      {
                        id: crypto.randomUUID(),
                        title: "New checklist step",
                        completed: false,
                        completedByMemberId: null,
                      },
                    ],
                  },
            ),
          }
        : d,
    );
  }

  function removeDraftTask(groupId: string, taskId: string) {
    if (!window.confirm("Remove this checklist step?")) return;
    setDraft((d) =>
      d
        ? {
            ...d,
            taskGroups: d.taskGroups.map((g) =>
              g.id !== groupId
                ? g
                : { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) },
            ),
          }
        : d,
    );
  }

  const sortedViewGroups = sortCleaningGroupsByFrequency(room.taskGroups);

  return (
    <>
      <DrawerBackdrop ariaLabel="Close cleaning playbook" onClick={onClose} />
      <DrawerPanel
        className="lg:max-w-[min(92vw,72rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={playbookDrawerTitleId}
      >
        <DrawerHeader
          eyebrow="Cleaning playbook"
          title={
            <span className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#ededed] bg-gradient-to-br from-orange-50 to-white text-[#F26522]"
                aria-hidden
              >
                <Icon className="h-6 w-6" />
              </span>
              <h2
                id={playbookDrawerTitleId}
                className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[1.65rem]"
              >
                {room.name}
              </h2>
            </span>
          }
          subtitle={
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">
                  Checklist {completed}/{total}
                </Badge>
                {cleanedTodayDrawer ? <Badge tone="green">Completed today</Badge> : null}
                {latestCompletion?.status === "needs_review" ? (
                  <Badge tone="amber">Needs review</Badge>
                ) : null}
                {latestCompletion?.status === "approved" ? (
                  <Badge tone="green">Approved</Badge>
                ) : null}
                {latestCompletion?.status === "needs_redo" ? (
                  <Badge tone="red">Needs redo</Badge>
                ) : null}
                {dueToday > 0 ? (
                  <Badge tone="blue">
                    {dueToday} linked chore{dueToday === 1 ? "" : "s"} due today
                  </Badge>
                ) : null}
                {overdue > 0 ? (
                  <Badge tone="red">
                    {overdue} overdue linked chore{overdue === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-slate-600">
                {latestCompletion ? (
                  <>
                    Last completed{" "}
                    <span className="font-medium text-slate-800">
                      {formatShortDate(latestCompletion.completedAt)}
                    </span>
                  </>
                ) : (
                  "No completions logged for this room yet."
                )}
              </p>
            </div>
          }
          trailing={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (editing) {
                    setDraft(room);
                    setEditing(false);
                  } else {
                    setEditing(true);
                  }
                }}
              >
                {editing ? "Back to playbook" : "Customize"}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          }
        />
        <DrawerBody className="bg-gradient-to-b from-slate-50/80 to-white">
          {!editing ? (
            <div className="mx-auto max-w-6xl space-y-5">
              <p className="text-sm leading-relaxed text-slate-600">
                {room.description || "Follow the steps below, check items off as you go, and match the reference photo when you are finished."}
              </p>

              <PlaybookField label="Stamp completions as (optional)">
                <Select
                  value={stampMemberId}
                  onChange={(e) => setStampMemberId(e.target.value)}
                  className="max-w-md"
                >
                  <option value="">Do not record who checked</option>
                  {stampRoster.map((m) => (
                    <option key={m.id} value={m.id}>
                      {getMemberFullName(m)}
                    </option>
                  ))}
                </Select>
              </PlaybookField>

              <section
                className={cn(
                  CARD_SMARTHR,
                  "border border-[#ededed] bg-[#f8faf9] p-4 ring-1 ring-[#22c55e]/10 sm:p-5",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                  Completion
                </p>
                <p className="mt-2 text-sm text-[#1f1f1f]">
                  Checklist progress:{" "}
                  <span className="font-semibold">
                    {completed}/{total}
                  </span>{" "}
                  checked
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className={BTN_PRIMARY_ORANGE}
                    variant="primary"
                    onClick={handleMarkRoomCompleteClick}
                  >
                    Mark room complete
                  </Button>
                </div>
                {incompleteCompleteOpen ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/95 p-4">
                    <p className="text-sm font-medium text-amber-950">
                      Some checklist items are still unchecked.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIncompleteCompleteOpen(false)}
                      >
                        Continue cleaning
                      </Button>
                      <Button
                        type="button"
                        className={BTN_PRIMARY_ORANGE}
                        variant="primary"
                        onClick={() => appendRoomCompletion("needs_review")}
                      >
                        Mark complete anyway
                      </Button>
                    </div>
                  </div>
                ) : null}
              </section>

              {latestCompletion?.status === "needs_review" ? (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
                    Review
                  </p>
                  <p className="mt-2 text-sm text-amber-950">
                    Logged at checklist{" "}
                    {latestCompletion.checklistProgress.completed}/
                    {latestCompletion.checklistProgress.total}. Approve or send back without proof
                    photos.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className={BTN_PRIMARY_ORANGE}
                      variant="primary"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const reviewer = resolveCompleterMemberId();
                        onPatchCleaningCompletion(latestCompletion.id, {
                          status: "approved",
                          reviewedByMemberId: reviewer,
                          reviewedAt: now,
                          updatedAt: now,
                        });
                      }}
                    >
                      Mark approved
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const reviewer = resolveCompleterMemberId();
                        onPatchCleaningCompletion(latestCompletion.id, {
                          status: "needs_redo",
                          reviewedByMemberId: reviewer,
                          reviewedAt: now,
                          updatedAt: now,
                        });
                      }}
                    >
                      Mark needs redo
                    </Button>
                  </div>
                </section>
              ) : null}

              <section className={cn(CARD_SMARTHR, "p-4 sm:p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#637381]">
                      Finished clean look
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {room.referenceImageCaption || "What “done” looks like for this room."}
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 shrink-0 text-[#F26522]/90" aria-hidden />
                </div>
                {canPreview ? (
                  <img
                    alt={room.referenceImageCaption ?? "Clean room reference"}
                    className="mt-4 max-h-72 w-full rounded-[8px] border border-[#ededed] bg-[#f8f9fa] object-contain"
                    src={referenceUrl}
                    loading="lazy"
                  />
                ) : (
                  <div className="mt-4 flex min-h-[10rem] flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-[#ededed] bg-[#fafafa] px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">No reference photo yet</p>
                    <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                      Add a reference photo URL to show what this room should look like when finished.
                      Only the URL is saved — no uploads or large images in storage.
                    </p>
                  </div>
                )}
              </section>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-sky-200/75 bg-sky-50/65 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-900">
                      What I have to do
                    </p>
                    <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-relaxed text-sky-950">
                      {(room.whatToDo ?? []).length ? (
                        room.whatToDo.map((row, idx) => <li key={idx}>{row}</li>)
                      ) : (
                        <li className="text-sky-900/70">Add guidance in Customize.</li>
                      )}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                      Cleaning supplies I need
                    </p>
                    <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-900">
                      {(room.suppliesNeeded ?? []).length ? (
                        room.suppliesNeeded.map((row, idx) => <li key={idx}>{row}</li>)
                      ) : (
                        <li className="text-slate-600">List supplies in Customize.</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedViewGroups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        "border p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)] sm:p-5",
                        groupPanelClass(group.frequency),
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-600">
                            {group.tasks.filter((t) => t.completed).length}/{group.tasks.length}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={() => resetTaskGroup(group.id)}
                          >
                            Reset section
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {group.tasks.length === 0 ? (
                          <p className="text-sm text-slate-600">No steps yet.</p>
                        ) : (
                          group.tasks.map((task) => {
                            const roster = membersForAssignmentSelect(
                              familyMembers,
                              task.completedByMemberId ?? undefined,
                            );
                            const who = task.completedByMemberId
                              ? roster.find((m) => m.id === task.completedByMemberId)
                              : undefined;
                            return (
                              <label
                                key={task.id}
                                className="flex cursor-pointer gap-3 rounded-[8px] border border-[#ededed] bg-white px-3 py-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 h-5 w-5 shrink-0 accent-[#F26522]"
                                  checked={task.completed === true}
                                  onChange={(e) =>
                                    toggleChecklist(group.id, task.id, e.target.checked)
                                  }
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-900">{task.title}</p>
                                  {task.completed && task.completedAt ? (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      Checked {new Date(task.completedAt).toLocaleString()}
                                      {who ? ` · ${getMemberFullName(who)}` : ""}
                                    </p>
                                  ) : null}
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <PlaybookField label="Room name">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  />
                </PlaybookField>
                <PlaybookField label="Zone (matches chore “Zone” field)">
                  <Input
                    value={draft.zone ?? ""}
                    onChange={(e) =>
                      setDraft((d) =>
                        d ? { ...d, zone: e.target.value || undefined } : d,
                      )
                    }
                    placeholder={draft.name}
                  />
                </PlaybookField>
                <PlaybookField label="Icon (Lucide name)">
                  <Input
                    value={draft.icon}
                    onChange={(e) => setDraft((d) => (d ? { ...d, icon: e.target.value } : d))}
                    placeholder="Bath, Warehouse, Sofa…"
                  />
                </PlaybookField>
              </div>
              <PlaybookField label="Short description">
                <Input
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                  }
                />
              </PlaybookField>
              <PlaybookField label="Finished clean look — image URL (https only recommended)">
                <Input
                  value={draft.referenceImageUrl ?? ""}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, referenceImageUrl: e.target.value } : d,
                    )
                  }
                  placeholder="https://…"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Add a reference photo URL to show what this room should look like when finished. Only
                  the URL is saved locally — no image files or base64 in storage.
                </p>
              </PlaybookField>
              <PlaybookField label="Caption for reference photo">
                <Input
                  value={draft.referenceImageCaption ?? ""}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, referenceImageCaption: e.target.value } : d,
                    )
                  }
                />
              </PlaybookField>
              <PlaybookField label="What I have to do (one per line)">
                <Textarea
                  value={(draft.whatToDo ?? []).join("\n")}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            whatToDo: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : d,
                    )
                  }
                  rows={6}
                />
              </PlaybookField>
              <PlaybookField label="Cleaning supplies I need (one per line)">
                <Textarea
                  value={(draft.suppliesNeeded ?? []).join("\n")}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            suppliesNeeded: e.target.value
                              .split("\n")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : d,
                    )
                  }
                  rows={5}
                />
              </PlaybookField>

              <div className="space-y-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-800">Checklist groups</p>
                {draft.taskGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="min-w-[8rem] flex-1"
                        value={group.title}
                        onChange={(e) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  taskGroups: d.taskGroups.map((g) =>
                                    g.id === group.id ? { ...g, title: e.target.value } : g,
                                  ),
                                }
                              : d,
                          )
                        }
                      />
                      <Select
                        className="w-36"
                        value={group.frequency ?? "custom"}
                        onChange={(e) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  taskGroups: d.taskGroups.map((g) =>
                                    g.id === group.id
                                      ? {
                                          ...g,
                                          frequency: e.target
                                            .value as CleaningRoomTaskGroupFrequency,
                                        }
                                      : g,
                                  ),
                                }
                              : d,
                          )
                        }
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="custom">Custom</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      {group.tasks.map((task) => (
                        <div key={task.id} className="flex gap-2">
                          <Input
                            className="flex-1"
                            value={task.title}
                            onChange={(e) =>
                              setDraft((d) =>
                                d
                                  ? {
                                      ...d,
                                      taskGroups: d.taskGroups.map((g) =>
                                        g.id !== group.id
                                          ? g
                                          : {
                                              ...g,
                                              tasks: g.tasks.map((t) =>
                                                t.id === task.id
                                                  ? { ...t, title: e.target.value }
                                                  : t,
                                              ),
                                            },
                                      ),
                                    }
                                  : d,
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="shrink-0 text-rose-600"
                            onClick={() => removeDraftTask(group.id, task.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs"
                      onClick={() => addDraftTask(group.id)}
                    >
                      Add checklist item
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setDraft(room)}>
                  Discard edits
                </Button>
                <Button variant="primary" onClick={saveDraft}>
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerPanel>
    </>
  );
}

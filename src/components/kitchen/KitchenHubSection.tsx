import { useMemo, type Dispatch, type SetStateAction } from "react";
import type {
  FamilyData,
  KitchenDutyCompletion,
  KitchenWeekday,
} from "../../data/familyData";
import { KitchenMemberDropdown } from "../dashboard/KitchenMemberDropdown";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { WorkspacePanel } from "../workspace/ModuleWorkspace";
import { createActivity } from "../../lib/activity";
import {
  getNextWeekdayKitchenAssignment,
  getTodayKitchenWeekdayLocal,
  isKitchenDutyCompleteForDate,
  kitchenDutyRelatedNotificationId,
  labelKitchenWeekday,
} from "../../lib/kitchenDuty";
import {
  kitchenChecklistProgressVisible,
  toggleKitchenChecklistItemForDate,
  visibleKitchenChecklistItems,
} from "../../lib/kitchenChecklistDisplay";
import {
  isoDateForNextKitchenWeekdayOccurrence,
  KITCHEN_WEEKDAY_ABBR,
} from "../../lib/kitchenWeekDates";
import { membersForAssignmentSelect } from "../../lib/memberAssignment";
import { cn, findMemberById, formatShortDate, getMemberFullName } from "../../lib/utils";

const KITCHEN_PANEL =
  "!rounded-[8px] !border-[#ededed] shadow-[0_1px_1px_rgba(0,0,0,0.12)] ring-0";
const btnPrimaryOrange =
  "bg-gradient-to-r from-[#FF6F28] to-[#FF5325] font-semibold text-white shadow-[0_6px_15px_rgba(242,101,34,0.22)] hover:brightness-[1.03]";

export function KitchenHubSection({
  data,
  setData,
  today,
}: {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  today: string;
}) {
  const todayKitchenDay = getTodayKitchenWeekdayLocal();
  const kitchenTodayEntry = todayKitchenDay
    ? data.kitchenSchedule.weekdays.find((w) => w.day === todayKitchenDay)
    : undefined;
  const kitchenTodayMember = kitchenTodayEntry
    ? findMemberById(data, kitchenTodayEntry.memberId)
    : undefined;
  const kitchenCompletedToday = isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, today);
  const checklistProgress = kitchenChecklistProgressVisible(data.kitchenChecklist, today);
  const visibleKitchenItems = useMemo(
    () => visibleKitchenChecklistItems(data.kitchenChecklist),
    [data.kitchenChecklist],
  );
  const nextDuty = !todayKitchenDay ? getNextWeekdayKitchenAssignment(data.kitchenSchedule) : null;
  const nextMember = nextDuty ? findMemberById(data, nextDuty.memberId) : undefined;

  const kitchenAssignMembers = useMemo(
    () =>
      membersForAssignmentSelect(
        data.familyMembers,
        ...data.kitchenSchedule.weekdays.map((w) => w.memberId),
      ),
    [data.familyMembers, data.kitchenSchedule.weekdays],
  );

  const kitchenChores = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          t.type === "chore" &&
          t.status !== "Done" &&
          t.status !== "Completed" &&
          ((t.zone ?? "").toLowerCase().includes("kitchen") ||
            (t.category ?? "").toLowerCase().includes("kitchen")),
      ),
    [data.tasks],
  );

  const history = useMemo(
    () =>
      [...data.kitchenDutyCompletions].sort((a, b) =>
        b.dutyDate.localeCompare(a.dutyDate),
      ),
    [data.kitchenDutyCompletions],
  );

  function updateKitchenDay(day: KitchenWeekday, memberId: string) {
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      kitchenSchedule: {
        ...current.kitchenSchedule,
        weekdays: current.kitchenSchedule.weekdays.map((row) =>
          row.day === day ? { ...row, memberId } : row,
        ),
        updatedAt: now,
      },
    }));
  }

  function toggleKitchenTodayDone() {
    if (!todayKitchenDay || !kitchenTodayMember) {
      return;
    }
    const now = new Date().toISOString();
    const relatedId = kitchenDutyRelatedNotificationId(today);
    const activeMemberId =
      data.adminSettings.activePreferencesMemberId ??
      data.familyMembers.find((m) => m.status === "active")?.id;

    setData((current) => {
      const existing = current.kitchenDutyCompletions.find((c) => c.dutyDate === today);
      if (existing) {
        const nextCompletions = current.kitchenDutyCompletions.filter((c) => c.id !== existing.id);
        const dates = new Set(current.kitchenSchedule.completedDates ?? []);
        dates.delete(today);
        return createActivity(
          {
            ...current,
            kitchenDutyCompletions: nextCompletions,
            kitchenSchedule: {
              ...current.kitchenSchedule,
              completedDates: [...dates].sort(),
              kitchenDutyReminderIssuedForDate: undefined,
              updatedAt: now,
            },
          },
          {
            type: "updated",
            entityType: "data",
            entityId: "kitchen-schedule",
            entityTitle: "Kitchen schedule",
            message: "Kitchen duty marked not complete for today.",
          },
        );
      }

      const completion: KitchenDutyCompletion = {
        id: crypto.randomUUID(),
        dayKey: todayKitchenDay,
        dutyDate: today,
        memberId: kitchenTodayMember.id,
        completedAt: now,
        completedByMemberId: activeMemberId,
        createdAt: now,
      };
      const dates = new Set(current.kitchenSchedule.completedDates ?? []);
      dates.add(today);
      const notifications = current.notifications.map((n) =>
        n.type === "kitchen_duty" && n.relatedEntityId === relatedId && !n.dismissedAt
          ? { ...n, dismissedAt: now }
          : n,
      );

      return createActivity(
        {
          ...current,
          kitchenDutyCompletions: [...current.kitchenDutyCompletions, completion],
          kitchenSchedule: {
            ...current.kitchenSchedule,
            completedDates: [...dates].sort(),
            updatedAt: now,
          },
          notifications,
        },
        {
          type: "completed",
          entityType: "data",
          entityId: completion.id,
          entityTitle: "Kitchen duty",
          message: "Completed kitchen duty.",
          memberId: activeMemberId,
        },
      );
    });
  }

  function toggleKitchenChecklistItem(itemId: string) {
    setData((current) => ({
      ...current,
      kitchenChecklist: toggleKitchenChecklistItemForDate(current.kitchenChecklist, itemId, today),
    }));
  }

  function updateKitchenChecklistLabel(itemId: string, label: string) {
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }
    setData((current) => ({
      ...current,
      kitchenChecklist: current.kitchenChecklist.map((item) =>
        item.id === itemId ? { ...item, label: trimmed } : item,
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <WorkspacePanel
        className={KITCHEN_PANEL}
        title="Weekly kitchen schedule"
        eyebrow="Monday–Friday dinner lead"
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <ul className="space-y-2" id="tasks-kitchen-weekdays">
            {data.kitchenSchedule.weekdays.map((row) => {
              const isToday = todayKitchenDay === row.day;
              const rowDone =
                isToday &&
                isKitchenDutyCompleteForDate(data.kitchenDutyCompletions, today);
              const iso = isoDateForNextKitchenWeekdayOccurrence(today, row.day);
              const dateMain = new Intl.DateTimeFormat(undefined, {
                month: "short",
                day: "numeric",
              }).format(new Date(`${iso}T12:00:00`));
              return (
                <li
                  key={row.day}
                  className={cn(
                    "flex flex-col gap-2 rounded-[8px] border px-3 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                    isToday
                      ? "border-[#FE9F43]/55 bg-orange-50/95 ring-2 ring-[#FF6F28]/25"
                      : "border-[#ededed] bg-white",
                  )}
                >
                  <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {KITCHEN_WEEKDAY_ABBR[row.day]}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-semibold leading-none tracking-tight text-slate-950">
                        {dateMain}
                      </span>
                      {isToday ? (
                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
                          Today
                        </span>
                      ) : null}
                      {isToday && rowDone ? (
                        <span className="text-xs font-semibold text-emerald-800">Done today</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="w-full sm:max-w-[17rem] sm:shrink-0">
                    <KitchenMemberDropdown
                      tone="light"
                      members={kitchenAssignMembers}
                      value={row.memberId}
                      ariaLabel={`Assign ${labelKitchenWeekday(row.day)}`}
                      onChange={(memberId) => updateKitchenDay(row.day, memberId)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] p-4 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Today
            </p>
            {todayKitchenDay && kitchenTodayMember ? (
              <div className="mt-2 space-y-3">
                <p className="text-lg font-semibold text-slate-950">
                  {getMemberFullName(kitchenTodayMember)}
                </p>
                <p className="text-sm text-slate-600">
                  {kitchenCompletedToday ? (
                    <span className="font-medium text-emerald-800">Marked complete for today.</span>
                  ) : (
                    <span>Not marked complete yet.</span>
                  )}
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant={kitchenCompletedToday ? "secondary" : "primary"}
                    className={cn(
                      "min-h-12 w-full",
                      !kitchenCompletedToday && btnPrimaryOrange,
                      kitchenCompletedToday &&
                        "border-[#ededed] bg-white font-semibold text-[#637381] shadow-sm hover:bg-[#f8f9fa]",
                    )}
                    onClick={toggleKitchenTodayDone}
                  >
                    {kitchenCompletedToday ? "Undo today done" : "Mark today done"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2 text-sm text-slate-700">
                <p>No weekday kitchen duty scheduled today.</p>
                {nextDuty && nextMember ? (
                  <p>
                    Next:{" "}
                    <span className="font-semibold text-slate-950">
                      {labelKitchenWeekday(nextDuty.day)}
                    </span>{" "}
                    · {getMemberFullName(nextMember)}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel
        className={KITCHEN_PANEL}
        title="Kitchen cleaning checklist"
        eyebrow="Daily close-down steps"
      >
        <p className="mb-3 text-sm text-slate-600">
          Checked items reset when you toggle off or change day. Edit labels to match your home.
        </p>
        <div className="mb-3 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1f1f1f]">
          Progress today:{" "}
          <span className="font-semibold tabular-nums">
            {checklistProgress.completed}/{checklistProgress.total}
          </span>
        </div>
        <ul className="space-y-2">
          {visibleKitchenItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start gap-3 rounded-[8px] border border-[#ededed] bg-white px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
              >
                <label className="flex cursor-pointer items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-5 w-5 accent-[#F26522]"
                    checked={item.checkedDate === today}
                    onChange={() => toggleKitchenChecklistItem(item.id)}
                  />
                </label>
                <Input
                  className="min-h-11 flex-1 text-sm"
                  value={item.label}
                  onChange={(e) => updateKitchenChecklistLabel(item.id, e.target.value)}
                />
              </li>
            ))}
        </ul>
      </WorkspacePanel>

      <WorkspacePanel
        className={KITCHEN_PANEL}
        title="Kitchen chore shortcuts"
        eyebrow="Open chores tagged kitchen"
      >
        {kitchenChores.length === 0 ? (
          <p className="text-sm text-slate-600">No open kitchen-tagged chores.</p>
        ) : (
          <ul className="space-y-2">
            {kitchenChores.slice(0, 12).map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#ededed] px-3 py-2 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.04)]"
              >
                <span className="font-medium text-slate-950">{t.title}</span>
                <span className="text-xs text-slate-500">
                  Due {formatShortDate(t.nextDueDate || t.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </WorkspacePanel>

      <WorkspacePanel
        className={KITCHEN_PANEL}
        title="Kitchen duty history"
        eyebrow="Recent completions"
      >
        {history.length === 0 ? (
          <p className="text-sm text-slate-600">No logged completions yet.</p>
        ) : (
          <ul className="max-h-60 space-y-2 overflow-y-auto">
            {history.slice(0, 40).map((row) => {
              const m = findMemberById(data, row.memberId);
              const by = row.completedByMemberId
                ? findMemberById(data, row.completedByMemberId)
                : undefined;
              return (
                <li
                  key={row.id}
                  className="rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-950">{row.dutyDate}</span>
                  <span className="text-slate-600">
                    {" "}
                    · {labelKitchenWeekday(row.dayKey)}
                    {m ? <> · {getMemberFullName(m)}</> : null}
                  </span>
                  {by ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Logged by {getMemberFullName(by)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </WorkspacePanel>
    </div>
  );
}

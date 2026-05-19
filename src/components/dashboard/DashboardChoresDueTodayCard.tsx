import { ChevronRight, ListChecks } from "lucide-react";
import type { FamilyData, Task, TaskStatus } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import {
  choreHomeRowTier,
  compareChoresForDashboardMemberView,
} from "../../lib/dashboardCommandCenterFilters";
import { getChoreDueDate, isChoreDone, patchTaskAfterChoreMarkedDone } from "../../lib/choreTrackerUtils";
import { resolveSessionMemberIdForUi } from "../../lib/familyDataSelectors";
import { getMemberColorById } from "../../lib/memberColors";
import {
  SMARTHR_BORDER_TOP,
  SMARTHR_HUB_ASSIGNMENT_META,
  SMARTHR_HUB_ASSIGNMENT_META_SOFT,
  SMARTHR_HUB_CHORE_PAST_DUE_KICKER,
  SMARTHR_HUB_CHORE_SELECT,
  SMARTHR_HUB_CHORE_TRACKER_LINK,
  SMARTHR_HUB_META_SEPARATOR,
  SMARTHR_HUB_SECTION_DUE,
  SMARTHR_HUB_SECTION_OVERDUE,
  SMARTHR_HUB_TITLE_MUTED,
  SMARTHR_HUB_TITLE_SHARED,
  SMARTHR_TITLE,
  SMARTHR_UI_COLORS,
} from "../../lib/smarthrUi";
import { cn, findMemberById, formatShortDate, getMemberFullName } from "../../lib/utils";
import { Select } from "../ui/Field";
import { hubCardClass, hubCardTitleClass, hubDashWidgetIconClass, hubMutedClass } from "./hub/dashboardHubTokens";

type Props = {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
  todayIso: string;
  dashboardViewMemberId: string | null;
  navigateWithinApp?: (href: string) => void;
};

type RowTier = "primary" | "shared" | "muted";

const TRACKER_STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Done"];

function compareOpenChores(
  a: Task,
  b: Task,
  dashboardViewMemberId: string | null,
): number {
  return compareChoresForDashboardMemberView(
    a,
    b,
    dashboardViewMemberId,
    (x, y) => getChoreDueDate(x).localeCompare(getChoreDueDate(y)) || x.title.localeCompare(y.title),
  );
}

function choreRowSurfaceClasses(tier: RowTier, overdue: boolean): string {
  if (overdue) {
    return cn(
      "border border-amber-200/90 bg-amber-50/70 shadow-[0_1px_2px_rgba(180,83,9,0.06)]",
      tier === "muted" && "opacity-[0.95]",
    );
  }
  if (tier === "primary") {
    return "border-[#E5E7EB] bg-[#fafafa]";
  }
  if (tier === "shared") {
    return "border-[#e8e8e8] bg-[#fbfbfb]";
  }
  return "border-[#E5E7EB]/70 bg-[#f4f4f4]/90 opacity-[0.92]";
}

function choreTitleClasses(tier: RowTier): string {
  if (tier === "primary") {
    return SMARTHR_TITLE;
  }
  if (tier === "shared") {
    return SMARTHR_HUB_TITLE_SHARED;
  }
  return SMARTHR_HUB_TITLE_MUTED;
}

const OVERDUE_CAP = 8;
const DUE_TODAY_CAP = 10;

/**
 * Open household chores: overdue and due today with assignee color, due date, and status control.
 * Member view sorts that member’s rows first; Family chores stay visible.
 */
export function DashboardChoresDueTodayCard({
  data,
  setData,
  todayIso,
  dashboardViewMemberId,
  navigateWithinApp,
}: Props) {
  const sessionMemberId = resolveSessionMemberIdForUi(data);
  const openChores = data.tasks.filter((t) => t.type === "chore" && !isChoreDone(t));

  const overduePool = openChores.filter((t) => getChoreDueDate(t) < todayIso);
  const dueTodayPool = openChores.filter((t) => getChoreDueDate(t) === todayIso);

  const overdue = [...overduePool].sort((a, b) => compareOpenChores(a, b, dashboardViewMemberId)).slice(0, OVERDUE_CAP);
  const dueToday = [...dueTodayPool]
    .sort((a, b) => compareOpenChores(a, b, dashboardViewMemberId))
    .slice(0, DUE_TODAY_CAP);

  const hasAny = overdue.length > 0 || dueToday.length > 0;

  function updateChore(task: Task, updates: Partial<Task>, message: string) {
    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item,
          ),
        },
        {
          type: "updated",
          entityType: "chore",
          entityId: task.id,
          entityTitle: task.title,
          memberId: task.assignedMemberId || undefined,
          message,
        },
      ),
    );
  }

  function onStatusChange(task: Task, next: TaskStatus) {
    if (next === "Done") {
      const completedBy =
        task.lastCompletedByMemberId?.trim() || sessionMemberId || task.assignedMemberId || undefined;
      const patch = patchTaskAfterChoreMarkedDone(
        task.frequency,
        todayIso,
        new Date().toISOString(),
        completedBy,
        task.dueDate,
        task.nextDueDate,
      );
      updateChore(task, patch, `Marked done from home: ${task.title}.`);
      return;
    }
    updateChore(task, { status: next }, `Updated status from home: ${task.title}.`);
  }

  function renderRow(t: Task, overdueRow: boolean) {
    const assignee = findMemberById(data, t.assignedMemberId);
    const accent = t.assignedMemberId
      ? getMemberColorById(t.assignedMemberId, data.familyMembers)
      : SMARTHR_UI_COLORS.textGroupLabel;
    const assigneeLabel = assignee ? getMemberFullName(assignee) : "Family";
    const tier = choreHomeRowTier(t, dashboardViewMemberId);
    const due = getChoreDueDate(t);
    const metaMuted =
      tier === "muted"
        ? SMARTHR_HUB_ASSIGNMENT_META_SOFT
        : tier === "shared"
          ? SMARTHR_HUB_ASSIGNMENT_META_SOFT
          : SMARTHR_HUB_ASSIGNMENT_META;
    const selectValue =
      t.status === "Completed"
        ? "Done"
        : TRACKER_STATUSES.includes(t.status)
          ? t.status
          : "Not Started";

    return (
      <li
        key={t.id}
        className={cn(
          "flex flex-col gap-2 rounded-md border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
          choreRowSurfaceClasses(tier, overdueRow),
        )}
        style={{
          borderLeftWidth: 4,
          borderLeftColor: overdueRow ? SMARTHR_UI_COLORS.choreOverdue : accent,
        }}
      >
        <div className="min-w-0 flex-1">
          {overdueRow ? <p className={SMARTHR_HUB_CHORE_PAST_DUE_KICKER}>Past due</p> : null}
          <p className={cn("text-[15px] font-semibold leading-snug", choreTitleClasses(tier))}>{t.title}</p>
          <p className={cn(hubMutedClass, "mt-1 text-[12px]")}>
            <span className={cn("font-medium", metaMuted)}>
              {overdueRow ? `Was due ${formatShortDate(due)}` : `Due ${formatShortDate(due)}`}
            </span>
            <span className={cn("mx-1.5", SMARTHR_HUB_META_SEPARATOR, metaMuted)} aria-hidden>
              ·
            </span>
            <span className={cn("font-medium", metaMuted)}>{assigneeLabel}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1 sm:items-end">
          <label className="sr-only" htmlFor={`home-chore-status-${t.id}`}>
            Status for {t.title}
          </label>
          <Select
            id={`home-chore-status-${t.id}`}
            className={SMARTHR_HUB_CHORE_SELECT}
            value={selectValue}
            onChange={(e) => onStatusChange(t, e.target.value as TaskStatus)}
          >
            {TRACKER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "Not Started" ? "Not started" : s === "In Progress" ? "In progress" : s}
              </option>
            ))}
          </Select>
        </div>
      </li>
    );
  }

  return (
    <section className={hubCardClass} aria-labelledby="home-chores-hub-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={hubDashWidgetIconClass} aria-hidden>
            <ListChecks className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <h2 id="home-chores-hub-title" className={hubCardTitleClass}>
            Household chores
          </h2>
        </div>
        <button
          type="button"
          className={SMARTHR_HUB_CHORE_TRACKER_LINK}
          onClick={() => navigateWithinApp?.("/tasks#chore-tracker")}
          aria-label="Open full chore tracker"
        >
          Open tracker
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {!hasAny ? (
        <p className={cn(hubMutedClass, "text-[14px] leading-relaxed")}>
          No open chores are overdue or due today — you’re caught up for now.
        </p>
      ) : (
        <div className="space-y-5">
          {overdue.length > 0 ? (
            <div>
              <h3 className={SMARTHR_HUB_SECTION_OVERDUE}>Overdue</h3>
              <ul className="space-y-2">{overdue.map((t) => renderRow(t, true))}</ul>
              {overduePool.length > OVERDUE_CAP ? (
                <p className={cn(hubMutedClass, "mt-2 text-[12px]")}>
                  +{overduePool.length - OVERDUE_CAP} more in tracker
                </p>
              ) : null}
            </div>
          ) : null}

          {dueToday.length > 0 || dueTodayPool.length === 0 ? (
            <div>
              <h3 className={SMARTHR_HUB_SECTION_DUE}>Due today</h3>
              {dueToday.length === 0 ? (
                <p className={cn(hubMutedClass, "text-[14px] leading-relaxed")}>Nothing due today.</p>
              ) : (
                <ul className="space-y-2">{dueToday.map((t) => renderRow(t, false))}</ul>
              )}
              {dueTodayPool.length > DUE_TODAY_CAP ? (
                <p className={cn(hubMutedClass, "mt-2 text-[12px]")}>
                  +{dueTodayPool.length - DUE_TODAY_CAP} more due today in tracker
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {dashboardViewMemberId && hasAny ? (
        <p className={cn(hubMutedClass, "mt-3 border-t pt-3 text-[12px] leading-snug", SMARTHR_BORDER_TOP)}>
          Showing everyone’s chores; yours and shared Family rows are listed first in each section.
        </p>
      ) : null}
    </section>
  );
}

import { useMemo, useState, type ReactNode } from "react";
import type {
  ActivityLogItem,
  CleaningCompletionRecord,
  FamilyMember,
  PlannerEvent,
  Task,
} from "../../data/familyData";
import type { UpcomingEventRow } from "../../lib/upcomingEvents";
import type { MemberChoreSuggestion, MemberTaskProgress } from "../../types/memberTasks";
import { resolveMemberTheme } from "../../lib/memberTheme";
import { computeMemberCompletionStreak } from "../../lib/memberStreak";
import { cn, formatShortDate } from "../../lib/utils";
import { UpcomingEventsList } from "../events/UpcomingEventsList";
import { MemberSuggestions } from "./MemberSuggestions";
import { MemberHeroCard } from "./MemberHeroCard";
import { MemberProgressPanel } from "./MemberProgressPanel";
import { MemberQuickActions } from "./MemberQuickActions";
import { MemberTaskBoard } from "./MemberTaskBoard";
import { MemberTaskEditModal } from "./MemberTaskEditModal";
import { KioskCard } from "../cards/Card";
import "../cards/kiosk.css";
import "./member-dashboard.css";

export type MemberWorkspaceProps = {
  member: FamilyMember;
  memberDisplayName: string;
  dateLabel: string;
  todayIso: string;
  familyMembers: FamilyMember[];
  itemsDueToday: Task[];
  overdueItems: Task[];
  upcomingItems: Task[];
  recurringChores: Task[];
  recentlyCompletedItems: Task[];
  todayPlannerItems: PlannerEvent[];
  upcomingPlannerItems: PlannerEvent[];
  upcomingEventRows?: UpcomingEventRow[];
  recentCleaningCompletions: CleaningCompletionRecord[];
  cleaningRoomName: (roomId: string) => string;
  cleaningStatusLabel: (status: CleaningCompletionRecord["status"]) => string;
  recentActivity: ActivityLogItem[];
  memberSuggestions: MemberChoreSuggestion[];
  memberProgress: MemberTaskProgress;
  tasksById: Map<string, Task>;
  onCompleteTask: (task: Task) => void;
  onSkipTask: (task: Task) => void;
  onSaveTask: (
    taskId: string,
    patch: Partial<Pick<Task, "title" | "notes" | "assignedMemberId" | "owner">>,
    previousAssigneeId?: string,
  ) => void;
  onOpenTasks?: () => void;
  onOpenCalendar?: () => void;
  getTaskDueDate: (task: Task) => string;
  headerSlot?: ReactNode;
  pinPanel?: ReactNode;
};

export function MemberWorkspace(props: MemberWorkspaceProps) {
  const theme = resolveMemberTheme(props.member.colorTheme);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"edit" | "note">("edit");

  const weeklyTasks = useMemo(
    () => [
      ...props.itemsDueToday,
      ...props.overdueItems,
      ...props.upcomingItems.slice(0, 6),
    ],
    [props.itemsDueToday, props.overdueItems, props.upcomingItems],
  );

  const streakDays = useMemo(() => {
    const assigned = Array.from(props.tasksById.values()).filter(
      (t) => t.assignedMemberId === props.member.id,
    );
    return computeMemberCompletionStreak(assigned, props.member.id, props.todayIso);
  }, [props.tasksById, props.member.id, props.todayIso]);

  const selectedTask = selectedTaskId ? props.tasksById.get(selectedTaskId) ?? null : null;

  function selectTask(task: Task) {
    setSelectedTaskId((prev) => (prev === task.id ? null : task.id));
  }

  function openEdit(task: Task, mode: "edit" | "note") {
    setSelectedTaskId(task.id);
    setEditMode(mode);
    setEditOpen(true);
  }

  return (
    <div className={cn("fh-member-dash wd-member-dashboard space-y-5 sm:space-y-6", theme.shell)}>
      {props.headerSlot}

      <article className="fh-member-dash__shell overflow-hidden">
        <MemberHeroCard
          member={props.member}
          displayName={props.memberDisplayName}
          dateLabel={props.dateLabel}
          dueTodayCount={props.itemsDueToday.length}
          overdueCount={props.overdueItems.length}
          completedWeekCount={props.memberProgress.weekly.completed}
          streakDays={streakDays}
        />

        <MemberProgressPanel progress={props.memberProgress} streakDays={streakDays} />

        <MemberQuickActions
          selectedTask={selectedTask}
          onComplete={props.onCompleteTask}
          onSkip={props.onSkipTask}
          onReassign={(task) => openEdit(task, "edit")}
          onAddNote={(task) => openEdit(task, "note")}
          onEdit={(task) => openEdit(task, "edit")}
        />

        <MemberTaskBoard
          memberDisplayName={props.memberDisplayName}
          itemsDueToday={props.itemsDueToday}
          overdueItems={props.overdueItems}
          upcomingItems={props.upcomingItems}
          recurringChores={props.recurringChores}
          recentlyCompletedItems={props.recentlyCompletedItems}
          todayPlannerItems={props.todayPlannerItems}
          weeklyTasks={weeklyTasks}
          selectedTaskId={selectedTaskId}
          onSelectTask={selectTask}
          onCompleteTask={props.onCompleteTask}
          getTaskDueDate={props.getTaskDueDate}
        />

        <section
          className="fh-member-upcoming mx-4 mb-5 space-y-3 sm:mx-5"
          aria-labelledby="member-home-upcoming-events"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Calendar
              </p>
              <h2
                id="member-home-upcoming-events"
                className="text-lg font-extrabold tracking-[-0.02em] text-slate-900"
              >
                Upcoming Events
              </h2>
              <p className="text-sm font-medium text-slate-600">
                Today first, then next — yours and household-wide
              </p>
            </div>
            {props.onOpenCalendar ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                onClick={props.onOpenCalendar}
              >
                Open calendar
              </button>
            ) : null}
          </div>
          <UpcomingEventsList
            events={props.upcomingEventRows ?? []}
            emptyText="No upcoming events yet."
            onOpenEvent={props.onOpenCalendar ? () => props.onOpenCalendar?.() : undefined}
          />
        </section>

        {props.pinPanel ? (
          <div className="fh-member-pin-panel">{props.pinPanel}</div>
        ) : null}
      </article>

      <MemberSuggestions
        memberId={props.member.id}
        suggestions={props.memberSuggestions}
        progress={props.memberProgress}
        tasksById={props.tasksById}
        onCompleteTask={props.onCompleteTask}
        onOpenTasks={props.onOpenTasks}
        onOpenCalendar={props.onOpenCalendar}
      />

      {(props.recentActivity.length > 0 || props.recentCleaningCompletions.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          {props.recentActivity.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">Recent activity</h2>
              {props.recentActivity.map((activity) => (
                <KioskCard
                  key={activity.id}
                  category="events"
                  title={activity.message}
                  subtitle={activity.entityType}
                  emoji="📣"
                  badge={
                    <span className="fh-kiosk-card__badge">
                      {formatShortDate(activity.createdAt)}
                    </span>
                  }
                  analyticsSurface="member:dashboard"
                />
              ))}
            </section>
          ) : null}
          {props.recentCleaningCompletions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">Cleaning</h2>
              {props.recentCleaningCompletions.map((record) => (
                <KioskCard
                  key={record.id}
                  category="chores"
                  title={props.cleaningRoomName(record.roomId)}
                  subtitle={formatShortDate(record.completedAt)}
                  emoji="🧽"
                  badge={
                    <span className="fh-kiosk-card__badge">
                      {props.cleaningStatusLabel(record.status)}
                    </span>
                  }
                  analyticsSurface="member:dashboard"
                />
              ))}
            </section>
          ) : null}
        </div>
      )}

      <MemberTaskEditModal
        open={editOpen}
        task={selectedTask}
        familyMembers={props.familyMembers}
        mode={editMode}
        onClose={() => setEditOpen(false)}
        onSave={(taskId, patch) => {
          props.onSaveTask(taskId, patch, selectedTask?.assignedMemberId);
        }}
      />
    </div>
  );
}

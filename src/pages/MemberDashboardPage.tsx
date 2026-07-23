import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Home,
  Table2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  ActivityLogItem,
  CleaningCompletionRecord,
  FamilyMember,
  Task,
} from "../data/familyData";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { createActivity } from "../lib/activity";
import { recentCleaningCompletionsForMember } from "../lib/cleaningPlaybook";
import { getMemberFullName, getNextDueDate } from "../lib/utils";
import { isFourDigitPin, isPinTakenByOther } from "../lib/memberPin";
import { Input } from "../components/ui/Field";
import { MemberDashboard } from "../components/member/MemberDashboard";
import { KioskPageTitle } from "../components/layout/KioskPageTitle";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { useMemberTasks } from "../hooks/useMemberTasks";
import {
  trackMemberDashboardView,
  trackMemberTaskComplete,
  trackMemberTaskReassign,
  trackMemberTaskSkip,
} from "../lib/memberDashboardAnalytics";
import { UpcomingEventsList } from "../components/events/UpcomingEventsList";
import { selectUpcomingEventsForMemberHome } from "../lib/upcomingEvents";
import type { PageProps } from "./pageTypes";
import "../styles/guided-kiosk.css";

type MemberDashboardPageProps = Pick<
  PageProps,
  "data" | "setData" | "onOpenDashboard" | "onOpenTasks" | "onOpenCalendar"
> & {
  memberId: string;
  onBackToFamily: () => void;
};

export function MemberDashboardPage({
  data,
  setData,
  memberId,
  onOpenDashboard,
  onOpenTasks,
  onOpenCalendar,
  onBackToFamily,
}: MemberDashboardPageProps) {
  const member = data.familyMembers.find((item) => item.id === memberId);

  if (!member) {
    return (
      <Card>
        <CardHeader
          title="Member not found"
          eyebrow="Member workspace"
          action={
            <div className="flex flex-wrap gap-2">
              <Button onClick={onOpenDashboard} variant="ghost">
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button onClick={onBackToFamily}>
                <ArrowLeft className="h-4 w-4" />
                Back to roster
              </Button>
            </div>
          }
        />
        <EmptyState text="That profile is not in your household list anymore. Use Settings → Household → Household members to fix your roster." />
      </Card>
    );
  }
  const memberSafe = member;

  const today = new Date().toISOString().slice(0, 10);
  const memberIdForActivity = memberSafe.id;
  const assignedTasks = data.tasks.filter((task) =>
    isTaskAssignedToMember(task, memberSafe),
  );
  const openAssignedItems = assignedTasks.filter(
    (task) =>
      task.status !== "Done" &&
      task.status !== "Completed" &&
      task.status !== "Skipped",
  );
  const recurringChores = assignedTasks.filter(
    (task) => task.type === "chore" && task.frequency !== "one-time",
  );
  const itemsDueToday = openAssignedItems.filter(
    (task) => getTaskDueDate(task) === today,
  );
  const overdueItems = openAssignedItems.filter(
    (task) => getTaskDueDate(task) < today,
  );
  const upcomingItems = openAssignedItems.filter(
    (task) => getTaskDueDate(task) > today,
  );
  const recentlyCompletedItems = assignedTasks
    .filter((task) => task.lastCompletedDate)
    .sort((a, b) => b.lastCompletedDate.localeCompare(a.lastCompletedDate))
    .slice(0, 5);
  const upcomingEventRows = useMemo(
    () => selectUpcomingEventsForMemberHome(data, memberSafe, today, 12),
    [data, memberSafe, today],
  );
  const todayPlannerItems = useMemo(
    () => upcomingEventRows.filter((row) => row.isToday).map((row) => row.event),
    [upcomingEventRows],
  );
  const upcomingPlannerItems = useMemo(
    () => upcomingEventRows.map((row) => row.event),
    [upcomingEventRows],
  );
  const recentActivity = getMemberActivity(data.activityLog ?? [], memberSafe);

  const recentCleaningCompletions = useMemo(
    () =>
      recentCleaningCompletionsForMember(
        memberSafe.id,
        data.cleaningCompletionRecords ?? [],
        6,
      ),
    [memberSafe.id, data.cleaningCompletionRecords],
  );

  const { suggestions: memberSuggestions, progress: memberProgress } = useMemberTasks({
    member: memberSafe,
    tasks: data.tasks,
    activityLog: data.activityLog ?? [],
    todayIso: today,
  });

  const tasksById = useMemo(() => new Map(data.tasks.map((t) => [t.id, t])), [data.tasks]);

  const [pinNew, setPinNew] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [showFullMember, setShowFullMember] = useState(false);
  const [guidedFlow, setGuidedFlow] = useState<"tasks" | "events" | "activity" | null>(null);
  const [guidedMessage, setGuidedMessage] = useState<string | null>(null);

  useEffect(() => {
    trackMemberDashboardView(memberSafe.id, getMemberFullName(memberSafe));
  }, [memberSafe.id, memberSafe.name]);

  function saveMemberPin() {
    setPinErr(null);
    if (!isFourDigitPin(pinNew) || !isFourDigitPin(pinConfirm)) {
      setPinErr("PIN must be exactly 4 digits.");
      return;
    }
    if (pinNew !== pinConfirm) {
      setPinErr("PIN and confirmation do not match.");
      return;
    }
    if (isPinTakenByOther(data.familyMembers, pinNew, memberSafe.id)) {
      setPinErr("That PIN is already in use. Choose a different 4-digit PIN.");
      return;
    }
    const ts = new Date().toISOString();
    setData((d) => ({
      ...d,
      familyMembers: d.familyMembers.map((m) =>
        m.id === memberSafe.id
          ? { ...m, pinCode: pinNew, pinUpdatedAt: ts, updatedAt: ts }
          : m,
      ),
    }));
    setPinNew("");
    setPinConfirm("");
  }

  function clearMemberPin() {
    setPinErr(null);
    if (!window.confirm(`Remove PIN for ${memberSafe.name}?`)) {
      return;
    }
    const ts = new Date().toISOString();
    setData((d) => ({
      ...d,
      familyMembers: d.familyMembers.map((m) =>
        m.id === memberSafe.id
          ? { ...m, pinCode: undefined, pinUpdatedAt: undefined, updatedAt: ts }
          : m,
      ),
    }));
    setPinNew("");
    setPinConfirm("");
  }

  function completeTask(task: Task) {
    trackMemberTaskComplete(task.id);
    const completedDate = new Date().toISOString().slice(0, 10);

    if (task.type === "chore") {
      setData((current) =>
        createActivity(
          {
            ...current,
            tasks: current.tasks.map((item) =>
              item.id === task.id
                ? {
                    ...item,
                    status: "Not Started",
                    isBrainDump: false,
                    lastCompletedDate: completedDate,
                    nextDueDate: getNextDueDate(completedDate, task.frequency),
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          },
          {
            type: "completed",
            entityType: "chore",
            entityId: task.id,
            entityTitle: task.title,
            memberId: memberIdForActivity,
            message: `Completed chore: ${task.title}.`,
          },
        ),
      );
      setGuidedMessage(`Completed ${task.title}.`);
      return;
    }

    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: task.requiresVerification ? "Waiting Review" : "Done",
                  isBrainDump: false,
                  lastCompletedDate: completedDate,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        },
        {
          type: "completed",
          entityType: "task",
          entityId: task.id,
          entityTitle: task.title,
          memberId: memberIdForActivity,
          message: `Completed task: ${task.title}.`,
        },
      ),
    );
    setGuidedMessage(`Completed ${task.title}.`);
  }

  function skipTask(task: Task) {
    trackMemberTaskSkip(task.id);
    const skippedDate = new Date().toISOString().slice(0, 10);
    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: "Skipped",
                  updatedAt: new Date().toISOString(),
                  ...(item.type === "chore"
                    ? {
                        nextDueDate: getNextDueDate(skippedDate, item.frequency),
                      }
                    : {}),
                }
              : item,
          ),
        },
        {
          type: "updated",
          entityType: task.type === "chore" ? "chore" : "task",
          entityId: task.id,
          entityTitle: task.title,
          memberId: memberIdForActivity,
          message: `Skipped: ${task.title}.`,
        },
      ),
    );
    setGuidedMessage(`Skipped ${task.title}.`);
  }

  function saveTask(
    taskId: string,
    patch: Partial<Pick<Task, "title" | "notes" | "assignedMemberId" | "owner">>,
    previousAssigneeId?: string,
  ) {
    if (
      patch.assignedMemberId &&
      previousAssigneeId &&
      patch.assignedMemberId !== previousAssigneeId
    ) {
      trackMemberTaskReassign(taskId, patch.assignedMemberId);
    }
    setData((current) =>
      createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === taskId
              ? {
                  ...item,
                  ...patch,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        },
        {
          type: "updated",
          entityType: "task",
          entityId: taskId,
          memberId: memberIdForActivity,
          message: "Updated task from member dashboard.",
        },
      ),
    );
  }

  const kioskShell = useKioskShell();
  const dateLabel = formatFullDate(new Date());

  function renderMemberFlowSheet() {
    if (!guidedFlow) {
      return null;
    }

    const flowTitle =
      guidedFlow === "tasks" ? "Choose a task" : guidedFlow === "events" ? "Upcoming events" : "Recent activity";

    return (
      <div className="wd-guided-kiosk__sheet-backdrop" role="presentation" onClick={() => setGuidedFlow(null)}>
        <section
          className="wd-guided-kiosk__sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-flow-title"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="wd-guided-kiosk__sheet-head">
            <div>
              <p className="wd-guided-kiosk__eyebrow">Member station</p>
              <h2 id="member-flow-title">{flowTitle}</h2>
              <p>Handle one item for {getMemberFullName(memberSafe)}, then return to the station.</p>
            </div>
            <button
              type="button"
              className="wd-guided-kiosk__icon-btn"
              aria-label="Close member flow"
              onClick={() => setGuidedFlow(null)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>

          {guidedFlow === "tasks" ? (
            <div className="wd-guided-kiosk__chooser" role="list" aria-label="Member tasks">
              {openAssignedItems.length === 0 ? (
                <p className="wd-guided-kiosk__empty">No open tasks for this member.</p>
              ) : (
                openAssignedItems.map((task) => (
                  <div key={task.id} className="wd-guided-kiosk__chooser-row">
                    <span>
                      <strong>{task.title}</strong>
                      <small>Due {getTaskDueDate(task) || "soon"} · {task.status}</small>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <button type="button" className="wd-guided-kiosk__secondary" onClick={() => skipTask(task)}>
                        Skip
                      </button>
                      <button type="button" className="wd-guided-kiosk__primary" onClick={() => completeTask(task)}>
                        Done
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {guidedFlow === "events" ? (
            <UpcomingEventsList
              events={upcomingEventRows}
              emptyText="No upcoming events for this member."
              compact
              onOpenEvent={() => onOpenCalendar?.()}
            />
          ) : null}

          {guidedFlow === "activity" ? (
            <div className="wd-guided-kiosk__chooser" role="list" aria-label="Member activity">
              {recentActivity.length === 0 ? (
                <p className="wd-guided-kiosk__empty">No recent activity for this member.</p>
              ) : (
                recentActivity.map((activity) => (
                  <article key={activity.id} className="wd-guided-kiosk__summary-card">
                    <strong>{activity.message ?? activity.entityTitle ?? "Activity"}</strong>
                    <small>{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "Recent"}</small>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  if (!showFullMember) {
    const station = (
      <div className="wd-guided-kiosk wd-guided-kiosk--member">
        <section className="wd-guided-kiosk__hero" aria-labelledby="member-kiosk-title">
          <div>
            <p className="wd-guided-kiosk__eyebrow">Member station</p>
            <h1 id="member-kiosk-title">{getMemberFullName(memberSafe)}</h1>
            <p>Choose one personal step: tasks, events, activity, or the profile workspace.</p>
          </div>
          <div className="wd-guided-kiosk__status">
            <span>{itemsDueToday.length} due today</span>
            <span>{overdueItems.length} overdue</span>
            <span>{upcomingEventRows.length} events</span>
          </div>
        </section>

        {guidedMessage ? (
          <section className="wd-guided-kiosk__complete" role="status">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            <p>{guidedMessage}</p>
            <button type="button" onClick={() => setGuidedMessage(null)}>
              Continue
            </button>
          </section>
        ) : null}

        <section
          className="rounded-[18px] border border-white/15 bg-white/95 p-4 text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.2)]"
          aria-labelledby="member-upcoming-events-title"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Calendar
              </p>
              <h2 id="member-upcoming-events-title" className="text-lg font-extrabold text-slate-900">
                Upcoming Events
              </h2>
            </div>
            {onOpenCalendar ? (
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                onClick={onOpenCalendar}
              >
                Calendar
              </button>
            ) : null}
          </div>
          <UpcomingEventsList
            events={upcomingEventRows}
            emptyText="No upcoming events yet."
            compact
            onOpenEvent={() => onOpenCalendar?.()}
          />
        </section>

        <section className="wd-guided-kiosk__actions-grid" aria-label="Member actions">
          <button type="button" className="wd-guided-kiosk__action wd-guided-kiosk__action--primary" onClick={onOpenDashboard}>
            <span className="wd-guided-kiosk__action-icon"><Home className="h-5 w-5" aria-hidden /></span>
            <span><strong>Home</strong><small>Back to family wake page</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("tasks")}>
            <span className="wd-guided-kiosk__action-icon"><ClipboardList className="h-5 w-5" aria-hidden /></span>
            <span><strong>Tasks</strong><small>Choose task, then mark done</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("events")}>
            <span className="wd-guided-kiosk__action-icon"><CalendarDays className="h-5 w-5" aria-hidden /></span>
            <span><strong>Events</strong><small>Review upcoming schedule</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setGuidedFlow("activity")}>
            <span className="wd-guided-kiosk__action-icon"><CheckCircle2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Activity</strong><small>See recent updates</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={() => setShowFullMember(true)}>
            <span className="wd-guided-kiosk__action-icon"><Table2 className="h-5 w-5" aria-hidden /></span>
            <span><strong>Profile workspace</strong><small>Open detailed member page</small></span>
          </button>
          <button type="button" className="wd-guided-kiosk__action" onClick={onBackToFamily}>
            <span className="wd-guided-kiosk__action-icon"><ArrowLeft className="h-5 w-5" aria-hidden /></span>
            <span><strong>Family list</strong><small>Back to family station</small></span>
          </button>
        </section>

        {renderMemberFlowSheet()}
      </div>
    );

    return station;
  }

  const body = (
    <>
      {kioskShell ? (
        <KioskPageTitle
          eyebrow="Member workspace"
          title={getMemberFullName(memberSafe)}
          description="Weekly chores, progress, and personalized suggestions."
        />
      ) : null}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Button onClick={onOpenDashboard} variant="ghost">
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button onClick={() => setShowFullMember(false)} variant="secondary">
            Kiosk station
          </Button>
          <Button onClick={onBackToFamily}>
            <ArrowLeft className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onOpenTasks} variant="secondary">
            <ClipboardList className="h-4 w-4" />
            Add Task
          </Button>
          <Button onClick={onOpenCalendar} variant="secondary">
            <CalendarDays className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </section>

      <MemberDashboard
        member={memberSafe}
        memberDisplayName={getMemberFullName(member)}
        dateLabel={dateLabel}
        todayIso={today}
        familyMembers={data.familyMembers}
        itemsDueToday={itemsDueToday}
        overdueItems={overdueItems}
        upcomingItems={upcomingItems}
        recurringChores={recurringChores}
        recentlyCompletedItems={recentlyCompletedItems}
        todayPlannerItems={todayPlannerItems}
        upcomingPlannerItems={upcomingPlannerItems}
        upcomingEventRows={upcomingEventRows}
        recentCleaningCompletions={recentCleaningCompletions}
        cleaningRoomName={(roomId) =>
          data.cleaningRooms?.find((room) => room.id === roomId)?.name ?? "Room"
        }
        cleaningStatusLabel={cleaningCompletionStatusLabel}
        recentActivity={recentActivity}
        memberSuggestions={memberSuggestions}
        memberProgress={memberProgress}
        tasksById={tasksById}
        onCompleteTask={completeTask}
        onSkipTask={skipTask}
        onSaveTask={saveTask}
        onOpenTasks={onOpenTasks}
        onOpenCalendar={onOpenCalendar}
        getTaskDueDate={getTaskDueDate}
        pinPanel={
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Kiosk PIN
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Four digits for the family login screen. Saved PINs are not shown.
            </p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {memberSafe.pinCode ? "PIN is set" : "Set PIN"}
            </p>
            <div className="mt-3 space-y-2">
              <label className="block space-y-1 text-xs font-medium text-slate-600">
                New PIN
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  type="password"
                  maxLength={4}
                  value={pinNew}
                  onChange={(e) => setPinNew(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
              <label className="block space-y-1 text-xs font-medium text-slate-600">
                Confirm PIN
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  type="password"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </label>
            </div>
            {pinErr ? <p className="mt-2 text-sm text-rose-700">{pinErr}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={saveMemberPin}>
                Save PIN
              </Button>
              {memberSafe.pinCode ? (
                <Button type="button" variant="secondary" onClick={clearMemberPin}>
                  Remove PIN
                </Button>
              ) : null}
            </div>
          </>
        }
      />
    </>
  );

  return <div className="motion-page space-y-5 px-4 pb-8 sm:space-y-6 sm:px-6">{body}</div>;
}

function cleaningCompletionStatusLabel(status: CleaningCompletionRecord["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "needs_review":
      return "Needs review";
    case "approved":
      return "Approved";
    case "needs_redo":
      return "Needs redo";
    default:
      return status;
  }
}


function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function isTaskAssignedToMember(task: Task, member: FamilyMember) {
  return task.assignedMemberId === member.id || samePerson(task.owner, member.name);
}

function getMemberActivity(
  activityLog: ActivityLogItem[],
  member: FamilyMember,
) {
  return activityLog
    .filter((activity) => {
      if (!activity.message) {
        return false;
      }

      return (
        activity.memberId === member.id ||
        (activity.entityType === "familyMember" && activity.entityId === member.id)
      );
    })
    .sort((a, b) => getActivityTime(b.createdAt) - getActivityTime(a.createdAt))
    .slice(0, 6);
}

function getTaskDueDate(task: Task) {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}

function samePerson(value: string, memberName: string) {
  return value.trim().toLowerCase() === memberName.trim().toLowerCase();
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getActivityTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

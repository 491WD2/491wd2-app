import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Home,
  MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  ActivityLogItem,
  CleaningCompletionRecord,
  FamilyMember,
  PlannerEvent,
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
import { WidgetPageShell } from "../components/widgets";
import { useMemberTasks } from "../hooks/useMemberTasks";
import {
  trackMemberDashboardView,
  trackMemberTaskComplete,
  trackMemberTaskReassign,
  trackMemberTaskSkip,
} from "../lib/memberDashboardAnalytics";
import type { PageProps } from "./pageTypes";

type MemberDashboardPageProps = Pick<
  PageProps,
  "data" | "setData" | "onOpenDashboard" | "onOpenTasks" | "onOpenCalendar" | "onOpenMessages"
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
  onOpenMessages,
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
                Dashboard
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
  const assignedPlannerItems = data.planner
    .filter((event) => isPlannerAssignedToMember(event, memberSafe))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const todayPlannerItems = assignedPlannerItems.filter(
    (event) => event.date === today,
  );
  const upcomingPlannerItems = assignedPlannerItems
    .filter((event) => event.date >= today)
    .slice(0, 5);
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
            Dashboard
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
          <Button onClick={onOpenMessages} variant="secondary">
            <MessageSquare className="h-4 w-4" />
            Message Board
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

  return kioskShell ? <WidgetPageShell>{body}</WidgetPageShell> : (
    <div className="motion-page space-y-5 px-4 pb-8 sm:space-y-6 sm:px-6">{body}</div>
  );
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

function isPlannerAssignedToMember(event: PlannerEvent, member: FamilyMember) {
  if (event.assignedMemberIds?.includes(member.id)) {
    return true;
  }

  return (
    event.assignedMemberId === member.id ||
    (!event.assignedMemberId && samePerson(event.assignedPerson, member.name))
  );
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

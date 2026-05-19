import type { ActivityLogItem, Task } from "../data/familyData";
import type {
  MemberChoreSuggestion,
  MemberTaskProgress,
} from "../types/memberTasks";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function taskDueDate(task: Task): string {
  return task.type === "chore" ? task.nextDueDate || task.dueDate : task.dueDate;
}

function isOpen(task: Task): boolean {
  return task.status !== "Done" && task.status !== "Completed";
}

function completionsInRange(
  tasks: Task[],
  memberId: string,
  startIso: string,
  endIso: string,
): number {
  return tasks.filter((t) => {
    if (!t.lastCompletedDate) {
      return false;
    }
    if (t.lastCompletedByMemberId && t.lastCompletedByMemberId !== memberId) {
      return false;
    }
    if (t.assignedMemberId !== memberId && t.lastCompletedByMemberId !== memberId) {
      return false;
    }
    return t.lastCompletedDate >= startIso && t.lastCompletedDate <= endIso;
  }).length;
}

function countDueInRange(tasks: Task[], startIso: string, endIso: string): number {
  return tasks.filter((t) => {
    if (!isOpen(t)) {
      return false;
    }
    const due = taskDueDate(t);
    return due >= startIso && due <= endIso;
  }).length;
}

export function buildMemberProgress(
  memberId: string,
  assignedTasks: Task[],
  todayIso: string,
): MemberTaskProgress {
  const today = new Date(todayIso);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today);
  monthStart.setDate(today.getDate() - 29);

  const weekStartIso = weekStart.toISOString().slice(0, 10);
  const monthStartIso = monthStart.toISOString().slice(0, 10);
  const todayEnd = todayIso;

  const weeklyCompleted = completionsInRange(
    assignedTasks,
    memberId,
    weekStartIso,
    todayEnd,
  );
  const weeklyTarget = Math.max(
    weeklyCompleted + countDueInRange(assignedTasks, weekStartIso, todayEnd),
    1,
  );

  const monthlyCompleted = completionsInRange(
    assignedTasks,
    memberId,
    monthStartIso,
    todayEnd,
  );
  const monthlyTarget = Math.max(
    monthlyCompleted + countDueInRange(assignedTasks, monthStartIso, todayEnd),
    1,
  );

  const weekdayCounts = new Array(7).fill(0) as number[];
  for (const task of assignedTasks) {
    if (!task.lastCompletedDate || task.assignedMemberId !== memberId) {
      continue;
    }
    const d = new Date(task.lastCompletedDate);
    if (Number.isNaN(d.getTime())) {
      continue;
    }
    weekdayCounts[d.getDay()] += 1;
  }
  const peakDays = weekdayCounts
    .map((count, day) => ({ day, count }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((x) => DAY_NAMES[x.day]);

  return {
    weekly: {
      label: "This week",
      completed: weeklyCompleted,
      target: weeklyTarget,
      percent: Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 100)),
      emoji: "🎯",
    },
    monthly: {
      label: "This month",
      completed: monthlyCompleted,
      target: monthlyTarget,
      percent: Math.min(100, Math.round((monthlyCompleted / monthlyTarget) * 100)),
      emoji: "📅",
    },
    peakDays,
  };
}

export function buildMemberChoreSuggestions(
  memberId: string,
  memberName: string,
  assignedTasks: Task[],
  activityLog: ActivityLogItem[],
  todayIso: string,
): MemberChoreSuggestion[] {
  const suggestions: MemberChoreSuggestion[] = [];
  const open = assignedTasks.filter(isOpen);

  for (const task of open.filter((t) => taskDueDate(t) < todayIso).slice(0, 3)) {
    suggestions.push({
      id: `overdue-${task.id}`,
      kind: "overdue",
      title: task.title,
      detail: `Overdue · ${task.type === "chore" ? task.frequency : "task"}`,
      taskId: task.id,
      priority: "high",
      actionLabel: "Mark complete",
      emoji: "⚠️",
    });
  }

  for (const task of open.filter((t) => taskDueDate(t) === todayIso).slice(0, 3)) {
    suggestions.push({
      id: `today-${task.id}`,
      kind: "due_today",
      title: task.title,
      detail: "Due today — knock it out while you are here",
      taskId: task.id,
      priority: "high",
      actionLabel: "Complete now",
      emoji: "✨",
    });
  }

  const choreCompletions = assignedTasks.filter(
    (t) => t.type === "chore" && t.lastCompletedByMemberId === memberId,
  );
  const zoneCounts = new Map<string, number>();
  for (const t of choreCompletions) {
    const z = t.zone || t.room || t.category || "general";
    zoneCounts.set(z, (zoneCounts.get(z) ?? 0) + 1);
  }
  const topZone = [...zoneCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  if (topZone) {
    const match = open.find(
      (t) =>
        t.type === "chore" &&
        (t.zone === topZone || t.room === topZone || t.category === topZone),
    );
    if (match && !suggestions.some((s) => s.taskId === match.id)) {
      suggestions.push({
        id: `pattern-${match.id}`,
        kind: "pattern_match",
        title: match.title,
        detail: `You often finish ${topZone} chores — good next pick for ${memberName}`,
        taskId: match.id,
        priority: "medium",
        actionLabel: "Start this chore",
        emoji: "🧠",
      });
    }
  }

  const recentActivity = activityLog.filter((a) => a.memberId === memberId).length;
  if (recentActivity >= 3 && open.length > 0) {
    const quick = open.find((t) => t.priority === "Low" || t.frequency === "daily");
    if (quick && !suggestions.some((s) => s.taskId === quick.id)) {
      suggestions.push({
        id: `quick-${quick.id}`,
        kind: "quick_win",
        title: quick.title,
        detail: "Quick win to keep momentum",
        taskId: quick.id,
        priority: "low",
        actionLabel: "Complete",
        emoji: "⚡",
      });
    }
  }

  const streak = choreCompletions.filter((t) => {
    if (!t.lastCompletedDate) {
      return false;
    }
    const d = new Date(t.lastCompletedDate);
    const diff = (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000);
    return diff <= 7;
  }).length;

  if (streak >= 2) {
    suggestions.push({
      id: "streak-motivation",
      kind: "streak",
      title: `${streak} chores this week`,
      detail: "Nice streak — keep it going",
      priority: "low",
      emoji: "🔥",
    });
  }

  return suggestions.slice(0, 6);
}

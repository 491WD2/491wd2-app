import type { FamilyData, FamilyMember, PantryItem, PlannerEvent, Task } from "../data/familyData";
import { buildMemberProgress } from "./memberTasksEngine";
import { getChoreDueDate } from "./choreTrackerUtils";
import {
  isInventoryExpiringSoon,
  isInventoryLowStock,
} from "../pages/inventory/inventoryUtils";

export type FamilyHubTodayOverview = {
  dateLabel: string;
  todayIso: string;
  choresDueToday: number;
  choresOverdue: number;
  expiringFood: number;
  lowStock: number;
  upcomingEvents: number;
  shoppingOpen: number;
  notifications: number;
};

export type FamilyHubPantryRow = {
  id: string;
  name: string;
  detail: string;
  badge: string;
  emoji: string;
};

export type FamilyHubChoreRow = {
  id: string;
  title: string;
  assigneeLabel: string;
  dueLabel: string;
  overdue: boolean;
  emoji: string;
};

export type FamilyHubMemberStatus = {
  member: FamilyMember;
  displayName: string;
  weeklyPercent: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  openChores: number;
  dueToday: number;
};

export type FamilyHubEventRow = {
  id: string;
  title: string;
  when: string;
  category: string;
  emoji: string;
};

export type FamilyHubSuggestion = {
  id: string;
  kind: "expiring" | "low_stock" | "chore" | "calendar" | "shopping" | "member";
  title: string;
  detail: string;
  emoji: string;
  priority: "high" | "medium" | "low";
  actionId: string;
  href: string;
};

export type FamilyHubDashboardModel = {
  overview: FamilyHubTodayOverview;
  expiringFood: FamilyHubPantryRow[];
  lowStock: FamilyHubPantryRow[];
  choresToday: FamilyHubChoreRow[];
  memberStatuses: FamilyHubMemberStatus[];
  upcomingEvents: FamilyHubEventRow[];
  suggestions: FamilyHubSuggestion[];
};

function isOpenTask(task: Task): boolean {
  return (
    task.status !== "Done" &&
    task.status !== "Completed" &&
    task.status !== "Skipped"
  );
}

function formatEventWhen(event: PlannerEvent): string {
  const time = event.time?.trim();
  return time ? `${event.date} · ${time}` : event.date;
}

function memberName(data: FamilyData, memberId: string | undefined, fallback: string): string {
  if (!memberId) {
    return fallback;
  }
  const m = data.familyMembers.find((x) => x.id === memberId);
  return m?.name?.trim() || fallback;
}

export function buildFamilyHubDashboardModel(
  data: FamilyData,
  todayIso: string,
): FamilyHubDashboardModel {
  const today = new Date(`${todayIso}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(today);

  const activePantry = data.pantry.filter((p) => !p.inactiveInInventory);
  const expiringItems = activePantry.filter(isInventoryExpiringSoon);
  const lowStockItems = activePantry.filter(
    (p) => p.status === "Low" || p.status === "Out" || isInventoryLowStock(p),
  );

  const openTasks = data.tasks.filter(isOpenTask);
  const choresDueToday = openTasks.filter((t) => getChoreDueDate(t) === todayIso);
  const choresOverdue = openTasks.filter((t) => getChoreDueDate(t) < todayIso);

  const upcomingEvents = [...data.planner]
    .filter((e) => e.date >= todayIso)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 8);

  const shoppingOpen = data.shopping.filter((s) => !s.purchased).length;
  const notifications = data.notifications.filter((n) => !n.dismissedAt).length;

  const memberStatuses: FamilyHubMemberStatus[] = data.familyMembers
    .filter((m) => m.status === "active" || m.status === "away")
    .map((member) => {
      const assigned = data.tasks.filter(
        (t) => t.assignedMemberId === member.id && isOpenTask(t),
      );
      const progress = buildMemberProgress(
        member.id,
        data.tasks.filter((t) => t.assignedMemberId === member.id),
        todayIso,
      );
      return {
        member,
        displayName: member.nickname?.trim() || member.name,
        weeklyPercent: progress.weekly.percent,
        weeklyCompleted: progress.weekly.completed,
        weeklyTarget: progress.weekly.target,
        openChores: assigned.length,
        dueToday: assigned.filter((t) => getChoreDueDate(t) === todayIso).length,
      };
    });

  const expiringFood: FamilyHubPantryRow[] = expiringItems.slice(0, 6).map((p) => ({
    id: p.id,
    name: pantryItemLabel(p),
    detail: p.expiryDate ? `Use by ${p.expiryDate}` : "Expiring soon",
    badge: p.status === "Out" ? "Out" : "Soon",
    emoji: "⏳",
  }));

  const lowStock: FamilyHubPantryRow[] = lowStockItems.slice(0, 6).map((p) => ({
    id: p.id,
    name: pantryItemLabel(p),
    detail: `${p.quantity ?? "0"} ${(p.unit ?? "").trim() || "units"}`.trim(),
    badge: p.status === "Out" ? "Out" : "Low",
    emoji: "📦",
  }));

  const choresToday: FamilyHubChoreRow[] = [...choresDueToday, ...choresOverdue]
    .slice(0, 8)
    .map((task) => {
      const due = getChoreDueDate(task);
      return {
        id: task.id,
        title: task.title,
        assigneeLabel: memberName(data, task.assignedMemberId, task.owner || "Family"),
        dueLabel: due === todayIso ? "Today" : formatShortDue(due, todayIso),
        overdue: due < todayIso,
        emoji: task.type === "chore" ? "🧹" : "📋",
      };
    });

  const upcomingEventRows: FamilyHubEventRow[] = upcomingEvents.map((event) => ({
    id: event.id,
    title: event.title,
    when: formatEventWhen(event),
    category: event.category,
    emoji: "📅",
  }));

  const suggestions = buildFamilyHubSuggestions({
    expiringCount: expiringItems.length,
    lowStockCount: lowStockItems.length,
    choresOverdue: choresOverdue.length,
    choresDueToday: choresDueToday.length,
    upcomingEvents: upcomingEvents.length,
    shoppingOpen,
    memberStatuses,
  });

  return {
    overview: {
      dateLabel,
      todayIso,
      choresDueToday: choresDueToday.length,
      choresOverdue: choresOverdue.length,
      expiringFood: expiringItems.length,
      lowStock: lowStockItems.length,
      upcomingEvents: upcomingEvents.length,
      shoppingOpen,
      notifications,
    },
    expiringFood,
    lowStock,
    choresToday,
    memberStatuses,
    upcomingEvents: upcomingEventRows,
    suggestions,
  };
}

function pantryItemLabel(p: PantryItem): string {
  return (p.productName || p.name || "Item").trim();
}

function formatShortDue(dueIso: string, todayIso: string): string {
  if (dueIso < todayIso) {
    return "Overdue";
  }
  return dueIso;
}

function buildFamilyHubSuggestions(input: {
  expiringCount: number;
  lowStockCount: number;
  choresOverdue: number;
  choresDueToday: number;
  upcomingEvents: number;
  shoppingOpen: number;
  memberStatuses: FamilyHubMemberStatus[];
}): FamilyHubSuggestion[] {
  const out: FamilyHubSuggestion[] = [];

  if (input.expiringCount > 0) {
    out.push({
      id: "suggest-expiring",
      kind: "expiring",
      title: "Use expiring food first",
      detail: `${input.expiringCount} item${input.expiringCount === 1 ? "" : "s"} need attention in the pantry.`,
      emoji: "⏳",
      priority: "high",
      actionId: "open_pantry",
      href: "/pantry?view=pantry",
    });
  }

  if (input.lowStockCount > 0) {
    out.push({
      id: "suggest-low-stock",
      kind: "low_stock",
      title: "Restock low pantry items",
      detail: `${input.lowStockCount} low or out items — add to shopping or scan restocks.`,
      emoji: "📦",
      priority: input.expiringCount > 0 ? "medium" : "high",
      actionId: "open_pantry",
      href: "/pantry?view=pantry",
    });
  }

  if (input.choresOverdue > 0) {
    out.push({
      id: "suggest-overdue-chores",
      kind: "chore",
      title: "Clear overdue chores",
      detail: `${input.choresOverdue} overdue — reassign or knock them out today.`,
      emoji: "⚠️",
      priority: "high",
      actionId: "open_chores",
      href: "/tasks",
    });
  } else if (input.choresDueToday > 0) {
    out.push({
      id: "suggest-today-chores",
      kind: "chore",
      title: "Today's chore list is ready",
      detail: `${input.choresDueToday} due today across the household.`,
      emoji: "✨",
      priority: "medium",
      actionId: "open_chores",
      href: "/tasks",
    });
  }

  const busyMember = [...input.memberStatuses]
    .filter((m) => m.openChores >= 3)
    .sort((a, b) => b.openChores - a.openChores)[0];
  if (busyMember) {
    out.push({
      id: `suggest-member-${busyMember.member.id}`,
      kind: "member",
      title: `Check in with ${busyMember.displayName}`,
      detail: `${busyMember.openChores} open chores · ${busyMember.weeklyPercent}% weekly progress.`,
      emoji: "👤",
      priority: "medium",
      actionId: "open_members",
      href: `/family/${busyMember.member.id}`,
    });
  }

  if (input.upcomingEvents > 0) {
    out.push({
      id: "suggest-calendar",
      kind: "calendar",
      title: "Upcoming on the calendar",
      detail: `${input.upcomingEvents} event${input.upcomingEvents === 1 ? "" : "s"} coming up.`,
      emoji: "📅",
      priority: "low",
      actionId: "add_event",
      href: "/quick-add?type=event&title=New%20event",
    });
  }

  if (input.shoppingOpen >= 5) {
    out.push({
      id: "suggest-shopping",
      kind: "shopping",
      title: "Shopping list is growing",
      detail: `${input.shoppingOpen} items still on the list.`,
      emoji: "🛒",
      priority: "low",
      actionId: "open_shopping",
      href: "/shopping",
    });
  }

  return out.slice(0, 5);
}

import type { FamilyData, HouseholdNotification, PantryItem, PlannerEvent, Task } from "../data/familyData";
import type { PlannerBoardItem, PlannerTypeFilter } from "../types/calendarPlanner";
import { getChoreDueDate } from "./choreTrackerUtils";
import {
  isInventoryExpiringSoon,
  isInventoryLowStock,
} from "../pages/inventory/inventoryUtils";

function isOpenTask(task: Task): boolean {
  return (
    task.status !== "Done" &&
    task.status !== "Completed" &&
    task.status !== "Skipped"
  );
}

function pantryLabel(p: PantryItem): string {
  return (p.productName || p.name || "Item").trim();
}

function isMealEvent(event: PlannerEvent): boolean {
  const cat = event.category?.toLowerCase() ?? "";
  const title = event.title.toLowerCase();
  return (
    cat === "meals" ||
    /\b(meal|dinner|lunch|breakfast|recipe|menu)\b/.test(title)
  );
}

export function addDaysIso(iso: string, delta: number): string {
  const t = new Date(`${iso.slice(0, 10)}T12:00:00`);
  t.setDate(t.getDate() + delta);
  return t.toISOString().slice(0, 10);
}

export function startOfWeekMondayIso(iso: string): string {
  const t = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const dow = t.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  t.setDate(t.getDate() + diff);
  return t.toISOString().slice(0, 10);
}

export function buildPlannerBoardItems(
  data: FamilyData,
  todayIso: string,
  weekStartIso: string,
  completedReminderIds: Set<string>,
): PlannerBoardItem[] {
  const weekEndIso = addDaysIso(weekStartIso, 6);
  const inWeek = (iso: string) => iso >= weekStartIso && iso <= weekEndIso;
  const items: PlannerBoardItem[] = [];

  for (const event of data.planner) {
    if (isMealEvent(event)) {
      continue;
    }
    const dateIso = event.date?.trim().slice(0, 10);
    if (!dateIso || !inWeek(dateIso)) {
      continue;
    }
    const id = `event-${event.id}`;
    if (completedReminderIds.has(id)) {
      continue;
    }
    items.push({
      id,
      kind: "event",
      dateIso,
      title: event.title || "Event",
      subtitle: event.time ? `${event.category} · ${event.time}` : event.category,
      emoji: "📅",
      memberIds: event.assignedMemberIds ?? (event.assignedMemberId ? [event.assignedMemberId] : []),
      sourceId: event.id,
      draggable: true,
      plannerEvent: event,
    });
  }

  for (const task of data.tasks) {
    if (!isOpenTask(task)) {
      continue;
    }
    const due = getChoreDueDate(task);
    if (!inWeek(due) && due !== todayIso) {
      continue;
    }
    const id = `chore-${task.id}`;
    if (completedReminderIds.has(id)) {
      continue;
    }
    items.push({
      id,
      kind: "chore",
      dateIso: due,
      title: task.title,
      subtitle: task.type === "chore" ? `${task.frequency} chore` : `Task · ${task.status}`,
      emoji: task.type === "chore" ? "🧹" : "📋",
      memberIds: task.assignedMemberId ? [task.assignedMemberId] : [],
      sourceId: task.id,
      draggable: true,
      overdue: due < todayIso,
      task,
    });
  }

  for (const p of data.pantry) {
    if (p.inactiveInInventory) {
      continue;
    }
    const name = pantryLabel(p);

    if (isInventoryExpiringSoon(p)) {
      const dateIso = (p.expiryDate || todayIso).slice(0, 10);
      const id = `food-${p.id}`;
      if (completedReminderIds.has(id)) {
        continue;
      }
      if (inWeek(dateIso) || dateIso <= todayIso) {
        items.push({
          id,
          kind: "food",
          dateIso: dateIso < weekStartIso ? todayIso : dateIso,
          title: name,
          subtitle: p.expiryDate ? `Use by ${p.expiryDate}` : "Expiring soon",
          emoji: "⏳",
          memberIds: [],
          sourceId: p.id,
          draggable: false,
          pantryId: p.id,
        });
      }
    }

    if (p.status === "Low" || p.status === "Out" || isInventoryLowStock(p)) {
      const id = `inventory-${p.id}`;
      if (completedReminderIds.has(id)) {
        continue;
      }
      items.push({
        id,
        kind: "inventory",
        dateIso: todayIso,
        title: name,
        subtitle: `${p.quantity ?? "0"} ${(p.unit ?? "").trim() || "units"} · ${p.status === "Out" ? "Out" : "Low"}`,
        emoji: "📦",
        memberIds: [],
        sourceId: p.id,
        draggable: false,
        pantryId: p.id,
      });
    }
  }

  for (const n of data.notifications) {
    if (n.dismissedAt) {
      continue;
    }
    const id = `reminder-${n.id}`;
    if (completedReminderIds.has(id)) {
      continue;
    }
    const dateIso = (n.createdAt ?? todayIso).slice(0, 10);
    items.push({
      id,
      kind: "reminder",
      dateIso: inWeek(dateIso) ? dateIso : todayIso,
      title: n.title || "Household reminder",
      subtitle: n.body?.slice(0, 80) ?? n.type,
      emoji: "🔔",
      memberIds: n.recipientMemberId ? [n.recipientMemberId] : [],
      sourceId: n.id,
      draggable: false,
      notificationId: n.id,
    });
  }

  return items.sort(
    (a, b) => a.dateIso.localeCompare(b.dateIso) || a.title.localeCompare(b.title),
  );
}

export function filterPlannerItems(
  items: PlannerBoardItem[],
  memberFilter: string | "all",
  typeFilter: PlannerTypeFilter,
): PlannerBoardItem[] {
  return items.filter((item) => {
    if (typeFilter !== "all" && item.kind !== typeFilter) {
      return false;
    }
    if (memberFilter !== "all" && item.memberIds.length > 0) {
      return item.memberIds.includes(memberFilter);
    }
    if (memberFilter !== "all" && item.memberIds.length === 0) {
      return typeFilter === "inventory" || typeFilter === "food" || typeFilter === "all";
    }
    return true;
  });
}

export function groupItemsByDate(items: PlannerBoardItem[]): Map<string, PlannerBoardItem[]> {
  const map = new Map<string, PlannerBoardItem[]>();
  for (const item of items) {
    const arr = map.get(item.dateIso) ?? [];
    arr.push(item);
    map.set(item.dateIso, arr);
  }
  return map;
}

export function sectionItems(
  items: PlannerBoardItem[],
  todayIso: string,
  weekStartIso: string,
): {
  today: PlannerBoardItem[];
  thisWeek: PlannerBoardItem[];
  choresDue: PlannerBoardItem[];
  foodExpiring: PlannerBoardItem[];
  lowStock: PlannerBoardItem[];
  familyEvents: PlannerBoardItem[];
  memberAssignments: PlannerBoardItem[];
  householdReminders: PlannerBoardItem[];
} {
  const weekEndIso = addDaysIso(weekStartIso, 6);
  const today = items.filter((i) => i.dateIso === todayIso);
  const thisWeek = items.filter((i) => i.dateIso >= weekStartIso && i.dateIso <= weekEndIso);
  return {
    today,
    thisWeek,
    choresDue: items.filter((i) => i.kind === "chore"),
    foodExpiring: items.filter((i) => i.kind === "food"),
    lowStock: items.filter((i) => i.kind === "inventory"),
    familyEvents: items.filter((i) => i.kind === "event"),
    memberAssignments: items.filter((i) => i.memberIds.length > 0),
    householdReminders: items.filter((i) => i.kind === "reminder"),
  };
}

export function dismissNotificationPatch(
  notifications: HouseholdNotification[],
  notificationId: string,
): HouseholdNotification[] {
  const ts = new Date().toISOString();
  return notifications.map((n) =>
    n.id === notificationId ? { ...n, dismissedAt: ts } : n,
  );
}

export function movePlannerItemDate(
  data: FamilyData,
  item: PlannerBoardItem,
  targetDateIso: string,
): FamilyData {
  if (item.kind === "event" && item.plannerEvent) {
    return {
      ...data,
      planner: data.planner.map((e) =>
        e.id === item.sourceId
          ? { ...e, date: targetDateIso, updatedAt: new Date().toISOString() }
          : e,
      ),
    };
  }
  if (item.kind === "chore" && item.task) {
    return {
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === item.sourceId
          ? {
              ...t,
              dueDate: t.type === "task" ? targetDateIso : t.dueDate,
              nextDueDate: t.type === "chore" ? targetDateIso : t.nextDueDate,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    };
  }
  return data;
}

export const PLANNER_TYPE_FILTERS: { id: PlannerTypeFilter; label: string; emoji: string }[] = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "chore", label: "Chore", emoji: "🧹" },
  { id: "food", label: "Food", emoji: "⏳" },
  { id: "inventory", label: "Inventory", emoji: "📦" },
  { id: "event", label: "Event", emoji: "📅" },
  { id: "reminder", label: "Reminder", emoji: "🔔" },
];

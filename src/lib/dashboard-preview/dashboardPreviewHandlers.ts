import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, KitchenDutyCompletion, Task } from "../../data/familyData";
import { createActivity } from "../activity";
import {
  getTodayKitchenWeekdayLocal,
  kitchenDutyRelatedNotificationId,
} from "../kitchenDuty";
import { getNextDueDate } from "../utils";
import { createShoppingItemFromName } from "../../pages/shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../../services/rulesEngine";

function isDoneToday(task: Task, todayIso: string): boolean {
  return (
    task.lastCompletedDate === todayIso ||
    task.status === "Done" ||
    task.status === "Completed"
  );
}

export type DashboardPreviewGo = (href: string, fallback?: () => void) => void;

/** Behavior mirrored from production NotionHomeWorkspace; keep in sync during preview phase. */
export function createToggleKitchenTodayDone(input: {
  data: FamilyData;
  now: Date;
  todayIso: string;
  kitchenTodayMember: { id: string } | undefined;
  setData: Dispatch<SetStateAction<FamilyData>>;
  go: DashboardPreviewGo;
  onOpenTasks?: () => void;
}) {
  const todayKitchenDay = getTodayKitchenWeekdayLocal(input.now);
  return () => {
    if (!todayKitchenDay || !input.kitchenTodayMember) {
      input.go("/tasks", input.onOpenTasks);
      return;
    }
    const kitchenMemberId = input.kitchenTodayMember.id;
    const stamp = new Date().toISOString();
    const relatedId = kitchenDutyRelatedNotificationId(input.todayIso);
    const activeMemberId =
      input.data.adminSettings.activePreferencesMemberId ??
      input.data.familyMembers.find((m) => m.status === "active")?.id;

    input.setData((current) => {
      const completions = current.kitchenDutyCompletions ?? [];
      const existing = completions.find((c) => c.dutyDate === input.todayIso);
      if (existing) {
        const nextCompletions = completions.filter((c) => c.id !== existing.id);
        const dates = new Set(current.kitchenSchedule.completedDates ?? []);
        dates.delete(input.todayIso);
        return createActivity(
          {
            ...current,
            kitchenDutyCompletions: nextCompletions,
            kitchenSchedule: {
              ...current.kitchenSchedule,
              completedDates: [...dates].sort(),
              kitchenDutyReminderIssuedForDate: undefined,
              updatedAt: stamp,
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
        dutyDate: input.todayIso,
        memberId: kitchenMemberId,
        completedAt: stamp,
        completedByMemberId: activeMemberId,
        createdAt: stamp,
      };
      const dates = new Set(current.kitchenSchedule.completedDates ?? []);
      dates.add(input.todayIso);
      const notifications = (current.notifications ?? []).map((n) =>
        n.type === "kitchen_duty" && n.relatedEntityId === relatedId && !n.dismissedAt
          ? { ...n, dismissedAt: stamp }
          : n,
      );

      return createActivity(
        {
          ...current,
          kitchenDutyCompletions: [...completions, completion],
          kitchenSchedule: {
            ...current.kitchenSchedule,
            completedDates: [...dates].sort(),
            updatedAt: stamp,
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
  };
}

/** Behavior mirrored from production NotionHomeWorkspace; keep in sync during preview phase. */
export function createToggleTodayChore(input: {
  todayIso: string;
  setData: Dispatch<SetStateAction<FamilyData>>;
}) {
  return (task: Task) => {
    const stamp = new Date().toISOString();
    const completedDate = input.todayIso;
    input.setData((current) => {
      const existing = current.tasks.find((item) => item.id === task.id);
      if (!existing) return current;
      const alreadyDone = isDoneToday(existing, input.todayIso);
      return createActivity(
        {
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === task.id
              ? alreadyDone
                ? {
                    ...item,
                    lastCompletedDate: "",
                    updatedAt: stamp,
                  }
                : {
                    ...item,
                    status: item.type === "chore" ? "Not Started" : "Done",
                    isBrainDump: false,
                    lastCompletedDate: completedDate,
                    nextDueDate:
                      item.type === "chore"
                        ? getNextDueDate(completedDate, item.frequency)
                        : item.nextDueDate,
                    updatedAt: stamp,
                  }
              : item,
          ),
        },
        {
          type: alreadyDone ? "updated" : "completed",
          entityType: existing.type === "chore" ? "chore" : "task",
          entityId: existing.id,
          entityTitle: existing.title,
          memberId: existing.assignedMemberId || undefined,
          message: alreadyDone
            ? `Reopened: ${existing.title}.`
            : `Completed ${existing.type === "chore" ? "chore" : "task"}: ${existing.title}.`,
        },
      );
    });
  };
}

/** Behavior mirrored from production NotionHomeWorkspace; keep in sync during preview phase. */
export function createAddShoppingItem(input: {
  data: FamilyData;
  setData: Dispatch<SetStateAction<FamilyData>>;
  go: DashboardPreviewGo;
  onOpenShopping: () => void;
  setShoppingDraft: (value: string) => void;
}) {
  return (rawName: string): boolean => {
    const name = rawName.trim();
    if (!name) return false;
    const duplicateIndex = findDuplicateShoppingIndex(input.data.shopping ?? [], name);
    if (duplicateIndex >= 0) {
      input.setShoppingDraft("");
      input.go("/shopping", input.onOpenShopping);
      return true;
    }
    const item = createShoppingItemFromName(name);
    input.setData((prev) =>
      createActivity(
        {
          ...prev,
          shopping: [item, ...(prev.shopping ?? [])],
        },
        {
          type: "created",
          entityType: "shopping",
          entityId: item.id,
          message: `Added “${item.name}” to shopping.`,
        },
      ),
    );
    input.setShoppingDraft("");
    return true;
  };
}

export { isDoneToday };

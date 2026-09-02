import type { Dispatch, SetStateAction } from "react";
import type { FamilyData, KitchenDutyCompletion, Task } from "../../data/familyData";
import {
  applyChoreToggleComplete,
  applyShoppingAddItem,
  isDoneToday,
} from "../../household/actions";
import { createActivity } from "../activity";
import {
  getTodayKitchenWeekdayLocal,
  kitchenDutyRelatedNotificationId,
} from "../kitchenDuty";

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
    input.setData((current) => {
      const result = applyChoreToggleComplete(current, task, input.todayIso);
      return result.ok ? result.value.data : current;
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
    const result = applyShoppingAddItem(input.data, rawName);
    if (!result.ok) {
      return false;
    }

    if (result.value.kind === "duplicate") {
      input.setShoppingDraft("");
      input.go("/shopping", input.onOpenShopping);
      return true;
    }

    input.setData(result.value.data);
    input.setShoppingDraft("");
    return true;
  };
}

export { isDoneToday };

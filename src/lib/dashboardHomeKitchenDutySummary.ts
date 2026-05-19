import type { FamilyMember, KitchenWeekday } from "../data/familyData";
import { getMemberFullName } from "./utils";

export function kitchenDutyDashboardSummaryLine(p: {
  todayKitchenDay: KitchenWeekday | null;
  kitchenTodayMember: FamilyMember | undefined;
  kitchenCompletedToday: boolean;
  activeMemberId?: string;
  dashboardViewMemberId?: string | null;
}): { tone: "muted" | "success" | "default"; text: string } {
  const { todayKitchenDay, kitchenTodayMember, kitchenCompletedToday, activeMemberId, dashboardViewMemberId } = p;

  if (!todayKitchenDay) {
    return {
      tone: "muted",
      text: "Kitchen schedule isn’t available for today’s weekday in this locale.",
    };
  }

  if (!kitchenTodayMember) {
    return { tone: "muted", text: "No kitchen duty assigned today." };
  }

  if (kitchenCompletedToday) {
    return {
      tone: "success",
      text: "Kitchen duty is complete today.",
    };
  }

  const youreUp = Boolean(activeMemberId && kitchenTodayMember.id === activeMemberId);
  const first =
    kitchenTodayMember.name.trim().split(/\s+/)[0] || getMemberFullName(kitchenTodayMember);
  const viewMatch =
    dashboardViewMemberId != null && kitchenTodayMember.id === dashboardViewMemberId;

  if (dashboardViewMemberId && !viewMatch) {
    return {
      tone: "muted",
      text: `${first} has kitchen duty today.`,
    };
  }

  if (youreUp) {
    return { tone: "default", text: "You have kitchen duty today." };
  }

  if (viewMatch) {
    return { tone: "default", text: "You’re on kitchen duty today." };
  }

  return {
    tone: "default",
    text: `${first} has kitchen duty today.`,
  };
}

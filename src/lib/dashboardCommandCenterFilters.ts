import type { HouseholdNotification, MessageBoardItem, PlannerEvent, Task } from "../data/familyData";
import { dedupeNotificationsForDisplay } from "./householdNotify";

export type DashboardInboxMode = "session" | "household" | "targetMember";

export function notificationMatchesDashboardInbox(
  n: HouseholdNotification,
  mode: DashboardInboxMode | undefined,
  currentMemberId: string | undefined,
  targetMemberId: string | undefined,
): boolean {
  if (n.dismissedAt) {
    return false;
  }
  const to = (n.recipientMemberId ?? "").trim();
  const m = mode ?? "session";
  if (m === "household") {
    return true;
  }
  if (m === "targetMember" && targetMemberId) {
    if (!to) {
      return true;
    }
    return to === targetMemberId;
  }
  if (!to) {
    return true;
  }
  if (!currentMemberId) {
    return false;
  }
  return to === currentMemberId;
}

export function countActiveNotificationsForDashboardInbox(
  notifications: HouseholdNotification[],
  mode: DashboardInboxMode | undefined,
  currentMemberId: string | undefined,
  targetMemberId: string | undefined,
): number {
  const raw = notifications.filter((n) =>
    notificationMatchesDashboardInbox(n, mode, currentMemberId, targetMemberId),
  );
  return dedupeNotificationsForDisplay(raw).length;
}

/** `null` = family view — no member filter. */
export type DashboardViewMemberId = string | null;

export function plannerEventVisibleForMemberView(
  e: PlannerEvent,
  memberId: DashboardViewMemberId,
): boolean {
  if (!memberId) {
    return true;
  }
  if (e.assignedMemberId === memberId) {
    return true;
  }
  if (e.assignedMemberIds?.includes(memberId)) {
    return true;
  }
  return false;
}

export function messageBoardItemInvolvesMember(
  m: MessageBoardItem,
  memberId: DashboardViewMemberId,
): boolean {
  if (!memberId) {
    return true;
  }
  if (m.authorMemberId === memberId) {
    return true;
  }
  if (m.relatedMemberIds?.includes(memberId)) {
    return true;
  }
  return false;
}

export function cleaningTaskVisibleForMemberView(t: Task, memberId: DashboardViewMemberId): boolean {
  if (!memberId) {
    return true;
  }
  return t.assignedMemberId === memberId;
}

/** Per-member Home: chore is “theirs” when assigned to the selected roster member. */
export function cleaningTaskAssignedToMember(t: Task, memberId: DashboardViewMemberId): boolean {
  if (!memberId) {
    return true;
  }
  return Boolean(t.assignedMemberId?.trim() && t.assignedMemberId === memberId);
}

/** Unassigned chores are shared with the whole household (“Family” assignee). */
export function choreAssigneeIsFamilyShared(t: Task): boolean {
  return !t.assignedMemberId?.trim();
}

/**
 * Member view sort bucket: 0 = assigned to selected member, 1 = family-shared, 2 = someone else.
 * Family view always returns 0 (caller should not rely on ordering buckets when `memberId` is null).
 */
export function choreMemberViewSortRank(t: Task, memberId: DashboardViewMemberId): number {
  if (!memberId) {
    return 0;
  }
  if (cleaningTaskAssignedToMember(t, memberId)) {
    return 0;
  }
  if (choreAssigneeIsFamilyShared(t)) {
    return 1;
  }
  return 2;
}

export function compareChoresForDashboardMemberView(
  a: Task,
  b: Task,
  memberId: DashboardViewMemberId,
  tieBreaker: (x: Task, y: Task) => number,
): number {
  if (memberId) {
    const ra = choreMemberViewSortRank(a, memberId);
    const rb = choreMemberViewSortRank(b, memberId);
    if (ra !== rb) {
      return ra - rb;
    }
  }
  return tieBreaker(a, b);
}

export type ChoreHomeHighlightTier = "primary" | "shared" | "muted";

/** Row emphasis on Home chore surfaces (Family = all primary). */
export function choreHomeRowTier(task: Task, memberId: DashboardViewMemberId): ChoreHomeHighlightTier {
  if (!memberId) {
    return "primary";
  }
  if (cleaningTaskAssignedToMember(task, memberId)) {
    return "primary";
  }
  if (choreAssigneeIsFamilyShared(task)) {
    return "shared";
  }
  return "muted";
}

export function taskIsActiveCleaning(t: Task): boolean {
  const s = t.status;
  return s !== "Completed" && s !== "Done" && s !== "Skipped";
}

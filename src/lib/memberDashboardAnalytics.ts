import { trackInteraction, trackKioskPageView } from "./kioskAnalytics";

const SURFACE = "member:dashboard";

export function trackMemberDashboardView(memberId: string, memberName: string) {
  trackKioskPageView(SURFACE, {
    memberId: memberId.slice(0, 24),
    member: memberName.slice(0, 40),
    action: "member_dashboard_view",
  });
  trackInteraction(SURFACE, "member_dashboard_view", {
    memberId: memberId.slice(0, 24),
  });
}

export function trackMemberTaskComplete(taskId: string) {
  trackInteraction(SURFACE, "task_complete", { taskId: taskId.slice(0, 24) });
}

export function trackMemberTaskSkip(taskId: string) {
  trackInteraction(SURFACE, "task_skip", { taskId: taskId.slice(0, 24) });
}

export function trackMemberTaskReassign(taskId: string, targetMemberId: string) {
  trackInteraction(SURFACE, "task_reassign", {
    taskId: taskId.slice(0, 24),
    targetMember: targetMemberId.slice(0, 24),
  });
}

export function trackMemberQuickAction(actionId: string, metadata?: Record<string, string>) {
  trackInteraction(SURFACE, "member_quick_action", {
    action: actionId,
    ...metadata,
  });
}

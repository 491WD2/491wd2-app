import type { Task } from "../data/familyData";

/** Consecutive days (ending today) with at least one completion for this member. */
export function computeMemberCompletionStreak(
  tasks: Task[],
  memberId: string,
  todayIso: string,
): number {
  let streak = 0;
  const cursor = new Date(todayIso);

  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    const completed = tasks.some(
      (t) =>
        t.lastCompletedDate === iso &&
        (t.lastCompletedByMemberId === memberId || t.assignedMemberId === memberId),
    );
    if (!completed) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

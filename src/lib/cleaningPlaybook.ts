import type {
  CleaningCompletionRecord,
  CleaningRoom,
  CleaningRoomTaskGroupFrequency,
  Task,
} from "../data/familyData";

/** Align playbook zones with chore task.zone without overwriting legacy name-only matching. */
export function choreMatchesCleaningRoom(room: CleaningRoom, task: Task): boolean {
  const zone = (room.zone ?? room.name).trim().toLowerCase();
  const tz = (task.zone ?? "").trim().toLowerCase();
  return tz.length > 0 && tz === zone;
}

export function getCleaningRoomProgress(room: CleaningRoom): {
  total: number;
  completed: number;
} {
  const all = room.taskGroups.flatMap((g) => g.tasks);
  const completed = all.filter((t) => t.completed === true).length;
  return { total: all.length, completed };
}

export function sortCleaningGroupsByFrequency(
  groups: CleaningRoom["taskGroups"],
): CleaningRoom["taskGroups"] {
  const rank: Record<CleaningRoomTaskGroupFrequency, number> = {
    daily: 0,
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    custom: 4,
  };
  return [...groups].sort(
    (a, b) =>
      rank[a.frequency ?? "custom"] - rank[b.frequency ?? "custom"] ||
      a.title.localeCompare(b.title),
  );
}

function dailyGroup(room: CleaningRoom): CleaningRoom["taskGroups"][0] | undefined {
  return room.taskGroups.find(
    (g) => g.frequency === "daily" || g.title.trim().toLowerCase().includes("daily"),
  );
}

export function dailyChecklistIncompleteCount(room: CleaningRoom): number {
  const g = dailyGroup(room);
  if (!g) return 0;
  return g.tasks.filter((t) => !t.completed).length;
}

export function dailyChecklistHasIncomplete(room: CleaningRoom): boolean {
  return dailyChecklistIncompleteCount(room) > 0;
}

export function pickTodayCleaningFocusRoom(rooms: CleaningRoom[]): CleaningRoom | undefined {
  const incomplete = rooms.filter(dailyChecklistHasIncomplete);
  if (incomplete.length === 0) return undefined;
  const dow = new Date().getDay();
  return incomplete[dow % incomplete.length];
}

export function choreDueDate(task: Task): string {
  return task.nextDueDate || task.dueDate || "";
}

export function latestCleaningCompletionForRoom(
  roomId: string,
  records: CleaningCompletionRecord[],
): CleaningCompletionRecord | undefined {
  const forRoom = records.filter((r) => r.roomId === roomId);
  if (forRoom.length === 0) return undefined;
  return [...forRoom].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
}

export function roomCleaningCompletedToday(
  roomId: string,
  records: CleaningCompletionRecord[],
  today: string,
): boolean {
  const day = today.slice(0, 10);
  return records.some(
    (r) => r.roomId === roomId && r.completedAt.slice(0, 10) === day,
  );
}

export function recentCleaningCompletionsForMember(
  memberId: string,
  records: CleaningCompletionRecord[],
  limit = 8,
): CleaningCompletionRecord[] {
  return [...records]
    .filter((r) => r.completedByMemberId === memberId)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, limit);
}

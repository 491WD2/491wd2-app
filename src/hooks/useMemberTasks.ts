import { useEffect, useMemo, useRef } from "react";
import type { ActivityLogItem, FamilyMember, Task } from "../data/familyData";
import type { MemberChoreSuggestion, MemberTaskProgress } from "../types/memberTasks";
import {
  buildMemberChoreSuggestions,
  buildMemberProgress,
} from "../lib/memberTasksEngine";
import { trackAiSuggestionShown } from "../lib/hubAiAnalytics";

export type UseMemberTasksOptions = {
  member: FamilyMember;
  tasks: Task[];
  activityLog: ActivityLogItem[];
  todayIso?: string;
};

export type UseMemberTasksResult = {
  suggestions: MemberChoreSuggestion[];
  progress: MemberTaskProgress;
};

function isAssignedToMember(task: Task, member: FamilyMember): boolean {
  return (
    task.assignedMemberId === member.id ||
    task.owner.trim().toLowerCase() === member.name.trim().toLowerCase()
  );
}

export function useMemberTasks({
  member,
  tasks,
  activityLog,
  todayIso = new Date().toISOString().slice(0, 10),
}: UseMemberTasksOptions): UseMemberTasksResult {
  const shownRef = useRef<Set<string>>(new Set());

  const assignedTasks = useMemo(
    () => tasks.filter((t) => isAssignedToMember(t, member)),
    [tasks, member],
  );

  const progress = useMemo(
    () => buildMemberProgress(member.id, assignedTasks, todayIso),
    [member.id, assignedTasks, todayIso],
  );

  const suggestions = useMemo(
    () =>
      buildMemberChoreSuggestions(
        member.id,
        member.name,
        assignedTasks,
        activityLog,
        todayIso,
      ),
    [member.id, member.name, assignedTasks, activityLog, todayIso],
  );

  useEffect(() => {
    for (const s of suggestions) {
      if (shownRef.current.has(s.id)) {
        continue;
      }
      shownRef.current.add(s.id);
      trackAiSuggestionShown("member:dashboard", s.id, s.kind);
    }
  }, [suggestions]);

  return { suggestions, progress };
}

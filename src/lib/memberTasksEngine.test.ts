import type { Task } from "../data/familyData";
import { buildMemberChoreSuggestions, buildMemberProgress } from "./memberTasksEngine";

const memberId = "m1";

const tasks: Task[] = [
  {
    id: "t1",
    title: "Dishes",
    owner: "Alex",
    status: "Not Started",
    priority: "Medium",
    dueDate: "2026-05-10",
    type: "chore",
    frequency: "daily",
    lastCompletedDate: "",
    nextDueDate: "2026-05-10",
    assignedMemberId: memberId,
    zone: "kitchen",
  },
  {
    id: "t2",
    title: "Vacuum",
    owner: "Alex",
    status: "Done",
    priority: "Low",
    dueDate: "2026-05-20",
    type: "chore",
    frequency: "weekly",
    lastCompletedDate: "2026-05-11",
    nextDueDate: "2026-05-18",
    assignedMemberId: memberId,
    lastCompletedByMemberId: memberId,
    zone: "kitchen",
  },
];

describe("memberTasksEngine", () => {
  it("computes progress", () => {
    const progress = buildMemberProgress(memberId, tasks, "2026-05-13");
    expect(progress.weekly.percent).toBeGreaterThanOrEqual(0);
    expect(progress.monthly.label).toBe("This month");
  });

  it("suggests overdue chores", () => {
    const suggestions = buildMemberChoreSuggestions(
      memberId,
      "Alex",
      tasks,
      [],
      "2026-05-13",
    );
    expect(suggestions.some((s) => s.kind === "overdue")).toBe(true);
  });
});

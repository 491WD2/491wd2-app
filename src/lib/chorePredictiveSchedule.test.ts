import { buildPredictiveSchedule } from "./chorePredictiveSchedule";
import type { ChoreTask, PersistedChoreState, ScheduleBundle } from "../types/cleaning";
import type { PersistedChoreNotes } from "../types/cleaning";

const emptyNotes: PersistedChoreNotes = { version: 1, improvementNotes: {} };

function task(partial: Partial<ChoreTask> & Pick<ChoreTask, "id" | "title">): ChoreTask {
  return {
    room: "Kitchen",
    assignedTo: "Stella",
    frequency: "Daily",
    dayPattern: "daily",
    dueDate: "2026-05-13",
    status: "To Do",
    notes: "",
    photoExampleUrl: "",
    improvementNotes: "",
    completedAt: null,
    skippedReason: null,
    source: "rule",
    ...partial,
  };
}

describe("buildPredictiveSchedule", () => {
  const today = "2026-05-13";
  const schedule: ScheduleBundle = {
    date: today,
    today: [
      task({ id: "t1", title: "Counters", status: "Overdue" }),
      task({ id: "t2", title: "Trash", assignedTo: "" }),
    ],
    thisWeek: [],
    thisMonth: [],
    memberSchedules: [],
    kitchenDutyToday: "Stella",
    checklists: [],
  };
  const state: PersistedChoreState = {
    version: 1,
    completions: {},
    skipped: {},
    assignmentOverrides: {},
  };

  it("ranks overdue tasks with high priority", () => {
    const report = buildPredictiveSchedule(schedule, state, emptyNotes, today, "Stella");
    expect(report.today.length).toBeGreaterThan(0);
    const overdue = report.today.find((i) => i.task.id === "t1");
    expect(overdue?.priority).toBe("high");
    expect(report.peakActivityHours.length).toBeGreaterThan(0);
  });
});

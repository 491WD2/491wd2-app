import { createDefaultFamilyData, type Task } from "../../data/familyData";
import { selectDashboardChores } from "./selectDashboardChores";

const TODAY = "2026-09-05";

function makeChore(overrides: Partial<Task> & Pick<Task, "id" | "title">): Task {
  return {
    owner: "",
    type: "chore",
    status: "Not Started",
    priority: "Medium",
    frequency: "weekly",
    dueDate: "",
    lastCompletedDate: "",
    nextDueDate: "",
    assignedMemberId: "",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("selectDashboardChores", () => {
  it("includes an open chore due today", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "due-today",
        title: "Unload dishwasher",
        dueDate: TODAY,
        nextDueDate: TODAY,
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows.map((row) => row.task.id)).toEqual(["due-today"]);
    expect(result.rows[0]?.attention).toBe("due-today");
    expect(result.rows[0]?.attentionLabel).toBe("Due today");
    expect(result.openCount).toBe(1);
    expect(result.summaryLabel).toBe("1 due today");
  });

  it("includes an open overdue chore without rewriting its stored date", () => {
    const data = createDefaultFamilyData();
    const stale = makeChore({
      id: "overdue",
      title: "Reset kitchen command center",
      status: "Today",
      dueDate: "2026-05-04",
      nextDueDate: "2026-05-04",
    });
    data.tasks = [stale];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.attention).toBe("overdue");
    expect(result.rows[0]?.attentionLabel).toBe("Overdue");
    expect(result.rows[0]?.task.nextDueDate).toBe("2026-05-04");
    expect(result.rows[0]?.task.dueDate).toBe("2026-05-04");
    expect(result.openCount).toBe(1);
    expect(result.summaryLabel).toBe("1 overdue");
  });

  it("includes a chore completed today", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "done-today",
        title: "Take out trash",
        status: "Not Started",
        lastCompletedDate: TODAY,
        dueDate: TODAY,
        nextDueDate: "2026-09-12",
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows.map((row) => row.task.id)).toEqual(["done-today"]);
    expect(result.rows[0]?.attention).toBe("completed-today");
    expect(result.summaryLabel).toBe("1 completed today");
    expect(result.openCount).toBe(0);
  });

  it("does not treat a historical completed chore as actionable", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "old-done",
        title: "Vacuum",
        status: "Done",
        lastCompletedDate: "2026-04-01",
        dueDate: "2026-04-01",
        nextDueDate: "2026-04-01",
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows).toHaveLength(0);
    expect(result.openCount).toBe(0);
    expect(result.summaryLabel).toBe("No chores need attention");
    expect(result.emptyLabel).toBe("No chores need attention");
  });

  it("excludes skipped chores", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "skipped",
        title: "Skipped sweep",
        status: "Skipped",
        dueDate: TODAY,
        nextDueDate: TODAY,
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows).toHaveLength(0);
    expect(result.openCount).toBe(0);
  });

  it("does not let a future chore outrank due or overdue chores", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "future",
        title: "Future mop",
        dueDate: "2026-09-20",
        nextDueDate: "2026-09-20",
      }),
      makeChore({
        id: "overdue",
        title: "Overdue mop",
        dueDate: "2026-05-04",
        nextDueDate: "2026-05-04",
      }),
      makeChore({
        id: "today",
        title: "Today mop",
        dueDate: TODAY,
        nextDueDate: TODAY,
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows.map((row) => row.task.id)).toEqual(["today", "overdue"]);
    expect(result.rows.map((row) => row.attention)).toEqual(["due-today", "overdue"]);
    expect(result.summaryLabel).toBe("1 due today · 1 overdue");
  });

  it("uses nearest upcoming chores only when nothing else is actionable", () => {
    const data = createDefaultFamilyData();
    data.tasks = [
      makeChore({
        id: "later",
        title: "Later chore",
        dueDate: "2026-09-22",
        nextDueDate: "2026-09-22",
      }),
      makeChore({
        id: "sooner",
        title: "Sooner chore",
        dueDate: "2026-09-08",
        nextDueDate: "2026-09-08",
      }),
    ];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows.map((row) => row.task.id)).toEqual(["sooner", "later"]);
    expect(result.rows.every((row) => row.attention === "upcoming")).toBe(true);
    expect(result.summaryLabel).toBe("Next up");
    expect(result.openCount).toBe(0);
  });

  it("returns a meaningful empty selection without fake rows", () => {
    const data = createDefaultFamilyData();
    data.tasks = [];

    const result = selectDashboardChores(data, TODAY);
    expect(result.rows).toEqual([]);
    expect(result.openCount).toBe(0);
    expect(result.summaryLabel).toBe("No chores need attention");
  });

  it("treats default seed May chores as overdue on a September dashboard date", () => {
    const data = createDefaultFamilyData();
    const result = selectDashboardChores(data, TODAY);
    const titles = result.rows.map((row) => row.task.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Reset kitchen command center",
        "Move clean towels upstairs",
      ]),
    );
    expect(result.rows.every((row) => row.attention === "overdue")).toBe(true);
    expect(result.openCount).toBeGreaterThan(0);
    expect(data.tasks.find((task) => task.id === "task-1")?.nextDueDate).toBe("2026-05-04");
  });
});

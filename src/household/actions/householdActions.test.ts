import { createDefaultFamilyData, type Task } from "../../data/familyData";
import {
  applyChoreToggleComplete,
  applyShoppingAddItem,
  isDoneToday,
} from "./index";

const todayIso = "2026-09-01";

function makeTask(overrides: Partial<Task> & Pick<Task, "id" | "title" | "type">): Task {
  return {
    owner: "",
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

describe("applyChoreToggleComplete", () => {
  it("reopens a chore completed today so isDoneToday is false", () => {
    const chore = makeTask({
      id: "chore-1",
      title: "Unload dishwasher",
      type: "chore",
      frequency: "daily",
    });
    const data = createDefaultFamilyData();
    data.tasks = [chore];

    const completed = applyChoreToggleComplete(data, chore, todayIso);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;

    const doneTask = completed.value.data.tasks.find((t) => t.id === chore.id)!;
    expect(isDoneToday(doneTask, todayIso)).toBe(true);

    const reopened = applyChoreToggleComplete(completed.value.data, doneTask, todayIso);
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;

    const reopenedTask = reopened.value.data.tasks.find((t) => t.id === chore.id)!;
    expect(reopened.value.toggled).toBe("reopened");
    expect(isDoneToday(reopenedTask, todayIso)).toBe(false);
    expect(reopenedTask.status).toBe("Not Started");
    expect(reopenedTask.lastCompletedDate).toBe("");
  });

  it("supports complete → reopen → complete again", () => {
    const chore = makeTask({
      id: "chore-2",
      title: "Take out trash",
      type: "chore",
      frequency: "weekly",
    });
    const data = createDefaultFamilyData();
    data.tasks = [chore];

    const first = applyChoreToggleComplete(data, chore, todayIso);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = applyChoreToggleComplete(first.value.data, chore, todayIso);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.toggled).toBe("reopened");

    const third = applyChoreToggleComplete(second.value.data, chore, todayIso);
    expect(third.ok).toBe(true);
    if (!third.ok) return;
    expect(third.value.toggled).toBe("completed");

    const finalTask = third.value.data.tasks.find((t) => t.id === chore.id)!;
    expect(isDoneToday(finalTask, todayIso)).toBe(true);
    expect(finalTask.lastCompletedDate).toBe(todayIso);
  });

  it("reopens a non-chore task marked Done and clears completed state", () => {
    const task = makeTask({
      id: "task-1",
      title: "Call school",
      type: "task",
      frequency: "one-time",
    });
    const data = createDefaultFamilyData();
    data.tasks = [task];

    const completed = applyChoreToggleComplete(data, task, todayIso);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;

    const doneTask = completed.value.data.tasks.find((t) => t.id === task.id)!;
    expect(doneTask.status).toBe("Done");
    expect(isDoneToday(doneTask, todayIso)).toBe(true);

    const reopened = applyChoreToggleComplete(completed.value.data, doneTask, todayIso);
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;

    const reopenedTask = reopened.value.data.tasks.find((t) => t.id === task.id)!;
    expect(reopenedTask.status).toBe("Not Started");
    expect(reopenedTask.lastCompletedDate).toBe("");
    expect(isDoneToday(reopenedTask, todayIso)).toBe(false);
  });

  it("preserves nextDueDate and assignedMemberId when reopening a recurring chore", () => {
    const chore = makeTask({
      id: "chore-3",
      title: "Vacuum",
      type: "chore",
      frequency: "weekly",
      assignedMemberId: "member-1",
      nextDueDate: "2026-09-08",
    });
    const data = createDefaultFamilyData();
    data.tasks = [chore];

    const completed = applyChoreToggleComplete(data, chore, todayIso);
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;

    const doneTask = completed.value.data.tasks.find((t) => t.id === chore.id)!;
    const nextDueAfterComplete = doneTask.nextDueDate;

    const reopened = applyChoreToggleComplete(completed.value.data, doneTask, todayIso);
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;

    const reopenedTask = reopened.value.data.tasks.find((t) => t.id === chore.id)!;
    expect(reopenedTask.nextDueDate).toBe(nextDueAfterComplete);
    expect(reopenedTask.assignedMemberId).toBe("member-1");
  });
});

describe("applyShoppingAddItem duplicate protection", () => {
  it("does not add a second Milk item or alter unrelated FamilyData", () => {
    const data = createDefaultFamilyData();
    const pantryBefore = [...data.pantry];
    const plannerBefore = [...data.planner];
    const householdName = data.adminSettings.householdName;

    const first = applyShoppingAddItem(data, "Milk");
    expect(first.ok).toBe(true);
    if (!first.ok || first.value.kind !== "added") return;

    const second = applyShoppingAddItem(first.value.data, "Milk");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.kind).toBe("duplicate");

    const milkItems = first.value.data.shopping?.filter((item) => item.name === "Milk") ?? [];
    expect(milkItems).toHaveLength(1);
    expect(first.value.data.pantry).toEqual(pantryBefore);
    expect(first.value.data.planner).toEqual(plannerBefore);
    expect(first.value.data.adminSettings.householdName).toBe(householdName);
  });
});

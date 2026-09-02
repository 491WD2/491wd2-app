import { createDefaultFamilyData, type Task } from "../data/familyData";
import { choresCompleteCapability, shoppingAddItemCapability } from "./index";

describe("household capabilities", () => {
  it("shopping.addItem matches household action behavior", () => {
    const data = createDefaultFamilyData();
    const result = shoppingAddItemCapability.execute(data, { name: "Eggs" });
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "added") return;
    expect(result.value.item.name).toBe("Eggs");
    expect(result.value.data.shopping?.[0]?.name).toBe("Eggs");
  });

  it("shopping.addItem('Milk') twice does not create a duplicate", () => {
    const data = createDefaultFamilyData();
    data.shopping = (data.shopping ?? []).filter(
      (item) => item.name.trim().toLowerCase() !== "milk",
    );

    const first = shoppingAddItemCapability.execute(data, { name: "Milk" });
    expect(first.ok).toBe(true);
    expect(first.ok && first.value.kind).toBe("added");
    if (!first.ok || first.value.kind !== "added") return;

    const second = shoppingAddItemCapability.execute(first.value.data, { name: "Milk" });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.kind).toBe("duplicate");
    expect(
      first.value.data.shopping?.filter((item) => item.name === "Milk"),
    ).toHaveLength(1);
  });

  it("chores.complete matches household action behavior", () => {
    const data = createDefaultFamilyData();
    const task: Task = {
      id: "cap-chore-1",
      title: "Wipe counters",
      owner: "",
      type: "chore",
      status: "Not Started",
      priority: "Medium",
      frequency: "daily",
      dueDate: "",
      lastCompletedDate: "",
      nextDueDate: "",
      assignedMemberId: "",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    data.tasks = [task];

    const result = choresCompleteCapability.execute(data, {
      task,
      todayIso: "2026-09-01",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.toggled).toBe("completed");
    expect(
      result.value.data.tasks.find((t) => t.id === task.id)?.lastCompletedDate,
    ).toBe("2026-09-01");
  });
});

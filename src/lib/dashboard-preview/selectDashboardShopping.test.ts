import { createDefaultFamilyData, type ShoppingItem } from "../../data/familyData";
import { selectDashboardShopping } from "./selectDashboardShopping";

function item(overrides: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "name">): ShoppingItem {
  return {
    category: "pantry",
    storeSection: "aisles",
    neededBy: "",
    purchased: false,
    destination: "Pantry",
    ...overrides,
  };
}

describe("selectDashboardShopping", () => {
  it("keeps only unpurchased items and sorts by neededBy then name", () => {
    const data = createDefaultFamilyData();
    data.shopping = [
      item({ id: "c", name: "Zest", neededBy: "2026-09-10", purchased: false }),
      item({ id: "b", name: "Apples", neededBy: "2026-09-10", purchased: false }),
      item({ id: "a", name: "Bread", neededBy: "2026-09-06", purchased: false }),
      item({ id: "done", name: "Bought milk", purchased: true, neededBy: "2026-09-01" }),
    ];

    const result = selectDashboardShopping(data, 5);
    expect(result.items.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(result.rows.map((row) => row.item.id)).toEqual(["a", "b", "c"]);
    expect(result.count).toBe(3);
    expect(result.summaryLabel).toBe("3 items on the list");
  });

  it("does not invent groceries when the list is empty", () => {
    const data = createDefaultFamilyData();
    data.shopping = [];
    const result = selectDashboardShopping(data);
    expect(result.items).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.summaryLabel).toBe("Shopping list is clear.");
    expect(result.emptyLabel).toBe("Shopping list is clear.");
  });

  it("surfaces existing seed shopping items without rewriting dates", () => {
    const data = createDefaultFamilyData();
    const result = selectDashboardShopping(data);
    expect(result.items.map((row) => row.name)).toEqual(["Milk", "AA batteries"]);
    expect(data.shopping.find((row) => row.name === "Milk")?.neededBy).toBe("2026-05-05");
    expect(result.items.some((row) => row.name === "Freezer waffles")).toBe(false);
  });
});

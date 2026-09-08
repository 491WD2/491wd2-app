import {
  eventWhenChip,
  isShoppingItemDueSoon,
  summarizePantryForHome,
  summarizeShoppingForHome,
  weatherPlaceholderCopy,
} from "./homePriorityDashboard";
import type { PantryItem, ShoppingItem } from "../data/familyData";

function shop(partial: Partial<ShoppingItem> & Pick<ShoppingItem, "id" | "name">): ShoppingItem {
  return {
    category: "pantry",
    storeSection: "aisles",
    neededBy: "",
    purchased: false,
    destination: "Pantry",
    ...partial,
  };
}

function pantry(partial: Partial<PantryItem> & Pick<PantryItem, "id" | "name" | "status">): PantryItem {
  return {
    quantity: "1",
    category: "pantry",
    storageArea: "Pantry",
    location: "Pantry",
    isStaple: false,
    tags: [],
    createdAt: "2026-09-01T00:00:00.000Z",
    lastUpdated: "2026-09-01T00:00:00.000Z",
    ...partial,
  };
}

describe("homePriorityDashboard", () => {
  it("summarizes open shopping items and due/restock flags", () => {
    const summary = summarizeShoppingForHome(
      [
        shop({ id: "a", name: "Milk", neededBy: "2026-09-01", createdAt: "2026-09-08T10:00:00.000Z" }),
        shop({ id: "b", name: "Bought bread", purchased: true }),
        shop({ id: "c", name: "Pasta", sourcePantryItemId: "pantry-1", neededBy: "2026-09-20" }),
      ],
      "2026-09-08",
    );
    expect(summary.open.map((item) => item.name)).toEqual(["Milk", "Pasta"]);
    expect(summary.dueSoon.map((item) => item.name)).toEqual(["Milk"]);
    expect(summary.restock.map((item) => item.name)).toEqual(["Pasta"]);
    expect(summary.recent[0]?.name).toBe("Milk");
    expect(isShoppingItemDueSoon(summary.open[0], "2026-09-08")).toBe(true);
  });

  it("prioritizes pantry out, low, and use-soon rows", () => {
    const summary = summarizePantryForHome([
      pantry({ id: "1", name: "Rice", status: "Out" }),
      pantry({ id: "2", name: "Oats", status: "Low" }),
      pantry({
        id: "3",
        name: "Yogurt",
        status: "Stocked",
        useSoonMarked: true,
      }),
      pantry({ id: "4", name: "Flour", status: "Stocked", inactiveInInventory: true }),
    ]);
    expect(summary.activeCount).toBe(3);
    expect(summary.out.map((item) => item.name)).toEqual(["Rice"]);
    expect(summary.low.map((item) => item.name)).toEqual(["Oats"]);
    expect(summary.attention.map((row) => `${row.badge}:${row.item.name}`)).toEqual([
      "Out:Rice",
      "Low:Oats",
      "Use soon:Yogurt",
    ]);
  });

  it("labels today and tomorrow event chips", () => {
    expect(eventWhenChip("2026-09-08", "2026-09-08")).toBe("Today");
    expect(eventWhenChip("2026-09-09", "2026-09-08")).toBe("Tomorrow");
  });

  it("keeps weather copy honest instead of inventing a forecast", () => {
    const copy = weatherPlaceholderCopy(new Date("2026-09-08T15:00:00"));
    expect(copy.detail).toMatch(/not connected/i);
  });
});

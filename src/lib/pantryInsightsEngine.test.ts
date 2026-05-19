import {
  buildSmartGroceryList,
  buildUseFirstSuggestions,
  filterPantryInsightItems,
} from "./pantryInsightsEngine";
import type { PantryInsightItem } from "../types/pantryInsights";

const sample: PantryInsightItem[] = [
  {
    id: "1",
    name: "Milk",
    quantity: 1,
    unit: "gal",
    expiryDate: "2026-05-12",
    category: "Dairy",
    status: "Expiring Soon",
  },
  {
    id: "2",
    name: "Rice",
    quantity: 5,
    unit: "lb",
    expiryDate: "2027-01-01",
    category: "Dry",
  },
];

describe("pantryInsightsEngine", () => {
  it("filters low stock", () => {
    const low = filterPantryInsightItems(sample, "low_stock", null);
    expect(low.some((i) => i.id === "1")).toBe(true);
  });

  it("builds use-first suggestions", () => {
    const now = new Date(2026, 4, 13);
    const suggestions = buildUseFirstSuggestions(sample);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].itemIds[0]).toBe("1");
    expect(suggestions[0].kind).toBe("use_first");
    void now;
  });

  it("builds smart grocery for low stock", () => {
    const lines = buildSmartGroceryList(sample);
    expect(lines.some((l) => l.name === "Milk")).toBe(true);
  });
});

import { createDefaultFamilyData } from "../../data/familyData";
import { buildFamilyHubDashboardModel } from "../familyHubDashboardData";
import { selectDashboardPantry } from "./selectDashboardPantry";

const TODAY = "2026-09-05";

describe("selectDashboardPantry", () => {
  it("does not invent pantry alerts when nothing needs attention", () => {
    const data = createDefaultFamilyData();
    data.pantry = [];
    const result = selectDashboardPantry(buildFamilyHubDashboardModel(data, TODAY));
    expect(result.rows).toEqual([]);
    expect(result.alertCount).toBe(0);
    expect(result.emptyLabel).toBe("No pantry alerts right now.");
  });

  it("surfaces real low-stock items after expiring items and dedupes both", () => {
    const result = selectDashboardPantry(
      {
        overview: {
          dateLabel: "Saturday, September 5, 2026",
          todayIso: TODAY,
          choresDueToday: 0,
          choresOverdue: 0,
          expiringFood: 1,
          lowStock: 2,
          upcomingEvents: 0,
          shoppingOpen: 0,
          notifications: 0,
        },
        expiringFood: [
          { id: "milk", name: "Milk", detail: "Use by 2026-09-08", badge: "Soon", emoji: "⏳" },
        ],
        lowStock: [
          { id: "milk", name: "Milk", detail: "1 gallon", badge: "Low", emoji: "📦" },
          { id: "rice", name: "Rice", detail: "1 bags", badge: "Low", emoji: "📦" },
        ],
      },
      4,
    );

    expect(result.rows.map((row) => row.id)).toEqual(["expiring-milk", "low-rice"]);
    expect(result.rows[0]?.kind).toBe("expiring");
    expect(result.rows[1]?.kind).toBe("low-stock");
    expect(result.alertCount).toBe(3);
    expect(result.summaryLabel).toBe("2 low · 1 expiring");
  });

  it("keeps seed low-stock items without rewriting inventory", () => {
    const data = createDefaultFamilyData();
    const hub = buildFamilyHubDashboardModel(data, TODAY);
    const result = selectDashboardPantry(hub);
    expect(result.lowStockCount).toBe(hub.overview.lowStock);
    expect(result.expiringCount).toBe(hub.overview.expiringFood);
    expect(result.alertCount).toBe(hub.overview.lowStock + hub.overview.expiringFood);
    if (result.lowStockCount > 0) {
      expect(result.rows.length).toBeGreaterThan(0);
    }
    expect(data.pantry.length).toBe(createDefaultFamilyData().pantry.length);
  });
});

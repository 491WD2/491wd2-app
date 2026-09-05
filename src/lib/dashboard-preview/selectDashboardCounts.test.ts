import { createDefaultFamilyData } from "../../data/familyData";
import { buildFamilyHubDashboardModel } from "../familyHubDashboardData";
import { selectDashboardChores } from "./selectDashboardChores";
import { selectDashboardMessages } from "./selectDashboardMessages";
import { selectDashboardPantry } from "./selectDashboardPantry";
import { selectDashboardShopping } from "./selectDashboardShopping";
import { selectDashboardUpcoming } from "./selectDashboardUpcoming";

const TODAY = "2026-09-05";

describe("dashboard preview counts match selection meaning", () => {
  it("describes seed household work without rewriting stored dates", () => {
    const data = createDefaultFamilyData();
    const chores = selectDashboardChores(data, TODAY);
    const shopping = selectDashboardShopping(data);
    const upcoming = selectDashboardUpcoming(data, TODAY);
    const pantry = selectDashboardPantry(buildFamilyHubDashboardModel(data, TODAY));
    const messages = selectDashboardMessages(data);

    expect(chores.openCount).toBe(chores.dueTodayCount + chores.overdueCount);
    expect(chores.openCount).toBe(2);
    expect(chores.summaryLabel).toBe("2 overdue");
    expect(data.tasks.find((task) => task.id === "task-1")?.nextDueDate).toBe("2026-05-04");

    expect(shopping.count).toBe(shopping.items.length);
    expect(shopping.count).toBe(2);
    expect(shopping.summaryLabel).toBe("2 items on the list");

    expect(upcoming.relevantCount).toBe(upcoming.todayCount + upcoming.upcomingCount);
    expect(upcoming.relevantCount).toBe(0);
    expect(upcoming.heading).toBe("Upcoming");

    expect(pantry.alertCount).toBe(pantry.lowStockCount + pantry.expiringCount);
    expect(pantry.summaryLabel).toBe(`${pantry.lowStockCount} low · ${pantry.expiringCount} expiring`);

    expect(messages.count).toBe(0);
    expect(messages.summaryLabel).toBe("Nothing unread");
  });
});

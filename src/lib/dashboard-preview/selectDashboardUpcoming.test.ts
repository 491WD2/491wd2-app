import { createDefaultFamilyData, type PlannerEvent } from "../../data/familyData";
import { selectDashboardUpcoming } from "./selectDashboardUpcoming";

const TODAY = "2026-09-05";

function event(overrides: Partial<PlannerEvent> & Pick<PlannerEvent, "id" | "title" | "date">): PlannerEvent {
  return {
    time: "09:00",
    category: "Family",
    assignedMemberId: "",
    assignedPerson: "Family",
    ...overrides,
  };
}

describe("selectDashboardUpcoming", () => {
  it("does not surface stale historical planner events", () => {
    const data = createDefaultFamilyData();
    const result = selectDashboardUpcoming(data, TODAY);
    expect(result.rows).toEqual([]);
    expect(result.relevantCount).toBe(0);
    expect(result.emptyLabel).toBe("No upcoming events on the planner.");
  });

  it("prioritizes today, then tomorrow, then the nearest upcoming event", () => {
    const data = createDefaultFamilyData();
    data.planner = [
      event({ id: "later", title: "Later picnic", date: "2026-09-20", time: "12:00" }),
      event({ id: "today", title: "Morning standup", date: TODAY, time: "08:00" }),
      event({ id: "tomorrow", title: "School pickup", date: "2026-09-06", time: "15:00" }),
      event({ id: "past", title: "Old meeting", date: "2026-05-04", time: "18:30" }),
    ];

    const result = selectDashboardUpcoming(data, TODAY);
    expect(result.rows.map((row) => row.id)).toEqual(["today", "tomorrow", "later"]);
    expect(result.rows[0]?.isToday).toBe(true);
    expect(result.todayCount).toBe(1);
    expect(result.upcomingCount).toBe(2);
    expect(result.relevantCount).toBe(3);
    expect(result.heading).toBe("Today");
    expect(result.rows[0]?.meta).toBe("08:00 · Family");
  });

  it("omits Other category labels, generic assignees, and duplicate rows", () => {
    const data = createDefaultFamilyData();
    const duplicate = event({
      id: "dup",
      title: "Library",
      date: "2026-09-07",
      time: "",
      category: "Other",
      assignedPerson: "Household",
    });
    data.planner = [duplicate, { ...duplicate }];

    const result = selectDashboardUpcoming(data, TODAY);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.meta).toBe("");
    expect(result.heading).toBe("Upcoming");
  });
});

import { buildAnalyticsAgentReport } from "./choreAnalyticsAgentData";
import type { KioskAnalyticsEvent } from "../types/kioskAnalytics";

function event(
  partial: Partial<KioskAnalyticsEvent> & Pick<KioskAnalyticsEvent, "category" | "action">,
): KioskAnalyticsEvent {
  return {
    id: partial.id ?? "e_test",
    ts: partial.ts ?? Date.now(),
    sessionId: "sess",
    surface: partial.surface,
    metadata: partial.metadata,
    durationMs: partial.durationMs,
    category: partial.category,
    action: partial.action,
  };
}

describe("buildAnalyticsAgentReport", () => {
  it("aggregates completions and page views", () => {
    const events: KioskAnalyticsEvent[] = [
      event({ category: "page", action: "page_view", surface: "chores:home" }),
      event({ category: "page", action: "page_view", surface: "chores:home" }),
      event({
        category: "chore",
        action: "chore_complete",
        surface: "chores:home",
        metadata: { assignedTo: "Stella" },
      }),
    ];
    const report = buildAnalyticsAgentReport(events, {
      pageSurface: "all",
      member: "all",
      choreStatus: "all",
      dateRange: "all",
    });
    expect(report.totalFiltered).toBe(3);
    expect(report.completions).toBe(1);
    expect(report.pageViewBars.some((b) => b.label === "Home" && b.value === 2)).toBe(true);
  });

  it("filters by page surface", () => {
    const events: KioskAnalyticsEvent[] = [
      event({ category: "page", action: "page_view", surface: "chores:home" }),
      event({ category: "page", action: "page_view", surface: "chores:dashboard" }),
    ];
    const report = buildAnalyticsAgentReport(events, {
      pageSurface: "chores:dashboard",
      member: "all",
      choreStatus: "all",
      dateRange: "all",
    });
    expect(report.totalFiltered).toBe(1);
  });
});

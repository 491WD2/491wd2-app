import {
  getAnalyticsRollupSummary,
  getKioskAnalyticsEvents,
  KIOSK_ANALYTICS_MAX_EVENTS,
  KIOSK_ANALYTICS_ROLLUP_KEY,
  trackKioskEvent,
} from "./kioskAnalytics";

async function flushAnalytics(): Promise<void> {
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
}

describe("kioskAnalytics", () => {
  it("retains at most KIOSK_ANALYTICS_MAX_EVENTS events", async () => {
    for (let i = 0; i < KIOSK_ANALYTICS_MAX_EVENTS + 25; i++) {
      trackKioskEvent({
        category: "chore",
        action: "complete",
        surface: "chores:home",
        metadata: { index: i },
      });
    }
    await flushAnalytics();
    const events = getKioskAnalyticsEvents();
    expect(events.length).toBe(KIOSK_ANALYTICS_MAX_EVENTS);
    expect(events[0]?.metadata).toEqual({ index: 25 });
  });

  it("rolls dropped events into hourly rollup storage", async () => {
    for (let i = 0; i < KIOSK_ANALYTICS_MAX_EVENTS + 10; i++) {
      trackKioskEvent({
        category: "gesture",
        action: "swipe",
        surface: "chores:home",
      });
    }
    await flushAnalytics();
    const rollup = getAnalyticsRollupSummary();
    expect(rollup.droppedTotal).toBeGreaterThanOrEqual(10);
    expect(localStorage.getItem(KIOSK_ANALYTICS_ROLLUP_KEY)).toBeTruthy();
  });
});

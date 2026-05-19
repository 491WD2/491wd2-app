export const KIOSK_ANALYTICS_AI_INSIGHTS_KEY = "491wd-chore-analytics-ai-insights";

export function isAnalyticsAiInsightsEnabled(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(KIOSK_ANALYTICS_AI_INSIGHTS_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAnalyticsAiInsightsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(KIOSK_ANALYTICS_AI_INSIGHTS_KEY, enabled ? "1" : "0");
}

import { trackInteraction, trackKioskPageView } from "./kioskAnalytics";

export const FAMILY_HUB_ANALYTICS_SURFACE = "family-hub:dashboard";

export function trackFamilyHubDashboardView(householdName?: string) {
  trackKioskPageView(FAMILY_HUB_ANALYTICS_SURFACE, {
    action: "dashboard_view",
    household: householdName?.slice(0, 40) ?? "household",
  });
  trackInteraction(FAMILY_HUB_ANALYTICS_SURFACE, "dashboard_view");
}

export function trackFamilyHubQuickAction(actionId: string) {
  trackInteraction(FAMILY_HUB_ANALYTICS_SURFACE, "quick_action", {
    action: actionId,
  });
}

export function trackFamilyHubSuggestionAction(suggestionId: string, kind: string) {
  trackInteraction(FAMILY_HUB_ANALYTICS_SURFACE, "suggestion_action", {
    suggestionId: suggestionId.slice(0, 24),
    kind,
  });
}

export function trackFamilyHubSectionOpen(sectionId: string) {
  trackInteraction(FAMILY_HUB_ANALYTICS_SURFACE, "section_open", {
    section: sectionId,
  });
}

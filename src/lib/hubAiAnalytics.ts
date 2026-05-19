/**
 * Hub AI suggestion analytics — localStorage via kiosk analytics queue (no notes).
 */
import { trackInteraction, trackKioskEvent } from "./kioskAnalytics";

export type HubAiSurface =
  | "pantry:food-inventory"
  | "pantry:kiosk"
  | "member:dashboard";

export function trackAiSuggestionShown(
  surface: HubAiSurface,
  suggestionId: string,
  kind: string,
) {
  trackInteraction(surface, "ai_suggestion_shown", {
    suggestionId,
    kind,
  });
}

export function trackAiSuggestionActed(
  surface: HubAiSurface,
  suggestionId: string,
  kind: string,
  action: string,
) {
  trackKioskEvent({
    category: "interaction",
    action: "ai_suggestion_accept",
    surface,
    metadata: { suggestionId, kind, action },
  });
}

export function trackAiSuggestionDismissed(
  surface: HubAiSurface,
  suggestionId: string,
  kind: string,
) {
  trackInteraction(surface, "ai_suggestion_dismiss", {
    suggestionId,
    kind,
  });
}

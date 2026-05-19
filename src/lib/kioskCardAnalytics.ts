/**
 * Hub card analytics — thin wrappers over kioskAnalytics (queueMicrotask, non-blocking).
 */
import { trackDragStart, trackInteraction, trackSwipe } from "./kioskAnalytics";

export function trackCardClick(surface: string, cardId: string) {
  trackInteraction(surface, "card_click", { cardId: cardId.slice(0, 24) });
}

export function trackCardAction(surface: string, actionId: string, cardId?: string) {
  trackInteraction(surface, "card_action", {
    action: actionId,
    ...(cardId ? { cardId: cardId.slice(0, 24) } : {}),
  });
}

export function trackCardComplete(surface: string, cardId: string) {
  trackInteraction(surface, "card_complete", { cardId: cardId.slice(0, 24) });
}

export function trackCardFilter(surface: string, filter: string) {
  trackInteraction(surface, "filter_change", { filter });
}

export function trackCardReorder(surface: string, from: number, to: number) {
  trackInteraction(surface, "card_reorder", { from, to });
}

export function trackCardDragStart(surface: string, cardId: string) {
  trackDragStart(surface, cardId);
}

export function trackCardDragDrop(surface: string, cardId: string, target: string) {
  trackInteraction(surface, "drag_drop", {
    cardId: cardId.slice(0, 24),
    target,
  });
}

export function trackCardScan(surface: string) {
  trackInteraction(surface, "scan_open");
}

export function trackCardEdit(surface: string, cardId: string) {
  trackInteraction(surface, "card_edit", { cardId: cardId.slice(0, 24) });
}

export function trackCardSwipeComplete(surface: string, direction: "left" | "right") {
  trackSwipe(surface, direction, "complete");
}

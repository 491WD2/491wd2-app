import { trackInteraction, trackKioskPageView } from "./kioskAnalytics";

export const CALENDAR_PLANNER_SURFACE = "calendar:planner";

export function trackCalendarView() {
  trackKioskPageView(CALENDAR_PLANNER_SURFACE, { action: "calendar_view" });
  trackInteraction(CALENDAR_PLANNER_SURFACE, "calendar_view");
}

export function trackCalendarEventAdd(eventId: string) {
  trackInteraction(CALENDAR_PLANNER_SURFACE, "event_add", {
    eventId: eventId.slice(0, 24),
  });
}

export function trackCalendarEventEdit(eventId: string) {
  trackInteraction(CALENDAR_PLANNER_SURFACE, "event_edit", {
    eventId: eventId.slice(0, 24),
  });
}

export function trackCalendarReminderComplete(itemId: string, kind: string) {
  trackInteraction(CALENDAR_PLANNER_SURFACE, "reminder_complete", {
    itemId: itemId.slice(0, 24),
    kind,
  });
}

export function trackCalendarPlannerDragDrop(itemId: string, kind: string, targetDate: string) {
  trackInteraction(CALENDAR_PLANNER_SURFACE, "planner_drag_drop", {
    itemId: itemId.slice(0, 24),
    kind,
    targetDate: targetDate.slice(0, 10),
  });
}

export function trackCalendarFoodReminderClick(itemId: string, kind: string) {
  trackInteraction(CALENDAR_PLANNER_SURFACE, "food_reminder_click", {
    itemId: itemId.slice(0, 24),
    kind,
  });
}

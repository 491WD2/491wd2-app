import type { PlannerEvent } from "../data/familyData";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

function withinLast24h(iso: string | undefined, now: number): boolean {
  if (!iso?.trim()) {
    return false;
  }
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    return false;
  }
  return now - t >= 0 && now - t <= TWENTY_FOUR_H_MS;
}

/** "New" if created in last 24h; else "Changed" if updated after created in last 24h. */
export function getPlannerEventFreshnessBadge(
  event: PlannerEvent,
  nowMs: number = Date.now(),
): "New" | "Changed" | null {
  const created = event.createdAt;
  const updated = event.updatedAt;
  if (withinLast24h(created, nowMs)) {
    return "New";
  }
  if (
    updated &&
    created &&
    Date.parse(updated) > Date.parse(created) &&
    withinLast24h(updated, nowMs)
  ) {
    return "Changed";
  }
  return null;
}

/**
 * Offline-ready snapshot of chore foundation — written on every persist.
 * Enables read-only recovery when the app shell loads without network (PWA cache).
 */
import type { PersistedChoreState } from "../types/cleaning";

export const CHORE_OFFLINE_SNAPSHOT_KEY = "491wd-chore-offline-snapshot";

export type ChoreOfflineSnapshot = {
  version: 1;
  savedAt: number;
  choreState: PersistedChoreState;
  memberSchedules: unknown;
  choreNotes: unknown;
};

export function writeChoreOfflineSnapshot(payload: {
  choreState: PersistedChoreState;
  memberSchedules: unknown;
  choreNotes: unknown;
}): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const snap: ChoreOfflineSnapshot = {
      version: 1,
      savedAt: Date.now(),
      choreState: payload.choreState,
      memberSchedules: payload.memberSchedules,
      choreNotes: payload.choreNotes,
    };
    window.localStorage.setItem(CHORE_OFFLINE_SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    /* quota — non-fatal */
  }
}

export function readChoreOfflineSnapshot(): ChoreOfflineSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CHORE_OFFLINE_SNAPSHOT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ChoreOfflineSnapshot;
    if (parsed.version !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

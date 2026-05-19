import {
  CHORE_OFFLINE_SNAPSHOT_KEY,
  readChoreOfflineSnapshot,
  writeChoreOfflineSnapshot,
} from "./choreOfflineSnapshot";
import type { PersistedChoreState } from "../types/cleaning";

const minimalState = {
  version: 1,
  tasks: [],
  definitions: [],
  checklists: [],
} as unknown as PersistedChoreState;

describe("choreOfflineSnapshot", () => {
  it("writes and reads a versioned snapshot", () => {
    writeChoreOfflineSnapshot({
      choreState: minimalState,
      memberSchedules: {},
      choreNotes: {},
    });
    const snap = readChoreOfflineSnapshot();
    expect(snap?.version).toBe(1);
    expect(snap?.choreState).toEqual(minimalState);
    expect(localStorage.getItem(CHORE_OFFLINE_SNAPSHOT_KEY)).toBeTruthy();
  });
});

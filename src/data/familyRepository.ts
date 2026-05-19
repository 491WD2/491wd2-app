import type { FamilyData } from "./familyData";

/** Result of probing whether the active storage backend can read/write (browser localStorage today). */
export type FamilyStorageStatus = "OK" | "Error" | "Unavailable";

/**
 * Data access boundary for household state.
 * Implemented by `LocalFamilyRepository` today; `SupabaseFamilyRepository` is a placeholder for a future backend.
 */
export interface FamilyRepository {
  loadFamilyData(): Promise<FamilyData>;
  saveFamilyData(data: FamilyData): Promise<void>;
  exportFamilyData(): Promise<FamilyData>;
  importFamilyData(data: FamilyData): Promise<void>;
  /**
   * Persists fresh default household data. Does not append activity-log entries;
   * UI reset flows that record a "reset" event should keep using `setData(createActivity(createDefaultFamilyData(), …))`.
   */
  resetFamilyData(): Promise<void>;
  getStorageStatus(): Promise<FamilyStorageStatus>;
}

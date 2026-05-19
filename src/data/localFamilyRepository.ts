import { createDefaultFamilyData, type FamilyData } from "./familyData";
import { migrateFamilyData, normalizeFamilyData } from "./familyMigrations";
import type { FamilyRepository, FamilyStorageStatus } from "./familyRepository";

/** Same key historically used for the primary household snapshot. */
export const FAMILY_DATA_STORAGE_KEY = "familysite-491:first-family-build";

export function readRawFamilyPayload(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(FAMILY_DATA_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeRawFamilyPayload(json: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FAMILY_DATA_STORAGE_KEY, json);
  } catch {
    // localStorage can fail in private mode or when storage is full.
  }
}

/**
 * Synchronous load for React initial state (same rules as {@link LocalFamilyRepository.loadFamilyData}).
 */
export function loadFamilyDataFromLocalStorageSync(): FamilyData {
  if (typeof window === "undefined") {
    return createDefaultFamilyData();
  }

  const raw = readRawFamilyPayload();
  if (!raw) {
    return createDefaultFamilyData();
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = migrateFamilyData(parsed);
    if (result.ok) {
      return result.data;
    }
    console.warn(
      "[FamilySite] Stored data could not be migrated; starting from the built-in template. Error:",
      result.error,
    );
    return createDefaultFamilyData();
  } catch (err) {
    console.warn(
      "[FamilySite] Stored data was not readable JSON; starting from the built-in template. If you had a backup, use Settings → Import Backup.",
      err,
    );
    return createDefaultFamilyData();
  }
}

/**
 * Browser localStorage implementation of {@link FamilyRepository}.
 * Uses {@link FAMILY_DATA_STORAGE_KEY} and shared migration/normalization from `familyMigrations.ts`.
 */
export class LocalFamilyRepository implements FamilyRepository {
  async loadFamilyData(): Promise<FamilyData> {
    return loadFamilyDataFromLocalStorageSync();
  }

  async saveFamilyData(data: FamilyData): Promise<void> {
    writeRawFamilyPayload(JSON.stringify(data));
  }

  async exportFamilyData(): Promise<FamilyData> {
    return this.loadFamilyData();
  }

  async importFamilyData(data: FamilyData): Promise<void> {
    const normalized = normalizeFamilyData(data);
    await this.saveFamilyData(normalized);
  }

  async resetFamilyData(): Promise<void> {
    await this.saveFamilyData(createDefaultFamilyData());
  }

  async getStorageStatus(): Promise<FamilyStorageStatus> {
    if (typeof window === "undefined") {
      return "Unavailable";
    }

    try {
      const testKey = "familysite-491:storage-test";
      window.localStorage.setItem(testKey, "ok");
      window.localStorage.removeItem(testKey);
      return "OK";
    } catch {
      return "Error";
    }
  }
}

export const localFamilyRepository: FamilyRepository = new LocalFamilyRepository();

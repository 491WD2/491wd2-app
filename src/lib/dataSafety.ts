/**
 * Non-destructive helpers around household persistence.
 * Primary snapshot key stays {@link FAMILY_DATA_STORAGE_KEY} — never renamed here.
 */
import {
  FAMILY_DATA_STORAGE_KEY,
  readRawFamilyPayload,
} from "../data/localFamilyRepository";

export { FAMILY_DATA_STORAGE_KEY };

/** Prefix for optional pre-migration snapshots (additive backups only). */
export const FAMILY_DATA_BACKUP_PREFIX = "familysite.backup.beforeDataIntegration.";

/**
 * Writes a copy of the current raw JSON payload to a timestamped backup key.
 * Does not read or modify the primary household key.
 * Returns the backup key used, or null if nothing was stored or storage failed.
 */
export function snapshotCurrentFamilyDataToBackupKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = readRawFamilyPayload();
  if (!raw || raw.trim().length === 0) {
    return null;
  }
  const key = `${FAMILY_DATA_BACKUP_PREFIX}${Date.now()}`;
  try {
    window.localStorage.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

/** Whether the primary household payload appears present (non-blocking probe). */
export function hasPrimaryFamilyPayload(): boolean {
  const raw = readRawFamilyPayload();
  return Boolean(raw && raw.trim().length > 0);
}

/** Last successful Export Backup timestamp from this browser (ISO string). Not household data. */
export const LAST_BACKUP_EXPORT_AT_KEY = "familysite-491:last-backup-export-at";

export function readLastBackupExportAt(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const v = window.localStorage.getItem(LAST_BACKUP_EXPORT_AT_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

export function writeLastBackupExportAt(iso: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LAST_BACKUP_EXPORT_AT_KEY, iso);
  } catch {
    /* ignore quota */
  }
}

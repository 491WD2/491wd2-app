import { createDefaultFamilyData, type FamilyData } from "../data/familyData";
import {
  loadFamilyDataFromLocalStorageSync,
  localFamilyRepository,
} from "../data/localFamilyRepository";
import {
  supabaseFamilyRepository,
  supabaseFamilyRepositoryImpl,
} from "../data/supabaseFamilyRepository";
export {
  migrateFamilyData,
  normalizeFamilyData,
  type MigrationResult,
} from "../data/familyMigrations";
import { useEffect, useState } from "react";

/**
 * Household state with localStorage persistence via {@link localFamilyRepository}.
 */
export function useFamilyData() {
  const defaultFamilyData = createDefaultFamilyData();

  const [value, setValue] = useState<FamilyData>(() =>
    typeof window === "undefined"
      ? defaultFamilyData
      : loadFamilyDataFromLocalStorageSync(),
  );
  const [cloudPreviewHydrated, setCloudPreviewHydrated] = useState(false);

  useEffect(() => {
    const mode = value.adminSettings.dataSourceMode ?? "local";
    const repo = mode === "cloud-preview" ? supabaseFamilyRepository : localFamilyRepository;
    if (mode === "cloud-preview" && !cloudPreviewHydrated) {
      // Don't overwrite cloud data before the first cloud load completes.
      return;
    }
    void repo.saveFamilyData(value).catch(() => {
      // Keep the UI responsive; errors are surfaced where mode is toggled.
    });
  }, [value, cloudPreviewHydrated]);

  useEffect(() => {
    const mode = value.adminSettings.dataSourceMode ?? "local";
    if (mode !== "cloud-preview") {
      setCloudPreviewHydrated(false);
      return;
    }

    let cancelled = false;
    const localSnapshot = value;
    const householdId = localSnapshot.adminSettings.cloudHouseholdId?.trim() ?? "";
    if (householdId) {
      supabaseFamilyRepositoryImpl.setHouseholdId(householdId);
    }

    async function load() {
      try {
        const cloud = await supabaseFamilyRepository.loadFamilyData();
        if (cancelled) {
          return;
        }

        // Preserve mode + connection details stored on this device.
        setValue((prev) => ({
          ...cloud,
          // Not implemented in cloud preview yet: keep device-only modules visible.
          projects: prev.projects,
          docs: prev.docs,
          activityLog: prev.activityLog,
          kitchenSchedule: prev.kitchenSchedule,
          kitchenDutyCompletions: prev.kitchenDutyCompletions,
          kitchenChecklist: prev.kitchenChecklist,
          messageBoard: prev.messageBoard,
          pets: prev.pets,
          petMedicationEntries: prev.petMedicationEntries,
          adminSettings: {
            ...cloud.adminSettings,
            dataSourceMode: "cloud-preview",
            cloudHouseholdId: prev.adminSettings.cloudHouseholdId,
            cloudHouseholdName: prev.adminSettings.cloudHouseholdName,
            cloudHouseholdRole: prev.adminSettings.cloudHouseholdRole,
            lastCloudUploadAt: prev.adminSettings.lastCloudUploadAt,
            lastCloudPreviewAt: prev.adminSettings.lastCloudPreviewAt,
            activePreferencesMemberId: prev.adminSettings.activePreferencesMemberId,
            activeMemberId: prev.adminSettings.activeMemberId,
            userPreferencesByMemberId: prev.adminSettings.userPreferencesByMemberId,
            siteNotificationDefaults: prev.adminSettings.siteNotificationDefaults,
          },
        }));
        setCloudPreviewHydrated(true);
      } catch {
        if (cancelled) {
          return;
        }
        // Failed to enter cloud preview; fall back safely without deleting local data.
        setValue((prev) => ({
          ...localSnapshot,
          adminSettings: { ...prev.adminSettings, dataSourceMode: "local" },
        }));
        setCloudPreviewHydrated(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // Intentionally only key off mode; other settings shouldn't re-trigger cloud load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.adminSettings.dataSourceMode]);

  return [value, setValue] as const;
}

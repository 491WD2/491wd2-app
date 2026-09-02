import {
  CURRENT_DATA_VERSION,
  createDefaultFamilyData,
  type Task,
} from "../data/familyData";
import {
  FAMILY_DATA_STORAGE_KEY,
  LocalFamilyRepository,
  writeRawFamilyPayload,
} from "../data/localFamilyRepository";
import { migrateFamilyData, normalizeFamilyData } from "../data/familyMigrations";
import { applyChoreToggleComplete, applyShoppingAddItem } from "../household/actions";

describe("family data safety", () => {
  it("uses the unchanged primary localStorage key", () => {
    expect(FAMILY_DATA_STORAGE_KEY).toBe("familysite-491:first-family-build");
  });

  it("persists load, modify, save, and reload through LocalFamilyRepository", async () => {
    const repo = new LocalFamilyRepository();
    const initial = createDefaultFamilyData();
    initial.adminSettings.householdName = "Persistence Test Household";
    await repo.saveFamilyData(initial);

    const loaded = await repo.loadFamilyData();
    expect(loaded.adminSettings.householdName).toBe("Persistence Test Household");

    loaded.shopping = [
      ...(loaded.shopping ?? []),
      {
        id: "shop-test-1",
        name: "Milk",
        quantity: "1",
        unit: "",
        category: "pantry",
        storeSection: "aisles",
        preferredStore: "",
        neededBy: "2026-09-01",
        purchased: false,
        needsPutAway: false,
        destination: "Pantry",
        destinationDetail: "",
        customDestinationName: "",
        pantryNote: "",
        wall: "Wall 1",
        shelf: "Shelf 1",
        notes: "",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ];
    await repo.saveFamilyData(loaded);

    const reloaded = await repo.loadFamilyData();
    expect(reloaded.shopping?.some((item) => item.name === "Milk")).toBe(true);
    expect(reloaded.adminSettings.householdName).toBe("Persistence Test Household");
  });

  it("migrates version-0 stored payloads without dropping household name", () => {
    const legacy = {
      dataVersion: 0,
      adminSettings: { householdName: "Legacy Household" },
      familyMembers: [],
      tasks: [],
      planner: [],
      shopping: [],
      pantry: [],
    };

    const migrated = migrateFamilyData(legacy);
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;

    expect(migrated.data.dataVersion).toBe(CURRENT_DATA_VERSION);
    expect(migrated.data.adminSettings.householdName).toBe("Legacy Household");
  });

  it("normalizes malformed optional fields without erasing unrelated household data", () => {
    const base = createDefaultFamilyData();
    base.adminSettings.householdName = "Normalize Guard";
    base.tasks = [
      {
        id: "task-1",
        title: "Unload dishwasher",
        owner: "",
        type: "chore",
        status: "Not Started",
        priority: "Medium",
        frequency: "daily",
        dueDate: "",
        lastCompletedDate: "",
        nextDueDate: "",
        assignedMemberId: "",
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    ];

    const normalized = normalizeFamilyData({
      ...base,
      shopping: "not-an-array",
      notifications: null,
      pantry: undefined,
    });

    expect(normalized.adminSettings.householdName).toBe("Normalize Guard");
    expect(normalized.tasks).toHaveLength(1);
    expect(normalized.tasks[0]?.title).toBe("Unload dishwasher");
    expect(Array.isArray(normalized.shopping)).toBe(true);
  });

  it("imports exported backup envelopes through migrate + repository import", async () => {
    const source = createDefaultFamilyData();
    source.adminSettings.householdName = "Backup Roundtrip";
    const backupEnvelope = {
      appName: "FamilySite_491",
      backupFormat: "familysite-491.backup.v1",
      exportedAt: "2026-09-01T12:00:00.000Z",
      householdName: source.adminSettings.householdName,
      dataVersion: CURRENT_DATA_VERSION,
      data: source,
    };

    const migrated = migrateFamilyData(backupEnvelope.data);
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;

    const repo = new LocalFamilyRepository();
    await repo.importFamilyData(migrated.data);
    const imported = await repo.loadFamilyData();
    expect(imported.adminSettings.householdName).toBe("Backup Roundtrip");
  });

  it("keeps pantry and calendar intact when shopping.addItem runs", () => {
    const data = createDefaultFamilyData();
    const pantryBefore = data.pantry.length;
    const plannerBefore = data.planner.length;
    const householdName = data.adminSettings.householdName;

    const result = applyShoppingAddItem(data, "Milk");
    expect(result.ok).toBe(true);
    if (!result.ok || result.value.kind !== "added") return;

    expect(result.value.data.shopping?.some((item) => item.name === "Milk")).toBe(true);
    expect(result.value.data.pantry).toHaveLength(pantryBefore);
    expect(result.value.data.planner).toHaveLength(plannerBefore);
    expect(result.value.data.adminSettings.householdName).toBe(householdName);
  });

  it("only changes the targeted chore when chores.complete runs", () => {
    const data = createDefaultFamilyData();
    const todayIso = "2026-09-01";
    const target: Task = {
      id: "chore-target",
      title: "Take out trash",
      owner: "",
      type: "chore",
      status: "Not Started",
      priority: "Medium",
      frequency: "weekly",
      dueDate: "",
      lastCompletedDate: "",
      nextDueDate: "",
      assignedMemberId: "",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    const other: Task = {
      id: "chore-other",
      title: "Vacuum",
      owner: "",
      type: "chore",
      status: "Not Started",
      priority: "Low",
      frequency: "weekly",
      dueDate: "",
      lastCompletedDate: "",
      nextDueDate: "",
      assignedMemberId: "",
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    };
    data.tasks = [target, other];

    const result = applyChoreToggleComplete(data, target, todayIso);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const completed = result.value.data.tasks.find((t) => t.id === "chore-target");
    const untouched = result.value.data.tasks.find((t) => t.id === "chore-other");
    expect(completed?.lastCompletedDate).toBe(todayIso);
    expect(untouched?.lastCompletedDate).toBeFalsy();
    expect(result.value.data.shopping).toEqual(data.shopping);
  });
});

describe("raw payload roundtrip", () => {
  it("writes and reads the primary key without renaming it", () => {
    const payload = JSON.stringify(createDefaultFamilyData());
    writeRawFamilyPayload(payload);
    expect(localStorage.getItem(FAMILY_DATA_STORAGE_KEY)).toBe(payload);
  });
});

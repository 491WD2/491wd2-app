/** Migration and normalization for stored `FamilyData` (localStorage or future remote snapshots). */
import { syncPetFleaDueNotifications } from "../lib/petFleaMedication";
import {
  CURRENT_DATA_VERSION,
  createCanonicalHouseholdFamilyMembers,
  createDefaultFamilyData,
  initialFamilyData,
  memberColorThemes,
  moduleKeys,
  stockStatuses,
  taskTypes,
  kioskDefaultViewOptions,
  kitchenWallDisplayDeviceOptions,
  type AdminSettings,
  type ActivityEntityType,
  type ActivityLogItem,
  type ActivityType,
  type CanCondition,
  type CalendarLink,
  type CleaningCompletionRecord,
  type CleaningCompletionStatus,
  type CleaningPhotoReference,
  type CleaningRoom,
  type CleaningRoomTaskGroupFrequency,
  createDefaultKitchenSchedule,
  createDefaultKitchenChecklist,
  type DataSource,
  type DocCategory,
  type DocItem,
  type DocVisibility,
  type FamilyMember,
  type FamilyData,
  type FoodStorageCategory,
  type GroceryItem,
  type HouseholdNotification,
  type HouseholdNotificationType,
  type ItemUseType,
  type PantryStorageType,
  type ShelfLifeSource,
  type KitchenChecklistItem,
  type KitchenDutyCompletion,
  type KitchenSchedule,
  type KitchenScheduleDay,
  type KitchenWeekday,
  type MessageBoardItem,
  type MemberNotificationPreferences,
  type MemberPageLayoutSettings,
  type ModuleKey,
  type PantryItem,
  type PantryItemType,
  type PantryShelf,
  type PantryWall,
  type Pet,
  type PetMedicationEntry,
  type PlannerEvent,
  type RecipeIdea,
  type RotationStatus,
  type StorageClass,
  type Project,
  type ProjectMilestone,
  type ProjectMilestoneStatus,
  type ProjectPriority,
  type ProjectStatus,
  type ShoppingItem,
  type SectionSize,
  type Task,
  type TaskSource,
  type UserMemberPreferences,
  type HouseholdStorageLocation,
  type PantryLocation,
  pantryLocations,
} from "./familyData";
import {
  CLEANING_PLAYBOOK_CANONICAL_IDS,
  cloneCleaningRoomStarter,
  sortCleaningRoomsCanonicalFirst,
  type CleaningPlaybookCanonicalId,
} from "./cleaningPlaybookTemplates";
import {
  getCalendarCategories,
  getDocCategories,
  getDocVisibilityOptions,
  getInventoryStorageAreas,
  getMemberStatuses,
  getGroceryStoreSections,
  getPantryShelfOptions,
  getPantryWallOptions,
  getProjectPriorities,
  getProjectStatuses,
  getTaskFrequencies,
  getTaskPriorities,
  getTaskStatuses,
  normalizeCustomization,
} from "../lib/customization";
import { normalizeColorKey } from "../lib/colorCoding";

export type MigrationResult =
  | { ok: true; data: FamilyData }
  | { ok: false; error: string };

export function migrateFamilyData(rawData: unknown): MigrationResult {
  if (!isRecord(rawData)) {
    return {
      ok: false,
      error: "Backup must contain a JSON object.",
    };
  }

  const sourceVersion = readNumber(rawData.dataVersion, 0);

  if (sourceVersion > CURRENT_DATA_VERSION) {
    return {
      ok: false,
      error: `Backup data version ${sourceVersion} is newer than this app supports.`,
    };
  }

  let migratedData: Record<string, unknown> = rawData;

  if (sourceVersion === 0) {
    migratedData = migrateVersion0To1(migratedData);
  }

  // Future versions can be chained here before final normalization.
  return {
    ok: true,
    data: normalizeFamilyData(migratedData),
  };
}

function migrateVersion0To1(data: Record<string, unknown>) {
  return {
    ...data,
    dataVersion: CURRENT_DATA_VERSION,
  };
}

export function normalizeFamilyData(value: unknown): FamilyData {
  if (!isRecord(value)) {
    return createDefaultFamilyData();
  }

  const adminSettings = normalizeAdminSettings(value.adminSettings);
  const familyMembers = normalizeFamilyMembers(
    value.familyMembers ?? value.members,
    adminSettings,
  );
  const tasks = normalizeArray(
    value.tasks,
    [],
    (task) => normalizeTask(task, adminSettings),
  ).map((task) => normalizeTaskAssignment(task, familyMembers));

  const kitchenSchedule = normalizeKitchenSchedule(value.kitchenSchedule, familyMembers);

  const normalized: FamilyData = {
    dataVersion: CURRENT_DATA_VERSION,
    adminSettings,
    familyMembers,
    groceryItems: normalizeArray(
      value.groceryItems,
      [],
      (item) => normalizeGroceryItem(item, adminSettings),
    ),
    tasks,
    projects: normalizeArray(
      value.projects,
      [],
      (project) => normalizeProject(project, adminSettings),
    ).map((project) => normalizeProjectLead(project, familyMembers)),
    pantry: normalizeArray(value.pantry, [], (item) =>
      normalizePantryItem(item, adminSettings),
    ),
    shopping: normalizeArray(
      value.shopping,
      [],
      (item) => normalizeShoppingItem(item, adminSettings),
    ),
    planner: normalizeArray(
      value.planner,
      [],
      (event) => normalizePlannerEvent(event, adminSettings),
    ).map((event) => normalizePlannerAssignment(event, familyMembers)),
    calendarLinks: normalizeCalendarLinks(value.calendarLinks),
    docs: normalizeArray(value.docs, [], (doc) =>
      normalizeDocItem(doc, familyMembers, adminSettings),
    ),
    cleaningRooms: normalizeCleaningRooms(value.cleaningRooms),
    cleaningCompletionRecords: normalizeCleaningCompletionRecords(value.cleaningCompletionRecords),
    kitchenSchedule,
    kitchenDutyCompletions: mergeLegacyKitchenDutyCompletions(
      normalizeKitchenDutyCompletions(value.kitchenDutyCompletions),
      kitchenSchedule,
      familyMembers,
    ),
    kitchenChecklist: normalizeKitchenChecklist(value.kitchenChecklist),
    messageBoard: normalizeMessageBoard(value.messageBoard),
    recipeIdeas: normalizeArray(value.recipeIdeas, [], normalizeRecipeIdea),
    notifications: normalizeArray(value.notifications, [], normalizeHouseholdNotification).slice(
      0,
      500,
    ),
    activityLog: normalizeArray(value.activityLog, [], normalizeActivityLogItem)
      .sort(
        (a, b) =>
          getSafeTimestamp(b.createdAt) - getSafeTimestamp(a.createdAt),
      )
      .slice(0, 200),
    storageLocations: normalizeArray(
      value.storageLocations,
      [],
      normalizeHouseholdStorageLocation,
    ),
    pets: mergeDefaultPets(normalizeArray(value.pets, [], normalizePet)),
    petMedicationEntries: normalizeArray(
      value.petMedicationEntries,
      [],
      normalizePetMedicationEntry,
    ),
  };

  return syncPetFleaDueNotifications(normalized);
}

const CLEANING_GROUP_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "custom",
] as const satisfies readonly CleaningRoomTaskGroupFrequency[];

function inferCleaningGroupFrequency(title: string): CleaningRoomTaskGroupFrequency {
  const t = title.trim().toLowerCase();
  if (t.includes("daily")) return "daily";
  if (t.includes("week")) return "weekly";
  if (t.includes("month")) return "monthly";
  if (t.includes("quarter")) return "quarterly";
  return "custom";
}

function isCanonicalCleaningRoomId(id: string): id is CleaningPlaybookCanonicalId {
  return (CLEANING_PLAYBOOK_CANONICAL_IDS as readonly string[]).includes(id);
}

function normalizeCleaningRoomRecord(raw: unknown, fallbackNow: string): CleaningRoom {
  const item = isRecord(raw) ? raw : {};
  const taskGroupsRaw = Array.isArray(item.taskGroups) ? item.taskGroups : [];

  return {
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "Room"),
    zone: readOptionalString(item.zone),
    icon: readString(item.icon, "Sparkles"),
    description: readOptionalString(item.description),
    referenceImageUrl: readOptionalString(item.referenceImageUrl),
    referenceImageCaption: readOptionalString(item.referenceImageCaption),
    whatToDo: normalizeArray(item.whatToDo, [], (v) => readString(v, "")).filter(Boolean),
    whatToAvoid: normalizeArray(item.whatToAvoid, [], (v) => readString(v, "")).filter(Boolean),
    suppliesNeeded: normalizeArray(item.suppliesNeeded, [], (v) => readString(v, "")).filter(Boolean),
    taskGroups: taskGroupsRaw.map((group) => {
      const g = isRecord(group) ? group : {};
      const tasksRaw = Array.isArray(g.tasks) ? g.tasks : [];
      const title = readString(g.title, "Checklist");
      return {
        id: readString(g.id, crypto.randomUUID()),
        title,
        frequency:
          pickOptional(g.frequency, CLEANING_GROUP_FREQUENCIES) ??
          inferCleaningGroupFrequency(title),
        tasks: tasksRaw.map((t) => {
          const task = isRecord(t) ? t : {};
          return {
            id: readString(task.id, crypto.randomUUID()),
            title: readString(task.title, "Task"),
            completed: typeof task.completed === "boolean" ? task.completed : false,
            completedAt: readOptionalString(task.completedAt),
            completedByMemberId:
              typeof task.completedByMemberId === "string" &&
              task.completedByMemberId.trim() !== ""
                ? task.completedByMemberId.trim()
                : null,
          };
        }),
      };
    }),
    createdAt: readString(item.createdAt, fallbackNow),
    updatedAt: readString(item.updatedAt, fallbackNow),
  };
}

function cleaningPlaybookIsEffectivelyEmpty(room: CleaningRoom): boolean {
  const hasGuides =
    (room.whatToDo?.length ?? 0) > 0 ||
    (room.whatToAvoid?.length ?? 0) > 0 ||
    (room.suppliesNeeded?.length ?? 0) > 0;
  const taskCount = room.taskGroups.reduce((n, g) => n + g.tasks.length, 0);
  return !hasGuides && taskCount === 0;
}

function hydrateEmptyCanonicalCleaningRoom(room: CleaningRoom, now: string): CleaningRoom {
  if (!isCanonicalCleaningRoomId(room.id) || !cleaningPlaybookIsEffectivelyEmpty(room)) {
    return room;
  }
  const seeded = cloneCleaningRoomStarter(room.id, now);
  return {
    ...seeded,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
  };
}

function normalizeCleaningRooms(value: unknown): CleaningRoom[] {
  const now = new Date().toISOString();

  let rooms: CleaningRoom[];

  if (!Array.isArray(value) || value.length === 0) {
    rooms = CLEANING_PLAYBOOK_CANONICAL_IDS.map((id) => cloneCleaningRoomStarter(id, now));
    return sortCleaningRoomsCanonicalFirst(rooms);
  }

  rooms = value.map((raw) => normalizeCleaningRoomRecord(raw, now));

  const seen = new Set(rooms.map((r) => r.id));
  for (const id of CLEANING_PLAYBOOK_CANONICAL_IDS) {
    if (!seen.has(id)) {
      rooms.push(cloneCleaningRoomStarter(id, now));
      seen.add(id);
    }
  }

  rooms = rooms.map((room) => hydrateEmptyCanonicalCleaningRoom(room, now));
  return sortCleaningRoomsCanonicalFirst(rooms);
}

const CLEANING_COMPLETION_STATUSES = [
  "completed",
  "needs_review",
  "approved",
  "needs_redo",
] as const satisfies readonly CleaningCompletionStatus[];

function normalizeCleaningCompletionRecords(value: unknown): CleaningCompletionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const now = new Date().toISOString();
  return value
    .map((raw) => {
      const item = isRecord(raw) ? raw : {};
      const progressRaw = isRecord(item.checklistProgress) ? item.checklistProgress : {};
      const completed = Math.max(0, Math.floor(readNumber(progressRaw.completed, 0)));
      const total = Math.max(0, Math.floor(readNumber(progressRaw.total, 0)));
      const noteRaw = item.reviewNote;
      const reviewNote =
        typeof noteRaw === "string" ? noteRaw.trim().slice(0, 500) : undefined;
      return {
        id: readString(item.id, crypto.randomUUID()),
        roomId: readString(item.roomId, ""),
        completedByMemberId: readOptionalString(item.completedByMemberId),
        completedAt: readIsoString(item.completedAt, now),
        checklistProgress: { completed, total },
        status: pick(item.status, CLEANING_COMPLETION_STATUSES, "completed"),
        reviewedByMemberId: readOptionalString(item.reviewedByMemberId),
        reviewedAt: readOptionalString(item.reviewedAt),
        reviewNote,
        createdAt: readIsoString(item.createdAt, now),
        updatedAt: readIsoString(item.updatedAt, now),
      };
    })
    .filter((row) => row.roomId.trim().length > 0);
}

const KITCHEN_WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function normalizeKitchenSchedule(
  value: unknown,
  familyMembers: FamilyMember[],
): KitchenSchedule {
  const fallback = createDefaultKitchenSchedule();
  const validIds = new Set(familyMembers.map((m) => m.id));
  const resolveId = (id: string) =>
    validIds.has(id) ? id : (familyMembers[0]?.id ?? "member-1");

  if (!isRecord(value) || !Array.isArray(value.weekdays)) {
    return fallback;
  }

  const byDay = new Map<(typeof KITCHEN_WEEKDAYS)[number], string>();
  for (const row of value.weekdays) {
    const r = isRecord(row) ? row : {};
    const day = pickOptional(r.day, KITCHEN_WEEKDAYS);
    if (!day) {
      continue;
    }
    const memberId = readString(r.memberId, "");
    if (memberId) {
      byDay.set(day, resolveId(memberId));
    }
  }

  const weekdays: KitchenScheduleDay[] = KITCHEN_WEEKDAYS.map((day) => {
    const fromMap = byDay.get(day);
    const fromFallback = fallback.weekdays.find((w) => w.day === day)?.memberId;
    return {
      day,
      memberId: resolveId(fromMap ?? fromFallback ?? "member-1"),
    };
  });

  const completedDatesRaw = Array.isArray(value.completedDates)
    ? value.completedDates
    : [];
  const completedDates = completedDatesRaw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));

  const reminderIssued = readOptionalString(value.kitchenDutyReminderIssuedForDate)?.trim();
  const kitchenDutyReminderIssuedForDate =
    reminderIssued && /^\d{4}-\d{2}-\d{2}$/.test(reminderIssued)
      ? reminderIssued
      : undefined;

  return {
    weekdays,
    updatedAt: readOptionalString(value.updatedAt) ?? fallback.updatedAt,
    ...(completedDates.length > 0 ? { completedDates } : {}),
    ...(kitchenDutyReminderIssuedForDate
      ? { kitchenDutyReminderIssuedForDate }
      : {}),
  };
}

function isoDateToKitchenWeekday(isoDate: string): KitchenWeekday | null {
  const d = new Date(`${isoDate.trim()}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const map: Record<number, KitchenWeekday> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };
  return map[d.getDay()] ?? null;
}

function normalizeKitchenDutyCompletions(raw: unknown): KitchenDutyCompletion[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const rows = raw.map((item): KitchenDutyCompletion | null => {
    const row = isRecord(item) ? item : {};
    const dutyDate = readString(row.dutyDate, "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dutyDate)) {
      return null;
    }
    const dayKey = pickOptional(row.dayKey, KITCHEN_WEEKDAYS);
    if (!dayKey) {
      const inferred = isoDateToKitchenWeekday(dutyDate);
      if (!inferred) {
        return null;
      }
      return buildDutyCompletionRow(row, dutyDate, inferred);
    }
    return buildDutyCompletionRow(row, dutyDate, dayKey);
  });
  return rows.filter((x): x is KitchenDutyCompletion => Boolean(x));
}

function buildDutyCompletionRow(
  row: Record<string, unknown>,
  dutyDate: string,
  dayKey: KitchenWeekday,
): KitchenDutyCompletion {
  const now = new Date().toISOString();
  const memberId = readString(row.memberId, "").trim() || "member-1";
  return {
    id: readString(row.id, crypto.randomUUID()),
    dayKey,
    dutyDate,
    memberId,
    completedAt: readIsoString(row.completedAt, `${dutyDate}T15:00:00.000Z`),
    completedByMemberId: readOptionalString(row.completedByMemberId),
    notes: readOptionalString(row.notes),
    createdAt: readIsoString(row.createdAt, now),
  };
}

function mergeLegacyKitchenDutyCompletions(
  completions: KitchenDutyCompletion[],
  schedule: KitchenSchedule,
  familyMembers: FamilyMember[],
): KitchenDutyCompletion[] {
  const byDate = new Set(completions.map((c) => c.dutyDate));
  const legacy = schedule.completedDates ?? [];
  const validIds = new Set(familyMembers.map((m) => m.id));
  const resolve = (id: string) =>
    validIds.has(id) ? id : (familyMembers[0]?.id ?? "member-1");

  const extra: KitchenDutyCompletion[] = [];
  for (const dutyDate of legacy) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dutyDate) || byDate.has(dutyDate)) {
      continue;
    }
    const dayKey = isoDateToKitchenWeekday(dutyDate);
    if (!dayKey) {
      continue;
    }
    const schedMember = schedule.weekdays.find((w) => w.day === dayKey)?.memberId ?? "";
    const memberId = resolve(schedMember);
    const stamp = `${dutyDate}T15:00:00.000Z`;
    extra.push({
      id: crypto.randomUUID(),
      dayKey,
      dutyDate,
      memberId,
      completedAt: stamp,
      createdAt: stamp,
    });
    byDate.add(dutyDate);
  }
  return [...completions, ...extra].sort((a, b) => a.dutyDate.localeCompare(b.dutyDate));
}

function readFiniteOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function normalizeOptionalStepsLines(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    const lines = raw
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : undefined;
  }
  if (typeof raw === "string") {
    const lines = raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return lines.length > 0 ? lines : undefined;
  }
  return undefined;
}

function normalizeCleaningPhotoReference(value: unknown): CleaningPhotoReference {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  const rawUrl = readOptionalString(item.imageDataUrl);
  let imageDataUrl: string | undefined;
  if (rawUrl?.startsWith("data:image/jpeg")) {
    imageDataUrl = rawUrl.length <= 2_500_000 ? rawUrl : undefined;
  }
  return {
    id: readString(item.id, crypto.randomUUID()),
    imageDataUrl,
    caption: readOptionalString(item.caption),
    instructions: readOptionalString(item.instructions),
    objectPositionX: readFiniteOptionalNumber(item.objectPositionX),
    objectPositionY: readFiniteOptionalNumber(item.objectPositionY),
    scale: readFiniteOptionalNumber(item.scale),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizeKitchenChecklist(raw: unknown): KitchenChecklistItem[] {
  const fallback = createDefaultKitchenChecklist();
  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback;
  }
  const parsed = raw
    .map((item, index): KitchenChecklistItem | null => {
      const row = isRecord(item) ? item : {};
      const id = readString(row.id, "").trim() || `kitchen-check-${index}`;
      const label = readString(row.label, "").trim();
      if (!label) {
        return null;
      }
      const checkedRaw = readOptionalString(row.checkedDate)?.trim();
      const checkedDate =
        checkedRaw && /^\d{4}-\d{2}-\d{2}$/.test(checkedRaw) ? checkedRaw : undefined;
      const stepsLines = normalizeOptionalStepsLines(row.stepsLines);
      const notesRaw = readOptionalString(row.notesText)?.trim();
      const photoReferences = normalizeArray(row.photoReferences, [], normalizeCleaningPhotoReference);

      const base: KitchenChecklistItem = {
        id,
        label,
        sortOrder: readNumber(row.sortOrder, index),
        ...(checkedDate ? { checkedDate } : {}),
      };
      const next: KitchenChecklistItem = { ...base };
      if (stepsLines && stepsLines.length > 0) {
        next.stepsLines = stepsLines;
      }
      if (notesRaw) {
        next.notesText = notesRaw;
      }
      if (photoReferences.length > 0) {
        next.photoReferences = photoReferences;
      }
      return next;
    })
    .filter((x): x is KitchenChecklistItem => Boolean(x));
  return parsed.length > 0 ? parsed : fallback;
}

const RECIPE_IDEA_SOURCES: RecipeIdea["source"][] = ["manual", "suggested", "ai_future"];

function normalizeRecipeIdea(value: unknown): RecipeIdea {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  const ingredients = normalizeStringArray(item.ingredients);
  const usesIds = normalizeStringArray(item.usesInventoryItemIds);
  return {
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title, "Recipe idea"),
    ingredients,
    usesInventoryItemIds: usesIds.length > 0 ? usesIds : undefined,
    notes: readOptionalString(item.notes),
    source: pick(item.source, RECIPE_IDEA_SOURCES, "manual"),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

const HOUSEHOLD_NOTIFICATION_TYPES: HouseholdNotificationType[] = [
  "inventory_low",
  "inventory_out",
  "shopping_added",
  "message",
  "kitchen_duty",
  "pet_flea_med_due",
  "chore_due",
  "calendar_reminder",
];

const DEFAULT_HOUSEHOLD_CATS: ReadonlyArray<{ name: string; colorTheme: string }> = [
  { name: "Ginny", colorTheme: "rose" },
  { name: "Stubby", colorTheme: "amber" },
  { name: "Cleo", colorTheme: "teal" },
  { name: "Pickeles", colorTheme: "violet" },
];

function mergeDefaultPets(existing: Pet[]): Pet[] {
  const now = new Date().toISOString();
  const seen = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  const next = [...existing];
  for (const spec of DEFAULT_HOUSEHOLD_CATS) {
    const key = spec.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const slug = key.replace(/\s+/g, "-");
    next.push({
      id: `pet-${slug}`,
      name: spec.name,
      species: "cat",
      colorTheme: spec.colorTheme,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  return next.sort((a, b) => a.name.localeCompare(b.name));
}

function normalizePet(value: unknown): Pet {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  return {
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "Pet").trim() || "Pet",
    species: pick(item.species, ["cat", "dog", "other"], "cat"),
    colorTheme: readOptionalString(item.colorTheme),
    active: typeof item.active === "boolean" ? item.active : true,
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizePetMedicationEntry(value: unknown): PetMedicationEntry {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  return {
    id: readString(item.id, crypto.randomUUID()),
    petId: readString(item.petId, ""),
    medicationType: pick(item.medicationType, ["flea"], "flea"),
    givenAt: readString(item.givenAt, now),
    givenByMemberId: readOptionalString(item.givenByMemberId),
    notes: readOptionalString(item.notes),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizeHouseholdStorageLocation(value: unknown): HouseholdStorageLocation {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  const storageArea = pickOrPreserve(
    item.storageArea,
    pantryLocations,
    "Pantry",
  ) as PantryLocation;
  const isPantry = storageArea === "Pantry";
  return {
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "Storage zone"),
    storageArea,
    locationDetail: readOptionalString(item.locationDetail),
    pantryWall: isPantry
      ? (pickOrPreserve(item.pantryWall, ["Wall 1", "Wall 2", "Wall 3", "Wall 4"], "Wall 1") as PantryWall)
      : undefined,
    pantryShelf: isPantry
      ? (pickOrPreserve(
          item.pantryShelf,
          ["Shelf 1", "Shelf 2", "Shelf 3", "Shelf 4", "Shelf 5"],
          "Shelf 1",
        ) as PantryShelf)
      : undefined,
    photoUrl: readOptionalString(item.photoUrl),
    photoCaption: readOptionalString(item.photoCaption),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizeHouseholdNotification(value: unknown): HouseholdNotification {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  return {
    id: readString(item.id, crypto.randomUUID()),
    recipientMemberId: readString(item.recipientMemberId, ""),
    type: pick(item.type, HOUSEHOLD_NOTIFICATION_TYPES, "message"),
    title: readString(item.title, "Notification"),
    body: readString(item.body, ""),
    relatedEntityType: readOptionalString(item.relatedEntityType),
    relatedEntityId: readOptionalString(item.relatedEntityId),
    dueAt: readOptionalString(item.dueAt),
    petId: readOptionalString(item.petId),
    readAt: readOptionalString(item.readAt),
    dismissedAt: readOptionalString(item.dismissedAt),
    createdAt: readString(item.createdAt, now),
  };
}

const MESSAGE_BOARD_PRIORITIES = [
  "low",
  "normal",
  "important",
  "urgent",
] as const;

function normalizeMessageBoard(value: unknown): MessageBoardItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const now = new Date().toISOString();
  return value
    .map((raw) => {
      const item = isRecord(raw) ? raw : {};
      const message = readString(item.message, "").trim().slice(0, 2000);
      const title = readString(item.title, "").trim().slice(0, 200);
      const category =
        readString(item.category, "").trim() || "General";
      const colorKey = normalizeColorKey(item.colorKey);
      const priority = pick(item.priority, MESSAGE_BOARD_PRIORITIES, "normal");
      const pinned = typeof item.pinned === "boolean" ? item.pinned : false;
      const relatedRaw = item.relatedMemberIds;
      const relatedMemberIds = Array.isArray(relatedRaw)
        ? relatedRaw
            .filter((x): x is string => typeof x === "string")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      return {
        id: readString(item.id, crypto.randomUUID()),
        title,
        message,
        category,
        colorKey,
        priority,
        pinned,
        authorMemberId: readOptionalString(item.authorMemberId),
        relatedMemberIds: relatedMemberIds?.length ? relatedMemberIds : undefined,
        startsAt: readOptionalString(item.startsAt),
        expiresAt: readOptionalString(item.expiresAt),
        createdAt: readString(item.createdAt, now),
        updatedAt: readString(item.updatedAt, now),
      };
    })
    .filter((row) => row.message.length > 0 || row.title.length > 0);
}

function normalizeSectionSizes(value: unknown): Record<string, SectionSize> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const sizes: Record<string, SectionSize> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === "compact" || v === "normal" || v === "large") {
      sizes[key] = v;
    }
  }
  return Object.keys(sizes).length > 0 ? sizes : undefined;
}

function normalizeMemberNotificationPreferences(
  value: unknown,
): MemberNotificationPreferences | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return {
    enableReminders:
      typeof value.enableReminders === "boolean" ? value.enableReminders : undefined,
    choresDue: typeof value.choresDue === "boolean" ? value.choresDue : undefined,
    choresOverdue:
      typeof value.choresOverdue === "boolean" ? value.choresOverdue : undefined,
    shoppingUpdates:
      typeof value.shoppingUpdates === "boolean" ? value.shoppingUpdates : undefined,
    kitchenDutyReminders:
      typeof value.kitchenDutyReminders === "boolean"
        ? value.kitchenDutyReminders
        : undefined,
    calendarReminders:
      typeof value.calendarReminders === "boolean" ? value.calendarReminders : undefined,
    calendarEventsToday:
      typeof value.calendarEventsToday === "boolean" ? value.calendarEventsToday : undefined,
    inventoryLowStock:
      typeof value.inventoryLowStock === "boolean" ? value.inventoryLowStock : undefined,
    petMedicationDue:
      typeof value.petMedicationDue === "boolean" ? value.petMedicationDue : undefined,
    importantMessages:
      typeof value.importantMessages === "boolean" ? value.importantMessages : undefined,
  };
}

function normalizePageSettingsMap(
  value: unknown,
): Record<string, MemberPageLayoutSettings> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const out: Record<string, MemberPageLayoutSettings> = {};
  for (const [pageKey, raw] of Object.entries(value)) {
    if (!pageKey.trim()) {
      continue;
    }
    const item = isRecord(raw) ? raw : {};
    const hidden = normalizeStringArray(item.hiddenSections);
    const collapsed = normalizeStringArray(item.collapsedSections);
    const sizes = normalizeSectionSizes(item.sectionSizes);
    out[pageKey] = {
      lockLayout: typeof item.lockLayout === "boolean" ? item.lockLayout : undefined,
      hiddenSections: hidden.length > 0 ? hidden : undefined,
      collapsedSections: collapsed.length > 0 ? collapsed : undefined,
      sectionSizes: sizes,
      notificationsEnabled:
        typeof item.notificationsEnabled === "boolean"
          ? item.notificationsEnabled
          : undefined,
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeUserPreferencesByMemberId(
  value: unknown,
): AdminSettings["userPreferencesByMemberId"] {
  if (!isRecord(value)) {
    return undefined;
  }
  const result: Record<string, UserMemberPreferences> = {};
  for (const [memberId, raw] of Object.entries(value)) {
    if (!memberId.trim()) {
      continue;
    }
    const item = isRecord(raw) ? raw : {};
    const pageSettings = normalizePageSettingsMap(item.pageSettings);
    const notificationPreferences = normalizeMemberNotificationPreferences(
      item.notificationPreferences,
    );
    const defaultLandingPage =
      typeof item.defaultLandingPage === "string" &&
      moduleKeys.includes(item.defaultLandingPage as ModuleKey)
        ? (item.defaultLandingPage as ModuleKey)
        : undefined;
    if (!pageSettings && !notificationPreferences && !defaultLandingPage) {
      continue;
    }
    result[memberId] = {
      ...(pageSettings ? { pageSettings } : {}),
      ...(notificationPreferences ? { notificationPreferences } : {}),
      ...(defaultLandingPage ? { defaultLandingPage } : {}),
    };
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeAdminSettings(value: unknown): AdminSettings {
  const item = isRecord(value) ? value : {};
  const visibility = isRecord(item.moduleVisibility)
    ? item.moduleVisibility
    : {};

  return {
    ...item,
    householdName: readString(
      item.householdName,
      initialFamilyData.adminSettings.householdName,
    ),
    dashboardWelcomeMessage: readString(
      item.dashboardWelcomeMessage,
      initialFamilyData.adminSettings.dashboardWelcomeMessage,
    ),
    appModeLabel: readString(
      item.appModeLabel,
      initialFamilyData.adminSettings.appModeLabel,
    ),
    dataSourceMode: item.dataSourceMode === "cloud-preview" ? "cloud-preview" : "local",
    colorThemeOptions: readString(
      item.colorThemeOptions,
      initialFamilyData.adminSettings.colorThemeOptions,
    ),
    animalIconHelpText: readString(
      item.animalIconHelpText,
      initialFamilyData.adminSettings.animalIconHelpText,
    ),
    instacart: normalizeInstacartSettings(item.instacart),
    moduleVisibility: moduleKeys.reduce(
      (result, key) => ({
        ...result,
        [key]:
          typeof visibility[key] === "boolean"
            ? visibility[key]
            : initialFamilyData.adminSettings.moduleVisibility[key],
      }),
      {} as AdminSettings["moduleVisibility"],
    ),
    customization: normalizeCustomization(item.customization),
    enableKioskMode:
      typeof item.enableKioskMode === "boolean"
        ? item.enableKioskMode
        : initialFamilyData.adminSettings.enableKioskMode ?? false,
    kioskDefaultView: pick(
      item.kioskDefaultView,
      kioskDefaultViewOptions,
      initialFamilyData.adminSettings.kioskDefaultView ?? "dashboard",
    ),
    kitchenWallDisplayDevice: pick(
      item.kitchenWallDisplayDevice,
      kitchenWallDisplayDeviceOptions,
      initialFamilyData.adminSettings.kitchenWallDisplayDevice ?? "ipad",
    ),
    showClock:
      typeof item.showClock === "boolean"
        ? item.showClock
        : initialFamilyData.adminSettings.showClock ?? true,
    showQuickActions:
      typeof item.showQuickActions === "boolean"
        ? item.showQuickActions
        : initialFamilyData.adminSettings.showQuickActions ?? true,
    largeTextMode:
      typeof item.largeTextMode === "boolean"
        ? item.largeTextMode
        : initialFamilyData.adminSettings.largeTextMode ?? false,
    setupChecklistDismissed:
      typeof item.setupChecklistDismissed === "boolean"
        ? item.setupChecklistDismissed
        : initialFamilyData.adminSettings.setupChecklistDismissed ?? false,
    enablePresencePanel:
      typeof item.enablePresencePanel === "boolean"
        ? item.enablePresencePanel
        : initialFamilyData.adminSettings.enablePresencePanel ?? true,
    showPresenceOnDashboard:
      typeof item.showPresenceOnDashboard === "boolean"
        ? item.showPresenceOnDashboard
        : initialFamilyData.adminSettings.showPresenceOnDashboard ?? true,
    showPresenceOnKiosk:
      typeof item.showPresenceOnKiosk === "boolean"
        ? item.showPresenceOnKiosk
        : initialFamilyData.adminSettings.showPresenceOnKiosk ?? true,
    homeAssistantBridge: {
      url: readString(
        isRecord(item.homeAssistantBridge) ? item.homeAssistantBridge.url : "",
        "",
      ),
      memberEntityMap:
        isRecord(item.homeAssistantBridge) &&
        isRecord(item.homeAssistantBridge.memberEntityMap)
          ? (item.homeAssistantBridge.memberEntityMap as Record<string, string>)
          : {},
    },
    cloudHouseholdId: readString(item.cloudHouseholdId, ""),
    cloudHouseholdName: readString(item.cloudHouseholdName, ""),
    cloudHouseholdRole: readString(item.cloudHouseholdRole, ""),
    lastCloudUploadAt: readString(item.lastCloudUploadAt, ""),
    lastCloudPreviewAt: readString(item.lastCloudPreviewAt, ""),
    activePreferencesMemberId: readOptionalString(item.activePreferencesMemberId),
    userPreferencesByMemberId: normalizeUserPreferencesByMemberId(
      item.userPreferencesByMemberId,
    ),
    siteNotificationDefaults: {
      ...initialFamilyData.adminSettings.siteNotificationDefaults,
      ...normalizeMemberNotificationPreferences(item.siteNotificationDefaults),
    },
    activeMemberId: readOptionalString(item.activeMemberId),
  };
}

function normalizeInstacartSettings(value: unknown): AdminSettings["instacart"] {
  const item = isRecord(value) ? value : {};

  return {
    enableInstacartExport:
      typeof item.enableInstacartExport === "boolean"
        ? item.enableInstacartExport
        : initialFamilyData.adminSettings.instacart.enableInstacartExport,
    preferredStoreName: readOptionalString(item.preferredStoreName),
    preferredZipCode: readOptionalString(item.preferredZipCode),
    notes: readOptionalString(item.notes),
  };
}

function normalizeTaskAssignment(task: Task, familyMembers: FamilyMember[]): Task {
  const assignedMember = familyMembers.find(
    (member) => member.id === task.assignedMemberId && member.status === "active",
  );

  if (assignedMember) {
    return {
      ...task,
      owner: assignedMember.name,
    };
  }

  const ownerMatch = familyMembers.find(
    (member) =>
      member.status === "active" &&
      member.name.trim().toLowerCase() === task.owner.trim().toLowerCase(),
  );

  if (ownerMatch) {
    return {
      ...task,
      assignedMemberId: ownerMatch.id,
      owner: ownerMatch.name,
    };
  }

  return {
    ...task,
    assignedMemberId: task.assignedMemberId,
    owner: task.owner || "Family",
  };
}

function normalizePlannerAssignment(
  event: PlannerEvent,
  familyMembers: FamilyMember[],
): PlannerEvent {
  const assignedMember = familyMembers.find(
    (member) =>
      member.id === event.assignedMemberId && member.status === "active",
  );

  if (assignedMember) {
    return {
      ...event,
      assignedPerson: assignedMember.name,
    };
  }

  const legacyMatch = familyMembers.find(
    (member) =>
      member.status === "active" &&
      member.name.trim().toLowerCase() ===
        event.assignedPerson.trim().toLowerCase(),
  );

  if (legacyMatch) {
    return {
      ...event,
      assignedMemberId: legacyMatch.id,
      assignedPerson: legacyMatch.name,
    };
  }

  return {
    ...event,
    assignedMemberId: event.assignedMemberId,
    assignedPerson: event.assignedPerson || "Family",
  };
}

function normalizeProjectLead(
  project: Project,
  familyMembers: FamilyMember[],
): Project {
  const assignedLead = familyMembers.find(
    (member) =>
      member.id === project.leadMemberId && member.status === "active",
  );

  if (assignedLead) {
    return {
      ...project,
      lead: assignedLead.name,
    };
  }

  const legacyLead = familyMembers.find(
    (member) =>
      member.status === "active" &&
      member.name.trim().toLowerCase() === project.lead.trim().toLowerCase(),
  );

  if (legacyLead) {
    return {
      ...project,
      leadMemberId: legacyLead.id,
      lead: legacyLead.name,
    };
  }

  return project;
}

function normalizeGroceryItem(value: unknown, admin: AdminSettings): GroceryItem {
  const item = isRecord(value) ? value : {};
  const areas = getInventoryStorageAreas(admin);
  const defaultLocation = pickOrPreserve(
    item.defaultLocation,
    areas,
    "Pantry",
  ) as GroceryItem["defaultLocation"];
  const sources: DataSource[] = ["manual", "seed", "import", "lookup"];

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "New grocery item"),
    category: readString(item.category, "pantry"),
    storeSection: pickOrPreserve(
      item.storeSection,
      getGroceryStoreSections(admin),
      "aisles",
    ) as GroceryItem["storeSection"],
    preferredStore: readOptionalString(item.preferredStore),
    amountDefault: readOptionalString(item.amountDefault),
    defaultLocation,
    defaultWall:
      defaultLocation === "Pantry"
        ? (pickOrPreserve(
            item.defaultWall,
            getPantryWallOptions(admin),
            "Wall 1",
          ) as PantryWall | undefined)
        : undefined,
    defaultShelf:
      defaultLocation === "Pantry"
        ? (pickOrPreserve(
            item.defaultShelf,
            getPantryShelfOptions(admin),
            "Shelf 1",
          ) as PantryShelf | undefined)
        : undefined,
    barcode: readOptionalString(item.barcode),
    brand: readOptionalString(item.brand),
    productImageUrl: readOptionalString(item.productImageUrl),
    notes: readOptionalString(item.notes),
    source: pick(item.source, sources, "manual"),
    sourceSystem: readOptionalString(item.sourceSystem),
    lookupMetadata: normalizeLookupMetadata(item.lookupMetadata),
  };
}

function normalizeFamilyMember(value: unknown, admin: AdminSettings): FamilyMember {
  const item = isRecord(value) ? value : {};
  const nicknameFirst = readOptionalString(item.nickname)?.trim();
  const nameDefault =
    nicknameFirst && nicknameFirst.length > 0
      ? nicknameFirst
      : "New family member";
  const rawName = typeof item.name === "string" ? item.name.trim() : "";
  const name = rawName.length > 0 ? rawName : nameDefault;
  const presence = isRecord(item.presence) ? item.presence : null;

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    name,
    nickname: readOptionalString(item.nickname),
    role: readOptionalString(item.role),
    roleLabel: readString(item.roleLabel, ""),
    status: pickOrPreserve(item.status, getMemberStatuses(admin), "active") as FamilyMember["status"],
    presence: presence
      ? {
          status:
            presence.status === "home" ||
            presence.status === "away" ||
            presence.status === "school" ||
            presence.status === "work" ||
            presence.status === "sleeping" ||
            presence.status === "busy" ||
            presence.status === "custom"
              ? presence.status
              : "unknown",
          customLabel: readOptionalString(presence.customLabel),
          source:
            presence.source === "manual" ||
            presence.source === "home_assistant" ||
            presence.source === "life360" ||
            presence.source === "device"
              ? presence.source
              : "unknown",
          lastUpdated: readOptionalString(presence.lastUpdated),
          note: readOptionalString(presence.note),
        }
      : undefined,
    colorTheme: pick(item.colorTheme, memberColorThemes, "blue"),
    animalIcon: readOptionalString(item.animalIcon),
    pinCode: (() => {
      const raw = readOptionalString(item.pinCode)?.trim();
      return raw && /^\d{4}$/.test(raw) ? raw : undefined;
    })(),
    pinUpdatedAt: (() => {
      const raw = readOptionalString(item.pinCode)?.trim();
      const valid = Boolean(raw && /^\d{4}$/.test(raw));
      return valid ? readOptionalString(item.pinUpdatedAt) : undefined;
    })(),
    ageGroup: readOptionalString(item.ageGroup),
    schoolWorkLabel: readOptionalString(item.schoolWorkLabel),
    allergies: readOptionalString(item.allergies),
    emergencyContact: readOptionalString(item.emergencyContact),
    notes: readString(item.notes, ""),
    updatedAt: readOptionalString(item.updatedAt),
  };
}

function normalizeFamilyMembers(value: unknown, admin: AdminSettings) {
  if (!Array.isArray(value) || value.length === 0) {
    return createCanonicalHouseholdFamilyMembers();
  }

  return value.map((member) => normalizeFamilyMember(member, admin));
}

function normalizeArray<T>(
  value: unknown,
  fallback: T[],
  normalizeItem: (value: unknown) => T,
) {
  return Array.isArray(value) ? value.map(normalizeItem) : fallback;
}

function normalizeTask(value: unknown, admin: AdminSettings): Task {
  const item = isRecord(value) ? value : {};
  const dueDate = readString(item.dueDate, new Date().toISOString().slice(0, 10));
  const legacyType = readString(item.type, "task");
  const sources: TaskSource[] = ["manual", "seed", "import"];
  const type =
    legacyType.toLowerCase() === "chore"
      ? "chore"
      : pick(item.type, taskTypes, "task");

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title, "New household task"),
    description: readOptionalString(item.description),
    owner: readString(item.owner, "Family"),
    status: pickOrPreserve(item.status, getTaskStatuses(admin), "Not Started") as Task["status"],
    priority: pickOrPreserve(item.priority, getTaskPriorities(admin), "Medium") as Task["priority"],
    dueDate,
    dueTime: readOptionalString(item.dueTime),
    type,
    frequency:
      type === "chore"
        ? (pickOrPreserve(
            item.frequency,
            getTaskFrequencies(admin),
            "weekly",
          ) as Task["frequency"])
        : "one-time",
    lastCompletedDate: readString(item.lastCompletedDate, ""),
    nextDueDate: readString(item.nextDueDate, dueDate),
    assignedMemberId: readString(item.assignedMemberId, ""),
    zone: readOptionalString(item.zone),
    room: readOptionalString(item.room),
    category: readOptionalString(item.category),
    notes: readOptionalString(item.notes),
    lastCompletedByMemberId: readOptionalString(item.lastCompletedByMemberId),
    lastCompletedAt: readOptionalString(item.lastCompletedAt),
    checklist: normalizeTaskChecklist(item.checklist),
    rewardPoints: readOptionalNumber(item.rewardPoints),
    requiresVerification:
      typeof item.requiresVerification === "boolean"
        ? item.requiresVerification
        : false,
    requiresProof: typeof item.requiresProof === "boolean" ? item.requiresProof : false,
    referenceMedia: normalizeReferenceMedia(item.referenceMedia),
    completionProof: normalizeCompletionProof(item.completionProof),
    isBrainDump: typeof item.isBrainDump === "boolean" ? item.isBrainDump : false,
    brainDumpType: pickOptional(item.brainDumpType, [
      "task",
      "chore",
      "project",
      "planner",
      "doc",
      "grocery",
    ]),
    source: pickOptional(item.source, sources),
    sourceSystem: readOptionalString(item.sourceSystem),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  };
}

function normalizeTaskChecklist(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = isRecord(entry) ? entry : {};

    return {
      id: readString(item.id, crypto.randomUUID()),
      text: readString(item.text, "Checklist item"),
      completed: typeof item.completed === "boolean" ? item.completed : false,
      completedAt: readOptionalString(item.completedAt),
    };
  });
}

function normalizeReferenceMedia(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const item = isRecord(entry) ? entry : {};

    return {
      id: readString(item.id, crypto.randomUUID()),
      type: pick(item.type, ["image", "video"], "image"),
      url: readString(item.url, ""),
      caption: readString(item.caption, ""),
      displayOrder: readNumber(item.displayOrder, index),
      createdAt: readString(item.createdAt, new Date().toISOString()),
    };
  });
}

function normalizeCompletionProof(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = isRecord(entry) ? entry : {};

    return {
      id: readString(item.id, crypto.randomUUID()),
      type: pick(item.type, ["image", "video"], "image"),
      url: readString(item.url, ""),
      note: readString(item.note, ""),
      uploadedBy: readString(item.uploadedBy, ""),
      uploadedAt: readString(item.uploadedAt, new Date().toISOString()),
    };
  });
}

function normalizeProject(value: unknown, admin: AdminSettings): Project {
  const item = isRecord(value) ? value : {};
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title ?? item.name, "New family project"),
    description: readString(item.description, ""),
    name: readString(item.name ?? item.title, "New family project"),
    lead: readString(item.lead, "Family"),
    leadMemberId: readString(item.leadMemberId, ""),
    status: normalizeProjectStatus(item.status, admin),
    priority: normalizeProjectPriority(item.priority, admin),
    startDate: readString(item.startDate, today),
    targetDate: readString(item.targetDate, ""),
    completedDate: readString(item.completedDate, ""),
    milestones: normalizeArray(item.milestones, [], normalizeProjectMilestone),
    milestoneIds: Array.isArray(item.milestoneIds)
      ? item.milestoneIds.filter(
          (milestoneId): milestoneId is string => typeof milestoneId === "string",
        )
      : undefined,
    tags: normalizeStringArray(item.tags),
    notes: readString(item.notes, ""),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
    nextStep: readString(item.nextStep, "Define the next useful step"),
  };
}

function normalizeProjectMilestone(value: unknown): ProjectMilestone {
  const item = isRecord(value) ? value : {};

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title, "New milestone"),
    status: normalizeProjectMilestoneStatus(item.status),
    dueDate: readString(item.dueDate, ""),
    notes: readString(item.notes, ""),
  };
}

function normalizeProjectStatus(value: unknown, admin: AdminSettings): ProjectStatus {
  const normalized = readString(value, "planned").trim().toLowerCase();
  if (normalized === "planning") return "planned";
  if (normalized === "complete") return "done";
  const opts = getProjectStatuses(admin).map((status) => status.toLowerCase());
  if (opts.includes(normalized)) {
    const match = getProjectStatuses(admin).find(
      (status) => status.toLowerCase() === normalized,
    );
    return (match ?? "planned") as ProjectStatus;
  }
  return normalized as ProjectStatus;
}

function normalizeProjectPriority(value: unknown, admin: AdminSettings): ProjectPriority {
  const normalized = readString(value, "medium").trim().toLowerCase();
  const opts = getProjectPriorities(admin).map((priority) => priority.toLowerCase());
  if (opts.includes(normalized)) {
    const match = getProjectPriorities(admin).find(
      (priority) => priority.toLowerCase() === normalized,
    );
    return (match ?? "medium") as ProjectPriority;
  }
  return normalized as ProjectPriority;
}

function normalizeProjectMilestoneStatus(value: unknown): ProjectMilestoneStatus {
  const normalized = readString(value, "not-started").trim().toLowerCase();
  if (normalized === "not started") return "not-started";
  return normalized === "not-started" ||
    normalized === "active" ||
    normalized === "done"
    ? normalized
    : "not-started";
}

const PANTRY_ITEM_TYPES: PantryItemType[] = ["food", "household", "medical", "pet", "other"];
const STORAGE_CLASSES: StorageClass[] = [
  "everyday",
  "three_month_supply",
  "long_term_storage",
  "emergency",
  "household_supply",
];
const FOOD_STORAGE_CATEGORIES: FoodStorageCategory[] = [
  "grains",
  "beans_legumes",
  "pasta",
  "oats",
  "potatoes",
  "canned_vegetables",
  "canned_fruit",
  "canned_meat",
  "dairy_powder",
  "baking",
  "oils_fats",
  "water",
  "comfort_food",
  "household_supply",
  "other",
];
const ROTATION_STATUSES: RotationStatus[] = [
  "fresh",
  "use_first",
  "rotate_soon",
  "past_best_quality",
  "inspect_before_use",
  "discard_if_damaged",
];
const CAN_CONDITIONS: CanCondition[] = [
  "good",
  "dented",
  "rusted",
  "swollen",
  "leaking",
  "unknown",
];

function normalizePantryItemType(value: unknown): PantryItemType | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return PANTRY_ITEM_TYPES.includes(s as PantryItemType) ? (s as PantryItemType) : undefined;
}

const PANTRY_STORAGE_TYPES: PantryStorageType[] = [
  "short_term",
  "long_term",
  "emergency",
  "household_supply",
  "other",
];

function normalizePantryStorageType(value: unknown): PantryStorageType | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return PANTRY_STORAGE_TYPES.includes(s as PantryStorageType) ? (s as PantryStorageType) : undefined;
}

const ITEM_USE_TYPES: ItemUseType[] = ["single_use", "partial_use", "multi_pack", "unknown"];

function normalizeItemUseType(value: unknown): ItemUseType | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return ITEM_USE_TYPES.includes(s as ItemUseType) ? (s as ItemUseType) : undefined;
}

const SHELF_LIFE_SOURCES: ShelfLifeSource[] = ["default_guidance", "manual", "unknown"];

function normalizeShelfLifeSource(value: unknown): ShelfLifeSource | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return SHELF_LIFE_SOURCES.includes(s as ShelfLifeSource) ? (s as ShelfLifeSource) : undefined;
}

function normalizeStorageClassValue(value: unknown): StorageClass | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return STORAGE_CLASSES.includes(s as StorageClass) ? (s as StorageClass) : undefined;
}

function normalizeFoodStorageCategoryValue(value: unknown): FoodStorageCategory | undefined {
  const s = readOptionalString(value)
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!s) {
    return undefined;
  }
  return FOOD_STORAGE_CATEGORIES.includes(s as FoodStorageCategory)
    ? (s as FoodStorageCategory)
    : undefined;
}

function normalizeRotationStatusValue(value: unknown): RotationStatus | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return ROTATION_STATUSES.includes(s as RotationStatus) ? (s as RotationStatus) : undefined;
}

function normalizeCanConditionValue(value: unknown): CanCondition | undefined {
  const s = readOptionalString(value)?.toLowerCase();
  if (!s) {
    return undefined;
  }
  return CAN_CONDITIONS.includes(s as CanCondition) ? (s as CanCondition) : undefined;
}

function normalizePantryItem(value: unknown, admin: AdminSettings): PantryItem {
  const item = isRecord(value) ? value : {};
  const areas = getInventoryStorageAreas(admin);
  const legacyLocation = readOptionalString(item.location);
  const storageArea = pickOrPreserve(
    item.storageArea ?? item.location,
    areas,
    "Pantry",
  ) as PantryItem["storageArea"];
  const legacyLocationDetail =
    legacyLocation && !areas.includes(legacyLocation) ? legacyLocation : undefined;
  const pantryWall =
    storageArea === "Pantry"
      ? (pickOrPreserve(
          item.pantryWall ?? item.wall,
          getPantryWallOptions(admin),
          "Wall 1",
        ) as PantryWall | undefined)
      : undefined;
  const pantryShelf =
    storageArea === "Pantry"
      ? (pickOrPreserve(
          item.pantryShelf ?? item.shelf,
          getPantryShelfOptions(admin),
          "Shelf 1",
        ) as PantryShelf | undefined)
      : undefined;
  const sources: DataSource[] = ["manual", "seed", "import", "lookup"];
  const now = new Date().toISOString();
  const expiryLegacy = readOptionalString(item.expiryDate);
  const bestByExplicit = readOptionalString(item.bestByDate);
  const effectiveBestBy = bestByExplicit ?? expiryLegacy;

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "New pantry item"),
    productName: readOptionalString(item.productName),
    quantity: readString(item.quantity, "1"),
    unit: readOptionalString(item.unit),
    category: readString(item.category, "Grocery"),
    storageArea,
    location: storageArea,
    locationDetail: readOptionalString(item.locationDetail) ?? legacyLocationDetail,
    customLocationName:
      readOptionalString(item.customLocationName) ??
      (storageArea === "Custom Location" ? legacyLocationDetail : undefined),
    kitchenLocationDetail:
      readOptionalString(item.kitchenLocationDetail) ??
      (storageArea === "Kitchen Cabinets" ? legacyLocationDetail : undefined),
    pantryLocationNote: readOptionalString(item.pantryLocationNote),
    coldLocationDetail:
      readOptionalString(item.coldLocationDetail) ??
      (storageArea !== "Pantry" &&
      storageArea !== "Kitchen Cabinets" &&
      storageArea !== "Custom Location"
        ? legacyLocationDetail
        : undefined),
    pantryWall,
    pantryShelf,
    wall: pantryWall,
    shelf: pantryShelf,
    status: pick(item.status, stockStatuses, "Stocked"),
    groceryItemId: readString(item.groceryItemId, ""),
    barcode: readOptionalString(item.barcode),
    brand: readOptionalString(item.brand),
    productImageUrl: readOptionalString(item.productImageUrl),
    lookupMetadata: normalizeLookupMetadata(item.lookupMetadata),
    expiryDate: effectiveBestBy || expiryLegacy,
    bestByDate: effectiveBestBy || undefined,
    itemType: normalizePantryItemType(item.itemType),
    storageClass: normalizeStorageClassValue(item.storageClass),
    foodStorageCategory: normalizeFoodStorageCategoryValue(item.foodStorageCategory),
    packageType: readOptionalString(item.packageType),
    purchaseDate: readOptionalString(item.purchaseDate),
    openedDate: readOptionalString(item.openedDate),
    estimatedShelfLifeMonths: readOptionalNumber(item.estimatedShelfLifeMonths),
    recommendedShelfLifeMonths:
      readOptionalNumber(item.recommendedShelfLifeMonths) ??
      readOptionalNumber(item.estimatedShelfLifeMonths),
    shelfLifeSource: normalizeShelfLifeSource(item.shelfLifeSource),
    storageType: normalizePantryStorageType(item.storageType),
    itemUseType: normalizeItemUseType(item.itemUseType),
    longTermShelfLifeYears: readOptionalNumber(item.longTermShelfLifeYears),
    rotationDueDate: readOptionalString(item.rotationDueDate),
    rotationStatus: normalizeRotationStatusValue(item.rotationStatus),
    canCondition: normalizeCanConditionValue(item.canCondition),
    notes: readOptionalString(item.notes),
    isStaple: typeof item.isStaple === "boolean" ? item.isStaple : false,
    minQuantity: readOptionalString(item.minQuantity),
    maxQuantity: readOptionalString(item.maxQuantity),
    overstockThreshold: readOptionalString(item.overstockThreshold),
    useSoonMarked: typeof item.useSoonMarked === "boolean" ? item.useSoonMarked : undefined,
    lastConsumptionMemberId: readOptionalString(item.lastConsumptionMemberId),
    lastConsumptionRecipeNote: readOptionalString(item.lastConsumptionRecipeNote),
    lastConsumptionNote: readOptionalString(item.lastConsumptionNote),
    inactiveInInventory: typeof item.inactiveInInventory === "boolean" ? item.inactiveInInventory : undefined,
    tags: normalizeStringArray(item.tags),
    source: pickOptional(item.source, sources),
    sourceSystem: readOptionalString(item.sourceSystem),
    lastUpdated: readString(item.lastUpdated, now),
    createdAt: readString(item.createdAt, now),
    itemPhotoUrl: readOptionalString(item.itemPhotoUrl),
    itemPhotoCaption: readOptionalString(item.itemPhotoCaption),
    /** Persisted explicitly so uploads / URLs survive normalize (spread alone can drift on refactors). */
    productImageDataUrl:
      typeof item.productImageDataUrl === "string" ? item.productImageDataUrl : undefined,
    productDescription: readOptionalString(item.productDescription),
    productLookupSource: readOptionalString(item.productLookupSource),
    productLookupUpdatedAt: readOptionalString(item.productLookupUpdatedAt),
  };
}

function normalizeShoppingItem(value: unknown, admin: AdminSettings): ShoppingItem {
  const item = isRecord(value) ? value : {};
  const areas = getInventoryStorageAreas(admin);
  const destination = pickOrPreserve(
    item.destination,
    areas,
    "Pantry",
  ) as ShoppingItem["destination"];
  const now = new Date().toISOString();

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name, "New shopping item"),
    quantity: readOptionalString(item.quantity),
    unit: readOptionalString(item.unit),
    category: readString(item.category, "Grocery"),
    storeSection: pickOrPreserve(
      item.storeSection,
      getGroceryStoreSections(admin),
      "aisles",
    ) as ShoppingItem["storeSection"],
    preferredStore: readOptionalString(item.preferredStore),
    neededBy: readString(item.neededBy, new Date().toISOString().slice(0, 10)),
    purchased: typeof item.purchased === "boolean" ? item.purchased : false,
    needsPutAway:
      typeof item.needsPutAway === "boolean"
        ? item.needsPutAway
        : typeof item.purchased === "boolean"
          ? item.purchased
          : false,
    destination,
    destinationDetail: readOptionalString(item.destinationDetail),
    customDestinationName: readOptionalString(item.customDestinationName),
    pantryNote: readOptionalString(item.pantryNote),
    wall:
      destination === "Pantry"
        ? (pickOrPreserve(item.wall, getPantryWallOptions(admin), "Wall 1") as PantryWall | undefined)
        : undefined,
    shelf:
      destination === "Pantry"
        ? (pickOrPreserve(item.shelf, getPantryShelfOptions(admin), "Shelf 1") as PantryShelf | undefined)
        : undefined,
    groceryItemId: readString(item.groceryItemId, ""),
    barcode: readOptionalString(item.barcode),
    brand: readOptionalString(item.brand),
    productImageUrl: readOptionalString(item.productImageUrl),
    notes: readOptionalString(item.notes),
    source: pickOptional(item.source, ["manual", "seed", "import", "lookup"]),
    sourceSystem: readOptionalString(item.sourceSystem),
    lookupMetadata: normalizeLookupMetadata(item.lookupMetadata),
    requestedByMemberId: readOptionalString(item.requestedByMemberId),
    assignedToMemberId: readOptionalString(item.assignedToMemberId),
    sourcePantryItemId: readOptionalString(item.sourcePantryItemId),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizePlannerEvent(value: unknown, admin: AdminSettings): PlannerEvent {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  const assignedMemberId = readString(item.assignedMemberId, "");
  const assignedMemberIds = normalizeStringArray(item.assignedMemberIds);
  const startTime = readOptionalString(item.startTime) ?? readString(item.time, "16:00");
  const stickyColor = pickOptional(item.stickyColor, ["dark", "blue", "yellow", "green"]);

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title, "New planner item"),
    date: readString(item.date, new Date().toISOString().slice(0, 10)),
    time: startTime,
    category: pickOrPreserve(
      item.category,
      getCalendarCategories(admin),
      "Family",
    ) as PlannerEvent["category"],
    assignedMemberId,
    assignedPerson: readString(item.assignedPerson, "Family"),
    assignedMemberIds:
      assignedMemberIds.length > 0
        ? assignedMemberIds
        : assignedMemberId
          ? [assignedMemberId]
          : [],
    responsibleAdultId: readOptionalString(item.responsibleAdultId),
    startTime,
    endTime: readOptionalString(item.endTime),
    endDate: readOptionalString(item.endDate),
    isAllDay: typeof item.isAllDay === "boolean" ? item.isAllDay : false,
    repeatEnabled:
      typeof item.repeatEnabled === "boolean" ? item.repeatEnabled : false,
    repeatRule: pickOptional(item.repeatRule, [
      "Daily",
      "Weekly",
      "Monthly",
      "Yearly",
      "Custom later",
    ]),
    location: readOptionalString(item.location),
    notes: readOptionalString(item.notes),
    tags: normalizeStringArray(item.tags),
    isTentative: typeof item.isTentative === "boolean" ? item.isTentative : false,
    noSchoolReason: readOptionalString(item.noSchoolReason),
    stickyColor,
    prepChecklist: normalizePlannerChecklist(item.prepChecklist),
    reminderSettings: normalizePlannerReminders(item.reminderSettings),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
  };
}

function normalizePlannerChecklist(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = isRecord(entry) ? entry : {};

    return {
      id: readString(item.id, crypto.randomUUID()),
      text: readString(item.text, "Prep item"),
      completed: typeof item.completed === "boolean" ? item.completed : false,
    };
  });
}

function normalizePlannerReminders(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const item = isRecord(entry) ? entry : {};

    return {
      id: readString(item.id, crypto.randomUUID()),
      label: readString(item.label, "None"),
      offsetMinutes: readNumber(item.offsetMinutes, 0),
    };
  });
}

function normalizeCalendarLink(value: unknown): CalendarLink {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    name: readString(item.name ?? item.displayName, "Family calendar"),
    calendarUrl: readString(item.calendarUrl ?? item.publicUrl ?? item.url, ""),
    embedUrl: readOptionalString(item.embedUrl),
    notes: readString(item.notes, ""),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
    displayName: readString(item.displayName ?? item.name, "Family calendar"),
    publicUrl: readString(item.publicUrl ?? item.calendarUrl ?? item.url, ""),
  };
}

function normalizeCalendarLinks(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return initialFamilyData.calendarLinks.map(normalizeCalendarLink);
  }

  return value.map(normalizeCalendarLink);
}

function normalizeDocItem(
  value: unknown,
  familyMembers: FamilyMember[],
  admin: AdminSettings,
): DocItem {
  const item = isRecord(value) ? value : {};
  const now = new Date().toISOString();
  const memberIds = new Set(familyMembers.map((member) => member.id));
  const content = readString(item.content ?? item.body, "Add the key details here.");
  const sources: DataSource[] = ["manual", "seed", "import"];

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    title: readString(item.title, "New family note"),
    content,
    category: normalizeDocCategory(item.category, admin),
    tags: normalizeStringArray(item.tags),
    pinned: typeof item.pinned === "boolean" ? item.pinned : false,
    relatedMemberIds: normalizeStringArray(item.relatedMemberIds).filter((id) =>
      memberIds.has(id),
    ),
    relatedProjectId: readString(item.relatedProjectId, ""),
    visibility: normalizeDocVisibility(item.visibility, admin),
    createdAt: readString(item.createdAt, now),
    updatedAt: readString(item.updatedAt, now),
    source: pick(item.source, sources, "manual"),
    sourceSystem: readOptionalString(item.sourceSystem),
    body: readString(item.body ?? item.content, content),
  };
}

function normalizeLookupMetadata(value: unknown) {
  const item = isRecord(value) ? value : undefined;

  if (!item) {
    return undefined;
  }

  return {
    provider: "openfoodfacts" as const,
    lookedUpAt: readString(item.lookedUpAt, new Date().toISOString()),
    status:
      item.status === "not_found"
        ? "not-found"
        : pick(item.status, ["found", "not-found", "error"], "found"),
    rawCode: readOptionalString(item.rawCode),
  };
}

function normalizeDocCategory(value: unknown, admin: AdminSettings): DocCategory {
  const normalized = readString(value, "other").trim().toLowerCase();
  const legacyMap: Record<string, DocCategory> = {
    "family process": "routine",
    "school note": "school",
    "medical note": "medical",
    "house routine": "routine",
    reference: "other",
  };

  if (legacyMap[normalized]) {
    return legacyMap[normalized];
  }

  const allowed = getDocCategories(admin).map((category) => category.toLowerCase());
  if (allowed.includes(normalized)) {
    const match = getDocCategories(admin).find(
      (category) => category.toLowerCase() === normalized,
    );
    return (match ?? "other") as DocCategory;
  }

  return normalized as DocCategory;
}

function normalizeDocVisibility(value: unknown, admin: AdminSettings): DocVisibility {
  const raw = readString(value, "household").trim();
  if (!raw) {
    return "household";
  }
  const opts = getDocVisibilityOptions(admin);
  if (opts.includes(raw)) {
    return raw as DocVisibility;
  }
  return raw as DocVisibility;
}

function normalizeActivityLogItem(value: unknown): ActivityLogItem {
  const item = isRecord(value) ? value : {};
  const activityTypes: ActivityType[] = [
    "created",
    "updated",
    "completed",
    "deleted",
    "imported",
    "reset",
    "exported",
    "assigned",
    "put-away",
  ];
  const entityTypes: ActivityEntityType[] = [
    "task",
    "chore",
    "planner",
    "project",
    "doc",
    "pantryItem",
    "shoppingItem",
    "familyMember",
    "settings",
    "data",
    "cleaningRoom",
  ];

  return {
    ...item,
    id: readString(item.id, crypto.randomUUID()),
    type: pick(item.type, activityTypes, "updated"),
    entityType: pick(item.entityType, entityTypes, "data"),
    entityId: readString(item.entityId, ""),
    entityTitle: readString(item.entityTitle, "Household item"),
    memberId: readOptionalString(item.memberId),
    message: readString(item.message, "Household data changed."),
    createdAt: readIsoString(item.createdAt, new Date().toISOString()),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readIsoString(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : fallback;
}

function getSafeTimestamp(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function pickOrPreserve(
  value: unknown,
  options: readonly string[],
  fallback: string,
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (options.includes(trimmed)) return trimmed;
  return trimmed;
}

function pick<T extends string>(value: unknown, options: readonly T[], fallback: T) {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

function pickOptional<T extends string>(value: unknown, options: readonly T[]) {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : undefined;
}

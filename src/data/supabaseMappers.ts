import type {
  AdminSettings,
  CalendarLink,
  FamilyData,
  FamilyMember,
  GroceryItem,
  PantryItem,
  PantryShelf,
  PantryWall,
  PlannerEvent,
  ShoppingItem,
  Task,
  TaskChecklistItem,
  TaskCompletionProof,
  TaskReferenceMedia,
} from "./familyData";
import { createDefaultFamilyData } from "./familyData";
import { normalizeFamilyData } from "./familyMigrations";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? (value as string[])
    : undefined;
}

function asJsonArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

export type SupabaseFamilyMemberRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  name: string;
  status: string;
  color_theme: string;
  notes: string | null;
  role_label: string | null;
  age_group: string | null;
  metadata: Json | null;
};

export type SupabaseTaskRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  title: string;
  description: string | null;
  owner_label: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  due_time: string | null;
  type: string;
  frequency: string;
  last_completed_date: string | null;
  next_due_date: string | null;
  assigned_member_id: string | null;
  zone: string | null;
  room: string | null;
  category: string | null;
  notes: string | null;
  reward_points: number | null;
  requires_verification: boolean | null;
  requires_proof: boolean | null;
  is_brain_dump: boolean | null;
  brain_dump_type: string | null;
  source: string | null;
  source_system: string | null;
  metadata: Json | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseTaskChecklistRow = {
  id: string;
  task_id: string;
  local_id: string | null;
  line_text: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number | null;
};

export type SupabaseTaskReferenceMediaRow = {
  id: string;
  task_id: string;
  local_id: string | null;
  media_type: "image" | "video";
  url: string;
  caption: string | null;
  display_order: number | null;
  created_at: string;
};

export type SupabaseTaskCompletionProofRow = {
  id: string;
  task_id: string;
  local_id: string | null;
  proof_type: "image" | "video";
  url: string;
  note: string | null;
  uploaded_by_label: string;
  uploaded_at: string;
};

export type SupabasePlannerEventRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  title: string;
  date: string;
  time: string | null;
  category: string;
  assigned_member_id: string | null;
  assigned_person: string | null;
  assigned_member_ids: Json | null;
  responsible_adult_id: string | null;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean | null;
  repeat_enabled: boolean | null;
  repeat_rule: string | null;
  location: string | null;
  notes: string | null;
  prep_checklist: Json | null;
  reminder_settings: Json | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseCalendarLinkRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  name: string;
  calendar_url: string;
  display_name: string;
  public_url: string | null;
  embed_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseShoppingItemRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  name: string;
  quantity: string | null;
  unit: string | null;
  category: string | null;
  store_section: string;
  preferred_store: string | null;
  needed_by: string | null;
  purchased: boolean | null;
  needs_put_away: boolean | null;
  destination: string | null;
  destination_detail: string | null;
  custom_destination_name: string | null;
  pantry_note: string | null;
  wall: string | null;
  shelf: string | null;
  grocery_item_id: string | null;
  barcode: string | null;
  brand: string | null;
  product_image_url: string | null;
  notes: string | null;
  source: string | null;
  source_system: string | null;
  lookup_metadata: Json | null;
  requested_by_member_id?: string | null;
  assigned_to_member_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseGroceryItemRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  name: string;
  category: string | null;
  store_section: string;
  preferred_store: string | null;
  amount_default: string | null;
  default_location: string | null;
  default_wall: string | null;
  default_shelf: string | null;
  barcode: string | null;
  brand: string | null;
  product_image_url: string | null;
  notes: string | null;
  source: string | null;
  source_system: string | null;
  lookup_metadata: Json | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseInventoryItemRow = {
  id: string;
  household_id: string;
  local_id: string | null;
  name: string;
  quantity: string;
  unit: string | null;
  category: string | null;
  storage_area: string | null;
  location: string;
  location_detail: string | null;
  custom_location_name: string | null;
  kitchen_location_detail: string | null;
  pantry_location_note: string | null;
  cold_location_detail: string | null;
  pantry_wall: string | null;
  pantry_shelf: string | null;
  wall: string | null;
  shelf: string | null;
  status: string;
  grocery_item_id: string | null;
  barcode: string | null;
  brand: string | null;
  product_image_url: string | null;
  lookup_metadata: Json | null;
  expiry_date: string | null;
  notes: string | null;
  is_staple: boolean | null;
  min_quantity: string | null;
  tags: Json | null;
  source: string | null;
  source_system: string | null;
  last_updated_label: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SupabaseAdminSettingsRow = {
  household_id: string;
  settings: Json;
  updated_at?: string;
};

function stableId(localId: string | null, cloudId: string): string {
  return localId && localId.trim().length > 0 ? localId : cloudId;
}

const pantryWallValues = new Set(["Wall 1", "Wall 2", "Wall 3", "Wall 4"]);
const pantryShelfValues = new Set([
  "Shelf 1",
  "Shelf 2",
  "Shelf 3",
  "Shelf 4",
  "Shelf 5",
]);

function asPantryWall(value: unknown): PantryWall | undefined {
  return typeof value === "string" && pantryWallValues.has(value)
    ? (value as PantryWall)
    : undefined;
}

function asPantryShelf(value: unknown): PantryShelf | undefined {
  return typeof value === "string" && pantryShelfValues.has(value)
    ? (value as PantryShelf)
    : undefined;
}

export function fromSupabaseRowsToFamilyData(args: {
  adminSettingsRow: SupabaseAdminSettingsRow | null;
  familyMembers: SupabaseFamilyMemberRow[];
  tasks: SupabaseTaskRow[];
  taskChecklist: SupabaseTaskChecklistRow[];
  taskReferenceMedia: SupabaseTaskReferenceMediaRow[];
  taskCompletionProof: SupabaseTaskCompletionProofRow[];
  plannerEvents: SupabasePlannerEventRow[];
  calendarLinks: SupabaseCalendarLinkRow[];
  shoppingItems: SupabaseShoppingItemRow[];
  groceryItems: SupabaseGroceryItemRow[];
  inventoryItems: SupabaseInventoryItemRow[];
  // Optional passthrough (not implemented in cloud preview yet)
  keepLocalAdminSettings?: Partial<AdminSettings>;
}): FamilyData {
  const base = createDefaultFamilyData();

  const cloudSettings =
    args.adminSettingsRow && args.adminSettingsRow.settings && typeof args.adminSettingsRow.settings === "object"
      ? (args.adminSettingsRow.settings as Record<string, unknown>)
      : {};

  const adminSettings: AdminSettings = {
    ...base.adminSettings,
    ...cloudSettings,
    ...(args.keepLocalAdminSettings ?? {}),
    // Never let cloud settings force the local device's storage mode.
    dataSourceMode: (args.keepLocalAdminSettings?.dataSourceMode ?? "local") as AdminSettings["dataSourceMode"],
  };

  const memberIdByCloudId = new Map<string, string>();
  const members: FamilyMember[] = args.familyMembers.map((row) => {
    const id = stableId(row.local_id, row.id);
    memberIdByCloudId.set(row.id, id);
    return {
      id,
      name: row.name,
      status: (row.status as FamilyMember["status"]) ?? "active",
      colorTheme: asString(row.color_theme, "slate"),
      notes: asString(row.notes, ""),
      roleLabel: asString(row.role_label, ""),
      ageGroup: asString(row.age_group, ""),
    };
  });

  const checklistByTaskCloudId = new Map<string, TaskChecklistItem[]>();
  for (const item of args.taskChecklist) {
    const next: TaskChecklistItem = {
      id: stableId(item.local_id, item.id),
      text: item.line_text,
      completed: Boolean(item.completed),
      completedAt: item.completed_at ?? undefined,
    };
    const bucket = checklistByTaskCloudId.get(item.task_id) ?? [];
    bucket.push(next);
    checklistByTaskCloudId.set(item.task_id, bucket);
  }

  const referenceByTaskCloudId = new Map<string, TaskReferenceMedia[]>();
  for (const item of args.taskReferenceMedia) {
    const next: TaskReferenceMedia = {
      id: stableId(item.local_id, item.id),
      type: item.media_type,
      url: item.url,
      caption: asString(item.caption, ""),
      displayOrder: item.display_order ?? 0,
      createdAt: item.created_at,
    };
    const bucket = referenceByTaskCloudId.get(item.task_id) ?? [];
    bucket.push(next);
    referenceByTaskCloudId.set(item.task_id, bucket);
  }

  const proofByTaskCloudId = new Map<string, TaskCompletionProof[]>();
  for (const item of args.taskCompletionProof) {
    const next: TaskCompletionProof = {
      id: stableId(item.local_id, item.id),
      type: item.proof_type,
      url: item.url,
      note: asString(item.note, ""),
      uploadedBy: item.uploaded_by_label,
      uploadedAt: item.uploaded_at,
    };
    const bucket = proofByTaskCloudId.get(item.task_id) ?? [];
    bucket.push(next);
    proofByTaskCloudId.set(item.task_id, bucket);
  }

  const tasks: Task[] = args.tasks.map((row) => {
    const assignedMemberId = row.assigned_member_id
      ? memberIdByCloudId.get(row.assigned_member_id) ?? ""
      : "";
    const checklist = checklistByTaskCloudId.get(row.id);
    const referenceMedia = referenceByTaskCloudId.get(row.id);
    const completionProof = proofByTaskCloudId.get(row.id);
    return {
      id: stableId(row.local_id, row.id),
      title: row.title,
      description: row.description ?? undefined,
      owner: asString(row.owner_label, ""),
      status: row.status as Task["status"],
      priority: (row.priority as Task["priority"]) ?? "Medium",
      dueDate: asString(row.due_date, ""),
      dueTime: row.due_time ?? undefined,
      type: (row.type as Task["type"]) ?? "task",
      frequency: (row.frequency as Task["frequency"]) ?? "one-time",
      lastCompletedDate: asString(row.last_completed_date, ""),
      nextDueDate: asString(row.next_due_date, ""),
      assignedMemberId,
      zone: row.zone ?? undefined,
      room: row.room ?? undefined,
      category: row.category ?? undefined,
      notes: row.notes ?? undefined,
      checklist: checklist && checklist.length ? checklist : undefined,
      rewardPoints: asNumber(row.reward_points ?? undefined),
      requiresVerification: asBoolean(row.requires_verification, false),
      requiresProof: asBoolean(row.requires_proof, false),
      referenceMedia: referenceMedia && referenceMedia.length ? referenceMedia : undefined,
      completionProof: completionProof && completionProof.length ? completionProof : undefined,
      isBrainDump: asBoolean(row.is_brain_dump, false),
      brainDumpType: (row.brain_dump_type as Task["brainDumpType"]) ?? undefined,
      source: (row.source as Task["source"]) ?? undefined,
      sourceSystem: row.source_system ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  const planner: PlannerEvent[] = args.plannerEvents.map((row) => {
    const assignedMemberId = row.assigned_member_id
      ? memberIdByCloudId.get(row.assigned_member_id) ?? ""
      : "";
    const responsibleAdultId = row.responsible_adult_id
      ? memberIdByCloudId.get(row.responsible_adult_id) ?? undefined
      : undefined;
    const assignedMemberIds = asStringArray(row.assigned_member_ids)?.map(
      (cloudId) => memberIdByCloudId.get(cloudId) ?? cloudId,
    );
    const prepChecklist = asJsonArray(row.prep_checklist)?.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const obj = item as Record<string, unknown>;
      return [
        {
          id: asString(obj.id, crypto.randomUUID()),
          text: asString(obj.text, ""),
          completed: asBoolean(obj.completed, false),
        },
      ];
    });
    const reminderSettings = asJsonArray(row.reminder_settings)?.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const obj = item as Record<string, unknown>;
      return [
        {
          id: asString(obj.id, crypto.randomUUID()),
          label: asString(obj.label, ""),
          offsetMinutes: Number(obj.offsetMinutes ?? obj.offset_minutes ?? 0),
        },
      ];
    });

    return {
      id: stableId(row.local_id, row.id),
      title: row.title,
      date: row.date,
      time: asString(row.time, ""),
      category: row.category as PlannerEvent["category"],
      assignedMemberId,
      assignedPerson: asString(row.assigned_person, ""),
      assignedMemberIds,
      responsibleAdultId,
      startTime: row.start_time ?? undefined,
      endTime: row.end_time ?? undefined,
      isAllDay: asBoolean(row.is_all_day, false),
      repeatEnabled: asBoolean(row.repeat_enabled, false),
      repeatRule: (row.repeat_rule as PlannerEvent["repeatRule"]) ?? undefined,
      location: row.location ?? undefined,
      notes: row.notes ?? undefined,
      prepChecklist: prepChecklist && prepChecklist.length ? prepChecklist : undefined,
      reminderSettings: reminderSettings && reminderSettings.length ? reminderSettings : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  const calendarLinks: CalendarLink[] = args.calendarLinks.map((row) => ({
    id: stableId(row.local_id, row.id),
    name: row.name,
    calendarUrl: row.calendar_url,
    createdAt: row.created_at,
    displayName: row.display_name,
    publicUrl: asString(row.public_url, ""),
    embedUrl: row.embed_url ?? undefined,
    notes: asString(row.notes, ""),
    updatedAt: row.updated_at,
  }));

  const shopping: ShoppingItem[] = args.shoppingItems.map((row) => ({
    id: stableId(row.local_id, row.id),
    name: row.name,
    quantity: asString(row.quantity, ""),
    unit: row.unit ?? undefined,
    category: asString(row.category, ""),
    storeSection: row.store_section as ShoppingItem["storeSection"],
    preferredStore: row.preferred_store ?? undefined,
    neededBy: asString(row.needed_by, ""),
    purchased: asBoolean(row.purchased, false),
    needsPutAway: asBoolean(row.needs_put_away, false),
    destination: (row.destination as ShoppingItem["destination"]) ?? "Pantry",
    destinationDetail: row.destination_detail ?? undefined,
    customDestinationName: row.custom_destination_name ?? undefined,
    pantryNote: row.pantry_note ?? undefined,
    wall: asPantryWall(row.wall),
    shelf: asPantryShelf(row.shelf),
    groceryItemId: row.grocery_item_id ?? undefined,
    barcode: row.barcode ?? undefined,
    brand: row.brand ?? undefined,
    productImageUrl: row.product_image_url ?? undefined,
    notes: row.notes ?? undefined,
    source: (row.source as ShoppingItem["source"]) ?? undefined,
    sourceSystem: row.source_system ?? undefined,
    lookupMetadata: (row.lookup_metadata as ShoppingItem["lookupMetadata"]) ?? undefined,
    requestedByMemberId: row.requested_by_member_id ?? undefined,
    assignedToMemberId: row.assigned_to_member_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const groceryItems: GroceryItem[] = args.groceryItems.map((row) => ({
    id: stableId(row.local_id, row.id),
    name: row.name,
    category: asString(row.category, ""),
    storeSection: row.store_section as GroceryItem["storeSection"],
    preferredStore: row.preferred_store ?? undefined,
    amountDefault: asString(row.amount_default, ""),
    defaultLocation: (row.default_location as GroceryItem["defaultLocation"]) ?? "Pantry",
    defaultWall: asPantryWall(row.default_wall),
    defaultShelf: asPantryShelf(row.default_shelf),
    barcode: row.barcode ?? undefined,
    brand: row.brand ?? undefined,
    productImageUrl: row.product_image_url ?? undefined,
    notes: row.notes ?? undefined,
    source: (row.source as GroceryItem["source"]) ?? undefined,
    sourceSystem: row.source_system ?? undefined,
    lookupMetadata: (row.lookup_metadata as GroceryItem["lookupMetadata"]) ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const pantry: PantryItem[] = args.inventoryItems.map((row) => ({
    id: stableId(row.local_id, row.id),
    name: row.name,
    quantity: row.quantity,
    unit: row.unit ?? undefined,
    category: asString(row.category, ""),
    storageArea: (row.storage_area as PantryItem["storageArea"]) ?? row.location,
    location: row.location as PantryItem["location"],
    locationDetail: row.location_detail ?? undefined,
    customLocationName: row.custom_location_name ?? undefined,
    kitchenLocationDetail: row.kitchen_location_detail ?? undefined,
    pantryLocationNote: row.pantry_location_note ?? undefined,
    coldLocationDetail: row.cold_location_detail ?? undefined,
    pantryWall: (row.pantry_wall as PantryItem["pantryWall"]) ?? undefined,
    pantryShelf: (row.pantry_shelf as PantryItem["pantryShelf"]) ?? undefined,
    wall: asPantryWall(row.wall),
    shelf: asPantryShelf(row.shelf),
    status: row.status as PantryItem["status"],
    groceryItemId: row.grocery_item_id ?? undefined,
    barcode: row.barcode ?? undefined,
    brand: row.brand ?? undefined,
    productImageUrl: row.product_image_url ?? undefined,
    lookupMetadata: (row.lookup_metadata as PantryItem["lookupMetadata"]) ?? undefined,
    expiryDate: asString(row.expiry_date, ""),
    notes: row.notes ?? undefined,
    isStaple: asBoolean(row.is_staple, false),
    minQuantity: asString(row.min_quantity, ""),
    tags: (asStringArray(row.tags) ?? []) as PantryItem["tags"],
    source: (row.source as PantryItem["source"]) ?? undefined,
    sourceSystem: row.source_system ?? undefined,
    lastUpdated: row.updated_at ?? new Date().toISOString(),
    createdAt: row.created_at ?? new Date().toISOString(),
  }));

  return normalizeFamilyData({
    ...base,
    adminSettings,
    familyMembers: members.length ? members : base.familyMembers,
    tasks,
    planner,
    calendarLinks,
    shopping,
    groceryItems,
    pantry,
  });
}

export function toSupabaseAdminSettingsRow(args: {
  householdId: string;
  adminSettings: AdminSettings;
}): { household_id: string; settings: Json } {
  const { adminSettings } = args;
  const { dataSourceMode: _dataSourceMode, ...rest } = adminSettings;
  return { household_id: args.householdId, settings: rest as unknown as Json };
}

export function toSupabaseFamilyMemberRows(args: {
  householdId: string;
  members: FamilyMember[];
}): Array<{
  household_id: string;
  local_id: string;
  name: string;
  status: string;
  color_theme: string;
  notes: string;
  role_label: string | null;
  age_group: string | null;
  source_metadata?: Json;
}> {
  return args.members.map((m) => ({
    household_id: args.householdId,
    local_id: m.id,
    name: m.name,
    status: m.status,
    color_theme: m.colorTheme ?? "slate",
    notes: m.notes ?? "",
    role_label: m.roleLabel ? m.roleLabel : null,
    age_group: m.ageGroup ? m.ageGroup : null,
  }));
}

export function toSupabaseTaskRows(args: {
  householdId: string;
  tasks: Task[];
  cloudMemberIdByLocalId: Map<string, string>;
}): Array<Record<string, unknown>> {
  return args.tasks.map((t) => ({
    household_id: args.householdId,
    local_id: t.id,
    title: t.title,
    description: t.description ?? null,
    owner_label: t.owner ?? null,
    status: t.status,
    priority: t.priority ?? null,
    due_date: t.dueDate ?? null,
    due_time: t.dueTime ?? null,
    type: t.type ?? "task",
    frequency: t.frequency ?? "one-time",
    last_completed_date: t.lastCompletedDate ?? null,
    next_due_date: t.nextDueDate ?? null,
    assigned_member_id: t.assignedMemberId
      ? args.cloudMemberIdByLocalId.get(t.assignedMemberId) ?? null
      : null,
    zone: t.zone ?? null,
    room: t.room ?? null,
    category: t.category ?? null,
    notes: t.notes ?? null,
    reward_points: t.rewardPoints ?? null,
    requires_verification: t.requiresVerification ?? false,
    requires_proof: t.requiresProof ?? false,
    is_brain_dump: t.isBrainDump ?? false,
    brain_dump_type: t.brainDumpType ?? null,
    source: t.source ?? null,
    source_system: t.sourceSystem ?? null,
    metadata: {},
  }));
}

export function toSupabaseTaskChecklistRows(args: {
  taskCloudIdByLocalId: Map<string, string>;
  checklist: { taskLocalId: string; items: TaskChecklistItem[] }[];
}): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const entry of args.checklist) {
    const taskId = args.taskCloudIdByLocalId.get(entry.taskLocalId);
    if (!taskId) continue;
    entry.items.forEach((item, idx) => {
      rows.push({
        task_id: taskId,
        local_id: item.id,
        line_text: item.text,
        completed: item.completed,
        completed_at: item.completedAt ?? null,
        sort_order: idx,
      });
    });
  }
  return rows;
}

export function toSupabaseTaskReferenceMediaRows(args: {
  taskCloudIdByLocalId: Map<string, string>;
  media: { taskLocalId: string; items: TaskReferenceMedia[] }[];
}): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const entry of args.media) {
    const taskId = args.taskCloudIdByLocalId.get(entry.taskLocalId);
    if (!taskId) continue;
    entry.items.forEach((item) => {
      rows.push({
        task_id: taskId,
        local_id: item.id,
        media_type: item.type,
        url: item.url,
        caption: item.caption ?? "",
        display_order: item.displayOrder ?? 0,
      });
    });
  }
  return rows;
}

export function toSupabaseTaskCompletionProofRows(args: {
  taskCloudIdByLocalId: Map<string, string>;
  proof: { taskLocalId: string; items: TaskCompletionProof[] }[];
}): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = [];
  for (const entry of args.proof) {
    const taskId = args.taskCloudIdByLocalId.get(entry.taskLocalId);
    if (!taskId) continue;
    entry.items.forEach((item) => {
      rows.push({
        task_id: taskId,
        local_id: item.id,
        proof_type: item.type,
        url: item.url,
        note: item.note ?? "",
        uploaded_by_label: item.uploadedBy ?? "",
        uploaded_at: item.uploadedAt ?? new Date().toISOString(),
      });
    });
  }
  return rows;
}

export function toSupabasePlannerEventRows(args: {
  householdId: string;
  planner: PlannerEvent[];
  cloudMemberIdByLocalId: Map<string, string>;
}): Array<Record<string, unknown>> {
  return args.planner.map((e) => ({
    household_id: args.householdId,
    local_id: e.id,
    title: e.title,
    date: e.date,
    time: e.time ?? "",
    category: e.category,
    assigned_member_id: e.assignedMemberId
      ? args.cloudMemberIdByLocalId.get(e.assignedMemberId) ?? null
      : null,
    assigned_person: e.assignedPerson ?? "",
    assigned_member_ids: (e.assignedMemberIds ?? []).map(
      (localId) => args.cloudMemberIdByLocalId.get(localId) ?? localId,
    ),
    responsible_adult_id: e.responsibleAdultId
      ? args.cloudMemberIdByLocalId.get(e.responsibleAdultId) ?? null
      : null,
    start_time: e.startTime ?? null,
    end_time: e.endTime ?? null,
    is_all_day: e.isAllDay ?? false,
    repeat_enabled: e.repeatEnabled ?? false,
    repeat_rule: e.repeatRule ?? null,
    location: e.location ?? null,
    notes: e.notes ?? null,
    prep_checklist: e.prepChecklist ?? null,
    reminder_settings: e.reminderSettings ?? null,
  }));
}

export function toSupabaseCalendarLinkRows(args: {
  householdId: string;
  calendarLinks: CalendarLink[];
}): Array<Record<string, unknown>> {
  return args.calendarLinks.map((c) => ({
    household_id: args.householdId,
    local_id: c.id,
    name: c.name,
    calendar_url: c.calendarUrl,
    display_name: c.displayName,
    public_url: c.publicUrl ?? "",
    embed_url: c.embedUrl ?? null,
    notes: c.notes ?? "",
  }));
}

export function toSupabaseShoppingItemRows(args: {
  householdId: string;
  shopping: ShoppingItem[];
}): Array<Record<string, unknown>> {
  return args.shopping.map((s) => ({
    household_id: args.householdId,
    local_id: s.id,
    name: s.name,
    quantity: s.quantity ?? null,
    unit: s.unit ?? null,
    category: s.category ?? "",
    store_section: s.storeSection ?? "aisles",
    preferred_store: s.preferredStore ?? null,
    needed_by: s.neededBy ?? "",
    purchased: s.purchased ?? false,
    needs_put_away: s.needsPutAway ?? false,
    destination: s.destination ?? null,
    destination_detail: s.destinationDetail ?? null,
    custom_destination_name: s.customDestinationName ?? null,
    pantry_note: s.pantryNote ?? null,
    wall: s.wall ?? null,
    shelf: s.shelf ?? null,
    grocery_item_id: s.groceryItemId ?? null,
    barcode: s.barcode ?? null,
    brand: s.brand ?? null,
    product_image_url: s.productImageUrl ?? null,
    notes: s.notes ?? null,
    source: s.source ?? null,
    source_system: s.sourceSystem ?? null,
    lookup_metadata: s.lookupMetadata ?? null,
    requested_by_member_id: s.requestedByMemberId ?? null,
    assigned_to_member_id: s.assignedToMemberId ?? null,
  }));
}

export function toSupabaseGroceryItemRows(args: {
  householdId: string;
  groceryItems: GroceryItem[];
}): Array<Record<string, unknown>> {
  return args.groceryItems.map((g) => ({
    household_id: args.householdId,
    local_id: g.id,
    name: g.name,
    category: g.category ?? "",
    store_section: g.storeSection ?? "aisles",
    preferred_store: g.preferredStore ?? null,
    amount_default: g.amountDefault ?? "",
    default_location: g.defaultLocation ?? null,
    default_wall: g.defaultWall ?? null,
    default_shelf: g.defaultShelf ?? null,
    barcode: g.barcode ?? null,
    brand: g.brand ?? null,
    product_image_url: g.productImageUrl ?? null,
    notes: g.notes ?? null,
    source: g.source ?? null,
    source_system: g.sourceSystem ?? null,
    lookup_metadata: g.lookupMetadata ?? null,
  }));
}

export function toSupabaseInventoryItemRows(args: {
  householdId: string;
  pantry: PantryItem[];
}): Array<Record<string, unknown>> {
  return args.pantry.map((p) => ({
    household_id: args.householdId,
    local_id: p.id,
    name: p.name,
    quantity: p.quantity ?? "0",
    unit: p.unit ?? null,
    category: p.category ?? "",
    storage_area: p.storageArea ?? null,
    location: p.location ?? "Pantry",
    location_detail: p.locationDetail ?? null,
    custom_location_name: p.customLocationName ?? null,
    kitchen_location_detail: p.kitchenLocationDetail ?? null,
    pantry_location_note: p.pantryLocationNote ?? null,
    cold_location_detail: p.coldLocationDetail ?? null,
    pantry_wall: p.pantryWall ?? null,
    pantry_shelf: p.pantryShelf ?? null,
    wall: p.wall ?? null,
    shelf: p.shelf ?? null,
    status: p.status ?? "Stocked",
    grocery_item_id: p.groceryItemId ?? null,
    barcode: p.barcode ?? null,
    brand: p.brand ?? null,
    product_image_url: p.productImageUrl ?? null,
    lookup_metadata: p.lookupMetadata ?? null,
    expiry_date: p.expiryDate ?? "",
    notes: p.notes ?? null,
    is_staple: p.isStaple ?? false,
    min_quantity: p.minQuantity ?? "",
    tags: p.tags ?? [],
    source: p.source ?? null,
    source_system: p.sourceSystem ?? null,
    last_updated_label: null,
  }));
}


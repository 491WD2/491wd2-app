import type { FamilyData } from "./familyData";
import type { FamilyRepository, FamilyStorageStatus } from "./familyRepository";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../lib/supabaseClient";
import {
  fromSupabaseRowsToFamilyData,
  toSupabaseAdminSettingsRow,
  toSupabaseCalendarLinkRows,
  toSupabaseFamilyMemberRows,
  toSupabaseGroceryItemRows,
  toSupabaseInventoryItemRows,
  toSupabasePlannerEventRows,
  toSupabaseShoppingItemRows,
  toSupabaseTaskChecklistRows,
  toSupabaseTaskCompletionProofRows,
  toSupabaseTaskReferenceMediaRows,
  toSupabaseTaskRows,
  type SupabaseAdminSettingsRow,
  type SupabaseCalendarLinkRow,
  type SupabaseFamilyMemberRow,
  type SupabaseGroceryItemRow,
  type SupabaseInventoryItemRow,
  type SupabasePlannerEventRow,
  type SupabaseShoppingItemRow,
  type SupabaseTaskChecklistRow,
  type SupabaseTaskCompletionProofRow,
  type SupabaseTaskReferenceMediaRow,
  type SupabaseTaskRow,
} from "./supabaseMappers";

/**
 * Supabase-backed {@link FamilyRepository} used only for Cloud Preview Mode.
 * Safety contract:
 * - Requires Supabase configured + user signed in + connected household id
 * - Reads/writes household-scoped rows only (RLS enforced)
 * - Does not touch localStorage
 */
function friendlySupabaseError(error: unknown): string {
  if (!error) return "Cloud request failed.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Cloud request failed.";
}

function requireConfiguredClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Cloud preview is not configured on this install.");
  }
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Cloud preview is not configured on this install.");
  }
  return client;
}

async function requireSignedInUserId() {
  const client = requireConfiguredClient();
  const { data, error } = await client.auth.getUser();
  if (error) {
    throw new Error(friendlySupabaseError(error));
  }
  if (!data.user) {
    throw new Error("Please sign in before using Cloud Preview.");
  }
  return { client, userId: data.user.id };
}

function requireConnectedHouseholdId(data: FamilyData): string {
  const id = data.adminSettings.cloudHouseholdId?.trim() ?? "";
  if (!id) {
    throw new Error("Connect a cloud household before using Cloud Preview.");
  }
  return id;
}

export class SupabaseFamilyRepository implements FamilyRepository {
  private lastKnownHouseholdId: string | null = null;

  setHouseholdId(householdId: string) {
    this.lastKnownHouseholdId = householdId;
  }

  async loadFamilyData(): Promise<FamilyData> {
    const { client } = await requireSignedInUserId();
    const householdId = this.lastKnownHouseholdId;
    if (!householdId) {
      throw new Error("Cloud household is not connected on this device yet.");
    }

    const [
      adminSettings,
      familyMembers,
      tasks,
      taskChecklist,
      taskReferenceMedia,
      taskCompletionProof,
      plannerEvents,
      calendarLinks,
      shoppingItems,
      groceryItems,
      inventoryItems,
    ] = await Promise.all([
      client
        .from("admin_settings")
        .select("household_id, settings, updated_at")
        .eq("household_id", householdId)
        .maybeSingle<SupabaseAdminSettingsRow>(),
      client
        .from("family_members")
        .select(
          "id, household_id, local_id, name, status, color_theme, notes, role_label, age_group, metadata",
        )
        .eq("household_id", householdId)
        .returns<SupabaseFamilyMemberRow[]>(),
      client
        .from("tasks")
        .select(
          "id, household_id, local_id, title, description, owner_label, status, priority, due_date, due_time, type, frequency, last_completed_date, next_due_date, assigned_member_id, zone, room, category, notes, reward_points, requires_verification, requires_proof, is_brain_dump, brain_dump_type, source, source_system, metadata, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabaseTaskRow[]>(),
      client
        .from("task_checklist_items")
        .select("id, task_id, local_id, line_text, completed, completed_at, sort_order")
        .returns<SupabaseTaskChecklistRow[]>(),
      client
        .from("task_reference_media")
        .select("id, task_id, local_id, media_type, url, caption, display_order, created_at")
        .returns<SupabaseTaskReferenceMediaRow[]>(),
      client
        .from("task_completion_proof")
        .select("id, task_id, local_id, proof_type, url, note, uploaded_by_label, uploaded_at")
        .returns<SupabaseTaskCompletionProofRow[]>(),
      client
        .from("planner_events")
        .select(
          "id, household_id, local_id, title, date, time, category, assigned_member_id, assigned_person, assigned_member_ids, responsible_adult_id, start_time, end_time, is_all_day, repeat_enabled, repeat_rule, location, notes, prep_checklist, reminder_settings, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabasePlannerEventRow[]>(),
      client
        .from("calendar_links")
        .select(
          "id, household_id, local_id, name, calendar_url, display_name, public_url, embed_url, notes, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabaseCalendarLinkRow[]>(),
      client
        .from("shopping_items")
        .select(
          "id, household_id, local_id, name, quantity, unit, category, store_section, preferred_store, needed_by, purchased, needs_put_away, destination, destination_detail, custom_destination_name, pantry_note, wall, shelf, grocery_item_id, barcode, brand, product_image_url, notes, source, source_system, lookup_metadata, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabaseShoppingItemRow[]>(),
      client
        .from("grocery_items")
        .select(
          "id, household_id, local_id, name, category, store_section, preferred_store, amount_default, default_location, default_wall, default_shelf, barcode, brand, product_image_url, notes, source, source_system, lookup_metadata, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabaseGroceryItemRow[]>(),
      client
        .from("inventory_items")
        .select(
          "id, household_id, local_id, name, quantity, unit, category, storage_area, location, location_detail, custom_location_name, kitchen_location_detail, pantry_location_note, cold_location_detail, pantry_wall, pantry_shelf, wall, shelf, status, grocery_item_id, barcode, brand, product_image_url, lookup_metadata, expiry_date, notes, is_staple, min_quantity, tags, source, source_system, last_updated_label, created_at, updated_at",
        )
        .eq("household_id", householdId)
        .returns<SupabaseInventoryItemRow[]>(),
    ]);

    const firstError =
      adminSettings.error ??
      familyMembers.error ??
      tasks.error ??
      taskChecklist.error ??
      taskReferenceMedia.error ??
      taskCompletionProof.error ??
      plannerEvents.error ??
      calendarLinks.error ??
      shoppingItems.error ??
      groceryItems.error ??
      inventoryItems.error;

    if (firstError) {
      throw new Error(friendlySupabaseError(firstError));
    }

    const taskIds = new Set((tasks.data ?? []).map((t) => t.id));
    const checklistRows = (taskChecklist.data ?? []).filter((row) =>
      taskIds.has(row.task_id),
    );
    const referenceRows = (taskReferenceMedia.data ?? []).filter((row) =>
      taskIds.has(row.task_id),
    );
    const proofRows = (taskCompletionProof.data ?? []).filter((row) =>
      taskIds.has(row.task_id),
    );

    return fromSupabaseRowsToFamilyData({
      adminSettingsRow: adminSettings.data ?? null,
      familyMembers: familyMembers.data ?? [],
      tasks: tasks.data ?? [],
      taskChecklist: checklistRows,
      taskReferenceMedia: referenceRows,
      taskCompletionProof: proofRows,
      plannerEvents: plannerEvents.data ?? [],
      calendarLinks: calendarLinks.data ?? [],
      shoppingItems: shoppingItems.data ?? [],
      groceryItems: groceryItems.data ?? [],
      inventoryItems: inventoryItems.data ?? [],
      keepLocalAdminSettings: {},
    });
  }

  async saveFamilyData(data: FamilyData): Promise<void> {
    const { client } = await requireSignedInUserId();
    const householdId = requireConnectedHouseholdId(data);
    this.lastKnownHouseholdId = householdId;

    // 1) Upsert admin_settings (exclude local-only mode field)
    const { error: settingsError } = await client
      .from("admin_settings")
      .upsert(toSupabaseAdminSettingsRow({ householdId, adminSettings: data.adminSettings }), {
        onConflict: "household_id",
      });
    if (settingsError) {
      throw new Error(friendlySupabaseError(settingsError));
    }

    // 2) Upsert family_members and build local->cloud id map
    const memberRows = toSupabaseFamilyMemberRows({ householdId, members: data.familyMembers });
    const { data: memberUpserted, error: memberError } = await client
      .from("family_members")
      .upsert(memberRows, { onConflict: "household_id,local_id" })
      .select("id, local_id");
    if (memberError) {
      throw new Error(friendlySupabaseError(memberError));
    }

    const cloudMemberIdByLocalId = new Map<string, string>();
    (memberUpserted ?? []).forEach((row: { id: string; local_id: string | null }) => {
      if (row.local_id) {
        cloudMemberIdByLocalId.set(row.local_id, row.id);
      }
    });

    // 3) Upsert tasks and build local->cloud id map for sub-items
    const taskRows = toSupabaseTaskRows({ householdId, tasks: data.tasks, cloudMemberIdByLocalId });
    const { data: taskUpserted, error: taskError } = await client
      .from("tasks")
      .upsert(taskRows, { onConflict: "household_id,local_id" })
      .select("id, local_id");
    if (taskError) {
      throw new Error(friendlySupabaseError(taskError));
    }

    const taskCloudIdByLocalId = new Map<string, string>();
    (taskUpserted ?? []).forEach((row: { id: string; local_id: string | null }) => {
      if (row.local_id) {
        taskCloudIdByLocalId.set(row.local_id, row.id);
      }
    });

    // 4) Upsert task sub-items (best-effort; safe to skip empty)
    const checklistPayload = toSupabaseTaskChecklistRows({
      taskCloudIdByLocalId,
      checklist: data.tasks.flatMap((task) =>
        task.checklist && task.checklist.length
          ? [{ taskLocalId: task.id, items: task.checklist }]
          : [],
      ),
    });
    if (checklistPayload.length) {
      const { error } = await client
        .from("task_checklist_items")
        .upsert(checklistPayload, { onConflict: "task_id,local_id" });
      if (error) {
        throw new Error(friendlySupabaseError(error));
      }
    }

    const referencePayload = toSupabaseTaskReferenceMediaRows({
      taskCloudIdByLocalId,
      media: data.tasks.flatMap((task) =>
        task.referenceMedia && task.referenceMedia.length
          ? [{ taskLocalId: task.id, items: task.referenceMedia }]
          : [],
      ),
    });
    if (referencePayload.length) {
      const { error } = await client
        .from("task_reference_media")
        .upsert(referencePayload, { onConflict: "task_id,local_id" });
      if (error) {
        throw new Error(friendlySupabaseError(error));
      }
    }

    const proofPayload = toSupabaseTaskCompletionProofRows({
      taskCloudIdByLocalId,
      proof: data.tasks.flatMap((task) =>
        task.completionProof && task.completionProof.length
          ? [{ taskLocalId: task.id, items: task.completionProof }]
          : [],
      ),
    });
    if (proofPayload.length) {
      const { error } = await client
        .from("task_completion_proof")
        .upsert(proofPayload, { onConflict: "task_id,local_id" });
      if (error) {
        throw new Error(friendlySupabaseError(error));
      }
    }

    // 5) Upsert planner, calendar, shopping, grocery, inventory
    const { error: plannerError } = await client
      .from("planner_events")
      .upsert(toSupabasePlannerEventRows({ householdId, planner: data.planner, cloudMemberIdByLocalId }), {
        onConflict: "household_id,local_id",
      });
    if (plannerError) {
      throw new Error(friendlySupabaseError(plannerError));
    }

    const { error: calendarError } = await client
      .from("calendar_links")
      .upsert(toSupabaseCalendarLinkRows({ householdId, calendarLinks: data.calendarLinks }), {
        onConflict: "household_id,local_id",
      });
    if (calendarError) {
      throw new Error(friendlySupabaseError(calendarError));
    }

    const { error: shoppingError } = await client
      .from("shopping_items")
      .upsert(toSupabaseShoppingItemRows({ householdId, shopping: data.shopping }), {
        onConflict: "household_id,local_id",
      });
    if (shoppingError) {
      throw new Error(friendlySupabaseError(shoppingError));
    }

    const { error: groceryError } = await client
      .from("grocery_items")
      .upsert(toSupabaseGroceryItemRows({ householdId, groceryItems: data.groceryItems }), {
        onConflict: "household_id,local_id",
      });
    if (groceryError) {
      throw new Error(friendlySupabaseError(groceryError));
    }

    const { error: inventoryError } = await client
      .from("inventory_items")
      .upsert(toSupabaseInventoryItemRows({ householdId, pantry: data.pantry }), {
        onConflict: "household_id,local_id",
      });
    if (inventoryError) {
      throw new Error(friendlySupabaseError(inventoryError));
    }
  }

  async exportFamilyData(): Promise<FamilyData> {
    // Export is always device-local today.
    throw new Error("Export is not available in Cloud Preview yet.");
  }

  async importFamilyData(data: FamilyData): Promise<void> {
    void data;
    throw new Error("Import is not available in Cloud Preview yet.");
  }

  async resetFamilyData(): Promise<void> {
    throw new Error("Reset is not available in Cloud Preview yet.");
  }

  async getStorageStatus(): Promise<FamilyStorageStatus> {
    if (!isSupabaseConfigured()) {
      return "Unavailable";
    }
    try {
      await requireSignedInUserId();
      return "OK";
    } catch {
      return "Error";
    }
  }
}

/** Used only when `adminSettings.dataSourceMode === "cloud-preview"`. */
export const supabaseFamilyRepositoryImpl = new SupabaseFamilyRepository();
export const supabaseFamilyRepository: FamilyRepository = supabaseFamilyRepositoryImpl;

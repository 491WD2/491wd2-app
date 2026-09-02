import type { FamilyData, ShoppingItem } from "../../data/familyData";
import { createActivity } from "../../lib/activity";
import { createShoppingItemFromName } from "../../pages/shopping/shoppingUtils";
import { findDuplicateShoppingIndex } from "../../services/rulesEngine";
import type { HouseholdActionResult } from "./types";

export type ShoppingAddItemOutcome =
  | { kind: "added"; item: ShoppingItem; data: FamilyData }
  | { kind: "duplicate"; duplicateIndex: number };

/**
 * Authoritative shopping add behavior shared by dashboard preview, production home,
 * and future capability/automation entry points.
 */
export function applyShoppingAddItem(
  data: FamilyData,
  rawName: string,
): HouseholdActionResult<ShoppingAddItemOutcome> {
  const name = rawName.trim();
  if (!name) {
    return { ok: false, error: "Shopping item name is required." };
  }

  const duplicateIndex = findDuplicateShoppingIndex(data.shopping ?? [], name);
  if (duplicateIndex >= 0) {
    return { ok: true, value: { kind: "duplicate", duplicateIndex } };
  }

  const item = createShoppingItemFromName(name);
  const next = createActivity(
    {
      ...data,
      shopping: [item, ...(data.shopping ?? [])],
    },
    {
      type: "created",
      entityType: "shopping",
      entityId: item.id,
      message: `Added “${item.name}” to shopping.`,
    },
  );

  return { ok: true, value: { kind: "added", item, data: next } };
}

import type { PantryItem } from "../data/familyData";
import { normalizeInventoryNameKey } from "./batchInventory";
import { normalizeBarcode } from "../services/openFoodFacts";

export type CrossCheckReason = "barcode" | "name_brand" | "name_only";

export type InventoryCrossCheckMatch = {
  item: PantryItem;
  reason: CrossCheckReason;
};

function normalizeBrandKey(brand?: string): string {
  return (brand ?? "").trim().toLowerCase();
}

/**
 * Finds household inventory rows that may duplicate a scanned / looked-up product.
 * Order: barcode matches first, then normalized name + brand, then name-only fallback.
 */
export function findInventoryCrossCheckMatches(
  pantry: PantryItem[],
  draft: {
    barcode?: string;
    name: string;
    productName?: string;
    brand?: string;
  },
): InventoryCrossCheckMatch[] {
  const bc = draft.barcode?.trim();
  const normBc = bc ? normalizeBarcode(bc) : "";

  const titleSource = (draft.productName || draft.name || "").trim();
  const titleKey = normalizeInventoryNameKey(titleSource);
  const brandKey = normalizeBrandKey(draft.brand);

  const byId = new Map<string, InventoryCrossCheckMatch>();

  if (normBc) {
    for (const item of pantry) {
      if (!item.barcode?.trim()) continue;
      if (normalizeBarcode(item.barcode) === normBc) {
        const existing = byId.get(item.id);
        if (!existing || existing.reason !== "barcode") {
          byId.set(item.id, { item, reason: "barcode" });
        }
      }
    }
  }

  if (titleKey && brandKey) {
    for (const item of pantry) {
      const inTitle = normalizeInventoryNameKey(item.productName ?? item.name);
      const inBrand = normalizeBrandKey(item.brand);
      if (inTitle === titleKey && inBrand === brandKey) {
        const cur = byId.get(item.id);
        if (!cur || cur.reason === "name_only") {
          byId.set(item.id, { item, reason: "name_brand" });
        }
      }
    }
  }

  if (titleKey) {
    for (const item of pantry) {
      const inTitle = normalizeInventoryNameKey(item.productName ?? item.name);
      if (inTitle === titleKey && !byId.has(item.id)) {
        byId.set(item.id, { item, reason: "name_only" });
      }
    }
  }

  const priority: Record<CrossCheckReason, number> = {
    barcode: 0,
    name_brand: 1,
    name_only: 2,
  };

  return [...byId.values()].sort((a, b) => priority[a.reason] - priority[b.reason]);
}

import type { GroceryItem, ShoppingItem } from "../../data/familyData";

export type ShoppingSectionGroup = {
  section: string;
  items: ShoppingItem[];
};

export function createShoppingItemFromName(name: string): ShoppingItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    quantity: "1",
    unit: "",
    category: "pantry",
    storeSection: "aisles",
    preferredStore: "",
    neededBy: new Date().toISOString().slice(0, 10),
    purchased: false,
    needsPutAway: false,
    destination: "Pantry",
    destinationDetail: "",
    customDestinationName: "",
    pantryNote: "",
    wall: "Wall 1",
    shelf: "Shelf 1",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function createShoppingItemFromGroceryItem(item: GroceryItem): ShoppingItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.amountDefault ?? "1",
    unit: "",
    category: item.category,
    storeSection: item.storeSection,
    preferredStore: item.preferredStore,
    neededBy: new Date().toISOString().slice(0, 10),
    purchased: false,
    needsPutAway: false,
    destination: item.defaultLocation,
    barcode: item.barcode,
    brand: item.brand,
    productImageUrl: item.productImageUrl,
    source: item.source,
    sourceSystem: item.sourceSystem,
    lookupMetadata: item.lookupMetadata,
    destinationDetail: "",
    customDestinationName: "",
    pantryNote: "",
    wall: item.defaultLocation === "Pantry" ? item.defaultWall : undefined,
    shelf: item.defaultLocation === "Pantry" ? item.defaultShelf : undefined,
    notes: item.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeShoppingName(value: string) {
  return value.trim().toLowerCase();
}

function normalizeBrand(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Finds an active (not purchased) shopping row that matches the candidate
 * by barcode, then name+brand, then name-only fallback.
 */
export function findActiveShoppingDuplicate(
  activeItems: ShoppingItem[],
  candidate: { name: string; brand?: string; barcode?: string },
): ShoppingItem | undefined {
  const bc = candidate.barcode?.trim();
  if (bc) {
    const hit = activeItems.find((i) => !i.purchased && i.barcode?.trim() === bc);
    if (hit) {
      return hit;
    }
  }

  const nameNorm = normalizeShoppingName(candidate.name);
  const brandCand = normalizeBrand(candidate.brand);

  for (const item of activeItems) {
    if (item.purchased) {
      continue;
    }
    if (normalizeShoppingName(item.name) !== nameNorm) {
      continue;
    }

    const brandItem = normalizeBrand(item.brand);

    if (brandCand && brandItem) {
      if (brandCand === brandItem) {
        return item;
      }
      continue;
    }

    if (!brandCand && !brandItem) {
      return item;
    }

    if (!brandCand || !brandItem) {
      return item;
    }
  }

  return undefined;
}

export function mergeShoppingQuantityStrings(current: string, add: string): string {
  const a = parseFloat(String(current).replace(/,/g, ""));
  const b = parseFloat(String(add).replace(/,/g, ""));
  if (Number.isFinite(a) && Number.isFinite(b)) {
    const sum = a + b;
    return Number.isInteger(sum) ? String(sum) : String(Math.round(sum * 1000) / 1000);
  }
  if (Number.isFinite(a)) {
    return String(Math.round(a + 1));
  }
  if (Number.isFinite(b)) {
    return String(b);
  }
  return "2";
}

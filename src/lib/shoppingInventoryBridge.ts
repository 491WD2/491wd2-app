import type { PantryItem, ShoppingItem, StoreSection } from "../data/familyData";
import { getPantryItemDisplayImageSrc } from "../pages/inventory/inventoryUtils";
import { normalizeInventoryNameKey } from "./batchInventory";
import { mapCategoryToStoreSection, normalizeBarcode } from "../services/openFoodFacts";

/** Active = still needed from the store (not yet purchased for this line). */
export function findActiveShoppingMatch(
  shopping: ShoppingItem[],
  item: PantryItem,
): ShoppingItem | undefined {
  return shopping.find((s) => !s.purchased && shoppingRowMatchesInventory(s, item));
}

export function shoppingRowMatchesInventory(s: ShoppingItem, item: PantryItem): boolean {
  const bcItem = item.barcode?.trim();
  const bcShop = s.barcode?.trim();
  if (bcItem && bcShop && normalizeBarcode(bcItem) === normalizeBarcode(bcShop)) {
    return true;
  }
  return normalizeInventoryNameKey(s.name) === normalizeInventoryNameKey(item.name);
}

export function buildShoppingItemFromPantryRestock(
  item: PantryItem,
  opts?: { requestedByMemberId?: string },
): ShoppingItem {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const storeSection: StoreSection =
    mapCategoryToStoreSection(item.category) ?? "aisles";

  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.minQuantity || item.quantity || "1",
    unit: item.unit,
    category: item.category,
    storeSection,
    preferredStore: "",
    neededBy: today,
    purchased: false,
    needsPutAway: false,
    destination: item.storageArea,
    destinationDetail: item.locationDetail,
    customDestinationName: item.customLocationName,
    pantryNote: item.pantryLocationNote,
    wall: item.pantryWall ?? item.wall,
    shelf: item.pantryShelf ?? item.shelf,
    groceryItemId: item.groceryItemId,
    barcode: item.barcode,
    brand: item.brand,
    productImageUrl: getPantryItemDisplayImageSrc(item) || item.productImageUrl,
    source: item.source,
    sourceSystem: item.sourceSystem,
    lookupMetadata: item.lookupMetadata,
    notes: "",
    requestedByMemberId: opts?.requestedByMemberId,
    sourcePantryItemId: item.id,
    createdAt: now,
    updatedAt: now,
  };
}

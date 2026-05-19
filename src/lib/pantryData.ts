import { PANTRY_LIBRARY_PRODUCTS } from "./groceryLibraryData";
import type { GroceryCategoryGroupId, HouseholdProduct } from "../types/grocery";
import type { FoodInventoryItem, FoodStorageLocation } from "../types/inventory";
import type { PantryItem, PantryStatus } from "../types/pantry";

export const PANTRY_INVOICE_HOUSEHOLD_LABEL = "491WD Household";

export const PANTRY_INVOICE_SHEET_LABEL = "Household Grocery Library";

export const PANTRY_INVOICE_LOCATION_SCOPE = "Fresh · Pantry · Home · Cold";

export function pantryStatusFromProduct(product: HouseholdProduct): PantryStatus {
  if (!product.expirationDate?.trim()) {
    return "In Stock";
  }
  const expiration = new Date(product.expirationDate).getTime();
  if (Number.isNaN(expiration)) {
    return "In Stock";
  }
  const now = Date.now();
  if (expiration < now) {
    return "Expired";
  }
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  if (expiration - now <= weekMs) {
    return "Expiring Soon";
  }
  return "In Stock";
}

export function householdProductToPantryItem(product: HouseholdProduct): PantryItem {
  const quantity = product.quantity ?? 0;
  const unit = product.unit?.trim() || "each";
  const productName = product.productName.trim();

  return {
    id: product.id,
    productName,
    name: productName,
    category: product.category,
    categoryGroup: product.categoryGroup,
    quantity,
    unit,
    store: product.store.trim(),
    storageLocation: product.categoryGroup,
    expirationDate: product.expirationDate?.trim() ?? "",
    imageUrl: product.imageUrl,
    status: pantryStatusFromProduct(product),
    notes: product.notes.trim(),
    lastUpdated: product.dateAdded ?? product.createdAt ?? "",
  };
}

export const PANTRY_GROCERY_ITEMS: PantryItem[] = PANTRY_LIBRARY_PRODUCTS.map(householdProductToPantryItem);

/** Legacy export name used by dashboard snapshots and the pantry list tab. */
export const PANTRY_SAMPLE_ITEMS: PantryItem[] = PANTRY_GROCERY_ITEMS;

/** Maps household storage group to food-inventory location chips. */
export function categoryGroupToFoodLocation(
  group: GroceryCategoryGroupId | string,
): FoodStorageLocation {
  if (group === "Cold") {
    return "freezer";
  }
  if (group === "Fresh") {
    return "fridge";
  }
  return "pantry";
}

export function foodLocationToCategoryGroup(location: FoodStorageLocation): GroceryCategoryGroupId {
  if (location === "freezer") {
    return "Cold";
  }
  if (location === "fridge") {
    return "Fresh";
  }
  return "Pantry";
}

/** Bridge pantry tab rows to GroFast `PantryGrid` / `PantryItemCard`. */
export function pantryItemToFoodInventory(
  item: PantryItem,
  product?: HouseholdProduct | null,
): FoodInventoryItem {
  const sourceProduct = product ?? null;
  const location = sourceProduct
    ? categoryGroupToFoodLocation(sourceProduct.categoryGroup)
    : categoryGroupToFoodLocation(item.categoryGroup);

  const scanned =
    sourceProduct?.source === "openfoodfacts" || Boolean(sourceProduct?.barcode?.trim());

  return {
    id: item.id,
    name: item.productName || item.name,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expirationDate,
    location,
    category: item.category,
    updatedAt: item.lastUpdated || new Date().toISOString(),
    createdAt: sourceProduct?.createdAt ?? sourceProduct?.dateAdded ?? item.lastUpdated,
    imageUrl: item.imageUrl,
    barcode: sourceProduct?.barcode ?? null,
    source: scanned ? "scan" : "manual",
  };
}

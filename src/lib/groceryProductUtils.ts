import type { HouseholdProduct } from "../types/grocery";
import { getGroceryCategoryGroup } from "./groceryCategoryMap";
import { parseShoppingQuantity } from "./shoppingData";
import { normalizeProductImageUrl, type NormalizedProductLookup } from "../services/openFoodFacts";

function parseLookupQuantity(lookup: NormalizedProductLookup): number | null {
  const fromQuantity = parseShoppingQuantity(lookup.quantity);
  if (fromQuantity) {
    return fromQuantity;
  }
  const fromPackage = parseShoppingQuantity(lookup.packageQuantity);
  return fromPackage;
}

export function createHouseholdProductFromLookup(lookup: NormalizedProductLookup): HouseholdProduct {
  const category = lookup.category.trim() || "Uncategorized";
  const imageUrl = normalizeProductImageUrl(lookup.imageUrl) || null;

  return {
    id: `barcode-${lookup.barcode}`,
    productName: lookup.name.trim() || `Product ${lookup.barcode}`,
    brand: lookup.brand.trim() || null,
    imageUrl,
    barcode: lookup.barcode,
    category,
    categoryGroup: getGroceryCategoryGroup(category),
    quantity: parseLookupQuantity(lookup),
    unit: lookup.unit.trim() || null,
    store: "",
    notes: lookup.description.trim(),
    need: false,
    purchased: false,
    productUrl: null,
    price: null,
    expirationDate: null,
    dateAdded: lookup.lookedUpAt,
    createdAt: lookup.lookedUpAt,
    source: "openfoodfacts",
  };
}

export function applyOpenFoodFactsToHouseholdProduct(
  product: HouseholdProduct,
  lookup: NormalizedProductLookup,
): HouseholdProduct {
  const imageUrl = normalizeProductImageUrl(lookup.imageUrl) || product.imageUrl;
  const category = lookup.category.trim() || product.category;
  const parsedQuantity = parseLookupQuantity(lookup);

  return {
    ...product,
    barcode: lookup.barcode || product.barcode,
    productName: lookup.name.trim() || product.productName,
    brand: lookup.brand.trim() || product.brand,
    imageUrl,
    category,
    categoryGroup: getGroceryCategoryGroup(category),
    quantity: parsedQuantity ?? product.quantity,
    unit: lookup.unit.trim() || product.unit,
    notes: lookup.description.trim() || product.notes,
    source: product.source === "notion" ? "openfoodfacts" : product.source,
  };
}

import {
  isLikelyBarcode,
  lookupOpenFoodFactsProduct,
  normalizeBarcode,
  normalizeProductImageUrl,
  type NormalizedProductLookup,
} from "../services/openFoodFacts";
import type { GroceryProductDetail } from "../types/grocery";
import { parseShoppingQuantity } from "./shoppingData";

export { isLikelyBarcode, lookupOpenFoodFactsProduct, normalizeBarcode };

export type GroceryBarcodeLookupResult = {
  status: "found" | "not_found" | "error";
  barcode: string;
  message: string | null;
  detail: GroceryProductDetail | null;
};

function parseLookupQuantity(lookup: NormalizedProductLookup): number | null {
  const fromQuantity = parseShoppingQuantity(lookup.quantity);
  if (fromQuantity) {
    return fromQuantity;
  }
  return parseShoppingQuantity(lookup.packageQuantity);
}

export function createDraftFromLookup(lookup: NormalizedProductLookup): GroceryProductDetail {
  const imageUrl = normalizeProductImageUrl(lookup.imageUrl) || null;
  return {
    id: `barcode-${lookup.barcode}`,
    productName: lookup.name.trim() || `Product ${lookup.barcode}`,
    brand: lookup.brand.trim() || null,
    imageUrl,
    barcode: lookup.barcode,
    category: lookup.category.trim() || "Uncategorized",
    quantity: parseLookupQuantity(lookup),
    unit: lookup.unit.trim() || null,
    store: "",
    notes: lookup.description.trim(),
  };
}

export function createManualDraft(barcode: string): GroceryProductDetail {
  const normalized = normalizeBarcode(barcode);
  return {
    id: `barcode-${normalized}`,
    productName: "",
    brand: null,
    imageUrl: null,
    barcode: normalized,
    category: "Uncategorized",
    quantity: 1,
    unit: "each",
    store: "",
    notes: "",
  };
}

export async function lookupGroceryProductByBarcode(
  barcodeInput: string,
): Promise<GroceryBarcodeLookupResult> {
  const barcode = normalizeBarcode(barcodeInput);
  if (!isLikelyBarcode(barcode)) {
    return {
      status: "error",
      barcode,
      message: "Enter a valid 8-14 digit UPC/EAN barcode.",
      detail: null,
    };
  }

  try {
    const lookup = await lookupOpenFoodFactsProduct(barcode);
    if (lookup.status !== "found") {
      return {
        status: "not_found",
        barcode,
        message: "No public record for this barcode. Enter the product manually.",
        detail: createManualDraft(barcode),
      };
    }

    return {
      status: "found",
      barcode,
      message: null,
      detail: createDraftFromLookup(lookup),
    };
  } catch (error) {
    return {
      status: "error",
      barcode,
      message:
        error instanceof Error ? error.message : "OpenFoodFacts lookup failed. Try again later.",
      detail: createManualDraft(barcode),
    };
  }
}

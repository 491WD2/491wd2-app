import type { GroceryItem, PantryItem, ShoppingItem, StoreSection } from "../data/familyData";

const BARCODE_PATTERN = /^\d{8,14}$/;

export type ProductLookupStatus = "idle" | "loading" | "found" | "not_found" | "error";
export type ProductLookupResultStatus = Extract<
  ProductLookupStatus,
  "found" | "not_found" | "error"
>;

export type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_front_url?: string;
  image_url?: string;
  product_quantity?: string | number;
  product_quantity_unit?: string;
  ingredients_text?: string;
  stores?: string;
  labels_tags?: string[];
  allergens_tags?: string[];
};

export type OpenFoodFactsApiResponse = {
  code?: string;
  status?: number;
  product?: OpenFoodFactsProduct;
};

export type OpenFoodFactsProductLookupResult = OpenFoodFactsApiResponse;

export type NormalizedProductLookup = {
  provider: "openfoodfacts";
  status: ProductLookupResultStatus;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  quantity: string;
  unit: string;
  packageQuantity: string;
  imageUrl: string;
  lookedUpAt: string;
};

export function normalizeBarcode(input: string) {
  return input.replace(/[\s-]/g, "").trim();
}

/**
 * Normalize product image URLs for in-browser use: protocol-relative → https,
 * and upgrade known Open Food Facts hosts from http → https (mixed content).
 */
export function normalizeProductImageUrl(url: string): string {
  const t = url.trim();
  if (!t) {
    return "";
  }
  if (t.startsWith("//")) {
    return `https:${t}`;
  }
  if (t.startsWith("http://")) {
    try {
      const hostname = new URL(t).hostname.toLowerCase();
      if (hostname.endsWith("openfoodfacts.org") || hostname.endsWith("openfoodfacts.net")) {
        return `https://${t.slice("http://".length)}`;
      }
    } catch {
      return t;
    }
  }
  return t;
}

export function isLikelyBarcode(input: string) {
  return BARCODE_PATTERN.test(normalizeBarcode(input));
}

export const isValidBarcode = isLikelyBarcode;

export async function lookupOpenFoodFactsProduct(
  barcodeInput: string,
): Promise<NormalizedProductLookup> {
  const barcode = normalizeBarcode(barcodeInput);

  if (!isLikelyBarcode(barcode)) {
    throw new Error("Enter a valid 8-14 digit UPC/EAN barcode.");
  }

  const fields = [
    "code",
    "product_name",
    "generic_name",
    "brands",
    "categories",
    "quantity",
    "image_front_url",
    "image_url",
    "product_quantity",
    "product_quantity_unit",
    "ingredients_text",
    "stores",
    "labels_tags",
    "allergens_tags",
  ].join(",");
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`;

  // Browsers generally block custom User-Agent headers. A future backend or
  // serverless proxy can set OpenFoodFacts' preferred app-identifying header.
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("OpenFoodFacts lookup failed. Try again later.");
  }

  const result = (await response.json()) as OpenFoodFactsApiResponse;

  if (result.status !== 1 || !result.product) {
    return {
      provider: "openfoodfacts",
      status: "not_found",
      barcode,
      name: "",
      brand: "",
      category: "",
      description: "",
      quantity: "",
      unit: "",
      packageQuantity: "",
      imageUrl: "",
      lookedUpAt: new Date().toISOString(),
    };
  }

  const product = result.product;
  const quantityParts = normalizeProductQuantity(product);

  return {
    provider: "openfoodfacts",
    status: "found",
    barcode,
    name: product.product_name ?? "",
    brand: product.brands ?? "",
    category: formatCategory(product.categories),
    description: formatProductDescription(product),
    quantity: quantityParts.quantity,
    unit: quantityParts.unit,
    packageQuantity: product.quantity || quantityParts.displayQuantity,
    imageUrl: normalizeProductImageUrl(product.image_front_url || product.image_url || ""),
    lookedUpAt: new Date().toISOString(),
  };
}

export function mapOpenFoodFactsToInventoryFields(
  product: NormalizedProductLookup,
): Partial<PantryItem> {
  const imageUrl = normalizeProductImageUrl(product.imageUrl);
  return {
    barcode: product.barcode,
    brand: product.brand || undefined,
    productImageUrl: imageUrl || undefined,
    productName: product.name || undefined,
    name: product.name || undefined,
    category: product.category || undefined,
    productDescription: product.description || undefined,
    quantity: product.quantity || undefined,
    unit: product.unit || undefined,
    source: "lookup",
    sourceSystem: "openfoodfacts",
    productLookupSource: "Open Food Facts",
    productLookupUpdatedAt: product.lookedUpAt,
    lookupMetadata: {
      provider: "openfoodfacts",
      lookedUpAt: product.lookedUpAt,
      status: toStoredLookupStatus(product.status),
      rawCode: product.barcode,
    },
  };
}

type PantryImagePriorityFields = Pick<
  PantryItem,
  "productImageDataUrl" | "itemPhotoUrl" | "productImageUrl"
>;

/**
 * Open Food Facts patch for pantry rows: never overwrites {@link PantryItem.productImageUrl}
 * when an uploaded data URL or manual {@link PantryItem.itemPhotoUrl} is already set.
 */
export function mapOpenFoodFactsToPantryItemRespectingImages(
  item: PantryImagePriorityFields,
  product: NormalizedProductLookup,
): Partial<PantryItem> {
  const mapped = mapOpenFoodFactsToInventoryFields(product);
  if (item.productImageDataUrl?.trim() || item.itemPhotoUrl?.trim()) {
    const { productImageUrl: _drop, ...rest } = mapped;
    return rest;
  }
  return mapped;
}

export function mapOpenFoodFactsToShoppingFields(
  product: NormalizedProductLookup,
): Partial<ShoppingItem> {
  const imageUrl = normalizeProductImageUrl(product.imageUrl);
  return {
    barcode: product.barcode,
    brand: product.brand,
    productImageUrl: imageUrl || undefined,
    name: product.name || undefined,
    category: product.category || undefined,
    storeSection: mapCategoryToStoreSection(product.category),
    quantity: product.quantity || product.packageQuantity || undefined,
    unit: product.unit || undefined,
    source: "lookup",
    sourceSystem: "openfoodfacts",
    lookupMetadata: {
      provider: "openfoodfacts",
      lookedUpAt: product.lookedUpAt,
      status: toStoredLookupStatus(product.status),
      rawCode: product.barcode,
    },
  };
}

export function mapOpenFoodFactsToGroceryFields(
  product: NormalizedProductLookup,
): Partial<GroceryItem> {
  const imageUrl = normalizeProductImageUrl(product.imageUrl);
  return {
    barcode: product.barcode,
    brand: product.brand,
    productImageUrl: imageUrl || undefined,
    name: product.name || undefined,
    category: product.category || undefined,
    storeSection: mapCategoryToStoreSection(product.category),
    amountDefault: product.quantity || product.packageQuantity || undefined,
    source: "lookup",
    sourceSystem: "openfoodfacts",
    lookupMetadata: {
      provider: "openfoodfacts",
      lookedUpAt: product.lookedUpAt,
      status: toStoredLookupStatus(product.status),
      rawCode: product.barcode,
    },
  };
}

function normalizeProductQuantity(product: OpenFoodFactsProduct) {
  const rawQuantity =
    product.product_quantity === undefined || product.product_quantity === null
      ? ""
      : String(product.product_quantity).trim();
  const unit = product.product_quantity_unit?.trim() ?? "";

  return {
    quantity: rawQuantity,
    unit,
    displayQuantity: [rawQuantity, unit].filter(Boolean).join(" "),
  };
}

function toStoredLookupStatus(status: ProductLookupResultStatus) {
  return status === "not_found" ? "not-found" : status;
}

export function mapCategoryToStoreSection(category: string): StoreSection | undefined {
  const normalized = category.toLowerCase();

  if (normalized.includes("frozen")) {
    return "frozen";
  }

  if (normalized.includes("dairy") || normalized.includes("milk")) {
    return "dairy";
  }

  if (
    normalized.includes("meat") ||
    normalized.includes("seafood") ||
    normalized.includes("poultry")
  ) {
    return "meat";
  }

  if (
    normalized.includes("fruit") ||
    normalized.includes("vegetable") ||
    normalized.includes("produce")
  ) {
    return "produce";
  }

  if (
    normalized.includes("clean") ||
    normalized.includes("paper") ||
    normalized.includes("household")
  ) {
    return "household";
  }

  return category ? "aisles" : undefined;
}

function formatCategory(value?: string) {
  if (!value) {
    return "";
  }

  return value
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}

function formatProductDescription(product: OpenFoodFactsProduct) {
  const parts = [product.generic_name?.trim(), product.ingredients_text?.trim()].filter(
    Boolean,
  ) as string[];
  return parts.join("\n\n").slice(0, 8000);
}

export type GroceryCategoryGroupId = "Fresh" | "Pantry" | "Home" | "Cold";

export type GroceryStoreId =
  | "Safeway"
  | "Costco"
  | "Amazon"
  | "Walmart"
  | "Trader Joes";

export type HouseholdProductSource = "notion" | "manual" | "openfoodfacts" | "import";

/** Fields shared with OpenFoodFacts lookup and apply flows. */
export type OpenFoodFactsProductFields = {
  barcode: string | null;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  quantity: number | null;
  unit: string | null;
  category: string;
  store: string;
  notes: string;
};

export type HouseholdProduct = {
  id: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  barcode: string | null;
  category: string;
  categoryGroup: GroceryCategoryGroupId;
  quantity: number | null;
  unit: string | null;
  store: string;
  notes: string;
  need: boolean;
  purchased: boolean;
  productUrl: string | null;
  price: string | null;
  expirationDate: string | null;
  dateAdded: string | null;
  createdAt: string | null;
  source: HouseholdProductSource;
};

export type GroceryCategoryGroup = {
  id: GroceryCategoryGroupId;
  label: GroceryCategoryGroupId;
  categories: readonly string[];
};

export type GroceryCartItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  category: string;
  quantity: number;
  unit: string;
  store: string;
  notes: string;
  purchased: boolean;
};

export type GroceryCartLine = GroceryCartItem & {
  id: string;
};

export type GroceryCartStoreCategoryGroup = {
  category: string;
  lines: GroceryCartLine[];
};

export type GroceryCartStoreGroup = {
  store: string;
  categories: GroceryCartStoreCategoryGroup[];
};

/** Shared product detail surface for Shopping, Pantry, scan, and OpenFoodFacts enrichment. */
export type GroceryProductDetail = {
  id: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  barcode: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  store: string;
  notes: string;
};

export type GroceryBarcodeLookupStatus = "found" | "not_found" | "error";

export type GroceryBarcodeLookupResult = {
  status: GroceryBarcodeLookupStatus;
  barcode: string;
  message: string | null;
  detail: GroceryProductDetail | null;
};

export function toGroceryProductDetail(product: HouseholdProduct): GroceryProductDetail {
  return {
    id: product.id,
    productName: product.productName,
    brand: product.brand,
    imageUrl: product.imageUrl,
    barcode: product.barcode,
    category: product.category,
    quantity: product.quantity,
    unit: product.unit,
    store: product.store,
    notes: product.notes,
  };
}

export function pickOpenFoodFactsFields(product: HouseholdProduct): OpenFoodFactsProductFields {
  return {
    barcode: product.barcode,
    productName: product.productName,
    brand: product.brand,
    imageUrl: product.imageUrl,
    quantity: product.quantity,
    unit: product.unit,
    category: product.category,
    store: product.store,
    notes: product.notes,
  };
}

export type GroceryProductDuplicateMatchReason = "barcode" | "name_category";

export type GroceryProductDuplicateMatch = {
  reason: GroceryProductDuplicateMatchReason;
  existingProductId: string;
  existingProductName: string;
  existingCategory: string;
  existingBarcode: string | null;
};

export type ProductLibraryStatusFilter =
  | "all"
  | "missing-image"
  | "missing-barcode"
  | "missing-store"
  | "duplicates"
  | "on-shopping"
  | "in-pantry";

export type ProductLibraryViewMode = "grid" | "table";

export type ProductLibraryStats = {
  totalProducts: number;
  missingImages: number;
  missingBarcodes: number;
  possibleDuplicates: number;
};

export type ProductLibraryDuplicateGroup = {
  id: string;
  reason: GroceryProductDuplicateMatchReason;
  products: HouseholdProduct[];
};

export type GroceryInventoryActivityAction = "add_stock" | "use_item" | "add_to_shopping";

export type GroceryInventoryActivityEntry = {
  id: string;
  productId: string;
  productName: string;
  action: GroceryInventoryActivityAction;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  unit: string;
  timestamp: string;
  cartLineId?: string;
  undone?: boolean;
};

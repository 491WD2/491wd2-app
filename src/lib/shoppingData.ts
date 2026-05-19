import type { StoreSection } from "../data/familyData";
import type { HouseholdProduct } from "../types/grocery";
import type {
  ShoppingAddableCategoryId,
  ShoppingCartLine,
  ShoppingCatalogItem,
  ShoppingCategoryGroup,
  ShoppingCategoryGroupId,
  ShoppingKioskCategoryId,
  ShoppingPageAction,
  ShoppingUnitId,
} from "../types/shopping";
import { GROCERY_CATEGORY_GROUPS, GROCERY_STORES } from "./groceryCategoryMap";
import { HOUSEHOLD_PRODUCT_LIBRARY } from "./groceryLibraryData";

export const SHOPPING_KIOSK_CATEGORIES: ReadonlyArray<{
  id: ShoppingKioskCategoryId;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "produce", label: "Produce" },
  { id: "dairy", label: "Dairy" },
  { id: "meat", label: "Meat" },
  { id: "pantry", label: "Pantry" },
  { id: "household", label: "Household" },
  { id: "frozen", label: "Frozen" },
  { id: "snacks", label: "Snacks" },
  { id: "drinks", label: "Drinks" },
];

const categoryLabelById = new Map(
  SHOPPING_KIOSK_CATEGORIES.map((category) => [category.id, category.label]),
);

const SHOPPING_ROUTE_CATEGORY_LABELS: Readonly<Record<ShoppingAddableCategoryId, readonly string[]>> = {
  produce: ["Produce"],
  dairy: ["Dairy & Eggs"],
  meat: ["Meats", "Seafood"],
  pantry: [
    "Condiments",
    "Canned & Jarred",
    "Grains Pasta & Dry Goods",
    "Baking Supplies",
    "International & Ethnic Foods",
    "Prepared Foods",
    "Bakery",
  ],
  household: ["Household & Misc Items", "Pet Food"],
  frozen: ["Frozen Foods"],
  snacks: ["Snacks"],
  drinks: ["Beverages", "Alcohol", "Protein Bars & Supplements"],
};

const SHOPPING_CATEGORY_GROUP_DEFINITIONS: ReadonlyArray<{
  id: ShoppingCategoryGroupId;
  label: string;
  categories: readonly string[];
}> = GROCERY_CATEGORY_GROUPS.map((group) => ({
  id: group.id.toLowerCase() as ShoppingCategoryGroupId,
  label: group.label,
  categories: group.categories,
}));

export const SHOPPING_CATEGORY_GROUPS: ShoppingCategoryGroup[] =
  SHOPPING_CATEGORY_GROUP_DEFINITIONS.map((group) => ({
    ...group,
    categories: [...group.categories].sort((left, right) => left.localeCompare(right)),
  }));

export function getShoppingCategoryLabel(categoryId: ShoppingKioskCategoryId | string) {
  if (categoryId === "all") {
    return "All";
  }
  return categoryLabelById.get(categoryId as ShoppingKioskCategoryId) ?? categoryId;
}

export function matchesShoppingRouteCategory(
  itemCategory: string,
  activeCategory: ShoppingKioskCategoryId,
) {
  if (activeCategory === "all") {
    return true;
  }
  const labels = SHOPPING_ROUTE_CATEGORY_LABELS[activeCategory];
  return labels?.includes(itemCategory) ?? itemCategory === activeCategory;
}

export function isShoppingAddableCategoryId(
  value: string | null | undefined,
): value is ShoppingAddableCategoryId {
  if (!value || value === "all") {
    return false;
  }
  return SHOPPING_KIOSK_CATEGORIES.some((category) => category.id === value);
}

export function parseShoppingRouteSearch(search?: string) {
  const raw = search?.trim() ?? "";
  const query = raw.startsWith("?") ? raw.slice(1) : raw;
  const params = new URLSearchParams(query);
  const actionParam = params.get("action");
  const action: ShoppingPageAction | null =
    actionParam === "add" || actionParam === "scan" ? actionParam : null;
  const categoryParam = params.get("category");
  const category: ShoppingKioskCategoryId = isShoppingAddableCategoryId(categoryParam)
    ? categoryParam
    : "all";
  return { action, category };
}

export const SHOPPING_UNIT_OPTIONS: ReadonlyArray<{
  id: ShoppingUnitId;
  label: string;
}> = [
  { id: "each", label: "each" },
  { id: "count", label: "count" },
  { id: "dozen", label: "dozen" },
  { id: "oz", label: "oz" },
  { id: "lb", label: "lb" },
  { id: "g", label: "g" },
  { id: "kg", label: "kg" },
  { id: "gallon", label: "gallon" },
  { id: "quart", label: "quart" },
  { id: "pint", label: "pint" },
  { id: "liter", label: "liter" },
  { id: "ml", label: "ml" },
  { id: "bottle", label: "bottle" },
  { id: "can", label: "can" },
  { id: "box", label: "box" },
  { id: "bag", label: "bag" },
  { id: "pack", label: "pack" },
  { id: "bunch", label: "bunch" },
  { id: "loaf", label: "loaf" },
  { id: "jar", label: "jar" },
];

export const SHOPPING_DEFAULT_STORES = [...GROCERY_STORES] as const;
export const SHOPPING_STORE_ADD_NEW = "Add New";

export function parseShoppingQuantity(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function normalizeShoppingUnit(unit: string | undefined, fallback = "each") {
  const normalized = (unit ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  const match = SHOPPING_UNIT_OPTIONS.find((option) => option.id === normalized);
  return match?.id ?? normalized;
}

export function groupCatalogByCategoryGroups(items: ShoppingCatalogItem[]) {
  return SHOPPING_CATEGORY_GROUPS.map((group) => ({
    ...group,
    items: items
      .filter((item) => group.categories.includes(item.category))
      .sort((left, right) => left.name.localeCompare(right.name)),
  })).filter((group) => group.items.length > 0);
}

export function groupCartLinesByStoreAndCategory(lines: ShoppingCartLine[]) {
  const storeMap = new Map<string, ShoppingCartLine[]>();
  for (const line of lines) {
    const store = line.store.trim() || "No store";
    const bucket = storeMap.get(store) ?? [];
    bucket.push(line);
    storeMap.set(store, bucket);
  }

  return [...storeMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([store, storeLines]) => {
      const categoryMap = new Map<string, ShoppingCartLine[]>();
      for (const line of storeLines) {
        const label = getShoppingCategoryLabel(line.category);
        const bucket = categoryMap.get(label) ?? [];
        bucket.push(line);
        categoryMap.set(label, bucket);
      }
      return {
        store,
        categories: [...categoryMap.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([category, categoryLines]) => ({
            category,
            lines: categoryLines.sort((left, right) => left.name.localeCompare(right.name)),
          })),
      };
    });
}

export function buildShoppingRouteHref(args: {
  action?: ShoppingPageAction | null;
  category?: ShoppingKioskCategoryId;
}) {
  const params = new URLSearchParams();
  if (args.action) {
    params.set("action", args.action);
  }
  if (args.category && args.category !== "all") {
    params.set("category", args.category);
  }
  const query = params.toString();
  return query ? `/shopping?${query}` : "/shopping";
}

export function householdProductToCatalogItem(product: HouseholdProduct): ShoppingCatalogItem {
  return {
    id: product.id,
    name: product.productName,
    category: product.category,
    categoryGroup: product.categoryGroup,
    suggestedQuantity: product.quantity ?? 1,
    unit: normalizeShoppingUnit(product.unit ?? undefined, "each"),
    imageUrl: product.imageUrl,
  };
}

export const SHOPPING_KIOSK_CATALOG: ShoppingCatalogItem[] = HOUSEHOLD_PRODUCT_LIBRARY.map(
  householdProductToCatalogItem,
);

const catalogById = new Map(SHOPPING_KIOSK_CATALOG.map((item) => [item.id, item]));

export function getShoppingCatalogItem(catalogId: string) {
  return catalogById.get(catalogId);
}

export function householdProductToCartLine(product: HouseholdProduct): ShoppingCartLine {
  return {
    id: crypto.randomUUID(),
    catalogId: product.id,
    name: product.productName,
    category: product.category,
    quantity: product.quantity ?? 1,
    unit: normalizeShoppingUnit(product.unit ?? undefined, "each"),
    store: product.store,
    notes: product.notes,
    purchased: product.purchased,
  };
}

export function categoryToStoreSection(category: string): StoreSection {
  const normalized = category.toLowerCase();
  if (normalized.includes("produce")) {
    return "produce";
  }
  if (normalized.includes("dairy") || normalized.includes("egg")) {
    return "dairy";
  }
  if (normalized.includes("meat") || normalized.includes("seafood")) {
    return "meat";
  }
  if (normalized.includes("frozen")) {
    return "frozen";
  }
  if (normalized.includes("household") || normalized.includes("pet food")) {
    return "household";
  }
  return "aisles";
}

export function shoppingStatusLabel(status: ShoppingCatalogItem["status"]) {
  switch (status) {
    case "popular":
      return "Popular";
    case "low-stock":
      return "Low stock";
    case "restock":
      return "Restock";
    default:
      return "";
  }
}

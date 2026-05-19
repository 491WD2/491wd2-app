import type { GroceryCategoryGroup, GroceryCategoryGroupId, GroceryStoreId } from "../types/grocery";

export const GROCERY_STORES = [
  "Safeway",
  "Costco",
  "Amazon",
  "Walmart",
  "Trader Joes",
] as const satisfies readonly GroceryStoreId[];

const FRESH_CATEGORIES = [
  "Produce",
  "Meats",
  "Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Prepared Foods",
] as const;

const PANTRY_CATEGORIES = [
  "Condiments",
  "Canned & Jarred",
  "Grains Pasta & Dry Goods",
  "Baking Supplies",
  "International & Ethnic Foods",
  "Snacks",
  "Beverages",
  "Alcohol",
  "Protein Bars & Supplements",
] as const;

const HOME_CATEGORIES = ["Household & Misc Items", "Pet Food"] as const;

const COLD_CATEGORIES = ["Frozen Foods"] as const;

export const NOTION_CATEGORY_TO_GROUP: Readonly<Record<string, GroceryCategoryGroupId>> = {
  ...Object.fromEntries(FRESH_CATEGORIES.map((category) => [category, "Fresh"] as const)),
  ...Object.fromEntries(PANTRY_CATEGORIES.map((category) => [category, "Pantry"] as const)),
  ...Object.fromEntries(HOME_CATEGORIES.map((category) => [category, "Home"] as const)),
  ...Object.fromEntries(COLD_CATEGORIES.map((category) => [category, "Cold"] as const)),
};

export const GROCERY_CATEGORY_GROUPS = [
  {
    id: "Fresh",
    label: "Fresh",
    categories: FRESH_CATEGORIES,
  },
  {
    id: "Pantry",
    label: "Pantry",
    categories: PANTRY_CATEGORIES,
  },
  {
    id: "Home",
    label: "Home",
    categories: HOME_CATEGORIES,
  },
  {
    id: "Cold",
    label: "Cold",
    categories: COLD_CATEGORIES,
  },
] as const satisfies readonly GroceryCategoryGroup[];

export function getGroceryCategoryGroup(category: string): GroceryCategoryGroupId {
  return NOTION_CATEGORY_TO_GROUP[category] ?? "Pantry";
}

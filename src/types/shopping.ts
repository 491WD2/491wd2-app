export type ShoppingKioskCategoryId =
  | "all"
  | "produce"
  | "dairy"
  | "meat"
  | "pantry"
  | "household"
  | "frozen"
  | "snacks"
  | "drinks";

export type ShoppingAddableCategoryId = Exclude<ShoppingKioskCategoryId, "all">;

export type ShoppingPageAction = "add" | "scan";

export type ShoppingCategoryGroupId = "fresh" | "pantry" | "home" | "cold";

export type ShoppingCategoryGroup = {
  id: ShoppingCategoryGroupId;
  label: string;
  categories: readonly string[];
};

export type ShoppingCatalogStatus = "popular" | "low-stock" | "restock";

export type ShoppingCatalogItem = {
  id: string;
  name: string;
  category: string;
  categoryGroup: "Fresh" | "Pantry" | "Home" | "Cold";
  suggestedQuantity: number;
  unit: string;
  imageUrl: string | null;
  status?: ShoppingCatalogStatus;
};

export type ShoppingUnitId =
  | "each"
  | "count"
  | "dozen"
  | "oz"
  | "lb"
  | "g"
  | "kg"
  | "gallon"
  | "quart"
  | "pint"
  | "liter"
  | "ml"
  | "bottle"
  | "can"
  | "box"
  | "bag"
  | "pack"
  | "bunch"
  | "loaf"
  | "jar";

export type ShoppingCartLine = {
  id: string;
  catalogId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  store: string;
  notes: string;
  purchased: boolean;
};

export type ShoppingDetailDraft = {
  catalogId?: string;
  name: string;
  category: string;
  quantity: string;
  unit: ShoppingUnitId | string;
  store: string;
  notes: string;
};

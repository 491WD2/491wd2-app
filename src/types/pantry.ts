import type { GroceryCategoryGroupId } from "../types/grocery";

export type PantryStatus =
  | "In Stock"
  | "Low Stock"
  | "Expiring Soon"
  | "Expired"
  | "Out of Stock";

export type PantryItem = {
  id: string;
  productName: string;
  /** Display alias kept for existing pantry views. */
  name: string;
  category: string;
  categoryGroup: GroceryCategoryGroupId;
  quantity: number;
  unit: string;
  store: string;
  storageLocation: string;
  /** ISO date string (YYYY-MM-DD) or empty */
  expirationDate: string;
  imageUrl: string | null;
  status: PantryStatus;
  notes: string;
  /** ISO datetime string */
  lastUpdated: string;
};

/** Sort keys for the integrated Pantry tab (frontend-only). */
export type PantrySortKey = "expirationDate" | "name" | "quantity";

export type PantrySortDirection = "asc" | "desc";

export type PantryViewMode = "table" | "cards";

/** Re-export AI insight types used by pantry kiosk + food inventory dashboards. */
export type {
  PantryAISuggestion,
  PantryAIFilter,
  SmartGroceryLine,
} from "./pantryInsights";

/** Stable order for status filter chips in the sidebar. */
export const PANTRY_STATUS_ORDER: readonly PantryStatus[] = [
  "In Stock",
  "Low Stock",
  "Expiring Soon",
  "Expired",
  "Out of Stock",
] as const;

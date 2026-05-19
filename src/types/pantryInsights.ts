/**
 * AI pantry insights — suggestions and smart grocery (no PII / free-text notes).
 */

export type PantrySuggestionKind =
  | "use_first"
  | "low_stock"
  | "replenish"
  | "smart_grocery";

export type PantryAISuggestion = {
  id: string;
  kind: PantrySuggestionKind;
  title: string;
  detail: string;
  /** Related inventory item ids */
  itemIds: string[];
  priority: "high" | "medium" | "low";
  actionLabel?: string;
};

export type SmartGroceryLine = {
  id: string;
  name: string;
  suggestedQty: number;
  unit: string;
  reason: "low_stock" | "usage_pattern" | "expiring_restock";
};

/** Dashboard filter chips (pantry AI panel + list). */
export type PantryAIFilter = "all" | "expiring" | "expired" | "low_stock";

export type PantryUsageRecord = {
  usedCount: number;
  lastUsedAt: string;
};

export type PantryUsageStore = {
  version: 1;
  byItemKey: Record<string, PantryUsageRecord>;
};

/** Normalized row for AI engine (kiosk + food inventory). */
export type PantryInsightItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
  status?: string;
};

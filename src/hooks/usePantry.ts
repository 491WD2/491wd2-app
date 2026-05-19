import { useCallback, useEffect, useMemo, useRef } from "react";
import type { FoodInventoryItem } from "../types/inventory";
import type { PantryItem } from "../types/pantry";
import type {
  PantryAIFilter,
  PantryAISuggestion,
  PantryInsightItem,
  SmartGroceryLine,
} from "../types/pantryInsights";
import {
  buildPantryAISuggestions,
  buildSmartGroceryList,
  filterPantryInsightItems,
} from "../lib/pantryInsightsEngine";
import { recordPantryItemUsed } from "../lib/pantryUsagePatterns";
import type { HubAiSurface } from "../lib/hubAiAnalytics";
import { trackAiSuggestionActed } from "../lib/hubAiAnalytics";

export type UsePantryOptions = {
  items: PantryInsightItem[];
  surface: HubAiSurface;
  aiFilter?: PantryAIFilter;
  categoryFilter?: string | null;
};

export type UsePantryResult = {
  suggestions: PantryAISuggestion[];
  smartGroceryList: SmartGroceryLine[];
  categories: string[];
  filteredItems: PantryInsightItem[];
  recordItemUsed: (item: PantryInsightItem) => void;
  formatGroceryListText: () => string;
  onSuggestionActed: (suggestionId: string, kind: string, action: string) => void;
};

export function pantryItemFromFoodInventory(item: FoodInventoryItem): PantryInsightItem {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expiryDate,
    category: item.category,
  };
}

export function pantryItemFromKiosk(item: PantryItem): PantryInsightItem {
  return {
    id: item.id,
    name: item.productName || item.name,
    quantity: item.quantity,
    unit: item.unit,
    expiryDate: item.expirationDate,
    category: item.category,
    status: item.status,
  };
}

export function usePantry({
  items,
  surface,
  aiFilter = "all",
  categoryFilter = null,
}: UsePantryOptions): UsePantryResult {
  const shownRef = useRef<Set<string>>(new Set());

  const suggestions = useMemo(() => buildPantryAISuggestions(items), [items]);
  const smartGroceryList = useMemo(() => buildSmartGroceryList(items), [items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category.trim()) {
        set.add(item.category);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(
    () => filterPantryInsightItems(items, aiFilter, categoryFilter),
    [items, aiFilter, categoryFilter],
  );

  useEffect(() => {
    for (const s of suggestions) {
      if (shownRef.current.has(s.id)) {
        continue;
      }
      shownRef.current.add(s.id);
      import("../lib/hubAiAnalytics").then(({ trackAiSuggestionShown }) => {
        trackAiSuggestionShown(surface, s.id, s.kind);
      });
    }
  }, [suggestions, surface]);

  const recordItemUsed = useCallback((item: PantryInsightItem) => {
    recordPantryItemUsed(item.name, item.category);
  }, []);

  const formatGroceryListText = useCallback(() => {
    return smartGroceryList
      .map((line) => `${line.name} — ${line.suggestedQty} ${line.unit}`)
      .join("\n");
  }, [smartGroceryList]);

  const onSuggestionActed = useCallback(
    (suggestionId: string, kind: string, action: string) => {
      trackAiSuggestionActed(surface, suggestionId, kind, action);
    },
    [surface],
  );

  return {
    suggestions,
    smartGroceryList,
    categories,
    filteredItems,
    recordItemUsed,
    formatGroceryListText,
    onSuggestionActed,
  };
}

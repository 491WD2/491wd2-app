import { getInventoryExpiryStatus } from "../types/inventory";
import type {
  PantryAISuggestion,
  PantryAIFilter,
  PantryInsightItem,
  SmartGroceryLine,
} from "../types/pantryInsights";
import { getUsageScore } from "./pantryUsagePatterns";

const LOW_STOCK_QTY = 2;

function isLowStock(item: PantryInsightItem): boolean {
  if (item.status === "Low Stock" || item.status === "Out of Stock") {
    return true;
  }
  return item.quantity <= LOW_STOCK_QTY;
}

export function filterPantryInsightItems(
  items: PantryInsightItem[],
  filter: PantryAIFilter,
  category: string | null,
): PantryInsightItem[] {
  return items.filter((item) => {
    if (category && item.category !== category) {
      return false;
    }
    if (filter === "all") {
      return true;
    }
    const expiry = getInventoryExpiryStatus(item.expiryDate);
    if (filter === "expired") {
      return expiry === "expired";
    }
    if (filter === "expiring") {
      return expiry === "soon" || expiry === "expired";
    }
    if (filter === "low_stock") {
      return isLowStock(item);
    }
    return true;
  });
}

export function buildUseFirstSuggestions(items: PantryInsightItem[]): PantryAISuggestion[] {
  const ranked = [...items]
    .filter((i) => i.expiryDate.trim())
    .sort((a, b) => {
      const order = { expired: 0, soon: 1, ok: 2 };
      const sa = order[getInventoryExpiryStatus(a.expiryDate)];
      const sb = order[getInventoryExpiryStatus(b.expiryDate)];
      if (sa !== sb) {
        return sa - sb;
      }
      return a.expiryDate.localeCompare(b.expiryDate);
    })
    .slice(0, 5);

  if (ranked.length === 0) {
    return [];
  }

  return [
    {
      id: "use-first-bundle",
      kind: "use_first",
      title: "Use these first",
      detail: ranked.map((i) => i.name).join(", "),
      itemIds: ranked.map((i) => i.id),
      priority: getInventoryExpiryStatus(ranked[0].expiryDate) === "expired" ? "high" : "medium",
      actionLabel: "Mark top item used",
    },
  ];
}

export function buildLowStockSuggestions(items: PantryInsightItem[]): PantryAISuggestion[] {
  const low = items.filter(isLowStock);
  if (low.length === 0) {
    return [];
  }
  return [
    {
      id: "low-stock-bundle",
      kind: "low_stock",
      title: `${low.length} low-stock item${low.length === 1 ? "" : "s"}`,
      detail: low.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(" · "),
      itemIds: low.map((i) => i.id),
      priority: "high",
      actionLabel: "View smart grocery list",
    },
  ];
}

export function buildReplenishSuggestions(items: PantryInsightItem[]): PantryAISuggestion[] {
  const out = items.filter((i) => i.status === "Out of Stock" || i.quantity === 0);
  if (out.length === 0) {
    return [];
  }
  return [
    {
      id: "replenish-bundle",
      kind: "replenish",
      title: "Restock soon",
      detail: out.map((i) => i.name).join(", "),
      itemIds: out.map((i) => i.id),
      priority: "high",
    },
  ];
}

export function buildSmartGroceryList(items: PantryInsightItem[]): SmartGroceryLine[] {
  const lines: SmartGroceryLine[] = [];

  for (const item of items) {
    if (isLowStock(item)) {
      lines.push({
        id: `grocery-low-${item.id}`,
        name: item.name,
        suggestedQty: Math.max(1, LOW_STOCK_QTY + 1 - item.quantity),
        unit: item.unit,
        reason: "low_stock",
      });
    }
  }

  const usageRanked = [...items]
    .filter((i) => getUsageScore(i.name, i.category) >= 2)
    .sort((a, b) => getUsageScore(b.name, b.category) - getUsageScore(a.name, a.category))
    .slice(0, 5);

  for (const item of usageRanked) {
    if (lines.some((l) => l.name === item.name)) {
      continue;
    }
    if (isLowStock(item)) {
      continue;
    }
    lines.push({
      id: `grocery-usage-${item.id}`,
      name: item.name,
      suggestedQty: 1,
      unit: item.unit,
      reason: "usage_pattern",
    });
  }

  const expiring = items.filter(
    (i) => getInventoryExpiryStatus(i.expiryDate) === "soon" && isLowStock(i),
  );
  for (const item of expiring) {
    if (lines.some((l) => l.id === `grocery-exp-${item.id}`)) {
      continue;
    }
    lines.push({
      id: `grocery-exp-${item.id}`,
      name: item.name,
      suggestedQty: 1,
      unit: item.unit,
      reason: "expiring_restock",
    });
  }

  return lines.slice(0, 12);
}

export function buildPantryAISuggestions(items: PantryInsightItem[]): PantryAISuggestion[] {
  return [
    ...buildUseFirstSuggestions(items),
    ...buildLowStockSuggestions(items),
    ...buildReplenishSuggestions(items),
    ...(buildSmartGroceryList(items).length > 0
      ? [
          {
            id: "smart-grocery",
            kind: "smart_grocery" as const,
            title: "Smart grocery list ready",
            detail: `${buildSmartGroceryList(items).length} items based on stock and usage`,
            itemIds: [],
            priority: "medium" as const,
            actionLabel: "Copy grocery list",
          },
        ]
      : []),
  ];
}

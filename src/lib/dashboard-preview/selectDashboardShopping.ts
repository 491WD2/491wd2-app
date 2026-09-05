import type { FamilyData, ShoppingItem } from "../../data/familyData";

export type DashboardShoppingRow = {
  item: ShoppingItem;
  quantityLabel: string;
  categoryLabel: string | null;
};

export type DashboardShoppingSelection = {
  items: ShoppingItem[];
  rows: DashboardShoppingRow[];
  count: number;
  summaryLabel: string;
  emptyLabel: string;
};

function compareShopping(a: ShoppingItem, b: ShoppingItem): number {
  const needA = a.neededBy?.trim() || "9999-12-31";
  const needB = b.neededBy?.trim() || "9999-12-31";
  const byNeed = needA.localeCompare(needB);
  if (byNeed !== 0) return byNeed;
  return a.name.localeCompare(b.name);
}

function categoryLabel(category: string | undefined): string | null {
  const value = category?.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "other" || lower === "general") return null;
  return value;
}

function quantityLabel(item: ShoppingItem): string {
  return [item.quantity, item.unit].filter(Boolean).join(" ") || "1";
}

function toRow(item: ShoppingItem): DashboardShoppingRow {
  return {
    item,
    quantityLabel: quantityLabel(item),
    categoryLabel: categoryLabel(item.category),
  };
}

/**
 * Active (unpurchased) shopping items, needed-by first, then name.
 */
export function selectDashboardShopping(
  data: FamilyData,
  limit = 5,
): DashboardShoppingSelection {
  const items = (data.shopping ?? [])
    .filter((item) => item && !item.purchased)
    .slice()
    .sort(compareShopping);
  const emptyLabel = "Shopping list is clear.";
  return {
    items,
    rows: items.slice(0, limit).map(toRow),
    count: items.length,
    summaryLabel:
      items.length === 0
        ? emptyLabel
        : items.length === 1
          ? "1 item on the list"
          : `${items.length} items on the list`,
    emptyLabel,
  };
}

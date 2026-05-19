import type { KitchenChecklistItem } from "../data/familyData";

/** Matches legacy `KitchenChecklistPage` — hides put-away helper rows from previews. */
export function isHiddenKitchenChecklistLabel(label: string): boolean {
  return /put\s*away|needs\s*put/i.test(label);
}

export function visibleKitchenChecklistItems(items: KitchenChecklistItem[]): KitchenChecklistItem[] {
  return [...items]
    .filter((item) => !isHiddenKitchenChecklistLabel(item.label))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function kitchenChecklistProgressVisible(
  items: KitchenChecklistItem[],
  today: string,
): { completed: number; total: number } {
  const visible = visibleKitchenChecklistItems(items);
  const total = visible.length;
  const completed = visible.filter((i) => i.checkedDate === today).length;
  return { completed, total };
}

export function toggleKitchenChecklistItemForDate(
  items: KitchenChecklistItem[],
  itemId: string,
  today: string,
): KitchenChecklistItem[] {
  return items.map((item) =>
    item.id === itemId
      ? { ...item, checkedDate: item.checkedDate === today ? undefined : today }
      : item,
  );
}

export function markAllVisibleKitchenChecklistForDate(
  items: KitchenChecklistItem[],
  today: string,
): KitchenChecklistItem[] {
  const visibleIds = new Set(visibleKitchenChecklistItems(items).map((i) => i.id));
  return items.map((item) =>
    visibleIds.has(item.id) ? { ...item, checkedDate: today } : item,
  );
}

export function resetKitchenChecklistCheckedForDate(
  items: KitchenChecklistItem[],
  today: string,
): KitchenChecklistItem[] {
  return items.map((item) =>
    item.checkedDate === today ? { ...item, checkedDate: undefined } : item,
  );
}

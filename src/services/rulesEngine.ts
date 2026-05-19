import type { PantryItem, ShoppingItem, Task } from "../data/familyData";
import { normalizeShoppingName } from "../pages/shopping/shoppingUtils";

/** Case-insensitive match for shopping list de-duplication. */
export function findDuplicateShoppingIndex(
  items: ShoppingItem[],
  name: string,
  onlyNeeded = true,
): number {
  const n = normalizeShoppingName(name);
  if (!n) {
    return -1;
  }
  return items.findIndex(
    (it) =>
      (!onlyNeeded || !it.purchased) && normalizeShoppingName(it.name) === n,
  );
}

export function friendlyPantryLowLine(item: PantryItem): string {
  return `${item.name} is running low.`;
}

export function friendlyPantryOutLine(item: PantryItem): string {
  return `${item.name} is out or nearly empty.`;
}

export function friendlyOverdueChoreLine(title: string): string {
  return `${title} needs attention.`;
}

export function friendlyUpcomingEventLine(title: string, minutes: number): string {
  if (minutes <= 0) {
    return `${title} is starting soon.`;
  }
  return `${title} starts in about ${minutes} minutes.`;
}

export function taskLooksLikeCleaning(t: Task): boolean {
  const z = (t.zone ?? "").toLowerCase();
  const c = (t.category ?? "").toLowerCase();
  const title = t.title.toLowerCase();
  return (
    t.type === "chore" ||
    c.includes("clean") ||
    z.includes("kitchen") ||
    title.includes("trash") ||
    title.includes("clean")
  );
}

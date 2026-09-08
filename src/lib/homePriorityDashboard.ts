import type { PantryItem, ShoppingItem } from "../data/familyData";
import { isInventoryExpiringSoon, isInventoryLowStock } from "../pages/inventory/inventoryUtils";

export type HomeShoppingSummary = {
  open: ShoppingItem[];
  preview: ShoppingItem[];
  dueSoon: ShoppingItem[];
  restock: ShoppingItem[];
  recent: ShoppingItem[];
};

export type HomePantryBadge = "Out" | "Low" | "Use soon";

export type HomePantryAttentionRow = {
  item: PantryItem;
  badge: HomePantryBadge;
};

export type HomePantrySummary = {
  activeCount: number;
  out: PantryItem[];
  low: PantryItem[];
  expiring: PantryItem[];
  attention: HomePantryAttentionRow[];
  recent: PantryItem[];
};

function localIsoFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addLocalDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoFromDate(date);
}

export function eventWhenChip(dateIso: string, todayIso: string): string {
  if (dateIso === todayIso) return "Today";
  if (dateIso === addLocalDaysIso(todayIso, 1)) return "Tomorrow";
  const parsed = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function createdStamp(item: { createdAt?: string; updatedAt?: string }): string {
  return item.createdAt || item.updatedAt || "";
}

export function summarizeShoppingForHome(
  items: ShoppingItem[] | undefined,
  todayIso: string,
  previewLimit = 6,
): HomeShoppingSummary {
  const open = (items ?? []).filter((item) => item && !item.purchased);
  const dueSoon = open.filter((item) => Boolean(item.neededBy) && item.neededBy <= todayIso);
  const restock = open.filter((item) => Boolean(item.sourcePantryItemId));
  const recent = [...open]
    .sort((a, b) => createdStamp(b).localeCompare(createdStamp(a)))
    .slice(0, 3);
  return {
    open,
    preview: open.slice(0, previewLimit),
    dueSoon,
    restock,
    recent,
  };
}

export function isShoppingItemDueSoon(item: ShoppingItem, todayIso: string): boolean {
  return Boolean(item.neededBy) && item.neededBy <= todayIso;
}

export function summarizePantryForHome(
  items: PantryItem[] | undefined,
  attentionLimit = 5,
): HomePantrySummary {
  const active = (items ?? []).filter((item) => item && !item.inactiveInInventory);
  const out = active.filter((item) => item.status === "Out");
  const low = active.filter(
    (item) => item.status !== "Out" && (item.status === "Low" || isInventoryLowStock(item)),
  );
  const expiring = active.filter((item) => item.useSoonMarked || isInventoryExpiringSoon(item));

  const seen = new Set<string>();
  const attention: HomePantryAttentionRow[] = [];
  const push = (item: PantryItem, badge: HomePantryBadge) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    attention.push({ item, badge });
  };
  out.forEach((item) => push(item, "Out"));
  low.forEach((item) => push(item, "Low"));
  expiring.forEach((item) => push(item, "Use soon"));

  const recent = [...active]
    .sort((a, b) => (b.lastUpdated || b.createdAt || "").localeCompare(a.lastUpdated || a.createdAt || ""))
    .slice(0, 3);

  return {
    activeCount: active.length,
    out,
    low,
    expiring,
    attention: attention.slice(0, attentionLimit),
    recent,
  };
}

export function weatherPlaceholderCopy(now: Date): { title: string; detail: string } {
  const hour = now.getHours();
  if (hour < 5) return { title: "Overnight", detail: "Local forecast not connected" };
  if (hour < 12) return { title: "This morning", detail: "Local forecast not connected" };
  if (hour < 17) return { title: "This afternoon", detail: "Local forecast not connected" };
  if (hour < 21) return { title: "This evening", detail: "Local forecast not connected" };
  return { title: "Tonight", detail: "Local forecast not connected" };
}

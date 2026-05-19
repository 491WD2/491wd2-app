import type {
  FamilyMember,
  HouseholdNotification,
  HouseholdNotificationType,
} from "../data/familyData";

/** Match canonical roster first names only — skips safely if renamed. */
export function memberIdsByFirstNames(
  members: FamilyMember[],
  firstNames: string[],
): string[] {
  const want = new Set(firstNames.map((n) => n.trim().toLowerCase()));
  return members
    .filter((m) => {
      const first = m.name.trim().split(/\s+/)[0]?.toLowerCase();
      return Boolean(first && want.has(first));
    })
    .map((m) => m.id);
}

export function createInventoryStockNotifications(input: {
  recipientMemberIds: string[];
  itemName: string;
  kind: "low" | "out";
  shoppingAdded: boolean;
  pantryItemId?: string;
}): HouseholdNotification[] {
  const now = new Date().toISOString();
  const title =
    input.kind === "out"
      ? `${input.itemName} is out.`
      : `${input.itemName} is running low.`;
  const body = input.shoppingAdded
    ? `${input.itemName} was added to the shopping list.`
    : "Add it to the shopping list when you’re ready.";
  const type: HouseholdNotificationType =
    input.kind === "out" ? "inventory_out" : "inventory_low";

  return input.recipientMemberIds.map((recipientMemberId) => ({
    id: crypto.randomUUID(),
    recipientMemberId,
    type,
    title,
    body,
    relatedEntityType: input.pantryItemId ? "pantryItem" : undefined,
    relatedEntityId: input.pantryItemId,
    createdAt: now,
  }));
}

export function prependNotifications(
  dataNotifications: HouseholdNotification[],
  incoming: HouseholdNotification[],
): HouseholdNotification[] {
  return [...incoming, ...dataNotifications].slice(0, 500);
}

/**
 * Collapse repeat alerts for the same pantry-linked inventory signal per recipient
 * (keeps the newest).
 */
export function dedupeNotificationsForDisplay(
  notifications: HouseholdNotification[],
): HouseholdNotification[] {
  const best = new Map<string, HouseholdNotification>();
  for (const n of notifications) {
    const dedupeKey =
      n.relatedEntityId &&
      (n.type === "inventory_low" ||
        n.type === "inventory_out" ||
        n.type === "shopping_added" ||
        n.type === "kitchen_duty" ||
        n.type === "pet_flea_med_due" ||
        n.type === "chore_due" ||
        n.type === "calendar_reminder")
        ? `${n.type}:${n.relatedEntityId}:${n.recipientMemberId}`
        : n.id;
    const prev = best.get(dedupeKey);
    if (!prev || n.createdAt > prev.createdAt) {
      best.set(dedupeKey, n);
    }
  }
  return [...best.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

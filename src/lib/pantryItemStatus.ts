import { getInventoryExpiryStatus } from "../types/inventory";
import type { PantryItemStatus } from "../types/cards";

const LOW_STOCK_QTY = 2;

export function resolvePantryItemStatus(input: {
  expiryDate: string;
  quantity: number;
  status?: string;
}): PantryItemStatus {
  if (input.status === "Low Stock" || input.status === "Out of Stock" || input.quantity <= LOW_STOCK_QTY) {
    return "low-stock";
  }
  const expiry = getInventoryExpiryStatus(input.expiryDate);
  if (expiry === "expired") {
    return "expired";
  }
  if (expiry === "soon") {
    return "expiring";
  }
  return "good";
}

export function pantryStatusLabel(status: PantryItemStatus): string {
  switch (status) {
    case "expired":
      return "Expired";
    case "expiring":
      return "Expiring soon";
    case "low-stock":
      return "Low stock";
    default:
      return "Good";
  }
}

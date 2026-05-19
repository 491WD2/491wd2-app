import type { PantryItem } from "../data/familyData";

/** Prefer packaged best-by; falls back to legacy `expiryDate`. */
export function effectiveBestByDate(item: PantryItem): string | undefined {
  const b = item.bestByDate?.trim();
  if (b) {
    return b;
  }
  const e = item.expiryDate?.trim();
  return e || undefined;
}

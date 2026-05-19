import type { PantryItem } from "../data/familyData";
import { normalizeBarcode } from "../services/openFoodFacts";
import { effectiveBestByDate } from "./inventoryDates";

export function normalizeInventoryNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type BatchMatchResult = {
  /** Same barcode + same best-by (when both sides have dates). */
  exactBatch: PantryItem[];
  /** Same barcode but different best-by — separate rotation batch. */
  differentBestBy: PantryItem[];
  /** Same normalized product title / name (fallback when barcode missing). */
  similarName: PantryItem[];
};

export function findBatchMatches(
  pantry: PantryItem[],
  draft: {
    barcode?: string;
    name: string;
    productName?: string;
    bestByDate?: string;
    storageArea?: string;
  },
): BatchMatchResult {
  const bc = draft.barcode?.trim();
  const normBc = bc ? normalizeBarcode(bc) : "";
  const titleKey = normalizeInventoryNameKey(draft.productName || draft.name);
  const best = draft.bestByDate?.trim();
  const area = draft.storageArea?.trim();

  const sameBarcode = normBc
    ? pantry.filter((p) => p.barcode && normalizeBarcode(p.barcode) === normBc)
    : [];

  const exactBatch = sameBarcode.filter((p) => {
    const pb = effectiveBestByDate(p);
    if (best && pb) {
      return pb === best;
    }
    return Boolean(best) === Boolean(pb) && pb === best;
  });

  const differentBestBy = sameBarcode.filter((p) => {
    const pb = effectiveBestByDate(p);
    if (!best && !pb) {
      return false;
    }
    if (best && pb && pb !== best) {
      return true;
    }
    return Boolean(best) !== Boolean(pb);
  });

  const similarName = pantry.filter((p) => {
    const pn = normalizeInventoryNameKey(p.productName ?? p.name);
    if (!titleKey || pn !== titleKey) {
      return false;
    }
    if (area && p.storageArea !== area) {
      return false;
    }
    return true;
  });

  return { exactBatch, differentBestBy, similarName };
}

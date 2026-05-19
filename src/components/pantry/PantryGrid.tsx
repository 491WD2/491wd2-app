import { useMemo } from "react";
import { ScanLine } from "lucide-react";
import { boardEmptyStateForChip, matchesPantryBoardChip } from "../../lib/pantryBoard";
import { trackCardScan } from "../../lib/kioskCardAnalytics";
import type { FoodInventoryItem, FoodStorageLocation } from "../../types/inventory";
import type { PantryBoardChip } from "../../types/pantryBoard";
import { PantryItemCard } from "./PantryItemCard";
import "../../styles/pantry-shopping-grofast.css";

export { PantryKioskGrid, SAMPLE_PANTRY_ITEMS } from "./PantryKioskGridLegacy";
export type { PantryKioskGridProps } from "./PantryKioskGridLegacy";

export type PantryGridProps = {
  items: FoodInventoryItem[];
  chip?: PantryBoardChip;
  onUse: (id: string) => void;
  onEdit: (item: FoodInventoryItem) => void;
  onMove: (id: string, location: FoodStorageLocation) => void;
  onReorder: (item: FoodInventoryItem) => void;
  onAddToShopping?: (item: FoodInventoryItem) => void;
  onScanRequest?: () => void;
  emptyTitle?: string;
  emptyHint?: string;
  analyticsSurface?: string;
};

/** GroFast-style responsive product grid for `/pantry?view=pantry`. */
export function PantryGrid({
  items,
  chip = "all",
  onUse,
  onEdit,
  onMove,
  onReorder,
  onAddToShopping,
  onScanRequest,
  emptyTitle = "No items in this view",
  emptyHint = "Try another filter or scan a product.",
  analyticsSurface = "pantry:food-inventory",
}: PantryGridProps) {
  const filtered = useMemo(
    () =>
      [...items]
        .filter((item) => matchesPantryBoardChip(item, chip))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, chip],
  );

  const emptyState = boardEmptyStateForChip(chip);

  if (filtered.length === 0) {
    return (
      <div className="gf-pantry-empty" role="status">
        <p className="gf-pantry-empty__title">{emptyState?.title ?? emptyTitle}</p>
        <p className="gf-pantry-empty__hint">{emptyState?.hint ?? emptyHint}</p>
        {onScanRequest ? (
          <button
            type="button"
            className="gf-pantry-item__btn gf-pantry-item__btn--primary mt-6"
            style={{ display: "inline-flex", margin: "24px auto 0", maxWidth: 240 }}
            onClick={() => {
              trackCardScan(analyticsSurface);
              onScanRequest();
            }}
          >
            <ScanLine className="h-5 w-5" aria-hidden />
            Scan barcode
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="gf-pantry-grid" aria-label="Pantry items">
      {filtered.map((item) => (
        <li key={item.id}>
          <PantryItemCard
            item={item}
            onUse={onUse}
            onEdit={onEdit}
            onMove={onMove}
            onReorder={onReorder}
            onAddToShopping={onAddToShopping}
            analyticsSurface={analyticsSurface}
          />
        </li>
      ))}
    </ul>
  );
}

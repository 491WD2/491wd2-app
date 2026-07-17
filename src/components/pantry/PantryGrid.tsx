import type { CSSProperties } from "react";
import { useMemo } from "react";
import { ScanLine } from "lucide-react";
import { boardEmptyStateForChip, matchesPantryBoardChip } from "../../lib/pantryBoard";
import { trackCardScan } from "../../lib/kioskCardAnalytics";
import { getGroceryCategoryTheme } from "../../lib/groceryCategoryTheme";
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
  variant?: "default" | "kiosk" | "inventory";
  groupByCategory?: boolean;
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
  variant = "default",
  groupByCategory = false,
}: PantryGridProps) {
  const filtered = useMemo(
    () =>
      [...items]
        .filter((item) => matchesPantryBoardChip(item, chip))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [items, chip],
  );

  const emptyState = boardEmptyStateForChip(chip);

  const groups = useMemo(() => {
    if (!groupByCategory) {
      return [];
    }
    const map = new Map<string, FoodInventoryItem[]>();
    for (const item of filtered) {
      const key = item.category?.trim() || "Uncategorized";
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return [...map.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, categoryItems]) => ({
        category,
        items: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filtered, groupByCategory]);

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

  if (groupByCategory) {
    return (
      <div className="gf-pantry-inventory-sections" aria-label="Pantry items by category">
        {groups.map((group) => {
          const theme = getGroceryCategoryTheme(group.category);
          return (
            <section
              key={group.category}
              className="gf-pantry-inventory-section"
              style={
                {
                  "--gf-pantry-section-accent": theme.accent,
                  "--gf-pantry-section-soft": theme.soft,
                } as CSSProperties
              }
            >
              <div className="gf-pantry-inventory-section__head">
                <div>
                  <p className="gf-pantry-inventory-section__eyebrow">Category</p>
                  <h3 className="gf-pantry-inventory-section__title">{group.category}</h3>
                </div>
                <span className="gf-pantry-inventory-section__count">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="gf-pantry-grid gf-pantry-grid--inventory" aria-label={`${group.category} pantry items`}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <PantryItemCard
                      item={item}
                      onUse={onUse}
                      onEdit={onEdit}
                      onMove={onMove}
                      onReorder={onReorder}
                      onAddToShopping={onAddToShopping}
                      analyticsSurface={analyticsSurface}
                      variant={variant}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
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
            variant={variant}
          />
        </li>
      ))}
    </ul>
  );
}

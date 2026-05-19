import { ArrowRightLeft, Check, Pencil, RotateCcw } from "lucide-react";
import {
  formatInventoryExpiryLabel,
  getInventoryExpiryStatus,
  INVENTORY_LOCATION_META,
  type FoodInventoryItem,
  type FoodStorageLocation,
} from "../../types/inventory";
import { isUseFirstItem, isLowStockItem, isExpiredItem } from "../../lib/pantryBoard";
import { pantryStatusLabel, resolvePantryItemStatus } from "../../lib/pantryItemStatus";
import {
  trackCardAction,
  trackCardComplete,
  trackCardEdit,
} from "../../lib/kioskCardAnalytics";
import { cn } from "../../lib/utils";
import "./pantry-board.css";

const CATEGORY_EMOJI: Record<string, string> = {
  Produce: "🥬",
  Dairy: "🥛",
  Meat: "🥩",
  Frozen: "🧊",
  Snacks: "🍿",
  Bakery: "🥖",
  "Dry goods": "🌾",
  Prepared: "🍱",
  General: "📦",
};

const ANALYTICS_SURFACE = "pantry:food-inventory";

export type PantryBoardCardProps = {
  item: FoodInventoryItem;
  onUse: (id: string) => void;
  onEdit: (item: FoodInventoryItem) => void;
  onMove: (id: string, location: FoodStorageLocation) => void;
  onReorder: (item: FoodInventoryItem) => void;
};

export function PantryBoardCard({ item, onUse, onEdit, onMove, onReorder }: PantryBoardCardProps) {
  const expiry = getInventoryExpiryStatus(item.expiryDate);
  const useFirst = isUseFirstItem(item) && !isExpiredItem(item);
  const low = isLowStockItem(item);
  const status = resolvePantryItemStatus({
    expiryDate: item.expiryDate,
    quantity: item.quantity,
  });
  const locLabel = INVENTORY_LOCATION_META[item.location].label;
  const emoji = CATEGORY_EMOJI[item.category] ?? "🏷️";
  const nextLocations = (["pantry", "fridge", "freezer"] as const).filter(
    (loc) => loc !== item.location,
  );

  return (
    <article
      className={cn(
        "fh-pantry-product",
        useFirst && "fh-pantry-product--use-first",
        expiry === "expired" && "fh-pantry-product--expired",
        low && "fh-pantry-product--low",
      )}
    >
      <div className="fh-pantry-product__media">
        {useFirst ? <span className="fh-pantry-product__use-first">Use First</span> : null}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="fh-pantry-product__placeholder" aria-hidden>
            {emoji}
          </span>
        )}
        <span className="fh-pantry-product__qty">
          {item.quantity} {item.unit}
        </span>
      </div>

      <h3 className="fh-pantry-product__name">{item.name}</h3>

      <div className="fh-pantry-product__badges">
        <span
          className={cn(
            "fh-pantry-product__badge",
            expiry === "expired"
              ? "fh-pantry-product__badge--expiry-expired"
              : expiry === "soon"
                ? "fh-pantry-product__badge--expiry-soon"
                : "fh-pantry-product__badge--expiry-ok",
          )}
        >
          {expiry === "expired" ? "Expired" : formatInventoryExpiryLabel(item.expiryDate)}
        </span>
        <span className="fh-pantry-product__badge fh-pantry-product__badge--loc">{locLabel}</span>
        {item.source === "scan" || item.barcode ? (
          <span className="fh-pantry-product__badge fh-pantry-product__badge--scan">Scanned</span>
        ) : null}
        {low ? (
          <span className="fh-pantry-product__badge fh-pantry-product__badge--expiry-soon">
            {pantryStatusLabel(status)}
          </span>
        ) : null}
      </div>

      <div className="fh-pantry-product__actions">
        <button
          type="button"
          className="fh-pantry-product__btn fh-pantry-product__btn--primary"
          onClick={() => {
            trackCardComplete(ANALYTICS_SURFACE, item.id);
            onUse(item.id);
          }}
        >
          <Check className="inline h-4 w-4" aria-hidden />
          Use
        </button>
        <button
          type="button"
          className="fh-pantry-product__btn"
          onClick={() => {
            trackCardEdit(ANALYTICS_SURFACE, item.id);
            onEdit(item);
          }}
        >
          <Pencil className="inline h-4 w-4" aria-hidden />
          Edit
        </button>
        {nextLocations[0] ? (
          <button
            type="button"
            className="fh-pantry-product__btn"
            onClick={() => {
              trackCardAction(ANALYTICS_SURFACE, "move", item.id);
              onMove(item.id, nextLocations[0]!);
            }}
          >
            <ArrowRightLeft className="inline h-4 w-4" aria-hidden />
            Move
          </button>
        ) : null}
        <button
          type="button"
          className="fh-pantry-product__btn fh-pantry-product__btn--accent"
          onClick={() => {
            trackCardAction(ANALYTICS_SURFACE, "reorder", item.id);
            onReorder(item);
          }}
        >
          <RotateCcw className="inline h-4 w-4" aria-hidden />
          Reorder
        </button>
      </div>
    </article>
  );
}

import { ArrowRightLeft, Check, Pencil, RotateCcw, ShoppingCart } from "lucide-react";
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
import "../../styles/pantry-shopping-grofast.css";

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

export type PantryItemCardProps = {
  item: FoodInventoryItem;
  onUse: (id: string) => void;
  onEdit: (item: FoodInventoryItem) => void;
  onMove: (id: string, location: FoodStorageLocation) => void;
  onReorder: (item: FoodInventoryItem) => void;
  onAddToShopping?: (item: FoodInventoryItem) => void;
  analyticsSurface?: string;
};

export function PantryItemCard({
  item,
  onUse,
  onEdit,
  onMove,
  onReorder,
  onAddToShopping,
  analyticsSurface = "pantry:food-inventory",
}: PantryItemCardProps) {
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
    <article className="gf-pantry-item">
      <div className="gf-pantry-item__media">
        {useFirst ? <span className="gf-pantry-item__use-first">Expiring</span> : null}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="gf-pantry-item__placeholder" aria-hidden>
            {emoji}
          </span>
        )}
      </div>

      <div className="gf-pantry-item__body">
        <h3 className="gf-pantry-item__name">{item.name}</h3>
        <p className="gf-pantry-item__meta">
          {item.quantity} {item.unit} · {locLabel}
        </p>

        <div className="gf-pantry-item__badges">
          <span
            className={cn(
              "gf-pantry-item__badge",
              expiry === "expired"
                ? "gf-pantry-item__badge--expiry-expired"
                : expiry === "soon"
                  ? "gf-pantry-item__badge--expiry-soon"
                  : "gf-pantry-item__badge--expiry-ok",
            )}
          >
            {expiry === "expired" ? "Expired" : formatInventoryExpiryLabel(item.expiryDate)}
          </span>
          <span className="gf-pantry-item__badge gf-pantry-item__badge--loc">{locLabel}</span>
          <span className="gf-pantry-item__badge gf-pantry-item__badge--cat">{item.category}</span>
          {item.source === "scan" || item.barcode ? (
            <span className="gf-pantry-item__badge gf-pantry-item__badge--scan">Scanned</span>
          ) : null}
          {low ? (
            <span className="gf-pantry-item__badge gf-pantry-item__badge--expiry-soon">
              {pantryStatusLabel(status)}
            </span>
          ) : null}
        </div>

        <div className="gf-pantry-item__actions">
          <button
            type="button"
            className="gf-pantry-item__btn gf-pantry-item__btn--primary"
            onClick={() => {
              trackCardComplete(analyticsSurface, item.id);
              onUse(item.id);
            }}
          >
            <Check className="h-4 w-4" aria-hidden />
            Use
          </button>
          <button
            type="button"
            className="gf-pantry-item__btn"
            onClick={() => {
              trackCardEdit(analyticsSurface, item.id);
              onEdit(item);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </button>
          {nextLocations[0] ? (
            <button
              type="button"
              className="gf-pantry-item__btn"
              onClick={() => {
                trackCardAction(analyticsSurface, "move", item.id);
                onMove(item.id, nextLocations[0]!);
              }}
            >
              <ArrowRightLeft className="h-4 w-4" aria-hidden />
              Move
            </button>
          ) : null}
          <button
            type="button"
            className="gf-pantry-item__btn"
            onClick={() => {
              trackCardAction(analyticsSurface, "reorder", item.id);
              onReorder(item);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reorder
          </button>
          {onAddToShopping ? (
            <button
              type="button"
              className="gf-pantry-item__btn gf-pantry-item__btn--cart"
              onClick={() => {
                trackCardAction(analyticsSurface, "add_shopping", item.id);
                onAddToShopping(item);
              }}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden />
              Add to shopping list
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

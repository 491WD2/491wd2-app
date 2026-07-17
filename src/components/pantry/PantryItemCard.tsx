import type { CSSProperties } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  Check,
  MapPin,
  Package,
  Pencil,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import {
  formatInventoryExpiryLabel,
  getInventoryExpiryStatus,
  INVENTORY_LOCATION_META,
  type FoodInventoryItem,
  type FoodStorageLocation,
} from "../../types/inventory";
import { getGroceryCategoryTheme } from "../../lib/groceryCategoryTheme";
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
  variant?: "default" | "kiosk" | "inventory";
};

export function PantryItemCard({
  item,
  onUse,
  onEdit,
  onMove,
  onReorder,
  onAddToShopping,
  analyticsSurface = "pantry:food-inventory",
  variant = "default",
}: PantryItemCardProps) {
  const expiry = getInventoryExpiryStatus(item.expiryDate);
  const useFirst = isUseFirstItem(item) && !isExpiredItem(item);
  const low = isLowStockItem(item);
  const status = resolvePantryItemStatus({
    expiryDate: item.expiryDate,
    quantity: item.quantity,
  });
  const locLabel = INVENTORY_LOCATION_META[item.location]?.label ?? "Pantry";
  const category = item.category?.trim() || "General";
  const emoji = CATEGORY_EMOJI[category] ?? "🏷️";
  const theme = getGroceryCategoryTheme(category);
  const nextLocations = (["pantry", "fridge", "freezer"] as const).filter(
    (loc) => loc !== item.location,
  );
  const inventoryVariant = variant === "inventory";
  const kioskVariant = variant === "kiosk" || inventoryVariant;

  return (
    <article
      className={cn(
        "gf-pantry-item",
        kioskVariant && "gf-pantry-item--kiosk",
        inventoryVariant && "gf-pantry-item--inventory",
        useFirst && "gf-pantry-item--use-first",
        low && "gf-pantry-item--low",
        expiry === "expired" && "gf-pantry-item--expired",
      )}
      style={
        {
          "--gf-pantry-card-accent": theme.accent,
          "--gf-pantry-card-soft": theme.soft,
        } as CSSProperties
      }
    >
      <div className="gf-pantry-item__media">
        {useFirst ? <span className="gf-pantry-item__use-first">Expiring</span> : null}
        {kioskVariant ? (
          <span className="gf-pantry-item__qty-pill">
            {inventoryVariant ? <span className="gf-pantry-item__qty-label">Qty</span> : null}
            {item.quantity} {item.unit}
          </span>
        ) : null}
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
        {kioskVariant ? (
          <div className="gf-pantry-item__meta-grid" aria-label="Item details">
            <span>
              <Package className="h-3.5 w-3.5" aria-hidden />
              {category}
            </span>
            <span>
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {locLabel}
            </span>
            <span>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatInventoryExpiryLabel(item.expiryDate)}
            </span>
          </div>
        ) : (
          <p className="gf-pantry-item__meta">
            {item.quantity} {item.unit} · {locLabel}
          </p>
        )}

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
          <span className="gf-pantry-item__badge gf-pantry-item__badge--cat">{category}</span>
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
            Used one
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
            Details
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
              Move spot
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
            Need more
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
              Add to list
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

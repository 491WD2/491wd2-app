import { Check, Minus, Plus, X } from "lucide-react";
import type { CSSProperties } from "react";
import { getGroceryCategoryTheme } from "../../lib/groceryCategoryTheme";
import { cn } from "../../lib/utils";
import type { GroceryCartLine } from "../../types/grocery";
import "../../styles/pantry-shopping-grofast.css";

export type ShoppingListCardProps = {
  line: GroceryCartLine;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onOpenDetails?: (line: GroceryCartLine) => void;
  variant?: "card" | "table";
};

export function ShoppingListCard({
  line,
  onTogglePurchased,
  onQuantityChange,
  onRemove,
  onOpenDetails,
  variant = "card",
}: ShoppingListCardProps) {
  const letter = line.productName.trim().charAt(0).toUpperCase() || "?";
  const theme = getGroceryCategoryTheme(line.category);
  const storeLabel = line.store.trim() || "No store";
  const quantityLabel = `${line.quantity} ${line.unit}`.trim();
  const statusLabel = line.purchased ? "Purchased" : "Need";
  const quantityControls = (
    <div className="gf-shopping-item__qty">
      <button
        type="button"
        className="gf-shopping-item__qty-btn"
        aria-label={`Decrease ${line.productName}`}
        onClick={() => onQuantityChange(line.id, line.quantity - 1)}
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="gf-shopping-item__qty-val">{line.quantity}</span>
      <button
        type="button"
        className="gf-shopping-item__qty-btn gf-shopping-item__qty-btn--plus"
        aria-label={`Increase ${line.productName}`}
        onClick={() => onQuantityChange(line.id, line.quantity + 1)}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
  const removeButton = (
    <button
      type="button"
      className="gf-shopping-item__remove"
      aria-label={`Remove ${line.productName}`}
      onClick={() => onRemove(line.id)}
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );

  return (
    <li
      className={cn(
        "gf-shopping-item",
        variant === "table" && "gf-shopping-item--table",
        line.purchased && "gf-shopping-item--checked",
      )}
      style={
        {
          "--gf-shopping-row-accent": theme.accent,
          "--gf-shopping-row-soft": theme.soft,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className={cn(
          "gf-shopping-item__check",
          line.purchased && "gf-shopping-item__check--on",
        )}
        aria-label={line.purchased ? `Mark ${line.productName} not done` : `Mark ${line.productName} done`}
        onClick={() => onTogglePurchased(line.id, !line.purchased)}
      >
        {line.purchased ? <Check className="h-4 w-4" aria-hidden /> : null}
      </button>

      <button
        type="button"
        className="gf-shopping-item__main"
        onClick={() => onOpenDetails?.(line)}
        aria-disabled={!onOpenDetails}
      >
        <span className="gf-shopping-item__thumb" aria-hidden>
          {line.imageUrl ? (
            <img src={line.imageUrl} alt="" loading="lazy" />
          ) : (
            <span className="gf-shopping-item__letter">{letter}</span>
          )}
        </span>
        <span className="gf-shopping-item__copy">
          <p className="gf-shopping-item__name">{line.productName}</p>
          {variant === "table" ? (
            <span className="gf-shopping-item__detail-row" aria-label="Shopping item details">
              <span className="gf-shopping-item__pill gf-shopping-item__pill--category">
                {line.category}
              </span>
              <span className="gf-shopping-item__pill gf-shopping-item__pill--status">
                {statusLabel}
              </span>
            </span>
          ) : null}
          {variant === "card" ? (
            <span className="gf-shopping-item__meta" aria-label="Shopping item details">
              <span className="gf-shopping-item__pill">
                {quantityLabel}
              </span>
              <span className="gf-shopping-item__pill gf-shopping-item__pill--store">
                {storeLabel}
              </span>
              <span className="gf-shopping-item__pill gf-shopping-item__pill--category">
                {line.category}
              </span>
            </span>
          ) : null}
          {line.notes.trim() ? (
            <p className="gf-shopping-item__sub gf-shopping-item__note">{line.notes.trim()}</p>
          ) : null}
        </span>
      </button>

      {variant === "table" ? (
        <>
          <span className="gf-shopping-item__store-cell">
            <span className="gf-shopping-item__pill gf-shopping-item__pill--store">
              {storeLabel}
            </span>
          </span>
          <span className="gf-shopping-item__amount-cell">
            <span className="gf-shopping-item__amount-text">
              {quantityLabel}
            </span>
            {quantityControls}
          </span>
          <span className="gf-shopping-item__actions-cell">{removeButton}</span>
        </>
      ) : (
        <div className="gf-shopping-item__side">
          {removeButton}
          {quantityControls}
        </div>
      )}
    </li>
  );
}

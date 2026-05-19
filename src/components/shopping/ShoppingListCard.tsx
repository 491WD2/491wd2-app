import { Check, Minus, Plus, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { GroceryCartLine } from "../../types/grocery";
import "../../styles/pantry-shopping-grofast.css";

export type ShoppingListCardProps = {
  line: GroceryCartLine;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export function ShoppingListCard({
  line,
  onTogglePurchased,
  onQuantityChange,
  onRemove,
}: ShoppingListCardProps) {
  const letter = line.productName.trim().charAt(0).toUpperCase() || "?";

  return (
    <li
      className={cn("gf-shopping-item", line.purchased && "gf-shopping-item--checked")}
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

      <div className="gf-shopping-item__thumb" aria-hidden>
        {line.imageUrl ? (
          <img src={line.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="gf-shopping-item__letter">{letter}</span>
        )}
      </div>

      <div className="gf-shopping-item__copy">
        <p className="gf-shopping-item__name">{line.productName}</p>
        <p className="gf-shopping-item__sub">
          {line.quantity} {line.unit}
          {line.store.trim() ? ` · ${line.store.trim()}` : ""}
        </p>
        {line.notes.trim() ? (
          <p className="gf-shopping-item__sub">{line.notes.trim()}</p>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          className="gf-shopping-item__remove"
          aria-label={`Remove ${line.productName}`}
          onClick={() => onRemove(line.id)}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
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
      </div>
    </li>
  );
}

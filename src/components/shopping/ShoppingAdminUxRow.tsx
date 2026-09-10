import { Check } from "lucide-react";
import type { GroceryCartLine } from "../../types/grocery";
import type { PantryItem } from "../../data/familyData";

type Props = {
  line: GroceryCartLine;
  linkedPantryName?: string | null;
  requestedBy?: string | null;
  dueSoon?: boolean;
  isRestock?: boolean;
  onMarkPurchased: () => void;
  onMoveBack?: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onAddToInventory?: () => void;
  onQuantityChange?: (quantity: number) => void;
  mode: "need" | "purchased";
};

export function ShoppingAdminUxRow({
  line,
  linkedPantryName,
  requestedBy,
  dueSoon = false,
  isRestock = false,
  onMarkPurchased,
  onMoveBack,
  onDelete,
  onEdit,
  onAddToInventory,
  onQuantityChange,
  mode,
}: Props) {
  const qty = `${line.quantity}${line.unit ? ` ${line.unit}` : ""}`;
  const purchased = mode === "purchased";

  return (
    <article className="aux-shopping-row">
      <div className="aux-shopping-row__lead">
        <button
          type="button"
          className={purchased ? "aux-shopping-row__check is-done" : "aux-shopping-row__check"}
          onClick={purchased ? () => onMoveBack?.() : onMarkPurchased}
          aria-label={
            purchased
              ? `Mark ${line.productName} as still needed`
              : `Mark ${line.productName} purchased`
          }
        >
          <Check className="h-5 w-5" aria-hidden />
        </button>
        <div>
          <p className="aux-shopping-row__name">{line.productName}</p>
          <p className="aux-shopping-row__meta">
            {line.store.trim() || "No store"}
            {line.notes.trim() ? ` · ${line.notes.trim()}` : ""}
          </p>
          <div className="aux-shopping-row__flags">
            {dueSoon ? <span className="fh-ops-badge fh-ops-badge--due">Due</span> : null}
            {isRestock ? <span className="fh-ops-badge fh-ops-badge--restock">Restock</span> : null}
            {linkedPantryName ? (
              <span className="fh-ops-badge fh-ops-badge--on-list">Pantry: {linkedPantryName}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div>
        {onQuantityChange ? (
          <div className="aux-shopping-row__actions">
            <button type="button" aria-label={`Decrease ${line.productName}`} onClick={() => onQuantityChange(line.quantity - 1)}>
              −
            </button>
            <span className="aux-shopping-row__name">{qty}</span>
            <button type="button" aria-label={`Increase ${line.productName}`} onClick={() => onQuantityChange(line.quantity + 1)}>
              +
            </button>
          </div>
        ) : (
          <p className="aux-shopping-row__name">{qty}</p>
        )}
      </div>
      <div>
        <p className="aux-shopping-row__meta">{line.category || "—"}</p>
        {requestedBy ? <p className="aux-shopping-row__meta">Requested by {requestedBy}</p> : null}
      </div>
      <div>
        <p className="aux-shopping-row__meta">
          {linkedPantryName ? `Linked: ${linkedPantryName}` : "No pantry link"}
        </p>
      </div>
      <div className="aux-shopping-row__actions">
        {mode === "need" ? (
          <button type="button" className="is-primary" onClick={onMarkPurchased}>
            Mark Purchased
          </button>
        ) : (
          <>
            {onMoveBack ? (
              <button type="button" onClick={onMoveBack}>
                Move Back to Need to Buy
              </button>
            ) : null}
            {onAddToInventory ? (
              <button type="button" className="is-warn" onClick={onAddToInventory}>
                Add to Inventory
              </button>
            ) : null}
          </>
        )}
        {onEdit ? (
          <button type="button" onClick={onEdit}>
            Edit / note
          </button>
        ) : null}
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}

export function findLinkedPantryItem(
  line: GroceryCartLine,
  pantry: PantryItem[],
): PantryItem | undefined {
  const nameKey = line.productName.trim().toLowerCase();
  return pantry.find((item) => {
    if (item.inactiveInInventory) {
      return false;
    }
    if (item.groceryItemId && item.groceryItemId === line.productId) {
      return true;
    }
    return item.name.trim().toLowerCase() === nameKey;
  });
}

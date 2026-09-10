import { useMemo } from "react";
import type { PantryItem } from "../../data/familyData";
import { formatShortDate } from "../../lib/utils";
import {
  getInventoryLocationLabel,
  getPantryItemDisplayImageSrc,
  getPantryItemPlaceholderEmoji,
  isUseSoonCandidate,
} from "../../pages/inventory/inventoryUtils";
import { getInventoryStatusLabel } from "../../services/inventoryStatus";

function itemFlags(item: PantryItem, onShoppingList: boolean) {
  return (
    <span className="aux-pantry-table__flags">
      <span className={statusBadgeClass(item)}>{getInventoryStatusLabel(item)}</span>
      {isUseSoonCandidate(item) ? <span className="fh-ops-badge fh-ops-badge--soon">Use soon</span> : null}
      {onShoppingList ? <span className="fh-ops-badge fh-ops-badge--on-list">On shopping list</span> : null}
    </span>
  );
}

function statusBadgeClass(item: PantryItem): string {
  if (item.status === "Out") {
    return "aux-pantry__badge aux-pantry__badge--out";
  }
  if (item.status === "Low") {
    return "aux-pantry__badge aux-pantry__badge--low";
  }
  if (item.status === "Stocked") {
    return "aux-pantry__badge aux-pantry__badge--stocked";
  }
  return "aux-pantry__badge aux-pantry__badge--other";
}

function ProductThumb({ item }: { item: PantryItem }) {
  const src = getPantryItemDisplayImageSrc(item);
  const emoji = getPantryItemPlaceholderEmoji(item);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-11 w-11 rounded-xl border border-slate-200/80 object-cover bg-slate-50"
      />
    );
  }
  return (
    <span
      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-sky-50 text-lg"
      aria-hidden
    >
      {emoji}
    </span>
  );
}

type Props = {
  items: PantryItem[];
  adjustItemQuantity: (item: PantryItem, delta: number) => void;
  addInventoryItemToShopping: (item: PantryItem) => void;
  onEditItem: (itemId: string) => void;
  onUpdateStock: (itemId: string) => void;
  shoppingLinkedIds?: Set<string>;
  onAddItem?: () => void;
};

export function PantryAdminUxInventoryList({
  items,
  adjustItemQuantity,
  addInventoryItemToShopping,
  onEditItem,
  onUpdateStock,
  shoppingLinkedIds,
  onAddItem,
}: Props) {
  const rows = useMemo(() => items, [items]);

  if (rows.length === 0) {
    return (
      <section className="aux-pantry__card" aria-label="Inventory list">
        <div className="aux-pantry__card-head">
          <h2>Inventory</h2>
          <p>No items match these filters</p>
        </div>
        <div className="aux-pantry__empty">
          <p className="text-sm font-bold text-slate-800">Nothing here yet.</p>
          <p className="text-sm font-semibold text-slate-500">
            Clear filters, or add an item to start tracking what the house has.
          </p>
          {onAddItem ? (
            <button type="button" className="aux-pantry__btn aux-pantry__btn--primary" onClick={onAddItem}>
              Add pantry item
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="aux-pantry__card" aria-label="Inventory list">
      <div className="aux-pantry__card-head">
        <h2>Inventory</h2>
        <p>
          {rows.length} item{rows.length === 1 ? "" : "s"} · table on desktop, cards on phone
        </p>
      </div>

      <div className="md:hidden aux-pantry-mobile-cards">
        {rows.map((item) => (
          <article key={item.id} className="aux-pantry-mobile-card" id={`inventory-card-${item.id}`}>
            <div className="aux-pantry-mobile-card__top">
              <ProductThumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="aux-pantry-table__name truncate">{item.name}</p>
                <p className="aux-pantry-table__muted mt-0.5 text-xs">
                  {item.category} · {getInventoryLocationLabel(item) || item.storageArea}
                </p>
                <span className="mt-2 block">{itemFlags(item, Boolean(shoppingLinkedIds?.has(item.id)))}</span>
              </div>
            </div>
            <div className="aux-pantry-mobile-card__meta">
              <span>
                Qty {item.quantity || "0"}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
              <span>Updated {item.lastUpdated ? formatShortDate(item.lastUpdated) : "—"}</span>
            </div>
            <div className="aux-pantry-table__actions">
              <button type="button" onClick={() => adjustItemQuantity(item, -1)} aria-label={`Decrease ${item.name}`}>
                −
              </button>
              <button type="button" onClick={() => adjustItemQuantity(item, 1)} aria-label={`Increase ${item.name}`}>
                +
              </button>
              <button type="button" onClick={() => onUpdateStock(item.id)}>
                Update Stock
              </button>
              <button type="button" onClick={() => addInventoryItemToShopping(item)}>
                {shoppingLinkedIds?.has(item.id) ? "Already on shopping list" : "Add to Shopping List"}
              </button>
              <button type="button" onClick={() => onEditItem(item.id)}>
                Edit
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden md:block aux-pantry-table-wrap">
        <table className="aux-pantry-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Item</th>
              <th scope="col">Category</th>
              <th scope="col">Location</th>
              <th scope="col">Qty</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} id={`inventory-row-${item.id}`}>
                <td>
                  <ProductThumb item={item} />
                </td>
                <td>
                  <span className="aux-pantry-table__name">{item.name}</span>
                  {item.brand ? (
                    <div className="aux-pantry-table__muted text-xs">{item.brand}</div>
                  ) : null}
                </td>
                <td className="aux-pantry-table__muted">{item.category || "—"}</td>
                <td className="aux-pantry-table__muted">
                  {getInventoryLocationLabel(item) || item.storageArea || "—"}
                </td>
                <td>
                  <div className="aux-pantry-table__actions">
                    <button
                      type="button"
                      onClick={() => adjustItemQuantity(item, -1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      −
                    </button>
                    <span className="aux-pantry-table__name px-1">
                      {item.quantity || "0"}
                      {item.unit ? ` ${item.unit}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustItemQuantity(item, 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  {itemFlags(item, Boolean(shoppingLinkedIds?.has(item.id)))}
                </td>
                <td className="aux-pantry-table__muted">
                  {item.lastUpdated ? formatShortDate(item.lastUpdated) : "—"}
                </td>
                <td>
                  <div className="aux-pantry-table__actions">
                    <button type="button" onClick={() => onUpdateStock(item.id)}>
                      Update Stock
                    </button>
                    <button type="button" onClick={() => addInventoryItemToShopping(item)}>
                      {shoppingLinkedIds?.has(item.id) ? "Already on shopping list" : "Add to Shopping List"}
                    </button>
                    <button type="button" onClick={() => onEditItem(item.id)}>
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

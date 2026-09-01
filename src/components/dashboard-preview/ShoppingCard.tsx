import { ShoppingCart } from "lucide-react";
import { useState, type Dispatch, FormEvent, SetStateAction } from "react";
import type { FamilyData } from "../../data/familyData";
import { createAddShoppingItem } from "../../lib/dashboard-preview/dashboardPreviewHandlers";
import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";
import type { DashboardGo } from "./types";

type ShoppingCardProps = {
  data: FamilyData;
  model: DashboardPreviewModel;
  setData: Dispatch<SetStateAction<FamilyData>>;
  go: DashboardGo;
  onOpenShopping: () => void;
  variant?: "default" | "primary";
};

export function ShoppingCard({
  data,
  model,
  setData,
  go,
  onOpenShopping,
}: ShoppingCardProps) {
  const { needToBuy } = model;
  const [shoppingDraft, setShoppingDraft] = useState("");

  const addShoppingItem = createAddShoppingItem({
    data,
    setData,
    go,
    onOpenShopping,
    setShoppingDraft,
  });

  const shoppingItemLabel =
    needToBuy.length === 1 ? "1 item" : `${needToBuy.length} items`;

  function onShoppingAdd(event: FormEvent) {
    event.preventDefault();
    addShoppingItem(shoppingDraft);
  }

  return (
    <section className="dp-widget dp-widget--shopping" aria-label="Shopping list">
      <header className="dp-widget__head">
        <div className="dp-widget__title-row">
          <span className="dp-widget__icon dp-widget__icon--shopping" aria-hidden="true">
            <ShoppingCart />
          </span>
          <div>
            <h2 className="dp-widget__title">Shopping</h2>
            <p className="dp-widget__meta">{shoppingItemLabel} on the list</p>
          </div>
        </div>
        <button type="button" className="dp-btn dp-btn--ghost" onClick={() => go("/shopping", onOpenShopping)}>
          Open shopping
        </button>
      </header>

      {needToBuy.length === 0 ? (
        <p className="dp-empty">Shopping list is clear.</p>
      ) : (
        <ul className="dp-checklist">
          {needToBuy.slice(0, 5).map((item) => {
            const qty = [item.quantity, item.unit].filter(Boolean).join(" ") || "1";
            const category = item.category?.trim();
            const showCategory =
              Boolean(category) &&
              category.toLowerCase() !== "other" &&
              category.toLowerCase() !== "general";
            return (
              <li key={item.id}>
                <button type="button" className="dp-checklist__row" onClick={() => go("/shopping", onOpenShopping)}>
                  <span className="dp-checklist__bullet" aria-hidden="true" />
                  <span className="dp-checklist__copy">
                    <span className="dp-checklist__title">{item.name}</span>
                    {showCategory ? <span className="dp-checklist__meta">{category}</span> : null}
                  </span>
                  <span className="dp-checklist__qty">{qty}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form className="dp-composer dp-composer--shopping" onSubmit={onShoppingAdd}>
        <input
          aria-label="Quick add shopping item"
          autoComplete="off"
          className="dp-composer__input"
          onChange={(e) => setShoppingDraft(e.target.value)}
          placeholder="Add an item…"
          value={shoppingDraft}
        />
        <button type="submit" className="dp-btn dp-btn--shopping" aria-label="Add shopping item">
          Add
        </button>
      </form>
    </section>
  );
}

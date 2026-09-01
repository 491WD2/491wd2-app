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
  variant = "default",
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
    <section
      className={[
        "dashboard-preview__card",
        "dashboard-preview__card--shopping-accent",
        variant === "primary" ? "dashboard-preview__card--shopping-primary" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Shopping list"
    >
      <header className="dashboard-preview__card-head dashboard-preview__card-head--row">
        <div className="dashboard-preview__card-head-with-icon">
          <span className="dashboard-preview__icon-badge dashboard-preview__icon-badge--shopping" aria-hidden="true">
            <ShoppingCart className="dashboard-preview__icon-badge-svg" />
          </span>
          <div>
            <h2 className="dashboard-preview__section-title">Shopping</h2>
            <p className="dashboard-preview__meta">{shoppingItemLabel} on the list</p>
          </div>
        </div>
        <button type="button" className="dashboard-preview__button--secondary" onClick={() => go("/shopping", onOpenShopping)}>
          Open shopping
        </button>
      </header>

      {needToBuy.length === 0 ? (
        <p className="dashboard-preview__placeholder">Shopping list is clear.</p>
      ) : (
        <ul className="dashboard-preview__list">
          {needToBuy.slice(0, 5).map((item) => {
            const qty = [item.quantity, item.unit].filter(Boolean).join(" ") || "1";
            const category = item.category?.trim();
            const showCategory =
              Boolean(category) &&
              category.toLowerCase() !== "other" &&
              category.toLowerCase() !== "general";
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="dashboard-preview__row"
                  onClick={() => go("/shopping", onOpenShopping)}
                >
                  <span className="dashboard-preview__row-main">
                    <span className="dashboard-preview__row-title">{item.name}</span>
                    {showCategory ? (
                      <span className="dashboard-preview__row-meta">{category}</span>
                    ) : null}
                  </span>
                  <span className="dashboard-preview__row-qty">{qty}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form className="dashboard-preview__composer" onSubmit={onShoppingAdd}>
        <input
          aria-label="Quick add shopping item"
          autoComplete="off"
          className="dashboard-preview__composer-input"
          onChange={(e) => setShoppingDraft(e.target.value)}
          placeholder="Add an item…"
          value={shoppingDraft}
        />
        <button type="submit" className="dashboard-preview__button" aria-label="Add shopping item">
          Add
        </button>
      </form>
    </section>
  );
}

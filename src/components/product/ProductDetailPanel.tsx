import { X } from "lucide-react";
import { pantryStatusFromProduct } from "../../lib/pantryData";
import type { HouseholdProduct } from "../../types/grocery";

type ProductDetailPanelProps = {
  product: HouseholdProduct;
  lookupBusy: boolean;
  lookupMessage: string | null;
  onClose: () => void;
  onAddToShopping: () => void;
  onAddToPantry: () => void;
  onUpdateFromOpenFoodFacts: () => void | Promise<void>;
};

function formatQuantity(product: HouseholdProduct) {
  if (product.quantity == null) {
    return "—";
  }
  return `${product.quantity}${product.unit ? ` ${product.unit}` : ""}`;
}

export function ProductDetailPanel({
  product,
  lookupBusy,
  lookupMessage,
  onClose,
  onAddToShopping,
  onAddToPantry,
  onUpdateFromOpenFoodFacts,
}: ProductDetailPanelProps) {
  const pantryStatus = pantryStatusFromProduct(product);

  return (
    <div className="wd-product-detail__backdrop" role="presentation" onClick={onClose}>
      <div
        className="wd-product-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wd-product-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wd-product-detail__head">
          <div className="wd-product-detail__hero">
            <div className="wd-product-detail__image" aria-hidden>
              {product.imageUrl ? (
                <img className="wd-product-detail__image-photo" src={product.imageUrl} alt="" />
              ) : (
                <span className="wd-product-detail__image-letter">{product.productName.charAt(0)}</span>
              )}
            </div>
            <div className="wd-product-detail__intro">
              <p className="wd-product-detail__eyebrow">{product.category}</p>
              <h2 id="wd-product-detail-title" className="wd-product-detail__title">
                {product.productName}
              </h2>
              <p className="wd-product-detail__brand">{product.brand?.trim() || "Brand not set"}</p>
            </div>
          </div>
          <button type="button" className="wd-product-detail__close" aria-label="Close product detail" onClick={onClose}>
            <X aria-hidden className="wd-product-detail__close-icon" />
          </button>
        </div>

        <dl className="wd-product-detail__grid">
          <div>
            <dt>Barcode</dt>
            <dd>{product.barcode?.trim() || "—"}</dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>{formatQuantity(product)}</dd>
          </div>
          <div>
            <dt>Store</dt>
            <dd>{product.store.trim() || "—"}</dd>
          </div>
          <div>
            <dt>Shopping status</dt>
            <dd>{product.need ? "On shopping list" : "Not on shopping list"}</dd>
          </div>
          <div>
            <dt>Pantry status</dt>
            <dd>{pantryStatus}</dd>
          </div>
          <div>
            <dt>Category group</dt>
            <dd>{product.categoryGroup}</dd>
          </div>
        </dl>

        <div className="wd-product-detail__notes">
          <p className="wd-product-detail__notes-label">Notes</p>
          <p className="wd-product-detail__notes-body">{product.notes.trim() || "—"}</p>
        </div>

        {lookupMessage ? (
          <p className="wd-product-detail__lookup-message" role="status">
            {lookupMessage}
          </p>
        ) : null}

        <div className="wd-product-detail__actions">
          <button type="button" className="wd-product-detail__btn wd-product-detail__btn--shopping" onClick={onAddToShopping}>
            Add to Shopping
          </button>
          <button type="button" className="wd-product-detail__btn wd-product-detail__btn--pantry" onClick={onAddToPantry}>
            Add to Pantry
          </button>
          <button
            type="button"
            className="wd-product-detail__btn wd-product-detail__btn--lookup"
            onClick={() => void onUpdateFromOpenFoodFacts()}
            disabled={lookupBusy}
          >
            {lookupBusy ? "Updating…" : "Update from OpenFoodFacts"}
          </button>
        </div>
      </div>
    </div>
  );
}

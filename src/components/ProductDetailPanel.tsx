import { X } from "lucide-react";
import { useProductDuplicatePanel } from "../lib/groceryProductActions";
import type { GroceryProductDetail } from "../types/grocery";

type ProductDetailPanelProps = {
  product: GroceryProductDetail;
  mode: "view" | "edit";
  lookupBusy: boolean;
  lookupMessage: string | null;
  onClose: () => void;
  onChange?: (patch: Partial<GroceryProductDetail>) => void;
  onAddToShopping: () => void;
  onAddToPantry: () => void;
  onSaveProduct?: () => void;
  onUpdateFromOpenFoodFacts?: () => void | Promise<void>;
  mergeReview?: {
    duplicateProductName: string;
    onConfirmMerge: () => void;
    onDismissMerge: () => void;
  };
};

function formatQuantity(product: GroceryProductDetail) {
  if (product.quantity == null) {
    return "—";
  }
  return `${product.quantity}${product.unit ? ` ${product.unit}` : ""}`;
}

export function ProductDetailPanel({
  product,
  mode,
  lookupBusy,
  lookupMessage,
  onClose,
  onChange,
  onAddToShopping,
  onAddToPantry,
  onSaveProduct,
  onUpdateFromOpenFoodFacts,
  mergeReview,
}: ProductDetailPanelProps) {
  const duplicatePanel = useProductDuplicatePanel();
  const letter = product.productName.trim().charAt(0) || "?";
  const editable = mode === "edit" && onChange != null;
  const duplicateMatch = editable ? duplicatePanel?.match ?? null : null;
  const duplicateChoice = duplicatePanel?.choice ?? "pending";

  return (
    <div className="wd-product-detail__backdrop" role="presentation" onClick={onClose}>
      <div
        className={`wd-product-detail${editable ? " wd-product-detail--edit" : ""}`}
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
                <span className="wd-product-detail__image-letter">{letter}</span>
              )}
            </div>
            <div className="wd-product-detail__intro">
              <p className="wd-product-detail__eyebrow">{product.category}</p>
              {editable ? (
                <label className="wd-product-detail__field wd-product-detail__field--title">
                  <span id="wd-product-detail-title">Product name</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.productName}
                    onChange={(event) => onChange({ productName: event.target.value })}
                  />
                </label>
              ) : (
                <h2 id="wd-product-detail-title" className="wd-product-detail__title">
                  {product.productName}
                </h2>
              )}
              {editable ? (
                <label className="wd-product-detail__field">
                  <span>Brand</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.brand ?? ""}
                    onChange={(event) => onChange({ brand: event.target.value || null })}
                  />
                </label>
              ) : (
                <p className="wd-product-detail__brand">{product.brand?.trim() || "Brand not set"}</p>
              )}
            </div>
          </div>
          <button type="button" className="wd-product-detail__close" aria-label="Close product detail" onClick={onClose}>
            <X aria-hidden className="wd-product-detail__close-icon" />
          </button>
        </div>

        {editable ? (
          <div className="wd-product-detail__form">
            <label className="wd-product-detail__field">
              <span>Image URL</span>
              <input
                className="wd-product-detail__input"
                value={product.imageUrl ?? ""}
                onChange={(event) => onChange({ imageUrl: event.target.value || null })}
              />
            </label>
            <label className="wd-product-detail__field">
              <span>Barcode</span>
              <input
                className="wd-product-detail__input"
                value={product.barcode ?? ""}
                onChange={(event) => onChange({ barcode: event.target.value || null })}
              />
            </label>
            <label className="wd-product-detail__field">
              <span>Category</span>
              <input
                className="wd-product-detail__input"
                value={product.category}
                onChange={(event) => onChange({ category: event.target.value })}
              />
            </label>
            <label className="wd-product-detail__field">
              <span>Quantity</span>
              <input
                className="wd-product-detail__input"
                type="number"
                min={0}
                step="any"
                value={product.quantity ?? ""}
                onChange={(event) =>
                  onChange({
                    quantity: event.target.value === "" ? null : Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="wd-product-detail__field">
              <span>Unit</span>
              <input
                className="wd-product-detail__input"
                value={product.unit ?? ""}
                onChange={(event) => onChange({ unit: event.target.value || null })}
              />
            </label>
            <label className="wd-product-detail__field">
              <span>Store</span>
              <input
                className="wd-product-detail__input"
                value={product.store}
                onChange={(event) => onChange({ store: event.target.value })}
              />
            </label>
            <label className="wd-product-detail__field wd-product-detail__field--full">
              <span>Notes</span>
              <textarea
                className="wd-product-detail__textarea"
                value={product.notes}
                onChange={(event) => onChange({ notes: event.target.value })}
                rows={3}
              />
            </label>
          </div>
        ) : (
          <>
            <dl className="wd-product-detail__grid">
              <div>
                <dt>Barcode</dt>
                <dd>{product.barcode?.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{product.category}</dd>
              </div>
              <div>
                <dt>Quantity</dt>
                <dd>{formatQuantity(product)}</dd>
              </div>
              <div>
                <dt>Unit</dt>
                <dd>{product.unit?.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Store</dt>
                <dd>{product.store.trim() || "—"}</dd>
              </div>
            </dl>

            <div className="wd-product-detail__notes">
              <p className="wd-product-detail__notes-label">Notes</p>
              <p className="wd-product-detail__notes-body">{product.notes.trim() || "—"}</p>
            </div>
          </>
        )}

        {lookupMessage ? (
          <p className="wd-product-detail__lookup-message" role="status">
            {lookupMessage}
          </p>
        ) : null}

        {mergeReview ? (
          <div className="wd-product-detail__merge-review" role="region" aria-label="Duplicate merge review">
            <p className="wd-product-detail__merge-review-title">Review before merge</p>
            <p className="wd-product-detail__merge-review-copy">
              Confirm merging <strong>{mergeReview.duplicateProductName}</strong> into{" "}
              <strong>{product.productName}</strong>. This keeps one product record and removes the duplicate.
            </p>
            <div className="wd-product-detail__merge-review-actions">
              <button
                type="button"
                className="wd-product-detail__btn wd-product-detail__btn--save"
                onClick={mergeReview.onConfirmMerge}
              >
                Confirm merge
              </button>
              <button
                type="button"
                className="wd-product-detail__btn wd-product-detail__btn--lookup"
                onClick={mergeReview.onDismissMerge}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {duplicateMatch ? (
          <div className="wd-product-detail__duplicate" role="status">
            <p className="wd-product-detail__duplicate-title">Possible duplicate found</p>
            <p className="wd-product-detail__duplicate-copy">
              {duplicateMatch.reason === "barcode"
                ? `Barcode already matches ${duplicateMatch.existingProductName}.`
                : `${duplicateMatch.existingProductName} in ${duplicateMatch.existingCategory} already exists.`}
            </p>
            <div className="wd-product-detail__duplicate-actions">
              <button
                type="button"
                className="wd-product-detail__btn wd-product-detail__btn--save"
                onClick={() => duplicatePanel?.onUpdateExisting()}
                aria-pressed={duplicateChoice === "update"}
              >
                Update existing
              </button>
              <button
                type="button"
                className="wd-product-detail__btn wd-product-detail__btn--lookup"
                onClick={() => duplicatePanel?.onAddAnyway()}
                aria-pressed={duplicateChoice === "add_anyway"}
              >
                Add anyway
              </button>
            </div>
          </div>
        ) : null}

        <div className="wd-product-detail__actions">
          <button
            type="button"
            className="wd-product-detail__btn wd-product-detail__btn--shopping"
            onClick={onAddToShopping}
          >
            Add to Shopping
          </button>
          <button
            type="button"
            className="wd-product-detail__btn wd-product-detail__btn--pantry"
            onClick={onAddToPantry}
          >
            Add to Pantry
          </button>
          {editable && onSaveProduct ? (
            <button type="button" className="wd-product-detail__btn wd-product-detail__btn--save" onClick={onSaveProduct}>
              Save Product
            </button>
          ) : null}
          {!editable && onUpdateFromOpenFoodFacts ? (
            <button
              type="button"
              className="wd-product-detail__btn wd-product-detail__btn--lookup"
              onClick={() => void onUpdateFromOpenFoodFacts()}
              disabled={lookupBusy}
            >
              {lookupBusy ? "Updating…" : "Update from OpenFoodFacts"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

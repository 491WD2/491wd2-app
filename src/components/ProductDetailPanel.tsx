import { ArrowLeft } from "lucide-react";
import { useProductDuplicatePanel } from "../lib/groceryProductActions";
import type { GroceryProductDetail } from "../types/grocery";
import type { FoodStorageLocation } from "../types/inventory";
import {
  applyStructuredPantryLocationToNotes,
  formatStructuredPantryLocation,
  getPantryLocationDetailOptions,
  PANTRY_LOCATION_AREAS,
  parseStructuredPantryLocation,
  type PantryLocationArea,
} from "../lib/pantryLocations";

type ProductDetailPanelProps = {
  product: GroceryProductDetail;
  mode?: "view" | "edit";
  lookupBusy: boolean;
  lookupMessage: string | null;
  onClose: () => void;
  onChange?: (patch: Partial<GroceryProductDetail>) => void;
  onAddToShopping: () => void;
  onAddToPantry: () => void;
  onUsedUp?: () => void;
  onUsedUpToShopping?: () => void;
  onSaveProduct?: () => void;
  onUpdateFromOpenFoodFacts?: () => void | Promise<void>;
  onNavigateToPantry?: () => void;
  onNavigateToShopping?: () => void;
  onNavigateToSettings?: () => void;
  locationFallback?: FoodStorageLocation;
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
  mode = "view",
  lookupBusy,
  lookupMessage,
  onClose,
  onChange,
  onAddToShopping,
  onAddToPantry,
  onUsedUp,
  onUsedUpToShopping,
  onSaveProduct,
  onUpdateFromOpenFoodFacts,
  onNavigateToPantry,
  onNavigateToShopping,
  onNavigateToSettings,
  locationFallback = "pantry",
  mergeReview,
}: ProductDetailPanelProps) {
  const duplicatePanel = useProductDuplicatePanel();
  const letter = product.productName.trim().charAt(0) || "?";
  const editable = mode === "edit" && onChange != null;
  const duplicateMatch = editable ? duplicatePanel?.match ?? null : null;
  const duplicateChoice = duplicatePanel?.choice ?? "pending";
  const productName = product.productName.trim() || "Product details";
  const brandLabel = product.brand?.trim() || "Brand not set";
  const storeLabel = product.store.trim() || "Not set";
  const notesLabel = product.notes.trim() || "No notes saved";
  const barcodeLabel = product.barcode?.trim() || "Not set";
  const structuredLocation = parseStructuredPantryLocation(product.notes, locationFallback);
  const structuredLocationLabel = formatStructuredPantryLocation(structuredLocation);
  const structuredLocationOptions = getPantryLocationDetailOptions(structuredLocation.area);

  function updateStructuredLocation(patch: Partial<typeof structuredLocation>) {
    onChange?.({
      notes: applyStructuredPantryLocationToNotes(product.notes, {
        ...structuredLocation,
        ...patch,
      }),
    });
  }

  function updateStructuredLocationArea(area: PantryLocationArea) {
    updateStructuredLocation({
      area,
      detail: getPantryLocationDetailOptions(area)[0]?.value ?? "",
    });
  }

  return (
    <div className="wd-product-detail__backdrop" role="presentation" onClick={onClose}>
      <div
        className={`wd-product-detail wd-product-detail--kiosk${editable ? " wd-product-detail--edit" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wd-product-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wd-product-detail__topbar" aria-label="Product detail navigation">
          <button type="button" className="wd-product-detail__back" onClick={onClose}>
            <ArrowLeft aria-hidden className="wd-product-detail__back-icon" />
            Back
          </button>
          <strong>Product Details</strong>
          <span aria-hidden />
        </header>

        <nav className="wd-product-detail__switcher" aria-label="Shared pantry and shopping pages">
          <button type="button" onClick={onNavigateToPantry} disabled={!onNavigateToPantry}>Inventory</button>
          <button type="button" onClick={onNavigateToShopping} disabled={!onNavigateToShopping}>Shopping</button>
          <button type="button" className="wd-product-detail__switcher-active" aria-current="page" disabled>
            Product Details
          </button>
          <button type="button" onClick={onNavigateToSettings} disabled={!onNavigateToSettings}>Settings</button>
        </nav>

        <section className="wd-product-detail__head">
          <div className="wd-product-detail__hero">
            <div className="wd-product-detail__image" aria-hidden>
              {product.imageUrl ? (
                <img className="wd-product-detail__image-photo" src={product.imageUrl} alt="" />
              ) : (
                <span className="wd-product-detail__image-letter">{letter}</span>
              )}
            </div>
            <div className="wd-product-detail__intro">
              <p className="wd-product-detail__eyebrow">{editable ? "Edit product" : product.category}</p>
              {editable ? (
                <label className="wd-product-detail__field wd-product-detail__field--title">
                  <span id="wd-product-detail-title">Product name</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.productName}
                    onChange={(event) => onChange?.({ productName: event.target.value })}
                  />
                </label>
              ) : (
                <h2 id="wd-product-detail-title" className="wd-product-detail__title">
                  {productName}
                </h2>
              )}
              {editable ? (
                <label className="wd-product-detail__field">
                  <span>Brand</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.brand ?? ""}
                    onChange={(event) => onChange?.({ brand: event.target.value || null })}
                  />
                </label>
              ) : (
                <p className="wd-product-detail__brand">{brandLabel}</p>
              )}
            </div>
          </div>
        </section>

        <div className="wd-product-detail__body">
          {editable ? (
            <section className="wd-product-detail__card" aria-label="Edit product information">
              <header>
                <h3>Product Information</h3>
                <p>Update the details used by Shopping, Pantry, and barcode lookup.</p>
              </header>
              <div className="wd-product-detail__form">
                <label className="wd-product-detail__field">
                  <span>Image URL</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.imageUrl ?? ""}
                    onChange={(event) => onChange?.({ imageUrl: event.target.value || null })}
                  />
                </label>
                <label className="wd-product-detail__field">
                  <span>Barcode</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.barcode ?? ""}
                    onChange={(event) => onChange?.({ barcode: event.target.value || null })}
                  />
                </label>
                <label className="wd-product-detail__field">
                  <span>Category</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.category}
                    onChange={(event) => onChange?.({ category: event.target.value })}
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
                      onChange?.({
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
                    onChange={(event) => onChange?.({ unit: event.target.value || null })}
                  />
                </label>
                <label className="wd-product-detail__field">
                  <span>Store</span>
                  <input
                    className="wd-product-detail__input"
                    value={product.store}
                    onChange={(event) => onChange?.({ store: event.target.value })}
                  />
                </label>
                <label className="wd-product-detail__field">
                  <span>Location group</span>
                  <select
                    className="wd-product-detail__input"
                    value={structuredLocation.area}
                    onChange={(event) => updateStructuredLocationArea(event.target.value as PantryLocationArea)}
                  >
                    {PANTRY_LOCATION_AREAS.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wd-product-detail__field">
                  <span>Location detail</span>
                  <select
                    className="wd-product-detail__input"
                    value={structuredLocation.detail}
                    onChange={(event) => updateStructuredLocation({ detail: event.target.value })}
                  >
                    {structuredLocationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wd-product-detail__field wd-product-detail__field--full">
                  <span>Location note</span>
                  <input
                    className="wd-product-detail__input"
                    value={structuredLocation.note}
                    placeholder="Add shelf detail, other location, or notes"
                    onChange={(event) => updateStructuredLocation({ note: event.target.value })}
                  />
                </label>
                <label className="wd-product-detail__field wd-product-detail__field--full">
                  <span>Notes</span>
                  <textarea
                    className="wd-product-detail__textarea"
                    value={product.notes}
                    onChange={(event) => onChange?.({ notes: event.target.value })}
                    rows={3}
                  />
                </label>
              </div>
            </section>
          ) : (
            <>
              <section className="wd-product-detail__card wd-product-detail__info-card" aria-label="Product information">
                <header>
                  <h3>Product Information</h3>
                  <p>Shared household product data</p>
                </header>
                <div className="wd-product-detail__product-line">
                  <div className="wd-product-detail__image wd-product-detail__image--small" aria-hidden>
                    {product.imageUrl ? (
                      <img className="wd-product-detail__image-photo" src={product.imageUrl} alt="" />
                    ) : (
                      <span className="wd-product-detail__image-letter">{letter}</span>
                    )}
                  </div>
                  <div>
                    <strong>{productName}</strong>
                    <span>{brandLabel}</span>
                  </div>
                </div>
                <dl className="wd-product-detail__grid">
                  <div>
                    <dt>Barcode</dt>
                    <dd>{barcodeLabel}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{product.category}</dd>
                  </div>
                  <div>
                    <dt>Store</dt>
                    <dd>{storeLabel}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{structuredLocationLabel}</dd>
                  </div>
                </dl>
              </section>

              <section className="wd-product-detail__count-grid" aria-label="Inventory check">
                <article>
                  <span>Current Quantity</span>
                  <strong>{formatQuantity(product)}</strong>
                </article>
                <article>
                  <span>Unit</span>
                  <strong>{product.unit?.trim() || "Not set"}</strong>
                </article>
              </section>

              <section className="wd-product-detail__summary-card" aria-label="Adjustment summary">
                <div>
                  <span>Summary</span>
                  <strong>{productName}</strong>
                  <p>{notesLabel}</p>
                </div>
                <em>{product.category}</em>
              </section>
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
                <strong>{productName}</strong>. This keeps one product record and removes the duplicate.
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
        </div>

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
            Add to Inventory
          </button>
          {onUsedUp ? (
            <button
              type="button"
              className="wd-product-detail__btn wd-product-detail__btn--lookup"
              onClick={onUsedUp}
            >
              Used Up
            </button>
          ) : null}
          {onUsedUpToShopping ? (
            <button
              type="button"
              className="wd-product-detail__btn wd-product-detail__btn--shopping"
              onClick={onUsedUpToShopping}
            >
              Used Up + Shopping
            </button>
          ) : null}
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
              {lookupBusy ? "Updating..." : "Update from OpenFoodFacts"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

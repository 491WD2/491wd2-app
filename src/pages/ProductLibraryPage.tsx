import { LayoutGrid, List, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { ProductDetailPanel } from "../components/ProductDetailPanel";
import { ProductScanPanel } from "../components/ProductScanPanel";
import {
  useGroceryProductActions,
  useGroceryProductCatalog,
  useProductLibraryMaintenance,
} from "../lib/groceryProductActions";
import { useGroceryCart } from "../lib/groceryCartStore";
import {
  buildProductLibraryStats,
  findProductLibraryDuplicateGroups,
  GROCERY_STORES,
  normalizeGroceryBarcode,
  productMatchesLibraryStatusFilter,
  productNeedsLibraryReview,
} from "../lib/groceryLibraryData";
import { getGroceryCategoryTheme } from "../lib/groceryCategoryTheme";
import type {
  HouseholdProduct,
  ProductLibraryDuplicateGroup,
  ProductLibraryStatusFilter,
  ProductLibraryViewMode,
} from "../types/grocery";

function productLetter(product: HouseholdProduct) {
  return product.productName.trim().charAt(0).toUpperCase() || "?";
}

function formatBarcodeStatus(product: HouseholdProduct) {
  return normalizeGroceryBarcode(product.barcode) ? "Barcode set" : "Missing barcode";
}

function ProductQualityBadges({
  product,
  duplicateCatalog,
  duplicateDismissals,
}: {
  product: HouseholdProduct;
  duplicateCatalog: readonly HouseholdProduct[];
  duplicateDismissals: readonly string[];
}) {
  const needsReview = productNeedsLibraryReview(product, { duplicateCatalog, duplicateDismissals });

  return (
    <div className="wd-product-library-card__badges wd-product-library-card__badges--quality">
      {!product.imageUrl?.trim() ? (
        <span className="wd-product-library-chip wd-product-library-chip--warn">Missing image</span>
      ) : null}
      {!normalizeGroceryBarcode(product.barcode) ? (
        <span className="wd-product-library-chip wd-product-library-chip--warn">Missing barcode</span>
      ) : null}
      {!product.store.trim() ? (
        <span className="wd-product-library-chip wd-product-library-chip--warn">Missing store</span>
      ) : null}
      {needsReview ? (
        <span className="wd-product-library-chip wd-product-library-chip--review">Needs review</span>
      ) : null}
    </div>
  );
}

export function ProductLibraryPage() {
  const { catalog, duplicateDismissals } = useGroceryProductCatalog();
  const { mergeDuplicateProducts, keepDuplicatePairSeparate } = useProductLibraryMaintenance();
  const { isProductOnCart } = useGroceryCart();
  const {
    detailView,
    detailMode,
    lookupBusy,
    lookupMessage,
    openProductDetailForEdit,
    beginBlankProductDetail,
    closeProductDetail,
    updateDetailDraft,
    beginManualDetailDraft,
    lookupBarcodeDraft,
    saveDetailProduct,
    addDetailToShopping,
    addDetailToPantry,
    addProductToShopping,
    addProductToPantry,
    enrichProductFromOpenFoodFacts,
  } = useGroceryProductActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<ProductLibraryStatusFilter>("all");
  const [viewMode, setViewMode] = useState<ProductLibraryViewMode>("grid");
  const [scanOpen, setScanOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mergeReview, setMergeReview] = useState<ProductLibraryDuplicateGroup | null>(null);

  const stats = useMemo(() => buildProductLibraryStats(catalog), [catalog]);
  const duplicateGroups = useMemo(
    () => findProductLibraryDuplicateGroups(catalog, duplicateDismissals),
    [catalog, duplicateDismissals],
  );

  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    for (const product of catalog) {
      if (product.category.trim()) {
        values.add(product.category.trim());
      }
    }
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [catalog]);

  const storeOptions = useMemo(() => {
    const values = new Set<string>(GROCERY_STORES);
    for (const product of catalog) {
      if (product.store.trim()) {
        values.add(product.store.trim());
      }
    }
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [catalog]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return catalog.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (storeFilter !== "all" && product.store !== storeFilter) {
        return false;
      }
      if (
        !productMatchesLibraryStatusFilter(product, statusFilter, {
          duplicateCatalog: catalog,
          duplicateDismissals,
          isOnShoppingList: product.need || isProductOnCart(product.id),
          isInPantry: !product.need,
        })
      ) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        product.productName,
        product.brand ?? "",
        product.category,
        product.store,
        product.barcode ?? "",
        product.notes,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [catalog, categoryFilter, duplicateDismissals, isProductOnCart, searchQuery, statusFilter, storeFilter]);

  const missingImageProducts = useMemo(
    () => catalog.filter((product) => !product.imageUrl?.trim()).slice(0, 8),
    [catalog],
  );
  const missingBarcodeProducts = useMemo(
    () => catalog.filter((product) => !normalizeGroceryBarcode(product.barcode)).slice(0, 8),
    [catalog],
  );
  const missingStoreProducts = useMemo(
    () => catalog.filter((product) => !product.store.trim()).slice(0, 8),
    [catalog],
  );
  const missingCategoryProducts = useMemo(
    () => catalog.filter((product) => !product.category.trim()).slice(0, 8),
    [catalog],
  );

  const handleOpenFoodFactsFromCard = async (product: HouseholdProduct) => {
    const next = await enrichProductFromOpenFoodFacts(product);
    setStatusMessage(
      next.barcode?.trim()
        ? `Updated ${next.productName} from Open Food Facts.`
        : `Add a barcode before updating ${product.productName}.`,
    );
  };

  function startMergeReview(group: ProductLibraryDuplicateGroup) {
    const canonical = group.products[0];
    if (!canonical) {
      return;
    }
    setMergeReview(group);
    openProductDetailForEdit(canonical.id);
  }

  function confirmMergeReview() {
    if (!mergeReview) {
      return;
    }
    const [canonical, duplicate] = mergeReview.products;
    if (canonical && duplicate) {
      mergeDuplicateProducts(canonical.id, duplicate.id);
      setStatusMessage(`Merged ${duplicate.productName} into ${canonical.productName}.`);
    }
    setMergeReview(null);
    closeProductDetail();
  }

  function dismissMergeReview() {
    setMergeReview(null);
  }

  const mergeReviewDetail =
    mergeReview && detailView
      ? {
          duplicateProductName: mergeReview.products[1]?.productName ?? "duplicate product",
          onConfirmMerge: confirmMergeReview,
          onDismissMerge: dismissMergeReview,
        }
      : undefined;

  return (
    <div className="wd-product-library">
      <section className="wd-product-library__header-card">
        <div className="wd-product-library__header-top">
          <div className="wd-product-library__header-copy">
            <h1>Product Library</h1>
            <p>Manage product details, images, barcodes, categories, stores, and duplicates.</p>
          </div>
          <div className="wd-product-library__header-actions">
            <button
              type="button"
              className="wd-product-library__hero-btn wd-product-library__hero-btn--scan"
              onClick={() => setScanOpen(true)}
            >
              Scan Product
            </button>
            <button
              type="button"
              className="wd-product-library__hero-btn wd-product-library__hero-btn--new"
              onClick={beginBlankProductDetail}
            >
              New Product
            </button>
          </div>
        </div>
        <dl className="wd-product-library__stats">
          <div>
            <dt>Total products</dt>
            <dd>{stats.totalProducts}</dd>
          </div>
          <div>
            <dt>Missing images</dt>
            <dd>{stats.missingImages}</dd>
          </div>
          <div>
            <dt>Missing barcodes</dt>
            <dd>{stats.missingBarcodes}</dd>
          </div>
          <div>
            <dt>Possible duplicates</dt>
            <dd>{stats.possibleDuplicates}</dd>
          </div>
        </dl>
      </section>

      <section className="wd-product-library__toolbar" aria-label="Product library filters">
        <label className="wd-product-library__search">
          <span className="wd-product-library__search-label">Search products</span>
          <Search aria-hidden className="wd-product-library__search-icon" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, brand, barcode, store…"
          />
        </label>

        <label className="wd-product-library__field">
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="wd-product-library__field">
          <span>Store</span>
          <select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}>
            <option value="all">All stores</option>
            {storeOptions.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </select>
        </label>

        <label className="wd-product-library__field">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ProductLibraryStatusFilter)}
          >
            <option value="all">All products</option>
            <option value="missing-image">Missing image</option>
            <option value="missing-barcode">Missing barcode</option>
            <option value="missing-store">Missing store</option>
            <option value="duplicates">Possible duplicates</option>
            <option value="on-shopping">On shopping list</option>
            <option value="in-pantry">In pantry</option>
          </select>
        </label>
      </section>

      <div className="wd-product-library__view-toggle" role="group" aria-label="Product view mode">
        <button
          type="button"
          className={viewMode === "grid" ? "wd-product-library__view-btn wd-product-library__view-btn--active" : "wd-product-library__view-btn"}
          onClick={() => setViewMode("grid")}
          aria-pressed={viewMode === "grid"}
        >
          <LayoutGrid aria-hidden />
          Grid
        </button>
        <button
          type="button"
          className={viewMode === "table" ? "wd-product-library__view-btn wd-product-library__view-btn--active" : "wd-product-library__view-btn"}
          onClick={() => setViewMode("table")}
          aria-pressed={viewMode === "table"}
        >
          <List aria-hidden />
          Table
        </button>
      </div>

      {statusMessage ? (
        <p className="wd-product-library__status" role="status">
          {statusMessage}
        </p>
      ) : null}

      {viewMode === "grid" ? (
        <section className="wd-product-library__grid" aria-label="Product cards">
          {filteredProducts.map((product) => (
            <article key={product.id} className="wd-product-library-card">
              <div className="wd-product-library-card__media" aria-hidden>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="" />
                ) : (
                  <span>{productLetter(product)}</span>
                )}
              </div>
              <div className="wd-product-library-card__body">
                <h2>{product.productName}</h2>
                <p className="wd-product-library-card__brand">{product.brand?.trim() || "Brand not set"}</p>
                <span
                  className="wd-product-library-card__category"
                  style={
                    {
                      "--wd-product-library-cat-accent": getGroceryCategoryTheme(product.category).accent,
                      "--wd-product-library-cat-soft": getGroceryCategoryTheme(product.category).soft,
                    } as CSSProperties
                  }
                >
                  {product.category.trim() || "Uncategorized"}
                </span>
                <p className="wd-product-library-card__meta">{product.store.trim() || "Store not set"}</p>
                <div className="wd-product-library-card__badges">
                  <span className={normalizeGroceryBarcode(product.barcode) ? "wd-product-library-chip" : "wd-product-library-chip wd-product-library-chip--warn"}>
                    {formatBarcodeStatus(product)}
                  </span>
                  {product.need || isProductOnCart(product.id) ? (
                    <span className="wd-product-library-chip wd-product-library-chip--shopping">Shopping</span>
                  ) : null}
                  {!product.need ? <span className="wd-product-library-chip wd-product-library-chip--pantry">Pantry</span> : null}
                </div>
                <ProductQualityBadges
                  product={product}
                  duplicateCatalog={catalog}
                  duplicateDismissals={duplicateDismissals}
                />
              </div>
              <div className="wd-product-library-card__actions">
                <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                  View/Edit
                </button>
                <button type="button" onClick={() => addProductToShopping(product)}>
                  Add to Shopping
                </button>
                <button type="button" onClick={() => addProductToPantry(product)}>
                  Add to Pantry
                </button>
                <button type="button" onClick={() => void handleOpenFoodFactsFromCard(product)}>
                  Update from OpenFoodFacts
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="wd-product-library__table-wrap" aria-label="Product table">
          <table className="wd-product-library__table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Category</th>
                <th scope="col">Store</th>
                <th scope="col">Barcode</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="wd-product-library-table__identity">
                      <span className="wd-product-library-table__tile" aria-hidden>
                        {product.imageUrl ? <img src={product.imageUrl} alt="" /> : productLetter(product)}
                      </span>
                      <span>
                        <strong>{product.productName}</strong>
                        <span>{product.brand?.trim() || "Brand not set"}</span>
                      </span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>{product.store.trim() || "—"}</td>
                  <td>{product.barcode?.trim() || "—"}</td>
                  <td>
                    <div className="wd-product-library-card__badges">
                      {product.need || isProductOnCart(product.id) ? (
                        <span className="wd-product-library-chip wd-product-library-chip--shopping">Shopping</span>
                      ) : null}
                      {!product.need ? <span className="wd-product-library-chip wd-product-library-chip--pantry">Pantry</span> : null}
                    </div>
                  </td>
                  <td>
                    <div className="wd-product-library-table__actions">
                      <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                        View/Edit
                      </button>
                      <button type="button" onClick={() => addProductToShopping(product)}>
                        Shopping
                      </button>
                      <button type="button" onClick={() => addProductToPantry(product)}>
                        Pantry
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {filteredProducts.length === 0 ? (
        <section className="wd-product-library__empty" role="status">
          <h2>No products match these filters</h2>
          <p>Try clearing search or status filters, or add a new product.</p>
        </section>
      ) : null}

      {(statusFilter === "duplicates" || duplicateGroups.length > 0) && duplicateGroups.length > 0 ? (
        <section
          className={`wd-product-library__panel${
            statusFilter === "duplicates" ? " wd-product-library__panel--highlight" : ""
          }`}
          aria-labelledby="wd-product-library-duplicates-title"
        >
          <div className="wd-product-library__panel-head">
            <h2 id="wd-product-library-duplicates-title">Duplicate review</h2>
            <p>Products with the same barcode or normalized name and category.</p>
          </div>
          <div className="wd-product-library__panel-list">
            {duplicateGroups.map((group) => (
              <article key={group.id} className="wd-product-library-duplicate">
                <p className="wd-product-library-duplicate__reason">
                  {group.reason === "barcode" ? "Same barcode" : "Same name and category"}
                </p>
                <ul>
                  {group.products.map((product) => (
                    <li key={product.id}>
                      <strong>{product.productName}</strong>
                      <span>{product.category}</span>
                    </li>
                  ))}
                </ul>
                <div className="wd-product-library-duplicate__actions">
                  <button type="button" onClick={() => openProductDetailForEdit(group.products[0]?.id ?? "")}>
                    Review
                  </button>
                  <button type="button" onClick={() => startMergeReview(group)}>
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const [left, right] = group.products;
                      if (left && right) {
                        keepDuplicatePairSeparate(left.id, right.id);
                      }
                    }}
                  >
                    Keep separate
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="wd-product-library__panel" aria-labelledby="wd-product-library-missing-title">
        <div className="wd-product-library__panel-head">
          <h2 id="wd-product-library-missing-title">Missing data</h2>
          <p>Quick lists for cleanup work.</p>
        </div>
        <div className="wd-product-library__missing-grid">
          <article>
            <h3>Missing image</h3>
            <ul>
              {missingImageProducts.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                    {product.productName}
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Missing barcode</h3>
            <ul>
              {missingBarcodeProducts.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                    {product.productName}
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Missing store</h3>
            <ul>
              {missingStoreProducts.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                    {product.productName}
                  </button>
                </li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Missing category</h3>
            <ul>
              {missingCategoryProducts.map((product) => (
                <li key={product.id}>
                  <button type="button" onClick={() => openProductDetailForEdit(product.id)}>
                    {product.productName}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {detailView ? (
        <ProductDetailPanel
          product={detailView}
          mode={detailMode}
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => {
            dismissMergeReview();
            closeProductDetail();
          }}
          onChange={detailMode === "edit" ? updateDetailDraft : undefined}
          mergeReview={mergeReviewDetail}
          onAddToShopping={() => {
            if (detailMode === "edit") {
              addDetailToShopping(detailView);
              return;
            }
            const product = catalog.find((entry) => entry.id === detailView.id);
            if (product) {
              addProductToShopping(product);
            }
          }}
          onAddToPantry={() => {
            if (detailMode === "edit") {
              addDetailToPantry(detailView);
              return;
            }
            const product = catalog.find((entry) => entry.id === detailView.id);
            if (product) {
              addProductToPantry(product);
            }
          }}
          onSaveProduct={
            detailMode === "edit"
              ? () => {
                  const saved = saveDetailProduct(detailView);
                  if (saved) {
                    setStatusMessage(`Saved ${saved.productName}.`);
                  }
                }
              : undefined
          }
          onUpdateFromOpenFoodFacts={
            detailMode === "view"
              ? async () => {
                  if (!detailView) {
                    return;
                  }
                  const product = catalog.find((entry) => entry.id === detailView.id);
                  if (!product) {
                    return;
                  }
                  await enrichProductFromOpenFoodFacts(product);
                }
              : undefined
          }
        />
      ) : null}

      {scanOpen ? (
        <ProductScanPanel
          title="Scan product"
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => setScanOpen(false)}
          onLookup={async (barcode) => {
            await lookupBarcodeDraft(barcode);
            setScanOpen(false);
          }}
          onManualEntry={(barcode) => {
            beginManualDetailDraft(barcode);
            setScanOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

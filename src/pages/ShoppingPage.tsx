import { ChevronRight, Grid2X2, Minus, Plus, X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type CSSProperties,
} from "react";
import type { ShoppingItem } from "../data/familyData";
import { ProductDetailPanel } from "../components/ProductDetailPanel";
import { ProductScanPanel } from "../components/ProductScanPanel";
import { useHouseholdProducts } from "../context/HouseholdProductContext";
import { createActivity } from "../lib/activity";
import { useGroceryProductActions } from "../lib/groceryProductActions";
import { collectKnownGroceryStores, useGroceryCart } from "../lib/groceryCartStore";
import {
  findBestHouseholdProductMatch,
  getMostUsedFallbackCategory,
  SHOPPING_MOST_USED_LABELS,
} from "../lib/groceryLibraryData";
import {
  buildShoppingRouteHref,
  categoryToStoreSection,
  getShoppingCategoryLabel,
  householdProductToCatalogItem,
  normalizeShoppingUnit,
  parseShoppingQuantity,
  parseShoppingRouteSearch,
  SHOPPING_CATEGORY_GROUPS,
  SHOPPING_DEFAULT_STORES,
  SHOPPING_STORE_ADD_NEW,
  SHOPPING_UNIT_OPTIONS,
} from "../lib/shoppingData";
import type {
  ShoppingCatalogItem,
  ShoppingDetailDraft,
  ShoppingKioskCategoryId,
  ShoppingPageAction,
} from "../types/shopping";
import type { GroceryCartLine } from "../types/grocery";
import {
  createShoppingItemFromName,
  findActiveShoppingDuplicate,
  mergeShoppingQuantityStrings,
} from "./shopping/shoppingUtils";
import type { PageProps } from "./pageTypes";
import { useUiCustomization } from "../context/UiCustomizationContext";
import {
  getGroceryCategoryTheme,
  groceryCategoryThemeStyle,
  PANTRY_VISIBLE_CATEGORY_ORDER,
} from "../lib/groceryCategoryTheme";
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import { ShoppingCategorySection } from "../components/shopping/ShoppingCategorySection";
import { ShoppingQuickActions } from "../components/shopping/ShoppingQuickActions";
import "../styles/pantry-shopping-grofast.css";

function createShoppingRowFromCartLine(line: GroceryCartLine): ShoppingItem {
  const base = createShoppingItemFromName(line.productName);
  return {
    ...base,
    quantity: String(line.quantity),
    unit: line.unit,
    category: line.category,
    preferredStore: line.store,
    notes: line.notes,
    purchased: line.purchased,
    storeSection: categoryToStoreSection(line.category),
  };
}

type AddItemStep = "category" | "form";

type ShoppingAddDrawerState = {
  mode: "manual" | "product";
  step: AddItemStep;
  draft: ShoppingDetailDraft;
  brand?: string | null;
  imageUrl?: string | null;
};

type MostUsedQuickAddItem = {
  label: string;
  catalogId?: string;
  name: string;
  category: string;
  unit: string;
  imageUrl: string | null;
  brand?: string | null;
};

export function ShoppingPage({ setData, navigateWithinApp, shoppingSearch = "" }: PageProps) {
  const { pageLayout } = useUiCustomization();
  const { products } = useHouseholdProducts();
  const {
    detailView,
    detailProduct,
    detailMode,
    lookupBusy,
    lookupMessage,
    closeProductDetail,
    updateDetailDraft,
    beginManualDetailDraft,
    lookupBarcodeDraft,
    saveDetailProduct,
    addProductToPantry,
    addDetailToPantry,
    enrichProductFromOpenFoodFacts,
    removedInventoryProductIds,
  } = useGroceryProductActions();
  const {
    items: cartLines,
    addItem,
    updateItem,
    removeItem,
    quantityByProductId,
  } = useGroceryCart();
  const sidebarCollapsed = pageLayout.global.sidebarCollapsed;
  const route = useMemo(() => parseShoppingRouteSearch(shoppingSearch), [shoppingSearch]);
  const [activeCategory, setActiveCategory] = useState<ShoppingKioskCategoryId>(route.category);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeAction, setActiveAction] = useState<ShoppingPageAction | null>(route.action);
  const [addDrawerState, setAddDrawerState] = useState<ShoppingAddDrawerState | null>(null);
  const [customStores, setCustomStores] = useState<string[]>([]);
  const [newStoreName, setNewStoreName] = useState("");
  const [reorderNote, setReorderNote] = useState<string | null>(null);

  const addDrawerTitleId = useId();

  const storeOptions = useMemo(
    () =>
      collectKnownGroceryStores({
        presetStores: SHOPPING_DEFAULT_STORES,
        libraryStores: products.map((product) => product.store),
        cartStores: cartLines.map((line) => line.store),
        customStores,
      }),
    [cartLines, customStores, products],
  );

  useEffect(() => {
    setActiveCategory(route.category);
    setActiveAction(route.action);
    if (route.action === "add") {
      setAddDrawerState((current) =>
        current ?? {
          mode: "manual",
          step: "category",
          draft: {
            name: "",
            category: "",
            quantity: "1",
            unit: "each",
            store: storeOptions[0] ?? "",
            notes: "",
          },
        },
      );
    }
  }, [route.action, route.category, storeOptions]);

  useEffect(() => {
    document.documentElement.classList.add("wd-shopping-route");
    return () => {
      document.documentElement.classList.remove("wd-shopping-route");
    };
  }, []);

  useEffect(() => {
    function handleShoppingQuickAdd() {
      openAddItemModal();
    }

    window.addEventListener("wd-shopping-quick-add", handleShoppingQuickAdd);
    return () => {
      window.removeEventListener("wd-shopping-quick-add", handleShoppingQuickAdd);
    };
  }, [activeAction, activeCategory, navigateWithinApp]);

  const catalog = useMemo(
    () =>
      products
        .filter((product) => !removedInventoryProductIds.includes(product.id))
        .map(householdProductToCatalogItem),
    [products, removedInventoryProductIds],
  );

  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      const matchesLibraryCategory =
        !selectedLibraryCategory || item.category === selectedLibraryCategory;
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);
      return matchesLibraryCategory && matchesSearch;
    });
  }, [catalog, searchQuery, selectedLibraryCategory]);

  const displayCatalog = useMemo(
    () => [...filteredCatalog].sort((left, right) => left.name.localeCompare(right.name)),
    [filteredCatalog],
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines],
  );

  const mostUsedItems = useMemo<MostUsedQuickAddItem[]>(() => {
    const activeProducts = products.filter(
      (product) => !removedInventoryProductIds.includes(product.id),
    );

    return SHOPPING_MOST_USED_LABELS.map((label) => {
      const match = findBestHouseholdProductMatch(label, activeProducts);
      if (match) {
        const catalogItem = householdProductToCatalogItem(match);
        return {
          label,
          catalogId: match.id,
          name: match.productName,
          category: match.category,
          unit: catalogItem.unit,
          imageUrl: match.imageUrl,
          brand: match.brand,
        };
      }

      return {
        label,
        name: label,
        category: getMostUsedFallbackCategory(label),
        unit: "each",
        imageUrl: null,
        brand: null,
      };
    });
  }, [products, removedInventoryProductIds]);

  function syncShoppingRoute(next: {
    action?: ShoppingPageAction | null;
    category?: ShoppingKioskCategoryId;
  }) {
    const action = next.action === undefined ? activeAction : next.action;
    const category = next.category ?? activeCategory;
    if (next.category !== undefined) {
      setActiveCategory(category);
    }
    if (next.action !== undefined) {
      setActiveAction(action);
    }
    navigateWithinApp?.(
      buildShoppingRouteHref({
        action,
        category,
      }),
    );
  }

  function openAddItemModal() {
    setNewStoreName("");
    setAddDrawerState({
      mode: "manual",
      step: "category",
      draft: {
        name: "",
        category: "",
        quantity: "1",
        unit: "each",
        store: storeOptions[0] ?? "",
        notes: "",
      },
    });
    syncShoppingRoute({ action: "add" });
  }

  function closeAddDrawer() {
    setAddDrawerState(null);
    setNewStoreName("");
    if (activeAction === "add") {
      syncShoppingRoute({ action: null });
    }
  }

  useDrawerEscape(addDrawerState != null, closeAddDrawer);

  function openProductAddDrawer(args: {
    catalogId?: string;
    name: string;
    category: string;
    quantity?: string;
    unit?: string;
    store?: string;
    notes?: string;
    brand?: string | null;
    imageUrl?: string | null;
  }) {
    setNewStoreName("");
    setAddDrawerState({
      mode: "product",
      step: "form",
      draft: {
        catalogId: args.catalogId,
        name: args.name,
        category: args.category,
        quantity: args.quantity ?? "1",
        unit: normalizeShoppingUnit(args.unit, "each"),
        store: args.store?.trim() || storeOptions[0] || "",
        notes: args.notes ?? "",
      },
      brand: args.brand,
      imageUrl: args.imageUrl,
    });
  }

  function openCatalogAddDrawer(item: ShoppingCatalogItem) {
    const product = products.find((entry) => entry.id === item.id);
    openProductAddDrawer({
      catalogId: item.id,
      name: item.name,
      category: item.category,
      quantity: String(item.suggestedQuantity),
      unit: item.unit,
      store: product?.store,
      notes: product?.notes,
      brand: product?.brand,
      imageUrl: item.imageUrl,
    });
  }

  function openMostUsedAddDrawer(item: MostUsedQuickAddItem) {
    openProductAddDrawer({
      catalogId: item.catalogId,
      name: item.name,
      category: item.category,
      unit: item.unit,
      imageUrl: item.imageUrl,
      brand: item.brand,
    });
  }

  function openScanModal() {
    syncShoppingRoute({ action: "scan" });
  }

  function closeScanModal() {
    syncShoppingRoute({ action: null });
  }

  async function handleScanLookup(barcode: string) {
    const draft = await lookupBarcodeDraft(barcode);
    if (draft) {
      closeScanModal();
    }
  }

  function handleManualScanEntry(barcode: string) {
    beginManualDetailDraft(barcode);
    closeScanModal();
  }

  function chooseAddItemCategory(category: string) {
    setAddDrawerState((current) => ({
      mode: "manual",
      step: "form",
      draft: {
        name: "",
        category,
        quantity: "1",
        unit: "each",
        store: storeOptions[0] ?? "",
        notes: "",
      },
      brand: current?.brand,
      imageUrl: current?.imageUrl,
    }));
  }

  function saveNewStore(target: "detail" | "custom") {
    const trimmed = newStoreName.trim();
    if (!trimmed) {
      return;
    }
    setCustomStores((current) =>
      current.some((store) => store.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed],
    );
    if (target === "custom") {
      setAddDrawerState((current) =>
        current
          ? {
              ...current,
              draft: { ...current.draft, store: trimmed },
            }
          : current,
      );
    }
    setNewStoreName("");
  }

  function submitAddDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addDrawerState) {
      return;
    }
    const draft = addDrawerState.draft;
    const quantity = parseShoppingQuantity(draft.quantity);
    if (!quantity || !draft.name.trim()) {
      return;
    }
    const catalogItem = draft.catalogId
      ? catalog.find((item) => item.id === draft.catalogId)
      : undefined;
    if (draft.store === SHOPPING_STORE_ADD_NEW && !newStoreName.trim()) {
      return;
    }
    const store =
      draft.store === SHOPPING_STORE_ADD_NEW ? newStoreName.trim() : draft.store.trim();
    addItem({
      productId: draft.catalogId ?? `manual-${crypto.randomUUID()}`,
      productName: draft.name.trim(),
      imageUrl: addDrawerState.imageUrl ?? catalogItem?.imageUrl ?? null,
      category: draft.category,
      quantity,
      unit: normalizeShoppingUnit(String(draft.unit)),
      store,
      notes: draft.notes.trim(),
      purchased: false,
    });
    closeAddDrawer();
  }

  function formatDrawerQuantity(value: number) {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  function setDrawerQuantity(delta: number) {
    setAddDrawerState((current) => {
      if (!current) {
        return current;
      }
      const nextQuantity = Math.max(1, (parseShoppingQuantity(current.draft.quantity) ?? 1) + delta);
      return {
        ...current,
        draft: {
          ...current.draft,
          quantity: formatDrawerQuantity(nextQuantity),
        },
      };
    });
  }

  function updateAddDrawerDraft(next: ShoppingDetailDraft) {
    setAddDrawerState((current) => (current ? { ...current, draft: next } : current));
  }

  function setCartQuantity(lineId: string, nextQuantity: number) {
    setSaveMessage("");
    if (nextQuantity <= 0) {
      removeItem(lineId);
      return;
    }
    updateItem(lineId, { quantity: nextQuantity });
  }

  function toggleCartPurchased(lineId: string, purchased: boolean) {
    setSaveMessage("");
    updateItem(lineId, { purchased });
  }

  const cartByCategory = useMemo(() => {
    const map = new Map<string, typeof cartLines>();
    for (const line of cartLines) {
      const key = line.category.trim() || "Uncategorized";
      const bucket = map.get(key) ?? [];
      bucket.push(line);
      map.set(key, bucket);
    }
    return [...map.entries()]
      .sort(([a], [b]) => getShoppingCategoryLabel(a).localeCompare(getShoppingCategoryLabel(b)))
      .map(([category, lines]) => ({
        category,
        lines: lines.sort((a, b) => a.productName.localeCompare(b.productName)),
      }));
  }, [cartLines]);

  function saveShoppingList() {
    if (cartLines.length === 0) {
      setSaveMessage("Add items to your list before saving.");
      return;
    }

    setData((current) => {
      let nextShopping = [...current.shopping];
      let addedCount = 0;
      let updatedCount = 0;

      for (const line of cartLines) {
        const active = nextShopping.filter((row) => !row.purchased);
        const duplicate = findActiveShoppingDuplicate(active, { name: line.productName });
        const now = new Date().toISOString();

        if (duplicate) {
          nextShopping = nextShopping.map((row) =>
            row.id === duplicate.id
              ? {
                  ...row,
                  quantity: mergeShoppingQuantityStrings(row.quantity ?? "", String(line.quantity)),
                  unit: line.unit || row.unit,
                  category: line.category,
                  preferredStore: line.store || row.preferredStore,
                  notes: line.notes || row.notes,
                  storeSection: categoryToStoreSection(line.category),
                  updatedAt: now,
                }
              : row,
          );
          updatedCount += 1;
          continue;
        }

        const created = createShoppingRowFromCartLine(line);
        nextShopping = [...nextShopping, created];
        addedCount += 1;
      }

      const summary =
        addedCount > 0 && updatedCount > 0
          ? `Saved ${addedCount} new items and updated ${updatedCount} existing items.`
          : addedCount > 0
            ? `Saved ${addedCount} item${addedCount === 1 ? "" : "s"} to the shopping list.`
            : `Updated ${updatedCount} item${updatedCount === 1 ? "" : "s"} on the shopping list.`;

      setSaveMessage(summary);

      return createActivity(
        {
          ...current,
          shopping: nextShopping,
        },
        {
          type: "updated",
          entityType: "shopping",
          entityId: "shopping-kiosk",
          entityTitle: "Shopping list",
          message: "Saved shopping list from kiosk.",
        },
      );
    });
  }

  function renderCategoryGroups(onSelect: (category: ShoppingKioskCategoryId | string) => void) {
    return (
      <>
        <button
          type="button"
          className="wd-shopping-kiosk__category-option"
          onClick={() => onSelect("all")}
        >
          All categories
        </button>
        {SHOPPING_CATEGORY_GROUPS.map((group) => (
          <div key={group.id} className="wd-shopping-kiosk__category-group">
            <p className="wd-shopping-kiosk__category-group-label">{group.label}</p>
            <div className="wd-shopping-kiosk__category-group-list">
              {group.categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="wd-shopping-kiosk__category-option"
                  onClick={() => onSelect(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  function renderCategoryGrid() {
    const allTheme = getGroceryCategoryTheme("");

    return (
      <nav className="wd-shopping-kiosk__category-grid" aria-label="Shopping categories">
        <button
          type="button"
          className={
            selectedLibraryCategory === null
              ? "wd-shopping-kiosk__category-button wd-shopping-kiosk__category-button--active"
              : "wd-shopping-kiosk__category-button"
          }
          style={
            {
              "--wd-shopping-cat-accent": allTheme.accent,
              "--wd-shopping-cat-soft": allTheme.soft,
            } as CSSProperties
          }
          onClick={() => setSelectedLibraryCategory(null)}
          aria-current={selectedLibraryCategory === null ? "true" : undefined}
        >
          <span className="wd-shopping-kiosk__category-button-icon" aria-hidden>
            <Grid2X2 size={24} strokeWidth={2.1} />
          </span>
          <span className="wd-shopping-kiosk__category-button-name">All Categories</span>
        </button>
        {PANTRY_VISIBLE_CATEGORY_ORDER.map((category) => {
          const theme = getGroceryCategoryTheme(category);
          const Icon = theme.icon;
          const active = selectedLibraryCategory === category;

          return (
            <button
              key={category}
              type="button"
              className={
                active
                  ? "wd-shopping-kiosk__category-button wd-shopping-kiosk__category-button--active"
                  : "wd-shopping-kiosk__category-button"
              }
              style={
                {
                  "--wd-shopping-cat-accent": theme.accent,
                  "--wd-shopping-cat-soft": theme.soft,
                } as CSSProperties
              }
              data-category={category}
              onClick={() => setSelectedLibraryCategory(category)}
              aria-current={active ? "true" : undefined}
            >
              <span className="wd-shopping-kiosk__category-button-icon" aria-hidden>
                <Icon size={24} strokeWidth={2.1} />
              </span>
              <span className="wd-shopping-kiosk__category-button-name">{category}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  function renderMostUsedSection() {
    return (
      <section className="wd-shopping-most-used" aria-labelledby="wd-shopping-most-used-title">
        <div className="wd-shopping-most-used__copy">
          <h2 id="wd-shopping-most-used-title" className="wd-shopping-most-used__title">
            Most Used
          </h2>
        </div>
        <div className="wd-shopping-most-used__grid">
          {mostUsedItems.map((item) => (
            <div
              key={item.label}
              className="wd-shopping-most-used__card"
              style={groceryCategoryThemeStyle(item.category)}
            >
              <span className="wd-shopping-most-used__accent" aria-hidden />
              <span className="wd-shopping-most-used__name">{item.label}</span>
              <button
                type="button"
                className="wd-shopping-most-used__add-btn"
                onClick={() => openMostUsedAddDrawer(item)}
              >
                <Plus aria-hidden className="wd-shopping-most-used__add-btn-icon" />
                Add
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderAddDrawer() {
    if (!addDrawerState) {
      return null;
    }

    const { draft, brand, imageUrl, mode, step } = addDrawerState;
    const showNewStore = draft.store === SHOPPING_STORE_ADD_NEW;
    const categoryLabel = getShoppingCategoryLabel(draft.category);
    const letter = draft.name.trim().charAt(0) || "?";

    return (
      <aside
        className="wd-shopping-add-drawer wd-shopping-add-drawer--inline"
        role="region"
        aria-labelledby={addDrawerTitleId}
      >
        <div className="wd-shopping-add-drawer__head">
          <h2 id={addDrawerTitleId} className="wd-shopping-add-drawer__title">
            Add to Shopping List
          </h2>
          <button
            type="button"
            className="wd-shopping-add-drawer__close"
            aria-label="Close add to shopping list drawer"
            onClick={closeAddDrawer}
          >
            <X aria-hidden className="wd-shopping-add-drawer__close-icon" />
          </button>
        </div>

        {step === "category" ? (
          <div className="wd-shopping-add-drawer__body">
            <p className="wd-shopping-add-drawer__intro">Choose a category for the new item.</p>
            {renderCategoryGroups((category) => {
              if (category === "all") {
                return;
              }
              chooseAddItemCategory(category);
            })}
          </div>
        ) : (
          <form className="wd-shopping-add-drawer__form" onSubmit={submitAddDrawer}>
            <div className="wd-shopping-add-drawer__body">
                {mode === "product" ? (
                  <div className="wd-shopping-add-drawer__product">
                    <span className="wd-shopping-add-drawer__product-tile" aria-hidden>
                      {imageUrl ? (
                        <img
                          className="wd-shopping-add-drawer__product-image"
                          src={imageUrl}
                          alt=""
                        />
                      ) : (
                        <span className="wd-shopping-add-drawer__product-letter">{letter}</span>
                      )}
                    </span>
                    <div className="wd-shopping-add-drawer__product-copy">
                      <p className="wd-shopping-add-drawer__product-category">{categoryLabel}</p>
                      <p className="wd-shopping-add-drawer__product-name">{draft.name}</p>
                      {brand?.trim() ? (
                        <p className="wd-shopping-add-drawer__product-brand">{brand.trim()}</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="wd-shopping-add-drawer__selected">
                      Category: <strong>{categoryLabel}</strong>
                    </p>
                    <label className="wd-shopping-add-drawer__field">
                      <span>Item name</span>
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          updateAddDrawerDraft({ ...draft, name: event.target.value })
                        }
                        required
                      />
                    </label>
                  </>
                )}

                <div className="wd-shopping-add-drawer__field">
                  <span>Amount</span>
                  <div className="wd-shopping-add-drawer__amount">
                    <button
                      type="button"
                      className="wd-shopping-add-drawer__amount-btn"
                      aria-label="Decrease amount"
                      onClick={() => setDrawerQuantity(-1)}
                    >
                      <Minus aria-hidden className="wd-shopping-add-drawer__amount-icon" />
                    </button>
                    <input
                      className="wd-shopping-add-drawer__amount-input"
                      value={draft.quantity}
                      onChange={(event) =>
                        updateAddDrawerDraft({ ...draft, quantity: event.target.value })
                      }
                      inputMode="decimal"
                      required
                    />
                    <button
                      type="button"
                      className="wd-shopping-add-drawer__amount-btn"
                      aria-label="Increase amount"
                      onClick={() => setDrawerQuantity(1)}
                    >
                      <Plus aria-hidden className="wd-shopping-add-drawer__amount-icon" />
                    </button>
                  </div>
                </div>

                <label className="wd-shopping-add-drawer__field">
                  <span>Unit / Size</span>
                  <select
                    value={draft.unit}
                    onChange={(event) =>
                      updateAddDrawerDraft({ ...draft, unit: event.target.value })
                    }
                  >
                    {SHOPPING_UNIT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wd-shopping-add-drawer__field">
                  <span>Store</span>
                  <select
                    value={draft.store}
                    onChange={(event) =>
                      updateAddDrawerDraft({ ...draft, store: event.target.value })
                    }
                  >
                    {storeOptions.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                    <option value={SHOPPING_STORE_ADD_NEW}>Add New Store</option>
                  </select>
                </label>

                {showNewStore ? (
                  <div className="wd-shopping-add-drawer__new-store">
                    <label className="wd-shopping-add-drawer__field">
                      <span>New store name</span>
                      <input
                        value={newStoreName}
                        onChange={(event) => setNewStoreName(event.target.value)}
                        placeholder="Store name"
                      />
                    </label>
                    <button
                      type="button"
                      className="wd-shopping-add-drawer__secondary"
                      onClick={() => saveNewStore("custom")}
                    >
                      Save New Store
                    </button>
                  </div>
                ) : null}

                <label className="wd-shopping-add-drawer__field">
                  <span>Notes</span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) =>
                      updateAddDrawerDraft({ ...draft, notes: event.target.value })
                    }
                    rows={3}
                  />
                </label>

                <div className="wd-shopping-add-drawer__footer">
                {mode === "manual" ? (
                  <button
                    type="button"
                    className="wd-shopping-add-drawer__secondary"
                    onClick={() =>
                      setAddDrawerState((current) =>
                        current ? { ...current, step: "category" } : current,
                      )
                    }
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wd-shopping-add-drawer__secondary"
                    onClick={closeAddDrawer}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="wd-shopping-add-drawer__primary">
                  Add to Shopping List
                </button>
              </div>
            </div>
          </form>
          )}
        </aside>
    );
  }
  function renderCatalogItems() {
    if (displayCatalog.length === 0) {
      return (
        <div className="wd-pantry-kiosk__empty" role="status">
          <p className="wd-pantry-kiosk__empty-title">No items match this filter.</p>
          <p className="wd-pantry-kiosk__empty-hint">Try another category or clear search.</p>
        </div>
      );
    }

    return (
      <ul className="wd-pantry-kiosk__rows wd-pantry-category-items">
        {displayCatalog.map((item) => {
          const inCart = quantityByProductId(item.id);
          const product = products.find((entry) => entry.id === item.id);
          const store = product?.store?.trim() ?? "";
          const letter = item.name.trim().charAt(0).toUpperCase() || "?";
          const theme = getGroceryCategoryTheme(item.category);

          return (
            <li key={item.id}>
              <button
                type="button"
                className="wd-pantry-kiosk__row wd-pantry-category-item"
                style={
                  {
                    borderTopColor: theme.accent,
                  } as CSSProperties
                }
                onClick={() => openCatalogAddDrawer(item)}
              >
                <span className="wd-pantry-kiosk__row-media" aria-hidden>
                  {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <span>{letter}</span>}
                </span>
                <span className="wd-pantry-kiosk__row-copy">
                  <strong>{item.name}</strong>
                  <span>
                    {item.suggestedQuantity} {item.unit}
                    {store ? ` · ${store}` : ""}
                  </span>
                  {inCart > 0 ? <span>In list: {inCart} {item.unit}</span> : null}
                </span>
                <ChevronRight aria-hidden className="wd-pantry-kiosk__row-arrow" />
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div
      className={`wd-shopping-kiosk${
        sidebarCollapsed ? " wd-shopping-kiosk--sidebar-collapsed" : ""
      }`}
    >
      <header className="wd-shopping-kiosk__header" aria-labelledby="wd-shopping-kiosk-title">
        <div className="wd-shopping-kiosk__header-inner">
          <div>
            <h1 id="wd-shopping-kiosk-title" className="wd-shopping-kiosk__title">
              Shopping List
            </h1>
            <p className="wd-shopping-kiosk__subtitle">What does the household need next?</p>
          </div>
          <div className="wd-shopping-kiosk__header-actions">
            <label className="wd-shopping-kiosk__search">
              <span className="wd-shopping-kiosk__search-label">Search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, store, notes…"
                aria-label="Search shopping products"
              />
            </label>
            <button
              type="button"
              className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--ghost"
              onClick={openAddItemModal}
            >
              New Add
            </button>
            <button
              type="button"
              className="wd-pantry-kiosk__btn wd-pantry-kiosk__btn--orange"
              onClick={openScanModal}
            >
              Scan product
            </button>
          </div>
        </div>
      </header>

      <div className="wd-shopping-kiosk__most-used-slot">{renderMostUsedSection()}</div>

      <div className="wd-shopping-kiosk__body wd-shopping-kiosk__body--no-sidebar">
        <div className="wd-shopping-kiosk__center">
          <div className="wd-shopping-kiosk__categories">{renderCategoryGrid()}</div>
          <div
            className={`wd-shopping-kiosk__list-column${
              addDrawerState ? " wd-shopping-kiosk__list-column--drawer-open" : ""
            }`}
          >
            <div className="wd-shopping-kiosk__list">{renderCatalogItems()}</div>
            {renderAddDrawer()}
          </div>
        </div>

        <aside className="wd-shopping-kiosk__summary wd-shopping-kiosk__cart" aria-label="Shopping list">
            <div className="gf-shopping-cart">
              <div className="gf-shopping-cart__head">
                <h2 className="gf-shopping-cart__title">My list</h2>
                <p className="gf-shopping-cart__count">
                  {cartTotal} item{cartTotal === 1 ? "" : "s"}
                </p>
              </div>

              {reorderNote ? (
                <p className="text-sm font-semibold text-violet-800" role="status">
                  {reorderNote}
                </p>
              ) : null}

              {cartLines.length === 0 ? (
                <div className="gf-shopping-empty" role="status">
                  <p className="gf-shopping-empty__title">Your list is empty</p>
                  <p className="gf-shopping-empty__hint">Add from the catalog or move items from Pantry.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {cartByCategory.map((group) => (
                    <ShoppingCategorySection
                      key={group.category}
                      category={group.category}
                      lines={group.lines}
                      onTogglePurchased={toggleCartPurchased}
                      onQuantityChange={setCartQuantity}
                      onRemove={(id) => setCartQuantity(id, 0)}
                    />
                  ))}
                </div>
              )}

              <ShoppingQuickActions
                itemCount={cartTotal}
                onSaveList={saveShoppingList}
                saveMessage={saveMessage}
                saveDisabled={cartLines.length === 0}
                onReorderNote={() => {
                  setReorderNote("Reorder noted locally — no payment or delivery.");
                  window.setTimeout(() => setReorderNote(null), 2800);
                }}
              />
            </div>
          </aside>
      </div>


      {activeAction === "scan" ? (
        <ProductScanPanel
          title="Scan item"
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={closeScanModal}
          onLookup={handleScanLookup}
          onManualEntry={handleManualScanEntry}
        />
      ) : null}

      {detailView ? (
        <ProductDetailPanel
          product={detailView}
          mode={detailMode}
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={closeProductDetail}
          onChange={detailMode === "edit" ? updateDetailDraft : undefined}
          onAddToShopping={() => {
            openProductAddDrawer({
              catalogId: detailView.id || detailProduct?.id,
              name: detailView.productName,
              category: detailView.category,
              quantity: detailView.quantity != null ? String(detailView.quantity) : "1",
              unit: detailView.unit ?? "each",
              store: detailView.store,
              notes: detailView.notes,
              brand: detailView.brand,
              imageUrl: detailView.imageUrl,
            });
          }}
          onAddToPantry={() => {
            if (detailMode === "edit") {
              addDetailToPantry(detailView);
              return;
            }
            if (detailProduct) {
              addProductToPantry(detailProduct);
            }
          }}
          onSaveProduct={detailMode === "edit" ? () => saveDetailProduct(detailView) : undefined}
          onUpdateFromOpenFoodFacts={
            detailMode === "view" && detailProduct
              ? async () => {
                  await enrichProductFromOpenFoodFacts(detailProduct);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

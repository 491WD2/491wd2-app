import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Minus,
  Package,
  Plus,
  ScanLine,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ShoppingItem } from "../data/familyData";
import { ProductDetailPanel } from "../components/ProductDetailPanel";
import { ProductScanPanel } from "../components/ProductScanPanel";
import { ShoppingListCard } from "../components/shopping/ShoppingListCard";
import { ShoppingQuickActions } from "../components/shopping/ShoppingQuickActions";
import { useHouseholdProducts } from "../context/HouseholdProductContext";
import { createActivity } from "../lib/activity";
import { useGroceryProductActions } from "../lib/groceryProductActions";
import { collectKnownGroceryStores, useGroceryCart } from "../lib/groceryCartStore";
import {
  buildShoppingRouteHref,
  categoryToStoreSection,
  householdProductToCatalogItem,
  normalizeShoppingUnit,
  parseShoppingQuantity,
  parseShoppingRouteSearch,
  SHOPPING_DEFAULT_STORES,
  SHOPPING_STORE_ADD_NEW,
  SHOPPING_UNIT_OPTIONS,
} from "../lib/shoppingData";
import type {
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
import { useDrawerEscape } from "../hooks/useDrawerEscape";
import "../styles/pantry-shopping-grofast.css";
import "../styles/guided-kiosk.css";

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

const MANUAL_SHOPPING_CATEGORY = "Shopping List";

type ShoppingAddDrawerState = {
  mode: "manual" | "product";
  draft: ShoppingDetailDraft;
  brand?: string | null;
  imageUrl?: string | null;
};

type ShoppingFlowScreen = "hub" | "lists" | "current" | "add" | "new-list" | "shared-list";

export function ShoppingPage({ data, setData, navigateWithinApp, shoppingSearch = "" }: PageProps) {
  const { products } = useHouseholdProducts();
  const {
    detailView,
    detailProduct,
    detailMode,
    lookupBusy,
    lookupMessage,
    openProductDetail,
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
  } = useGroceryCart();
  const route = useMemo(() => parseShoppingRouteSearch(shoppingSearch), [shoppingSearch]);
  const [activeCategory, setActiveCategory] = useState<ShoppingKioskCategoryId>(route.category);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeAction, setActiveAction] = useState<ShoppingPageAction | null>(route.action);
  const [screen, setScreen] = useState<ShoppingFlowScreen>(route.action === "add" ? "add" : "hub");
  const [addDrawerState, setAddDrawerState] = useState<ShoppingAddDrawerState | null>(null);
  const [customStores, setCustomStores] = useState<string[]>([]);
  const [newStoreName, setNewStoreName] = useState("");
  const [currentListTitle, setCurrentListTitle] = useState("Current List");
  const [selectedStore, setSelectedStore] = useState("All Stores");
  const [newListTitle, setNewListTitle] = useState("");
  const [sharedListTitle, setSharedListTitle] = useState("Shared Household List");

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

  function createManualShoppingDraft(seedName = ""): ShoppingDetailDraft {
    return {
      name: seedName.trim(),
      category: MANUAL_SHOPPING_CATEGORY,
      quantity: "1",
      unit: "each",
      store: storeOptions[0] ?? "",
      notes: "",
    };
  }

  useEffect(() => {
    setActiveCategory(route.category);
    setActiveAction(route.action);
    if (route.action === "add") {
      setScreen("add");
      setAddDrawerState((current) => {
        if (current) {
          if (!current.draft.name.trim() && route.itemName) {
            return {
              ...current,
              draft: {
                ...current.draft,
                name: route.itemName,
              },
            };
          }
          return current;
        }
        return {
          mode: "manual",
          draft: createManualShoppingDraft(route.itemName),
        };
      });
    } else if (activeAction === "add") {
      setAddDrawerState(null);
    }
  }, [activeAction, route.action, route.category, route.itemName, storeOptions]);

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

  const openLineCount = useMemo(
    () => cartLines.filter((line) => !line.purchased).length,
    [cartLines],
  );
  const activeCartLines = useMemo(
    () => cartLines.filter((line) => !line.purchased),
    [cartLines],
  );
  const purchasedCartLines = useMemo(
    () => cartLines.filter((line) => line.purchased),
    [cartLines],
  );
  const visibleCurrentLines = useMemo(
    () =>
      selectedStore === "All Stores"
        ? activeCartLines
        : activeCartLines.filter((line) => (line.store.trim() || "No store") === selectedStore),
    [activeCartLines, selectedStore],
  );
  const savedOpenItems = useMemo(
    () => data.shopping.filter((item) => !item.purchased),
    [data.shopping],
  );
  const savedPurchasedItems = useMemo(
    () => data.shopping.filter((item) => item.purchased),
    [data.shopping],
  );
  const listCards = useMemo(
    () => [
      {
        id: "current",
        title: currentListTitle,
        subtitle: "Live household shopping cart",
        count: activeCartLines.length,
        meta: `${purchasedCartLines.length} purchased`,
        screen: "current" as ShoppingFlowScreen,
      },
      {
        id: "saved",
        title: "Saved Shopping List",
        subtitle: "Items saved into the household dashboard",
        count: savedOpenItems.length,
        meta: `${savedPurchasedItems.length} completed`,
        screen: "lists" as ShoppingFlowScreen,
      },
      {
        id: "shared",
        title: sharedListTitle,
        subtitle: "Shared family list setup",
        count: cartLines.length,
        meta: "Uses current household cart",
        screen: "shared-list" as ShoppingFlowScreen,
      },
    ],
    [activeCartLines.length, cartLines.length, currentListTitle, purchasedCartLines.length, savedOpenItems.length, savedPurchasedItems.length, sharedListTitle],
  );
  const frequentProducts = useMemo(() => {
    const cartProductIds = new Set(cartLines.map((line) => line.productId));
    const savedNameCounts = new Map<string, number>();
    for (const item of data.shopping) {
      const key = item.name.trim().toLowerCase();
      if (key) {
        savedNameCounts.set(key, (savedNameCounts.get(key) ?? 0) + 1);
      }
    }
    return catalog
      .filter((item) => !cartProductIds.has(item.id))
      .sort((left, right) => {
        const leftHits = savedNameCounts.get(left.name.trim().toLowerCase()) ?? 0;
        const rightHits = savedNameCounts.get(right.name.trim().toLowerCase()) ?? 0;
        if (leftHits !== rightHits) {
          return rightHits - leftHits;
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, 8);
  }, [cartLines, catalog, data.shopping]);

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

  function openPantryInventory() {
    navigateWithinApp?.("/pantry?view=pantry");
  }

  function openPantrySettings() {
    navigateWithinApp?.("/pantry?view=settings");
  }

  function openShoppingScreen(nextScreen: ShoppingFlowScreen) {
    if (nextScreen !== "add" && activeAction === "add") {
      syncShoppingRoute({ action: null });
    }
    setScreen(nextScreen);
  }

  function addCatalogProductToShopping(item: (typeof catalog)[number]) {
    addItem({
      productId: item.id,
      productName: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      quantity: Math.max(1, item.suggestedQuantity || 1),
      unit: normalizeShoppingUnit(item.unit, "each"),
      store: products.find((product) => product.id === item.id)?.store ?? storeOptions[0] ?? "",
      notes: "",
      purchased: false,
    });
    setSaveMessage(`${item.name} was added to ${currentListTitle}.`);
    setScreen("current");
  }

  function startShopping() {
    setSaveMessage(
      activeCartLines.length
        ? `Shopping started with ${activeCartLines.length} active item${activeCartLines.length === 1 ? "" : "s"}.`
        : "Add products before starting the shopping list.",
    );
    setScreen("current");
  }

  function createNewList(shared = false) {
    const title = (shared ? sharedListTitle : newListTitle).trim();
    if (!title) {
      setSaveMessage("Add a list name first.");
      return;
    }
    setCurrentListTitle(title);
    if (shared) {
      setSharedListTitle(title);
    }
    setSaveMessage(`${title} is ready using the current household shopping items.`);
    setScreen("current");
  }

  function openAddItemModal(seedName = route.itemName) {
    setScreen("add");
    setNewStoreName("");
    setAddDrawerState({
      mode: "manual",
      draft: createManualShoppingDraft(seedName),
    });
    syncShoppingRoute({ action: "add" });
  }

  function closeAddDrawer() {
    setAddDrawerState(null);
    setNewStoreName("");
    if (screen === "add") {
      setScreen("current");
    }
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
    setScreen("add");
    setNewStoreName("");
    setAddDrawerState({
      mode: "product",
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

  function openScanModal() {
    syncShoppingRoute({ action: "scan" });
  }

  function openShoppingLineDetails(line: GroceryCartLine) {
    const target = line;
    const product = products.find((entry) => entry.id === target.productId);
    if (product) {
      openProductDetail(product.id);
      return;
    }
    openProductAddDrawer({
      catalogId: target.productId,
      name: target.productName,
      category: target.category,
      quantity: String(target.quantity),
      unit: target.unit,
      store: target.store,
      notes: target.notes,
      imageUrl: target.imageUrl,
    });
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

  function renderAddDrawer() {
    if (!addDrawerState) {
      return null;
    }

    const { draft, brand, imageUrl, mode } = addDrawerState;
    const showNewStore = draft.store === SHOPPING_STORE_ADD_NEW;
    const letter = draft.name.trim().charAt(0) || "?";
    const query = draft.name.trim().toLowerCase();
    const libraryMatches =
      query.length >= 2
        ? catalog
            .filter((item) => item.name.toLowerCase().includes(query))
            .filter((item) => item.name.toLowerCase() !== query)
            .slice(0, 5)
        : [];
    const heroTitle = draft.name.trim() || "New shopping item";
    const heroSubtitle =
      mode === "product" && brand?.trim() ? brand.trim() : "Type 2-3 letters and pick from your product library.";

    return (
      <aside
        className="wd-shopping-add-drawer wd-shopping-add-drawer--inline wd-shopping-add-drawer--pantry-system"
        role="region"
        aria-labelledby={addDrawerTitleId}
      >
        <div className="wd-shopping-add-drawer__hero">
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
          <div className="wd-shopping-add-drawer__hero-copy">
            <p>Shopping item</p>
            <h2 id={addDrawerTitleId} className="wd-shopping-add-drawer__title">
              Add item
            </h2>
            <strong>{heroTitle}</strong>
            <span>{heroSubtitle}</span>
            <div className="wd-shopping-add-drawer__pills" aria-label="Shopping item summary">
              <span>{draft.quantity || "1"} {draft.unit || "each"}</span>
              <span>{draft.store || "Default list"}</span>
              <span>{draft.catalogId ? "Library item" : "Manual"}</span>
            </div>
          </div>
          <button
            type="button"
            className="wd-shopping-add-drawer__close"
            aria-label="Close add to shopping list drawer"
            onClick={closeAddDrawer}
          >
            <X aria-hidden className="wd-shopping-add-drawer__close-icon" />
          </button>
        </div>

        <form className="wd-shopping-add-drawer__form" onSubmit={submitAddDrawer}>
          <div className="wd-shopping-add-drawer__body">
            <section className="wd-shopping-add-drawer__card">
              <header>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                <div>
                  <h3>Item details</h3>
                  <p>Name and product library match.</p>
                </div>
              </header>
              <label className="wd-shopping-add-drawer__field">
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(event) =>
                    updateAddDrawerDraft({
                      ...draft,
                      catalogId: undefined,
                      name: event.target.value,
                      category: draft.category || MANUAL_SHOPPING_CATEGORY,
                    })
                  }
                  placeholder="Start typing an item"
                  required
                />
              </label>

              {libraryMatches.length > 0 ? (
                <div className="wd-shopping-add-drawer__matches" aria-label="Product library suggestions">
                  {libraryMatches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setAddDrawerState((current) =>
                          current
                            ? {
                                ...current,
                                mode: "product",
                                imageUrl: item.imageUrl,
                                draft: {
                                  ...current.draft,
                                  catalogId: item.id,
                                  name: item.name,
                                  category: item.category,
                                  quantity: String(item.suggestedQuantity || 1),
                                  unit: normalizeShoppingUnit(item.unit, "each"),
                                },
                              }
                            : current,
                        )
                      }
                    >
                      <span>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.name.charAt(0)}</span>
                      <strong>{item.name}</strong>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="wd-shopping-add-drawer__card">
              <header>
                <Plus className="h-4 w-4" aria-hidden />
                <div>
                  <h3>Count and store</h3>
                  <p>Quantity, unit, and where to buy it.</p>
                </div>
              </header>
              <div className="wd-shopping-add-drawer__field-grid">
                <div className="wd-shopping-add-drawer__field">
                  <span>Qty</span>
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
                  <span>Unit</span>
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
              </div>

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
            </section>

            <section className="wd-shopping-add-drawer__card wd-shopping-add-drawer__card--wide">
              <header>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                <div>
                  <h3>Notes</h3>
                  <p>Optional buying details.</p>
                </div>
              </header>
              <label className="wd-shopping-add-drawer__field">
                <span>Notes</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    updateAddDrawerDraft({ ...draft, notes: event.target.value })
                  }
                  placeholder="Brand, size, substitution, or reminder"
                  rows={3}
                />
              </label>
            </section>

            <div className="wd-shopping-add-drawer__footer">
              <button
                type="button"
                className="wd-shopping-add-drawer__secondary"
                onClick={closeAddDrawer}
              >
                Cancel
              </button>
              <button type="submit" className="wd-shopping-add-drawer__primary">
                Add to Shopping List
              </button>
            </div>
          </div>
        </form>
      </aside>
    );
  }

  function renderTopBar() {
    return (
      <header className="wd-shopping-ref__topbar" aria-label="Shopping navigation">
        <button type="button" className="wd-shopping-ref__back" onClick={openPantryInventory}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <strong>Shopping</strong>
        <span aria-hidden />
      </header>
    );
  }

  function renderHubScreen() {
    return (
      <main className="wd-shopping-ref__content wd-shopping-flow" aria-label="Shopping main">
        <section className="wd-shopping-flow__hero">
          <div>
            <h1>Household Shopping</h1>
            <span>{openLineCount} active items from your real shopping cart and product library.</span>
          </div>
        </section>

        {saveMessage ? <p className="wd-shopping-ref__status" role="status">{saveMessage}</p> : null}

        <section className="wd-shopping-flow__quick-grid" aria-label="Shopping shortcuts">
          <button type="button" onClick={() => openShoppingScreen("lists")}>
            <ListChecks className="h-6 w-6" aria-hidden />
            <strong>Lists</strong>
            <span>{listCards.length} list views</span>
          </button>
          <button type="button" onClick={() => openAddItemModal()}>
            <Plus className="h-6 w-6" aria-hidden />
            <strong>Add Product</strong>
            <span>Search real products</span>
          </button>
          <button type="button" onClick={openScanModal}>
            <ScanLine className="h-6 w-6" aria-hidden />
            <strong>Scan Item</strong>
            <span>Barcode + OpenFoodFacts</span>
          </button>
          <button type="button" onClick={() => openShoppingScreen("shared-list")}>
            <Share2 className="h-6 w-6" aria-hidden />
            <strong>Shared List</strong>
            <span>Household planning</span>
          </button>
          <button type="button" onClick={openPantrySettings}>
            <Settings className="h-6 w-6" aria-hidden />
            <strong>Settings</strong>
            <span>Pantry and shopping setup</span>
          </button>
        </section>

        <section className="wd-shopping-flow__cards" aria-label="Shopping list groups">
          {listCards.map((list) => (
            <button
              key={list.id}
              type="button"
              className="wd-shopping-flow__list-card"
              onClick={() => openShoppingScreen(list.screen)}
            >
              <span className="wd-shopping-flow__list-icon" aria-hidden>
                {list.id === "shared" ? <Users className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
              </span>
              <span className="wd-shopping-flow__list-copy">
                <strong>{list.title}</strong>
                <small>{list.subtitle}</small>
              </span>
              <em>{list.count}</em>
            </button>
          ))}
        </section>
        <button type="button" className="wd-shopping-flow__pantry-link" onClick={openPantryInventory}>
          <Package className="h-5 w-5" aria-hidden />
          <span>
            <strong>Inventory</strong>
            <small>Open inventory locations</small>
          </span>
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </main>
    );
  }

  function renderListsScreen() {
    return (
      <main className="wd-shopping-ref__content wd-shopping-flow" aria-label="Available shopping lists">
        <section className="wd-shopping-flow__section-head">
          <div>
            <p className="wd-shopping-flow__eyebrow">Lists</p>
            <h1>Shopping Lists</h1>
            <span>Built from your current cart and saved household shopping data.</span>
          </div>
          <button type="button" onClick={() => openShoppingScreen("new-list")}>
            <Plus className="h-4 w-4" aria-hidden />
            New List
          </button>
        </section>

        <section className="wd-shopping-flow__cards">
          {listCards.map((list) => (
            <button
              key={list.id}
              type="button"
              className="wd-shopping-flow__list-card wd-shopping-flow__list-card--wide"
              onClick={() => openShoppingScreen(list.screen)}
            >
              <span className="wd-shopping-flow__list-icon" aria-hidden>
                <ListChecks className="h-5 w-5" />
              </span>
              <span>
                <strong>{list.title}</strong>
                <small>{list.subtitle} · {list.meta}</small>
              </span>
              <em>{list.count}</em>
            </button>
          ))}
        </section>

        {savedOpenItems.length > 0 ? (
          <section className="wd-shopping-flow__saved" aria-label="Saved household shopping items">
            <h2>Saved Household Items</h2>
            {savedOpenItems.slice(0, 8).map((item) => (
              <article key={item.id} className="wd-shopping-flow__saved-row">
                <strong>{item.name}</strong>
                <span>{item.quantity || "1"} {item.unit || ""}</span>
              </article>
            ))}
          </section>
        ) : null}
      </main>
    );
  }

  function renderCurrentListScreen() {
    return (
      <main className="wd-shopping-ref__content wd-shopping-flow" aria-label="Current shopping list">
        <section className="wd-shopping-flow__section-head wd-shopping-flow__section-head--current">
          <div>
            <p className="wd-shopping-flow__eyebrow">Current List</p>
            <h1>{currentListTitle}</h1>
            <span>{visibleCurrentLines.length} visible active item{visibleCurrentLines.length === 1 ? "" : "s"}.</span>
          </div>
          <button type="button" onClick={startShopping}>
            <Sparkles className="h-4 w-4" aria-hidden />
            Start Shopping
          </button>
        </section>

        <section className="wd-shopping-flow__list-stats" aria-label="Shopping list summary">
          <article>
            <span>Active</span>
            <strong>{activeCartLines.length}</strong>
            <small>Still needed</small>
          </article>
          <article>
            <span>Visible</span>
            <strong>{visibleCurrentLines.length}</strong>
            <small>{selectedStore}</small>
          </article>
          <article>
            <span>Purchased</span>
            <strong>{purchasedCartLines.length}</strong>
            <small>Checked off</small>
          </article>
        </section>

        <section className="wd-shopping-flow__store-strip" aria-label="Store selector">
          <Store className="h-5 w-5" aria-hidden />
          <div>
            <strong>Store selector</strong>
            <select value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
              <option value="All Stores">All Stores</option>
              {storeOptions.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="wd-shopping-ref__list wd-shopping-flow__list-panel" aria-label="Current active shopping items">
          <header className="wd-shopping-flow__list-panel-head">
            <div>
              <p>To buy</p>
              <h2>Active grocery items</h2>
            </div>
            <span>{visibleCurrentLines.length} item{visibleCurrentLines.length === 1 ? "" : "s"}</span>
          </header>
          {visibleCurrentLines.length === 0 ? (
            <div className="wd-shopping-ref__empty" role="status">
              <p>Your current list is empty.</p>
              <span>Add a product, scan an item, or send something from Pantry.</span>
            </div>
          ) : (
            <div className="wd-shopping-flow__table-wrap">
              <div className="wd-shopping-flow__table-head" aria-hidden>
                <span>Need</span>
                <span>Name</span>
                <span>Store</span>
                <span>Amount</span>
                <span />
              </div>
              <ul className="gf-shopping-list wd-shopping-flow__line-list">
                {visibleCurrentLines.map((line) => (
                  <ShoppingListCard
                    key={line.id}
                    line={line}
                    variant="table"
                    onOpenDetails={openShoppingLineDetails}
                    onTogglePurchased={toggleCartPurchased}
                    onQuantityChange={setCartQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
            </div>
          )}
        </section>

        {purchasedCartLines.length > 0 ? (
          <section className="wd-shopping-ref__purchased wd-shopping-flow__list-panel wd-shopping-flow__list-panel--purchased" aria-label="Purchased items">
            <header className="wd-shopping-flow__list-panel-head">
              <div>
                <p>Checked off</p>
                <h2><CheckCircle2 className="h-4 w-4" aria-hidden /> Purchased items</h2>
              </div>
              <span>{purchasedCartLines.length} done</span>
            </header>
            <div className="wd-shopping-flow__table-wrap">
              <div className="wd-shopping-flow__table-head" aria-hidden>
                <span>Done</span>
                <span>Name</span>
                <span>Store</span>
                <span>Amount</span>
                <span />
              </div>
              <ul className="gf-shopping-list wd-shopping-flow__line-list">
                {purchasedCartLines.map((line) => (
                  <ShoppingListCard
                    key={line.id}
                    line={line}
                    variant="table"
                    onOpenDetails={openShoppingLineDetails}
                    onTogglePurchased={toggleCartPurchased}
                    onQuantityChange={setCartQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <ShoppingQuickActions
          itemCount={openLineCount}
          onSaveList={saveShoppingList}
          onReorderNote={() => openShoppingScreen("lists")}
          saveMessage={saveMessage}
          saveDisabled={cartLines.length === 0}
          primaryLabel="Save current list"
          secondaryLabel="Review lists"
        />
      </main>
    );
  }

  function renderAddProductScreen() {
    return (
      <main className="wd-shopping-ref__content wd-shopping-flow" aria-label="Add product">
        <section className="wd-shopping-flow__section-head">
          <div>
            <p className="wd-shopping-flow__eyebrow">Add Product</p>
            <h1>Find or Add Product</h1>
            <span>Search your real product library, type a manual item, or scan a barcode.</span>
          </div>
          <button type="button" onClick={openScanModal}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan
          </button>
        </section>

        {addDrawerState ? renderAddDrawer() : (
          <button type="button" className="wd-shopping-ref__add" onClick={() => openAddItemModal()}>
            <Search className="h-5 w-5" aria-hidden />
            Start Product Search
          </button>
        )}

        {frequentProducts.length > 0 ? (
          <section className="wd-shopping-flow__recommendations" aria-label="Recommended products">
            <h2>Recommended from your products</h2>
            <div>
              {frequentProducts.map((item) => (
                <button key={item.id} type="button" onClick={() => addCatalogProductToShopping(item)}>
                  <span className="wd-shopping-ref__thumb" aria-hidden>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : item.name.charAt(0)}
                  </span>
                  <strong>{item.name}</strong>
                  <small>{item.category}</small>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  }

  function renderListBuilderScreen(shared: boolean) {
    return (
      <main className="wd-shopping-ref__content wd-shopping-flow" aria-label={shared ? "Shared list" : "New list"}>
        <section className="wd-shopping-flow__section-head">
          <div>
            <p className="wd-shopping-flow__eyebrow">{shared ? "Shared List" : "New List"}</p>
            <h1>{shared ? "Shared Household List" : "Create Shopping List"}</h1>
            <span>Uses the existing household cart and saved shopping data. No data model reset.</span>
          </div>
        </section>

        <section className="wd-shopping-flow__builder">
          <label>
            <span>List title</span>
            <input
              value={shared ? sharedListTitle : newListTitle}
              onChange={(event) => shared ? setSharedListTitle(event.target.value) : setNewListTitle(event.target.value)}
              placeholder={shared ? "Shared Household List" : "Weekend Costco Run"}
            />
          </label>
          <div className="wd-shopping-flow__builder-summary">
            <article>
              <strong>{activeCartLines.length}</strong>
              <span>Active items</span>
            </article>
            <article>
              <strong>{storeOptions.length}</strong>
              <span>Known stores</span>
            </article>
            <article>
              <strong>{products.length}</strong>
              <span>Products</span>
            </article>
          </div>
          <button type="button" className="wd-shopping-flow__hero-action" onClick={() => createNewList(shared)}>
            {shared ? "Use Shared List" : "Create List"}
          </button>
        </section>
      </main>
    );
  }

  const shoppingPopups = (
    <>
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
            closeProductDetail();
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
          onNavigateToPantry={() => {
            closeProductDetail();
            openPantryInventory();
          }}
          onNavigateToShopping={closeProductDetail}
          onNavigateToSettings={() => {
            closeProductDetail();
            openPantrySettings();
          }}
        />
      ) : null}
    </>
  );

  return (
    <div className="wd-shopping-ref">
      {renderTopBar()}
      {screen === "hub" ? renderHubScreen() : null}
      {screen === "lists" ? renderListsScreen() : null}
      {screen === "current" ? renderCurrentListScreen() : null}
      {screen === "add" ? renderAddProductScreen() : null}
      {screen === "new-list" ? renderListBuilderScreen(false) : null}
      {screen === "shared-list" ? renderListBuilderScreen(true) : null}
      {shoppingPopups}
    </div>
  );
}

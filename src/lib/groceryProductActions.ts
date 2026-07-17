import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useHouseholdProducts } from "../context/HouseholdProductContext";
import { getGroceryCategoryGroup } from "./groceryCategoryMap";
import {
  dismissDuplicatePair,
  findGroceryProductDuplicate,
  getDuplicateDismissalsSnapshot,
  getLibraryOverridesSnapshot,
  getMergedProductTargetsSnapshot,
  mergeHouseholdProductLibrary,
  mergeHouseholdProductsForLibrary,
  recordMergedProduct,
  removeLibraryOverride,
  subscribeDuplicateDismissals,
  subscribeLibraryOverrides,
  subscribeMergedProductTargets,
  upsertLibraryOverride,
} from "./groceryLibraryData";
import { applyOpenFoodFactsToHouseholdProduct } from "./groceryProductUtils";
import { useGroceryCart } from "./groceryCartStore";
import {
  createManualDraft,
  lookupGroceryProductByBarcode,
  lookupOpenFoodFactsProduct,
} from "./openFoodFactsClient";
import type {
  GroceryInventoryActivityAction,
  GroceryInventoryActivityEntry,
  GroceryProductDetail,
  GroceryProductDuplicateMatch,
  HouseholdProduct,
  HouseholdProductSource,
} from "../types/grocery";
import { toGroceryProductDetail } from "../types/grocery";

const EXTRA_PRODUCTS_STORAGE_KEY = "491wd-grocery-extra-products";
const REMOVED_INVENTORY_STORAGE_KEY = "491wd-grocery-removed-inventory";

type ExtraProductListener = () => void;
type RemovedInventoryListener = () => void;
type ProductDuplicateResolution = "pending" | "update" | "add_anyway";

type ProductDuplicatePanelState = {
  match: GroceryProductDuplicateMatch | null;
  choice: ProductDuplicateResolution;
  onUpdateExisting: () => void;
  onAddAnyway: () => void;
};

let extraProducts: HouseholdProduct[] = loadExtraProducts();
let removedInventoryProductIds: string[] = loadRemovedInventoryProductIds();
const extraProductListeners = new Set<ExtraProductListener>();
const removedInventoryListeners = new Set<RemovedInventoryListener>();
let productDuplicatePanelState: ProductDuplicatePanelState | null = null;
const productDuplicatePanelListeners = new Set<() => void>();

function loadRemovedInventoryProductIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(REMOVED_INVENTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  } catch {
    return [];
  }
}

function persistRemovedInventoryProductIds() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(REMOVED_INVENTORY_STORAGE_KEY, JSON.stringify(removedInventoryProductIds));
}

function emitRemovedInventoryProductIds() {
  persistRemovedInventoryProductIds();
  for (const listener of removedInventoryListeners) {
    listener();
  }
}

function subscribeRemovedInventoryProductIds(listener: RemovedInventoryListener) {
  removedInventoryListeners.add(listener);
  return () => {
    removedInventoryListeners.delete(listener);
  };
}

function getRemovedInventoryProductIdsSnapshot() {
  return removedInventoryProductIds;
}

function markProductRemovedFromInventory(productId: string) {
  if (!removedInventoryProductIds.includes(productId)) {
    removedInventoryProductIds = [...removedInventoryProductIds, productId];
    emitRemovedInventoryProductIds();
  }
  removeExtraProduct(productId);
  removeLibraryOverride(productId);
}

function loadExtraProducts(): HouseholdProduct[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(EXTRA_PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HouseholdProduct[]) : [];
  } catch {
    return [];
  }
}

function persistExtraProducts() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(EXTRA_PRODUCTS_STORAGE_KEY, JSON.stringify(extraProducts));
}

function emitExtraProducts() {
  persistExtraProducts();
  for (const listener of extraProductListeners) {
    listener();
  }
}

function subscribeExtraProducts(listener: ExtraProductListener) {
  extraProductListeners.add(listener);
  return () => {
    extraProductListeners.delete(listener);
  };
}

function getExtraProductsSnapshot() {
  return extraProducts;
}

function publishProductDuplicatePanel(state: ProductDuplicatePanelState | null) {
  productDuplicatePanelState = state;
  for (const listener of productDuplicatePanelListeners) {
    listener();
  }
}

export function subscribeProductDuplicatePanel(listener: () => void) {
  productDuplicatePanelListeners.add(listener);
  return () => {
    productDuplicatePanelListeners.delete(listener);
  };
}

export function getProductDuplicatePanelSnapshot() {
  return productDuplicatePanelState;
}

export function useProductDuplicatePanel() {
  return useSyncExternalStore(
    subscribeProductDuplicatePanel,
    getProductDuplicatePanelSnapshot,
    getProductDuplicatePanelSnapshot,
  );
}

function upsertExtraProduct(product: HouseholdProduct) {
  const index = extraProducts.findIndex((entry) => entry.id === product.id);
  if (index >= 0) {
    extraProducts = extraProducts.map((entry, entryIndex) =>
      entryIndex === index ? product : entry,
    );
    return;
  }
  extraProducts = [...extraProducts, product];
}

function removeExtraProduct(productId: string) {
  const next = extraProducts.filter((entry) => entry.id !== productId);
  if (next.length === extraProducts.length) {
    return;
  }
  extraProducts = next;
  emitExtraProducts();
}

function resolveHouseholdProduct(
  productId: string,
  getProductById: (id: string) => HouseholdProduct | undefined,
  extras: HouseholdProduct[],
): HouseholdProduct | undefined {
  return getProductById(productId) ?? extras.find((product) => product.id === productId);
}

function householdProductFromDetail(
  detail: GroceryProductDetail,
  source: HouseholdProductSource,
  existing?: HouseholdProduct,
): HouseholdProduct {
  const category = detail.category.trim() || "Uncategorized";
  const productName = detail.productName.trim() || `Product ${detail.barcode ?? detail.id}`;

  return {
    id: detail.id,
    productName,
    brand: detail.brand?.trim() || null,
    imageUrl: detail.imageUrl,
    barcode: detail.barcode?.trim() || null,
    category,
    categoryGroup: existing?.categoryGroup ?? getGroceryCategoryGroup(category),
    quantity: detail.quantity,
    unit: detail.unit?.trim() || null,
    store: detail.store.trim(),
    notes: detail.notes.trim(),
    need: existing?.need ?? false,
    purchased: existing?.purchased ?? false,
    productUrl: existing?.productUrl ?? null,
    price: existing?.price ?? null,
    expirationDate: existing?.expirationDate ?? null,
    dateAdded: existing?.dateAdded ?? new Date().toISOString(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    source,
  };
}

function inferDetailSource(detail: GroceryProductDetail): HouseholdProductSource {
  return detail.imageUrl || detail.brand ? "openfoodfacts" : "manual";
}

export function useGroceryProductActions() {
  const { getProductById, updateProduct, products } = useHouseholdProducts();
  const { addFromProduct, removeItemsByProductId } = useGroceryCart();
  const extraCatalog = useSyncExternalStore(
    subscribeExtraProducts,
    getExtraProductsSnapshot,
    getExtraProductsSnapshot,
  );
  const removedInventoryProductIds = useSyncExternalStore(
    subscribeRemovedInventoryProductIds,
    getRemovedInventoryProductIdsSnapshot,
    getRemovedInventoryProductIdsSnapshot,
  );
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<GroceryProductDetail | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [duplicateChoice, setDuplicateChoice] = useState<ProductDuplicateResolution>("pending");

  const allProducts = useMemo(
    () =>
      [...products, ...extraCatalog.filter((extra) => !products.some((product) => product.id === extra.id))].filter(
        (product) => !removedInventoryProductIds.includes(product.id),
      ),
    [extraCatalog, products, removedInventoryProductIds],
  );

  const detailProduct = useMemo(() => {
    if (!detailProductId) {
      return undefined;
    }
    return resolveHouseholdProduct(detailProductId, getProductById, extraCatalog);
  }, [detailProductId, extraCatalog, getProductById]);

  const detailView = useMemo<GroceryProductDetail | undefined>(() => {
    if (detailDraft) {
      return detailDraft;
    }
    return detailProduct ? toGroceryProductDetail(detailProduct) : undefined;
  }, [detailDraft, detailProduct]);

  const duplicateMatch = useMemo(() => {
    if (!detailView || detailMode !== "edit") {
      return null;
    }
    return findGroceryProductDuplicate(allProducts, detailView);
  }, [allProducts, detailMode, detailView]);

  const persistDetail = useCallback(
    (detail: GroceryProductDetail, source: HouseholdProductSource) => {
      const libraryMatch = getProductById(detail.id);
      const extraMatch = extraCatalog.find((product) => product.id === detail.id);
      const existing = libraryMatch ?? extraMatch;
      const nextProduct = householdProductFromDetail(detail, source, existing);

      if (libraryMatch) {
        updateProduct(detail.id, nextProduct);
        upsertLibraryOverride(nextProduct);
      } else {
        upsertExtraProduct(nextProduct);
        emitExtraProducts();
      }

      return nextProduct;
    },
    [extraCatalog, getProductById, updateProduct],
  );

  const finalizeDetailForSave = useCallback(
    (detail: GroceryProductDetail) => {
      if (!duplicateMatch) {
        return detail;
      }
      if (duplicateChoice === "update") {
        return { ...detail, id: duplicateMatch.existingProductId };
      }
      if (duplicateChoice === "add_anyway" && detail.id === duplicateMatch.existingProductId) {
        return { ...detail, id: `manual-${crypto.randomUUID()}` };
      }
      return detail;
    },
    [duplicateChoice, duplicateMatch],
  );

  const ensureDuplicateResolved = useCallback(() => {
    if (!duplicateMatch) {
      return true;
    }
    if (duplicateChoice !== "pending") {
      return true;
    }
    setLookupMessage("Choose whether to update the existing product or add a duplicate.");
    return false;
  }, [duplicateChoice, duplicateMatch]);

  const openProductDetail = useCallback((productId: string) => {
    setLookupMessage(null);
    setDetailDraft(null);
    setDetailMode("view");
    setDuplicateChoice("pending");
    setDetailProductId(productId);
  }, []);

  const openProductDetailForEdit = useCallback(
    (productId: string) => {
      const product = resolveHouseholdProduct(productId, getProductById, extraCatalog);
      if (!product) {
        return;
      }
      setLookupMessage(null);
      setDetailProductId(productId);
      setDetailDraft(toGroceryProductDetail(product));
      setDetailMode("edit");
      setDuplicateChoice("pending");
    },
    [extraCatalog, getProductById],
  );

  const beginBlankProductDetail = useCallback(() => {
    setLookupMessage(null);
    setDetailProductId(null);
    setDetailDraft({
      id: `manual-${crypto.randomUUID()}`,
      productName: "",
      brand: null,
      imageUrl: null,
      barcode: null,
      category: "Uncategorized",
      quantity: null,
      unit: null,
      store: "",
      notes: "",
    });
    setDetailMode("edit");
    setDuplicateChoice("pending");
  }, []);

  const closeProductDetail = useCallback(() => {
    setDetailProductId(null);
    setDetailDraft(null);
    setDetailMode("view");
    setLookupMessage(null);
    setDuplicateChoice("pending");
    publishProductDuplicatePanel(null);
  }, []);

  const updateDetailDraft = useCallback((patch: Partial<GroceryProductDetail>) => {
    setDuplicateChoice("pending");
    setDetailDraft((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const beginManualDetailDraft = useCallback((barcodeInput: string) => {
    const draft = createManualDraft(barcodeInput);
    setDetailProductId(null);
    setDetailDraft(draft);
    setDetailMode("edit");
    setDuplicateChoice("pending");
    setLookupMessage("No public record for this barcode. Enter the product manually.");
  }, []);

  const lookupBarcodeDraft = useCallback(
    async (barcodeInput: string) => {
      setLookupBusy(true);
      setLookupMessage("Searching Open Food Facts…");

      try {
        const result = await lookupGroceryProductByBarcode(barcodeInput);
        if (!result.detail) {
          setLookupMessage(result.message);
          return null;
        }

        const libraryMatch = products.find((product) => product.barcode === result.barcode);
        const extraMatch = extraCatalog.find((product) => product.barcode === result.barcode);
        const existing = libraryMatch ?? extraMatch;
        const nextDraft =
          existing && result.status === "found"
            ? toGroceryProductDetail({
                ...existing,
                productName: result.detail.productName || existing.productName,
                brand: result.detail.brand ?? existing.brand,
                imageUrl: result.detail.imageUrl ?? existing.imageUrl,
                barcode: result.detail.barcode ?? existing.barcode,
                category: result.detail.category || existing.category,
                quantity: result.detail.quantity ?? existing.quantity,
                unit: result.detail.unit ?? existing.unit,
                store: existing.store,
                notes: result.detail.notes || existing.notes,
              })
            : result.detail;

        setDetailProductId(null);
        setDetailDraft(nextDraft);
        setDetailMode("edit");
        setDuplicateChoice("pending");
        setLookupMessage(result.message);
        return nextDraft;
      } finally {
        setLookupBusy(false);
      }
    },
    [extraCatalog, products],
  );

  const chooseDuplicateUpdate = useCallback(() => {
    if (!duplicateMatch) {
      return;
    }
    setDuplicateChoice("update");
    setDetailDraft((current) =>
      current ? { ...current, id: duplicateMatch.existingProductId } : current,
    );
    setLookupMessage(null);
  }, [duplicateMatch]);

  const chooseDuplicateAddAnyway = useCallback(() => {
    if (!duplicateMatch) {
      return;
    }
    setDuplicateChoice("add_anyway");
    setDetailDraft((current) => {
      if (!current) {
        return current;
      }
      if (current.id === duplicateMatch.existingProductId) {
        return { ...current, id: `manual-${crypto.randomUUID()}` };
      }
      return current;
    });
    setLookupMessage(null);
  }, [duplicateMatch]);

  useEffect(() => {
    if (!detailView || detailMode !== "edit") {
      publishProductDuplicatePanel(null);
      return;
    }

    publishProductDuplicatePanel({
      match: duplicateMatch,
      choice: duplicateChoice,
      onUpdateExisting: chooseDuplicateUpdate,
      onAddAnyway: chooseDuplicateAddAnyway,
    });
  }, [chooseDuplicateAddAnyway, chooseDuplicateUpdate, detailMode, detailView, duplicateChoice, duplicateMatch]);

  const saveDetailProduct = useCallback(
    (detail: GroceryProductDetail) => {
      if (!ensureDuplicateResolved()) {
        return null;
      }
      const saved = persistDetail(finalizeDetailForSave(detail), inferDetailSource(detail));
      setDetailDraft(null);
      setDetailMode("view");
      setDetailProductId(saved.id);
      setLookupMessage(null);
      setDuplicateChoice("pending");
      publishProductDuplicatePanel(null);
      return saved;
    },
    [ensureDuplicateResolved, finalizeDetailForSave, persistDetail],
  );

  const addProductToShopping = useCallback(
    (product: HouseholdProduct) => {
      addFromProduct(product);
    },
    [addFromProduct],
  );

  const addProductToPantry = useCallback(
    (product: HouseholdProduct) => {
      if (getProductById(product.id)) {
        const nextProduct = { ...product, need: false };
        updateProduct(product.id, { need: false });
        upsertLibraryOverride(nextProduct);
        removeItemsByProductId(product.id);
        return;
      }
      upsertExtraProduct({ ...product, need: false });
      emitExtraProducts();
      removeItemsByProductId(product.id);
    },
    [getProductById, removeItemsByProductId, updateProduct],
  );

  const addDetailToShopping = useCallback(
    (detail: GroceryProductDetail) => {
      if (!ensureDuplicateResolved()) {
        return;
      }
      const saved = persistDetail(finalizeDetailForSave(detail), inferDetailSource(detail));
      addProductToShopping(saved);
      setDetailDraft(null);
      setDetailMode("view");
      setDetailProductId(saved.id);
      setLookupMessage(null);
      setDuplicateChoice("pending");
      publishProductDuplicatePanel(null);
    },
    [addProductToShopping, ensureDuplicateResolved, finalizeDetailForSave, persistDetail],
  );

  const addDetailToPantry = useCallback(
    (detail: GroceryProductDetail) => {
      if (!ensureDuplicateResolved()) {
        return;
      }
      const saved = persistDetail(finalizeDetailForSave(detail), inferDetailSource(detail));
      addProductToPantry({ ...saved, need: false });
      setDetailDraft(null);
      setDetailMode("view");
      setDetailProductId(saved.id);
      setLookupMessage(null);
      setDuplicateChoice("pending");
      publishProductDuplicatePanel(null);
    },
    [addProductToPantry, ensureDuplicateResolved, finalizeDetailForSave, persistDetail],
  );

  const enrichProductFromOpenFoodFacts = useCallback(
    async (product: HouseholdProduct) => {
      const barcode = product.barcode?.trim();
      if (!barcode) {
        setLookupMessage("Add a barcode before updating from Open Food Facts.");
        return product;
      }

      setLookupBusy(true);
      setLookupMessage("Searching Open Food Facts…");

      try {
        const lookup = await lookupOpenFoodFactsProduct(barcode);
        if (lookup.status !== "found") {
          setLookupMessage("No public record for this barcode.");
          return product;
        }

        const nextProduct = applyOpenFoodFactsToHouseholdProduct(product, lookup);
        if (getProductById(product.id)) {
          updateProduct(product.id, nextProduct);
          upsertLibraryOverride(nextProduct);
        } else {
          upsertExtraProduct(nextProduct);
          emitExtraProducts();
        }
        setLookupMessage(null);
        return nextProduct;
      } catch (error) {
        setLookupMessage(
          error instanceof Error ? error.message : "OpenFoodFacts lookup failed. Try again later.",
        );
        return product;
      } finally {
        setLookupBusy(false);
      }
    },
    [getProductById, updateProduct],
  );

  const openProductFromBarcode = useCallback(
    async (barcodeInput: string) => {
      const draft = await lookupBarcodeDraft(barcodeInput);
      return draft?.id ?? null;
    },
    [lookupBarcodeDraft],
  );

  const removeProductFromInventory = useCallback(
    (productId: string) => {
      markProductRemovedFromInventory(productId);
      if (getProductById(productId)) {
        updateProduct(productId, { need: false, quantity: 0, purchased: false });
      }
      removeItemsByProductId(productId);
      setDetailProductId((current) => (current === productId ? null : current));
      setDetailDraft((current) => (current?.id === productId ? null : current));
      setLookupMessage(null);
    },
    [getProductById, removeItemsByProductId, updateProduct],
  );

  return {
    detailProduct,
    detailView,
    detailDraft,
    detailMode,
    detailProductId,
    duplicateMatch,
    duplicateChoice,
    lookupBusy,
    lookupMessage,
    openProductDetail,
    openProductDetailForEdit,
    beginBlankProductDetail,
    closeProductDetail,
    updateDetailDraft,
    beginManualDetailDraft,
    lookupBarcodeDraft,
    chooseDuplicateUpdate,
    chooseDuplicateAddAnyway,
    saveDetailProduct,
    addProductToShopping,
    addProductToPantry,
    addDetailToShopping,
    addDetailToPantry,
    enrichProductFromOpenFoodFacts,
    openProductFromBarcode,
    removeProductFromInventory,
    removedInventoryProductIds,
  };
}

export function useGroceryProductCatalog() {
  const { products, updateProduct } = useHouseholdProducts();
  const extraCatalog = useSyncExternalStore(
    subscribeExtraProducts,
    getExtraProductsSnapshot,
    getExtraProductsSnapshot,
  );
  const libraryOverrides = useSyncExternalStore(
    subscribeLibraryOverrides,
    getLibraryOverridesSnapshot,
    getLibraryOverridesSnapshot,
  );
  const mergedTargets = useSyncExternalStore(
    subscribeMergedProductTargets,
    getMergedProductTargetsSnapshot,
    getMergedProductTargetsSnapshot,
  );
  const duplicateDismissals = useSyncExternalStore(
    subscribeDuplicateDismissals,
    getDuplicateDismissalsSnapshot,
    getDuplicateDismissalsSnapshot,
  );

  useEffect(() => {
    for (const override of libraryOverrides) {
      updateProduct(override.id, override);
    }
  }, [libraryOverrides, updateProduct]);

  const catalog = useMemo(
    () => mergeHouseholdProductLibrary(products, libraryOverrides, extraCatalog, mergedTargets),
    [extraCatalog, libraryOverrides, mergedTargets, products],
  );

  return {
    catalog,
    duplicateDismissals,
  };
}

export function useProductLibraryMaintenance() {
  const { getProductById, updateProduct } = useHouseholdProducts();
  const extraCatalog = useSyncExternalStore(
    subscribeExtraProducts,
    getExtraProductsSnapshot,
    getExtraProductsSnapshot,
  );

  const mergeDuplicateProducts = useCallback(
    (canonicalId: string, duplicateId: string) => {
      const canonical =
        getProductById(canonicalId) ?? extraCatalog.find((product) => product.id === canonicalId);
      const duplicate =
        getProductById(duplicateId) ?? extraCatalog.find((product) => product.id === duplicateId);
      if (!canonical || !duplicate) {
        return;
      }

      const merged = mergeHouseholdProductsForLibrary(canonical, duplicate);
      if (getProductById(canonicalId)) {
        updateProduct(canonicalId, merged);
        upsertLibraryOverride(merged);
      } else {
        upsertExtraProduct(merged);
        emitExtraProducts();
      }

      if (extraCatalog.some((product) => product.id === duplicateId)) {
        removeExtraProduct(duplicateId);
      } else {
        removeLibraryOverride(duplicateId);
      }

      recordMergedProduct(duplicateId, canonicalId);
    },
    [extraCatalog, getProductById, updateProduct],
  );

  const keepDuplicatePairSeparate = useCallback((productIdA: string, productIdB: string) => {
    dismissDuplicatePair(productIdA, productIdB);
  }, []);

  return {
    mergeDuplicateProducts,
    keepDuplicatePairSeparate,
  };
}

const INVENTORY_ACTIVITY_STORAGE_KEY = "491wd-grocery-inventory-activity";
const CART_STORAGE_KEY = "491wd-grocery-cart";
const MAX_INVENTORY_ACTIVITY_ENTRIES = 40;

type InventoryActivityListener = () => void;

let inventoryActivityEntries: GroceryInventoryActivityEntry[] = loadInventoryActivityEntries();
const inventoryActivityListeners = new Set<InventoryActivityListener>();

function loadInventoryActivityEntries(): GroceryInventoryActivityEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(INVENTORY_ACTIVITY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((entry): entry is GroceryInventoryActivityEntry => {
        if (!entry || typeof entry !== "object") {
          return false;
        }
        const record = entry as GroceryInventoryActivityEntry;
        return (
          typeof record.id === "string" &&
          typeof record.productId === "string" &&
          typeof record.productName === "string" &&
          (record.action === "add_stock" ||
            record.action === "use_item" ||
            record.action === "add_to_shopping") &&
          typeof record.quantityChange === "number" &&
          typeof record.previousQuantity === "number" &&
          typeof record.newQuantity === "number" &&
          typeof record.timestamp === "string"
        );
      })
      .map((record) => ({
        ...record,
        unit: typeof record.unit === "string" && record.unit.trim() ? record.unit : "each",
        undone: record.undone === true,
      }));
  } catch {
    return [];
  }
}

function persistInventoryActivityEntries() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(INVENTORY_ACTIVITY_STORAGE_KEY, JSON.stringify(inventoryActivityEntries));
}

function emitInventoryActivity() {
  persistInventoryActivityEntries();
  for (const listener of inventoryActivityListeners) {
    listener();
  }
}

function subscribeInventoryActivity(listener: InventoryActivityListener) {
  inventoryActivityListeners.add(listener);
  return () => {
    inventoryActivityListeners.delete(listener);
  };
}

function getInventoryActivitySnapshot() {
  return inventoryActivityEntries;
}

function pushInventoryActivity(entry: GroceryInventoryActivityEntry) {
  inventoryActivityEntries = [entry, ...inventoryActivityEntries].slice(0, MAX_INVENTORY_ACTIVITY_ENTRIES);
  emitInventoryActivity();
}

function readCartLinesFromStorage(): Array<{ id: string; productId: string; quantity: number; purchased: boolean }> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }
        const record = entry as Record<string, unknown>;
        const id = typeof record.id === "string" ? record.id : "";
        const productId = typeof record.productId === "string" ? record.productId : "";
        const quantity = Number(record.quantity);
        if (!id || !productId) {
          return null;
        }
        return {
          id,
          productId,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          purchased: record.purchased === true,
        };
      })
      .filter((entry): entry is { id: string; productId: string; quantity: number; purchased: boolean } => entry != null);
  } catch {
    return [];
  }
}

function createInventoryActivityEntry(
  product: Pick<HouseholdProduct, "id" | "productName" | "quantity" | "unit">,
  action: GroceryInventoryActivityAction,
  quantityChange: number,
  previousQuantity: number,
  newQuantity: number,
  cartLineId?: string,
): GroceryInventoryActivityEntry {
  return {
    id: crypto.randomUUID(),
    productId: product.id,
    productName: product.productName,
    action,
    quantityChange,
    previousQuantity,
    newQuantity,
    unit: product.unit?.trim() || "each",
    timestamp: new Date().toISOString(),
    cartLineId,
  };
}

function isUndoableInventoryActivity(entry: GroceryInventoryActivityEntry): boolean {
  return !entry.undone && (entry.action === "add_stock" || entry.action === "use_item");
}

export function useInventoryActivityHistory() {
  const entries = useSyncExternalStore(
    subscribeInventoryActivity,
    getInventoryActivitySnapshot,
    getInventoryActivitySnapshot,
  );
  const { updateProduct, getProductById } = useHouseholdProducts();

  const commitPantryPendingDeltas = useCallback(
    (pendingDeltas: Record<string, number>, products: readonly HouseholdProduct[]) => {
      for (const [productId, delta] of Object.entries(pendingDeltas)) {
        if (delta === 0) {
          continue;
        }
        const product = products.find((entry) => entry.id === productId);
        if (!product) {
          continue;
        }
        const previousQuantity = product.quantity ?? 0;
        const newQuantity = Math.max(0, previousQuantity + delta);
        updateProduct(productId, { quantity: newQuantity });
        if (getProductById(productId)) {
          const current = getProductById(productId);
          if (current) {
            upsertLibraryOverride({ ...current, quantity: newQuantity });
          }
        }
        pushInventoryActivity(
          createInventoryActivityEntry(
            product,
            delta > 0 ? "add_stock" : "use_item",
            delta,
            previousQuantity,
            newQuantity,
          ),
        );
      }
    },
    [getProductById, updateProduct],
  );

  const recordAddToShoppingActivity = useCallback((product: HouseholdProduct) => {
    const quantityChange = product.quantity ?? 1;
    const lines = readCartLinesFromStorage();
    const line = [...lines].reverse().find((entry) => entry.productId === product.id && !entry.purchased);
    pushInventoryActivity(
      createInventoryActivityEntry(
        product,
        "add_to_shopping",
        quantityChange,
        product.quantity ?? 0,
        product.quantity ?? 0,
        line?.id,
      ),
    );
  }, []);

  const undoLastInventoryActivity = useCallback(() => {
    const undoableIndex = inventoryActivityEntries.findIndex(isUndoableInventoryActivity);
    if (undoableIndex === -1) {
      return;
    }

    const latest = inventoryActivityEntries[undoableIndex];
    const product = getProductById(latest.productId);
    if (product) {
      updateProduct(latest.productId, { quantity: latest.previousQuantity });
      upsertLibraryOverride({ ...product, quantity: latest.previousQuantity });
    }

    inventoryActivityEntries = inventoryActivityEntries.map((entry, index) =>
      index === undoableIndex ? { ...entry, undone: true } : entry,
    );
    emitInventoryActivity();
  }, [getProductById, updateProduct]);

  return {
    entries,
    commitPantryPendingDeltas,
    recordAddToShoppingActivity,
    undoLastInventoryActivity,
    canUndo: entries.some(isUndoableInventoryActivity),
  };
}

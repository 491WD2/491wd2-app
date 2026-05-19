import { useCallback, useSyncExternalStore } from "react";
import type {
  GroceryCartItem,
  GroceryCartLine,
  GroceryCartStoreGroup,
  HouseholdProduct,
} from "../types/grocery";
import { getShoppingCategoryLabel, normalizeShoppingUnit } from "./shoppingData";

const STORAGE_KEY = "491wd-grocery-cart";

type CartListener = () => void;

let cartLines: GroceryCartLine[] = loadCartLines();
const listeners = new Set<CartListener>();

function loadCartLines(): GroceryCartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry) => normalizeStoredLine(entry))
      .filter((entry): entry is GroceryCartLine => entry != null);
  } catch {
    return [];
  }
}

function persistCartLines() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartLines));
}

function emit() {
  persistCartLines();
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: CartListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cartLines;
}

function normalizeStoredLine(value: unknown): GroceryCartLine | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const productId = typeof record.productId === "string" ? record.productId.trim() : "";
  const productName = typeof record.productName === "string" ? record.productName.trim() : "";
  if (!productId || !productName) {
    return null;
  }

  const id = typeof record.id === "string" && record.id.trim() ? record.id : crypto.randomUUID();
  const quantity = Number(record.quantity);
  const unit = typeof record.unit === "string" ? normalizeShoppingUnit(record.unit) : "each";

  return {
    id,
    productId,
    productName,
    imageUrl: typeof record.imageUrl === "string" ? record.imageUrl : null,
    category: typeof record.category === "string" ? record.category : "Uncategorized",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit,
    store: typeof record.store === "string" ? record.store : "",
    notes: typeof record.notes === "string" ? record.notes : "",
    purchased: record.purchased === true,
  };
}

export function createGroceryCartItemFromProduct(product: HouseholdProduct): GroceryCartItem {
  return {
    productId: product.id,
    productName: product.productName.trim(),
    imageUrl: product.imageUrl,
    category: product.category,
    quantity: product.quantity ?? 1,
    unit: normalizeShoppingUnit(product.unit ?? undefined, "each"),
    store: product.store.trim(),
    notes: product.notes.trim(),
    purchased: false,
  };
}

export function collectKnownGroceryStores(inputs: {
  presetStores?: readonly string[];
  libraryStores?: readonly string[];
  cartStores?: readonly string[];
  customStores?: readonly string[];
}): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    ordered.push(trimmed);
  };

  for (const source of [
    inputs.presetStores ?? [],
    inputs.libraryStores ?? [],
    inputs.cartStores ?? [],
    inputs.customStores ?? [],
  ]) {
    for (const store of source) {
      add(store);
    }
  }

  return ordered.sort((left, right) => left.localeCompare(right));
}

export function groupGroceryCartByStoreAndCategory(lines: GroceryCartLine[]): GroceryCartStoreGroup[] {
  const storeMap = new Map<string, GroceryCartLine[]>();
  for (const line of lines) {
    const store = line.store.trim() || "No store";
    const bucket = storeMap.get(store) ?? [];
    bucket.push(line);
    storeMap.set(store, bucket);
  }

  return [...storeMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([store, storeLines]) => {
      const categoryMap = new Map<string, GroceryCartLine[]>();
      for (const line of storeLines) {
        const label = getShoppingCategoryLabel(line.category);
        const bucket = categoryMap.get(label) ?? [];
        bucket.push(line);
        categoryMap.set(label, bucket);
      }

      return {
        store,
        categories: [...categoryMap.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([category, categoryLines]) => ({
            category,
            lines: categoryLines.sort((left, right) =>
              left.productName.localeCompare(right.productName),
            ),
          })),
      };
    });
}

function upsertCartItem(item: GroceryCartItem) {
  const existing = cartLines.find(
    (line) => line.productId === item.productId && line.purchased === item.purchased,
  );

  if (existing) {
    cartLines = cartLines.map((line) =>
      line.id === existing.id
        ? {
            ...line,
            ...item,
            quantity: line.quantity + item.quantity,
          }
        : line,
    );
    return;
  }

  cartLines = [...cartLines, { ...item, id: crypto.randomUUID() }];
}

function updateCartLine(id: string, patch: Partial<GroceryCartItem>) {
  cartLines = cartLines.map((line) => (line.id === id ? { ...line, ...patch } : line));
}

function removeCartLine(id: string) {
  cartLines = cartLines.filter((line) => line.id !== id);
}

function removeCartLinesByProductId(productId: string) {
  cartLines = cartLines.filter((line) => line.productId !== productId);
}

export function useGroceryCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addItem = useCallback((item: GroceryCartItem) => {
    upsertCartItem(item);
    emit();
  }, []);

  const addFromProduct = useCallback((product: HouseholdProduct) => {
    upsertCartItem(createGroceryCartItemFromProduct(product));
    emit();
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<GroceryCartItem>) => {
    updateCartLine(id, patch);
    emit();
  }, []);

  const removeItem = useCallback((id: string) => {
    removeCartLine(id);
    emit();
  }, []);

  const removeItemsByProductId = useCallback((productId: string) => {
    removeCartLinesByProductId(productId);
    emit();
  }, []);

  const quantityByProductId = useCallback(
    (productId: string) =>
      items
        .filter((line) => line.productId === productId && !line.purchased)
        .reduce((sum, line) => sum + line.quantity, 0),
    [items],
  );

  const isProductOnCart = useCallback(
    (productId: string) => quantityByProductId(productId) > 0,
    [quantityByProductId],
  );

  return {
    items,
    addItem,
    addFromProduct,
    updateItem,
    removeItem,
    removeItemsByProductId,
    quantityByProductId,
    isProductOnCart,
    groupedItems: groupGroceryCartByStoreAndCategory(items),
  };
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScanLine, ShoppingCart } from "lucide-react";
import { AIInsights } from "../components/pantry/AIInsights";
import { PantryBoardEditSheet } from "../components/pantry/PantryBoardEditSheet";
import { PantryFilterBar } from "../components/pantry/PantryFilterBar";
import { PantryGrid } from "../components/pantry/PantryGrid";
import { ProductScanPanel } from "../components/ProductScanPanel";
import { useHouseholdProducts } from "../context/HouseholdProductContext";
import { useGroceryProductActions, useInventoryActivityHistory } from "../lib/groceryProductActions";
import { useGroceryCart } from "../lib/groceryCartStore";
import { trackCardAction, trackCardFilter, trackCardScan } from "../lib/kioskCardAnalytics";
import {
  foodLocationToCategoryGroup,
  householdProductToPantryItem,
  pantryItemToFoodInventory,
} from "../lib/pantryData";
import { recordPantryItemUsed } from "../lib/pantryUsagePatterns";
import { isLowStockItem, isUseFirstItem, isExpiredItem } from "../lib/pantryBoard";
import type { PantryBoardChip } from "../types/pantryBoard";
import type { PantryAIFilter } from "../types/pantryInsights";
import type { FoodInventoryItem, FoodStorageLocation } from "../types/inventory";
import type { PantryItem } from "../types/pantry";
import { pantryItemFromKiosk, usePantry } from "../hooks/usePantry";
import {
  PantryKioskCategoryGrid,
  PantryKioskSummaryCard,
  type PantryKioskPendingChange,
  type PantryKioskRow,
} from "./inventory/InventoryViews";
import "../styles/pantry-shopping-grofast.css";

const ANALYTICS_SURFACE = "pantry:kiosk";

export type PantryTabPageProps = {
  onOpenShopping?: () => void;
};

function formatShortDate(iso: string): string {
  if (!iso.trim()) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toKioskRow(item: PantryItem): PantryKioskRow {
  return {
    id: item.id,
    productName: item.productName,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    store: item.store,
    storageLocation: item.storageLocation,
    expirationDate: item.expirationDate,
    imageUrl: item.imageUrl,
    status: item.status,
    notes: item.notes,
  };
}

function itemMatchesSearch(item: PantryItem, query: string): boolean {
  if (!query) {
    return true;
  }
  const hay = [
    item.productName,
    item.category,
    item.categoryGroup,
    item.store,
    item.storageLocation,
    item.notes,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function matchesPantryCategory(item: PantryItem, category: string | null): boolean {
  if (!category) {
    return true;
  }
  return item.category === category;
}

function chipToAiFilter(chip: PantryBoardChip): PantryAIFilter {
  if (chip === "use_first") {
    return "expiring";
  }
  if (chip === "low_stock") {
    return "low_stock";
  }
  if (chip === "expired") {
    return "expired";
  }
  return "all";
}

function aiFilterToBoardChip(filter: PantryAIFilter): PantryBoardChip {
  if (filter === "expiring") {
    return "use_first";
  }
  if (filter === "low_stock") {
    return "low_stock";
  }
  if (filter === "expired") {
    return "expired";
  }
  return "all";
}

export default function PantryTabPage({ onOpenShopping }: PantryTabPageProps) {
  const { pantryProducts, updateProduct, getProductById } = useHouseholdProducts();
  const { beginManualDetailDraft, lookupBarcodeDraft, lookupBusy, lookupMessage } =
    useGroceryProductActions();
  const { recordAddToShoppingActivity } = useInventoryActivityHistory();
  const { items: cartItems, addFromProduct } = useGroceryCart();

  const productById = useMemo(() => {
    const map = new Map(pantryProducts.map((p) => [p.id, p]));
    return map;
  }, [pantryProducts]);

  const allItems = useMemo(
    () => pantryProducts.map(householdProductToPantryItem),
    [pantryProducts],
  );

  const inventoryItems = useMemo(
    () =>
      allItems.map((item) => pantryItemToFoodInventory(item, productById.get(item.id) ?? null)),
    [allItems, productById],
  );

  const shoppingListIds = useMemo(() => {
    const ids = new Set<string>();
    for (const line of cartItems) {
      if (!line.purchased) {
        ids.add(line.productId);
      }
    }
    return ids;
  }, [cartItems]);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [boardChip, setBoardChip] = useState<PantryBoardChip>("all");
  const [pendingDeltas, setPendingDeltas] = useState<Record<string, number>>({});
  const [scanOpen, setScanOpen] = useState(false);
  const [aiFilter, setAiFilter] = useState<PantryAIFilter>("all");
  const [aiCategoryFilter, setAiCategoryFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<FoodInventoryItem | null>(null);
  const [reorderToast, setReorderToast] = useState<string | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  const insightItems = useMemo(() => allItems.map(pantryItemFromKiosk), [allItems]);
  const pantryAi = usePantry({
    items: insightItems,
    surface: "pantry:kiosk",
    aiFilter,
    categoryFilter: aiCategoryFilter,
  });

  const searchNorm = search.trim().toLowerCase();

  const gridItems = useMemo(() => {
    const allowedAi =
      aiFilter === "all"
        ? null
        : new Set(pantryAi.filteredItems.map((entry) => entry.id));

    return inventoryItems.filter((item) => {
      const pantryRow = allItems.find((row) => row.id === item.id);
      if (!pantryRow) {
        return false;
      }
      if (!itemMatchesSearch(pantryRow, searchNorm)) {
        return false;
      }
      if (!matchesPantryCategory(pantryRow, activeCategory)) {
        return false;
      }
      if (aiCategoryFilter && pantryRow.category !== aiCategoryFilter) {
        return false;
      }
      if (allowedAi && !allowedAi.has(item.id)) {
        return false;
      }
      return true;
    });
  }, [
    activeCategory,
    aiCategoryFilter,
    aiFilter,
    allItems,
    inventoryItems,
    pantryAi.filteredItems,
    searchNorm,
  ]);

  const pendingChanges = useMemo<PantryKioskPendingChange[]>(() => {
    return Object.entries(pendingDeltas)
      .filter(([, delta]) => delta !== 0)
      .map(([id, delta]) => {
        const item = allItems.find((entry) => entry.id === id);
        return {
          id,
          productName: item?.productName ?? "Item",
          delta,
          unit: item?.unit ?? "each",
        };
      });
  }, [allItems, pendingDeltas]);

  const lowStockItems = useMemo(
    () =>
      inventoryItems
        .filter((item) => isLowStockItem(item))
        .map((item) => {
          const row = allItems.find((entry) => entry.id === item.id);
          return row ? toKioskRow(row) : null;
        })
        .filter((row): row is PantryKioskRow => row !== null),
    [allItems, inventoryItems],
  );

  const expiringItems = useMemo(
    () =>
      inventoryItems
        .filter((item) => isUseFirstItem(item) || isExpiredItem(item))
        .map((item) => {
          const row = allItems.find((entry) => entry.id === item.id);
          return row ? toKioskRow(row) : null;
        })
        .filter((row): row is PantryKioskRow => row !== null),
    [allItems, inventoryItems],
  );

  const adjustPending = useCallback((id: string, delta: number) => {
    setPendingDeltas((current) => {
      const next = (current[id] ?? 0) + delta;
      if (next === 0) {
        const { [id]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [id]: next };
    });
  }, []);

  useEffect(() => {
    trackCardFilter(ANALYTICS_SURFACE, boardChip);
  }, [boardChip]);

  const handleMarkUsed = useCallback(
    (id: string) => {
      const row = allItems.find((item) => item.id === id);
      if (row) {
        recordPantryItemUsed(row.productName || row.name, row.category);
        pantryAi.recordItemUsed(pantryItemFromKiosk(row));
      }
      adjustPending(id, -1);
    },
    [adjustPending, allItems, pantryAi],
  );

  const handleSaveEdit = useCallback(
    (id: string, patch: Partial<Omit<FoodInventoryItem, "id">>) => {
      const product = getProductById(id);
      if (!product) {
        return;
      }
      updateProduct(id, {
        productName: patch.name?.trim() || product.productName,
        quantity: patch.quantity ?? product.quantity,
        unit: patch.unit ?? product.unit,
        expirationDate: patch.expiryDate ?? product.expirationDate,
        category: patch.category?.trim() || product.category,
        categoryGroup: patch.location
          ? foodLocationToCategoryGroup(patch.location)
          : product.categoryGroup,
      });
    },
    [getProductById, updateProduct],
  );

  const handleMove = useCallback(
    (id: string, location: FoodStorageLocation) => {
      const product = getProductById(id);
      if (!product) {
        return;
      }
      updateProduct(id, { categoryGroup: foodLocationToCategoryGroup(location) });
    },
    [getProductById, updateProduct],
  );

  const handleAddToShopping = useCallback(
    (item: FoodInventoryItem) => {
      const product = getProductById(item.id);
      if (!product) {
        return;
      }
      if (shoppingListIds.has(item.id)) {
        setCartToast(`${item.name} is already on your shopping list`);
      } else {
        addFromProduct(product);
        recordAddToShoppingActivity(product);
        setCartToast(`Added ${item.name} to shopping list`);
      }
      window.setTimeout(() => setCartToast(null), 2400);
    },
    [addFromProduct, getProductById, recordAddToShoppingActivity, shoppingListIds],
  );

  const handleReorder = useCallback((item: FoodInventoryItem) => {
    trackCardAction(ANALYTICS_SURFACE, "reorder", item.id);
    setReorderToast(`Reorder noted: ${item.name}`);
    window.setTimeout(() => setReorderToast(null), 2800);
  }, []);

  async function handleScanLookup(barcode: string) {
    trackCardScan(ANALYTICS_SURFACE);
    const draft = await lookupBarcodeDraft(barcode);
    if (draft) {
      setScanOpen(false);
    }
  }

  function handleManualScanEntry(barcode: string) {
    beginManualDetailDraft(barcode);
    setScanOpen(false);
  }

  return (
    <>
      <div className="gf-grocery-page wd-pantry-tab px-4 pb-8 pt-2 sm:px-6">
        <header className="gf-pantry-tab__header">
          <div>
            <h1 className="gf-pantry-tab__title">Inventory</h1>
            <p className="gf-pantry-tab__subtitle">
              Browse pantry stock, adjust quantities, and send items to shopping.
            </p>
          </div>
          <div className="gf-pantry-tab__header-actions">
            <label className="gf-pantry-tab__search">
              <span className="sr-only">Search pantry</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, store, notes…"
              />
            </label>
            {onOpenShopping ? (
              <button
                type="button"
                className="gf-pantry-item__btn"
                onClick={onOpenShopping}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Shopping list
              </button>
            ) : null}
            <button
              type="button"
              className="gf-pantry-item__btn gf-pantry-item__btn--primary"
              onClick={() => setScanOpen(true)}
            >
              <ScanLine className="h-4 w-4" aria-hidden />
              Scan product
            </button>
          </div>
        </header>

        {(reorderToast || cartToast) ? (
          <p
            className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900"
            role="status"
          >
            {reorderToast ?? cartToast}
          </p>
        ) : null}

        <AIInsights
          surface="pantry:kiosk"
          suggestions={pantryAi.suggestions}
          smartGroceryList={pantryAi.smartGroceryList}
          aiFilter={aiFilter}
          onAiFilterChange={(filter) => {
            setAiFilter(filter);
            setBoardChip(aiFilterToBoardChip(filter));
          }}
          categories={pantryAi.categories}
          categoryFilter={aiCategoryFilter}
          onCategoryFilterChange={setAiCategoryFilter}
          onCopyGroceryList={pantryAi.formatGroceryListText}
          onSuggestionActed={pantryAi.onSuggestionActed}
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(260px,300px)]">
          <div className="gf-pantry-tab__categories min-w-0">
            <PantryKioskCategoryGrid
              activeCategory={activeCategory}
              onSelectCategory={(category) => {
                setActiveCategory(category);
                setAiCategoryFilter(category);
              }}
            />
          </div>

          <div className="min-w-0">
            <PantryFilterBar
              active={boardChip}
              onChange={(chip) => {
                setBoardChip(chip);
                setAiFilter(chipToAiFilter(chip));
              }}
              analyticsSurface={ANALYTICS_SURFACE}
            />
            <PantryGrid
              items={gridItems}
              chip={boardChip}
              onUse={handleMarkUsed}
              onEdit={setEditing}
              onMove={handleMove}
              onReorder={handleReorder}
              onAddToShopping={handleAddToShopping}
              onScanRequest={() => setScanOpen(true)}
              analyticsSurface={ANALYTICS_SURFACE}
              emptyHint="Try another filter, pick a category, or scan a product."
            />
          </div>

          <aside className="gf-pantry-tab__summary min-w-0" aria-label="Inventory summary">
            <PantryKioskSummaryCard
              pendingChanges={pendingChanges}
              lowStockItems={lowStockItems}
              expiringItems={expiringItems}
              formatDate={formatShortDate}
              pendingDeltas={pendingDeltas}
              products={pantryProducts}
              onPendingCleared={() => setPendingDeltas({})}
              saveDisabled={pendingChanges.length === 0}
            />
          </aside>
        </div>
      </div>

      <PantryBoardEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />

      {scanOpen ? (
        <ProductScanPanel
          title="Scan pantry product"
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => setScanOpen(false)}
          onLookup={handleScanLookup}
          onManualEntry={handleManualScanEntry}
        />
      ) : null}
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { KioskPageTitle } from "../components/layout/KioskPageTitle";
import { useKioskShell } from "../components/layout/KioskShellContext";
import { WidgetPageShell } from "../components/widgets";
import { ProductScanPanel } from "../components/ProductScanPanel";
import { AIInsights } from "../components/pantry/AIInsights";
import { PantryFilterBar } from "../components/pantry/PantryFilterBar";
import { PantryGrid } from "../components/pantry/PantryGrid";
import { PantryBoardEditSheet } from "../components/pantry/PantryBoardEditSheet";
import { InventoryActions } from "../components/inventory/InventoryActions";
import { useInventory } from "../hooks/useInventory";
import { pantryItemFromFoodInventory, usePantry } from "../hooks/usePantry";
import { useGroceryCart } from "../lib/groceryCartStore";
import { lookupGroceryProductByBarcode } from "../lib/openFoodFactsClient";
import { trackCardAction, trackCardFilter, trackCardScan } from "../lib/kioskCardAnalytics";
import type { PantryBoardChip } from "../types/pantryBoard";
import type { PantryAIFilter } from "../types/pantryInsights";
import type {
  InventoryFilterPreset,
  InventorySortDirection,
  InventorySortKey,
} from "../types/inventory";
import type { FoodInventoryItem } from "../types/inventory";
import "../styles/pantry-shopping-grofast.css";

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

function aiFilterToInventoryPreset(filter: PantryAIFilter): InventoryFilterPreset {
  if (filter === "expiring") {
    return "expiring";
  }
  if (filter === "expired") {
    return "expired";
  }
  return "all";
}

function inventoryPresetToAiFilter(preset: InventoryFilterPreset): PantryAIFilter {
  if (preset === "expiring") {
    return "expiring";
  }
  if (preset === "expired") {
    return "expired";
  }
  return "all";
}

/**
 * Family Hub food inventory — `/pantry?view=pantry` GroFast-style widget grid.
 */
export function FoodInventoryDashboard() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<InventorySortKey>("expiryDate");
  const [sortDirection, setSortDirection] = useState<InventorySortDirection>("asc");
  const [boardChip, setBoardChip] = useState<PantryBoardChip>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [reorderToast, setReorderToast] = useState<string | null>(null);
  const [editing, setEditing] = useState<FoodInventoryItem | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  const { addItem: addToCart } = useGroceryCart();
  const aiFilter = chipToAiFilter(boardChip);

  const {
    items,
    categories: inventoryCategories,
    addItem,
    markUsed,
    moveItem,
    updateItem,
    resetToSeed,
  } = useInventory({
    search,
    sortKey,
    sortDirection,
    filterPreset: "all",
    categoryFilter,
  });

  const insightItems = useMemo(() => items.map(pantryItemFromFoodInventory), [items]);

  const pantryAi = usePantry({
    items: insightItems,
    surface: "pantry:food-inventory",
    aiFilter,
    categoryFilter,
  });

  const categories = useMemo(() => {
    const set = new Set([...inventoryCategories, ...pantryAi.categories]);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [inventoryCategories, pantryAi.categories]);

  const handleMarkUsed = useCallback(
    (id: string) => {
      const row = items.find((i) => i.id === id);
      if (row) {
        pantryAi.recordItemUsed(pantryItemFromFoodInventory(row));
      }
      markUsed(id);
    },
    [items, markUsed, pantryAi],
  );

  const handleAddToShopping = useCallback(
    (item: FoodInventoryItem) => {
      addToCart({
        productId: item.id,
        productName: item.name,
        imageUrl: item.imageUrl ?? null,
        category: item.category,
        quantity: 1,
        unit: item.unit,
        store: "",
        notes: "From pantry",
        purchased: false,
      });
      setCartToast(`Added ${item.name} to shopping list`);
      window.setTimeout(() => setCartToast(null), 2400);
    },
    [addToCart],
  );

  const handleScanLookup = useCallback(
    async (barcode: string) => {
      setLookupBusy(true);
      setLookupMessage(null);
      trackCardScan("pantry:food-inventory");
      try {
        const result = await lookupGroceryProductByBarcode(barcode);
        if (result.status === "error") {
          setLookupMessage(result.message);
          return;
        }
        const detail = result.detail;
        if (!detail) {
          setLookupMessage("Could not read product details.");
          return;
        }
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 14);
        addItem({
          name: detail.productName.trim() || `Product ${barcode}`,
          quantity: detail.quantity ?? 1,
          unit: detail.unit?.trim() || "each",
          expiryDate: expiry.toISOString().slice(0, 10),
          location: "pantry",
          category: detail.category?.trim() || "General",
          imageUrl: detail.imageUrl,
          barcode: detail.barcode ?? barcode,
          source: "scan",
        });
        setLookupMessage(
          result.status === "found"
            ? `Added from OpenFoodFacts: ${detail.productName}`
            : "Added — complete details manually if needed.",
        );
        setShowScan(false);
      } finally {
        setLookupBusy(false);
      }
    },
    [addItem],
  );

  const handleReorder = useCallback((item: FoodInventoryItem) => {
    trackCardAction("pantry:food-inventory", "reorder", item.id);
    setReorderToast(`Reorder noted: ${item.name}`);
    window.setTimeout(() => setReorderToast(null), 2800);
  }, []);

  const kioskShell = useKioskShell();
  useEffect(() => {
    if (!kioskShell) {
      return;
    }
    kioskShell.setActions({
      searchPlaceholder: "Search pantry…",
      searchValue: search,
      onSearchChange: setSearch,
      showScan: true,
      onScan: () => setShowScan(true),
      showAdd: true,
      addLabel: "Add item",
      onAdd: () => document.getElementById("food-inv-add-trigger")?.click(),
    });
    return () => kioskShell.clearActions();
  }, [kioskShell, search]);

  useEffect(() => {
    trackCardFilter("pantry:food-inventory", boardChip);
  }, [boardChip]);

  const content = (
    <div className="gf-grocery-page">
      <KioskPageTitle
        eyebrow="Family Hub · Pantry"
        title="Pantry"
        description="Products, expiry, storage zones, and barcode scan — GroFast-style kiosk grid."
      />

      {(reorderToast || cartToast) ? (
        <p
          className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-900"
          role="status"
        >
          {reorderToast ?? cartToast}
        </p>
      ) : null}

      <AIInsights
        surface="pantry:food-inventory"
        suggestions={pantryAi.suggestions}
        smartGroceryList={pantryAi.smartGroceryList}
        aiFilter={aiFilter}
        onAiFilterChange={(f) => {
          if (f === "expiring") {
            setBoardChip("use_first");
          } else if (f === "low_stock") {
            setBoardChip("low_stock");
          } else if (f === "expired") {
            setBoardChip("expired");
          } else {
            setBoardChip("all");
          }
        }}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onMarkItemUsed={handleMarkUsed}
        onCopyGroceryList={pantryAi.formatGroceryListText}
        onSuggestionActed={pantryAi.onSuggestionActed}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
        <div className="min-w-0">
          <InventoryActions
            search={search}
            onSearchChange={setSearch}
            sortKey={sortKey}
            onSortKeyChange={setSortKey}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
            filterPreset={aiFilterToInventoryPreset(aiFilter)}
            onFilterPresetChange={(preset) => {
              const f = inventoryPresetToAiFilter(preset);
              if (f === "expiring") {
                setBoardChip("use_first");
              } else if (f === "expired") {
                setBoardChip("expired");
              } else {
                setBoardChip("all");
              }
            }}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            categories={categories}
            onAddItem={addItem}
            onResetDemo={resetToSeed}
            totalCount={items.length}
            filteredCount={items.length}
          />
        </div>

        <div className="min-w-0">
          <PantryFilterBar active={boardChip} onChange={setBoardChip} />
          <PantryGrid
            items={items}
            chip={boardChip}
            onUse={handleMarkUsed}
            onEdit={setEditing}
            onMove={moveItem}
            onReorder={handleReorder}
            onAddToShopping={handleAddToShopping}
            onScanRequest={() => setShowScan(true)}
          />
        </div>
      </div>

      <PantryBoardEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={updateItem}
      />

      {showScan ? (
        <ProductScanPanel
          title="Scan pantry item"
          lookupBusy={lookupBusy}
          lookupMessage={lookupMessage}
          onClose={() => setShowScan(false)}
          onLookup={handleScanLookup}
          onManualEntry={(code) => {
            void handleScanLookup(code);
          }}
        />
      ) : null}
    </div>
  );

  return kioskShell ? (
    <WidgetPageShell className="wd-pantry wd-food-inv">{content}</WidgetPageShell>
  ) : (
    <div className="wd-pantry wd-food-inv px-4 pb-10 sm:px-6">{content}</div>
  );
}

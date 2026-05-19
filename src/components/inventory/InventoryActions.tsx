import { Plus, RotateCcw } from "lucide-react";
import { useState } from "react";
import type {
  FoodStorageLocation,
  InventoryFilterPreset,
  InventorySortDirection,
  InventorySortKey,
} from "../../types/inventory";
import { FOOD_STORAGE_LOCATIONS } from "../../types/inventory";
import type { NewFoodInventoryItemInput } from "../../hooks/useInventory";

export type InventoryActionsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortKey: InventorySortKey;
  onSortKeyChange: (key: InventorySortKey) => void;
  sortDirection: InventorySortDirection;
  onSortDirectionChange: (dir: InventorySortDirection) => void;
  filterPreset: InventoryFilterPreset;
  onFilterPresetChange: (preset: InventoryFilterPreset) => void;
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  categories: string[];
  onAddItem: (input: NewFoodInventoryItemInput) => void;
  onResetDemo?: () => void;
  totalCount: number;
  filteredCount: number;
};

const SORT_OPTIONS: { value: InventorySortKey; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "quantity", label: "Quantity" },
  { value: "expiryDate", label: "Expiry date" },
];

const FILTER_OPTIONS: { value: InventoryFilterPreset; label: string }[] = [
  { value: "all", label: "All items" },
  { value: "expiring", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
];

function defaultExpiryIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

/**
 * Sidebar: search, filters, sort controls, and add-item form.
 */
export function InventoryActions({
  search,
  onSearchChange,
  sortKey,
  onSortKeyChange,
  sortDirection,
  onSortDirectionChange,
  filterPreset,
  onFilterPresetChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onAddItem,
  onResetDemo,
  totalCount,
  filteredCount,
}: InventoryActionsProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ea");
  const [expiryDate, setExpiryDate] = useState(defaultExpiryIso);
  const [location, setLocation] = useState<FoodStorageLocation>("pantry");
  const [category, setCategory] = useState("General");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onAddItem({
      name: trimmed,
      quantity: Math.max(0, Number(quantity) || 0),
      unit: unit.trim() || "ea",
      expiryDate,
      location,
      category: category.trim() || "General",
    });
    setName("");
    setQuantity("1");
  };

  return (
    <aside className="wd-pantry-sidebar wd-food-inv-sidebar" aria-label="Inventory controls">
      <h2 className="wd-pantry-sidebar__title">Food inventory</h2>
      <p className="mb-4 text-[12px] leading-relaxed text-[#64748b]">
        Showing {filteredCount} of {totalCount} items. Drag cards between columns to move
        locations.
      </p>

      <div className="wd-pantry-filter-block">
        <p className="wd-pantry-filter-block__label">Search</p>
        <input
          type="search"
          className="wd-pantry-search__input"
          placeholder="Filter by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search inventory"
        />
      </div>

      <div className="wd-pantry-filter-block">
        <p className="wd-pantry-filter-block__label">Sort by</p>
        <div className="flex flex-wrap gap-2">
          <select
            className="wd-pantry-select flex-1"
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as InventorySortKey)}
            aria-label="Sort field"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="wd-pantry-sort-dir"
            onClick={() =>
              onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")
            }
            aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
          >
            {sortDirection === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      </div>

      <div className="wd-pantry-filter-block">
        <p className="wd-pantry-filter-block__label">Status</p>
        <div className="wd-pantry-filter-list" role="list">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="listitem"
              className={
                filterPreset === opt.value
                  ? "wd-pantry-filter-opt wd-pantry-filter-opt--active"
                  : "wd-pantry-filter-opt"
              }
              onClick={() => onFilterPresetChange(opt.value)}
            >
              <span className="wd-pantry-filter-opt__text">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="wd-pantry-filter-block">
          <p className="wd-pantry-filter-block__label">Category</p>
          <div className="wd-pantry-filter-list" role="list">
            <button
              type="button"
              className={
                categoryFilter === null
                  ? "wd-pantry-filter-opt wd-pantry-filter-opt--active"
                  : "wd-pantry-filter-opt"
              }
              onClick={() => onCategoryFilterChange(null)}
            >
              <span className="wd-pantry-filter-opt__text">All categories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={
                  categoryFilter === cat
                    ? "wd-pantry-filter-opt wd-pantry-filter-opt--active"
                    : "wd-pantry-filter-opt"
                }
                onClick={() => onCategoryFilterChange(cat)}
              >
                <span className="wd-pantry-filter-opt__text">{cat}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form className="wd-pantry-filter-block border-t border-[#e2e8f0] pt-4" onSubmit={handleAdd}>
        <p className="wd-pantry-filter-block__label">Add item</p>
        <div className="flex flex-col gap-2">
          <label className="wd-pantry-field">
            <span className="wd-pantry-field__label">Name</span>
            <input
              className="wd-pantry-search__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Eggs"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="wd-pantry-field">
              <span className="wd-pantry-field__label">Qty</span>
              <input
                type="number"
                min={0}
                step={0.5}
                className="wd-pantry-search__input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className="wd-pantry-field">
              <span className="wd-pantry-field__label">Unit</span>
              <input
                className="wd-pantry-search__input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
          </div>
          <label className="wd-pantry-field">
            <span className="wd-pantry-field__label">Expiry</span>
            <input
              type="date"
              className="wd-pantry-search__input"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </label>
          <label className="wd-pantry-field">
            <span className="wd-pantry-field__label">Location</span>
            <select
              className="wd-pantry-select w-full"
              value={location}
              onChange={(e) => setLocation(e.target.value as FoodStorageLocation)}
            >
              {FOOD_STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="wd-pantry-field">
            <span className="wd-pantry-field__label">Category</span>
            <input
              className="wd-pantry-search__input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="wd-food-inv-categories"
            />
            <datalist id="wd-food-inv-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <button
            id="food-inv-add-trigger"
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#FF6F28] to-[#FF5325] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:brightness-[1.03]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add to inventory
          </button>
        </div>
      </form>

      {onResetDemo ? (
        <button
          type="button"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-medium text-[#94a3b8] hover:text-[#64748b]"
          onClick={onResetDemo}
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          Reset demo data
        </button>
      ) : null}
    </aside>
  );
}

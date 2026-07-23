import { Camera, PackagePlus, ScanLine, Settings2 } from "lucide-react";
import type { DemoPantryZone } from "../../data/demoPantryInventory";
import type { PantryZoneSummary } from "../../lib/pantryStorageZones";
import { cn } from "../../lib/utils";

export type PantryInventorySort = "name" | "status" | "updated";

type Props = {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  recentlyUpdated: number;
  purchasedToAdd: number;
  storageAreaCount: number;
  zoneSummaries: PantryZoneSummary[];
  activeZone: DemoPantryZone | "all";
  onSelectZone: (zone: DemoPantryZone | "all") => void;
  onAddItem: () => void;
  onScanItem: () => void;
  onOpenSettings?: () => void;
  onStatFilter: (kind: "all" | "low" | "out" | "recent" | "purchased" | "storage") => void;
  searchText: string;
  setSearchText: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  sortBy: PantryInventorySort;
  setSortBy: (value: PantryInventorySort) => void;
  categories: string[];
  locations: string[];
};

export function PantryAdminUxChrome({
  totalItems,
  lowStock,
  outOfStock,
  recentlyUpdated,
  purchasedToAdd,
  storageAreaCount,
  zoneSummaries,
  activeZone,
  onSelectZone,
  onAddItem,
  onScanItem,
  onOpenSettings,
  onStatFilter,
  searchText,
  setSearchText,
  categoryFilter,
  setCategoryFilter,
  locationFilter,
  setLocationFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  categories,
  locations,
}: Props) {
  return (
    <>
      <header className="aux-pantry__hero" aria-label="Pantry & Inventory">
        <div>
          <p className="aux-pantry__eyebrow">Household kitchen</p>
          <h1>Pantry &amp; Inventory</h1>
          <p>Track what the house has, what is low, and what needs to be added.</p>
        </div>
        <div className="aux-pantry__hero-actions">
          <button type="button" className="aux-pantry__btn aux-pantry__btn--primary" onClick={onAddItem}>
            <PackagePlus className="h-4 w-4" aria-hidden />
            Add Item
          </button>
          <button type="button" className="aux-pantry__btn aux-pantry__btn--scan" onClick={onScanItem}>
            <ScanLine className="h-4 w-4" aria-hidden />
            Scan Item
          </button>
          {onOpenSettings ? (
            <button type="button" className="aux-pantry__btn aux-pantry__btn--ghost" onClick={onOpenSettings}>
              <Settings2 className="h-4 w-4" aria-hidden />
              Inventory settings
            </button>
          ) : null}
        </div>
      </header>

      <section className="aux-pantry__stats" aria-label="Inventory summary">
        <button type="button" className="aux-pantry__stat aux-pantry__stat--total" onClick={() => onStatFilter("all")}>
          <strong>{totalItems}</strong>
          <span>Total Items</span>
        </button>
        <button type="button" className="aux-pantry__stat aux-pantry__stat--low" onClick={() => onStatFilter("low")}>
          <strong>{lowStock}</strong>
          <span>Low Stock</span>
        </button>
        <button type="button" className="aux-pantry__stat aux-pantry__stat--out" onClick={() => onStatFilter("out")}>
          <strong>{outOfStock}</strong>
          <span>Out of Stock</span>
        </button>
        <button
          type="button"
          className="aux-pantry__stat aux-pantry__stat--recent"
          onClick={() => onStatFilter("recent")}
        >
          <strong>{recentlyUpdated}</strong>
          <span>Recently Updated</span>
        </button>
        <button
          type="button"
          className="aux-pantry__stat aux-pantry__stat--purchased"
          onClick={() => onStatFilter("purchased")}
        >
          <strong>{purchasedToAdd}</strong>
          <span>Purchased Items to Add</span>
        </button>
        <button
          type="button"
          className="aux-pantry__stat aux-pantry__stat--storage"
          onClick={() => onStatFilter("storage")}
        >
          <strong>{storageAreaCount}</strong>
          <span>Storage Areas</span>
        </button>
      </section>

      <section className="aux-pantry__card" aria-label="Storage areas">
        <div className="aux-pantry__card-head">
          <h2>Storage areas</h2>
          <p>Filter by fridge, freezer, or kitchen pantry</p>
        </div>
        <div className="aux-pantry__zones">
          <button
            type="button"
            className={cn("aux-pantry__zone", activeZone === "all" && "is-active")}
            onClick={() => onSelectZone("all")}
          >
            <div className="aux-pantry__zone-top">
              <span className="aux-pantry__zone-icon aux-pantry__zone-icon--blue" aria-hidden>
                <Camera className="h-4 w-4" />
              </span>
              <strong>All areas</strong>
            </div>
            <em>{totalItems} items</em>
          </button>
          {zoneSummaries.map((z) => (
            <button
              key={z.zone}
              type="button"
              className={cn("aux-pantry__zone", activeZone === z.zone && "is-active")}
              onClick={() => onSelectZone(z.zone)}
            >
              <div className="aux-pantry__zone-top">
                <span className={`aux-pantry__zone-icon aux-pantry__zone-icon--${z.accent}`} aria-hidden>
                  {z.icon}
                </span>
                <strong>{z.zone}</strong>
              </div>
              <em>
                {z.count} item{z.count === 1 ? "" : "s"}
              </em>
              {z.low + z.out > 0 ? (
                <small>
                  {z.low > 0 ? `${z.low} low` : null}
                  {z.low > 0 && z.out > 0 ? " · " : null}
                  {z.out > 0 ? `${z.out} out` : null}
                </small>
              ) : (
                <small style={{ color: "#64748b" }}>Looking good</small>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="aux-pantry__card" aria-label="Search and filter inventory">
        <div className="aux-pantry__card-head">
          <h2>Search &amp; filter</h2>
          <p>Find items by name, category, location, or status</p>
        </div>
        <div className="aux-pantry__filters">
          <label className="aux-pantry__field">
            <span>Search inventory</span>
            <input
              type="search"
              value={searchText}
              placeholder="Name, brand, barcode, notes…"
              onChange={(e) => setSearchText(e.target.value)}
            />
          </label>
          <label className="aux-pantry__field">
            <span>Category</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="aux-pantry__field">
            <span>Location</span>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <label className="aux-pantry__field">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="Stocked">Stocked</option>
              <option value="Low">Low</option>
              <option value="Out">Out</option>
              <option value="low-stock">Low stock (qty)</option>
              <option value="expiring">Use soon</option>
            </select>
          </label>
          <label className="aux-pantry__field">
            <span>Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as PantryInventorySort)}
            >
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="updated">Last updated</option>
            </select>
          </label>
        </div>
      </section>

      <p className="aux-pantry__finance">
        Pantry budget tools coming later · Estimated pantry value placeholder
      </p>
    </>
  );
}

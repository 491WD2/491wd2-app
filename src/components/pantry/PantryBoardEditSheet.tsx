import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Package, Save, X } from "lucide-react";
import {
  formatInventoryExpiryLabel,
  getInventoryExpiryStatus,
  INVENTORY_LOCATION_META,
  type FoodInventoryItem,
  type FoodStorageLocation,
} from "../../types/inventory";
import {
  applyStructuredPantryLocationToNotes,
  getPantryLocationDetailOptions,
  PANTRY_LOCATION_AREAS,
  pantryAreaToFoodStorageLocation,
  parseStructuredPantryLocation,
  type PantryLocationArea,
} from "../../lib/pantryLocations";

export type PantryBoardEditSheetProps = {
  item: FoodInventoryItem | null;
  itemNotes?: string;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<FoodInventoryItem, "id">> & { notes?: string }) => void;
};

export function PantryBoardEditSheet({ item, itemNotes = "", onClose, onSave }: PantryBoardEditSheetProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ea");
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState<FoodStorageLocation>("pantry");
  const [locationArea, setLocationArea] = useState<PantryLocationArea>("pantry");
  const [locationDetail, setLocationDetail] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [category, setCategory] = useState("General");

  useEffect(() => {
    if (!item) {
      return;
    }
    setName(item.name);
    setQuantity(String(item.quantity));
    setUnit(item.unit);
    setExpiryDate(item.expiryDate);
    setLocation(item.location);
    const structuredLocation = parseStructuredPantryLocation(itemNotes, item.location);
    setLocationArea(structuredLocation.area);
    setLocationDetail(structuredLocation.detail);
    setLocationNote(structuredLocation.note);
    setCategory(item.category);
  }, [item, itemNotes]);

  if (!item) {
    return null;
  }

  const letter = item.name.trim().charAt(0).toUpperCase() || "?";
  const expiryStatus = getInventoryExpiryStatus(expiryDate);
  const expiryLabel = formatInventoryExpiryLabel(expiryDate);
  const locationLabel = INVENTORY_LOCATION_META[location].label;
  const sourceLabel = item.source === "scan" || item.barcode ? "Scanned" : "Manual";
  const locationDetailOptions = getPantryLocationDetailOptions(locationArea);

  function updateLocationArea(nextArea: PantryLocationArea) {
    const options = getPantryLocationDetailOptions(nextArea);
    setLocationArea(nextArea);
    setLocationDetail(options[0]?.value ?? "");
    setLocation(pantryAreaToFoodStorageLocation(nextArea));
  }

  return (
    <div
      className="gf-pantry-edit-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pantry-edit-title"
      onClick={onClose}
    >
      <form
        className="gf-pantry-edit-sheet__form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(item.id, {
            name: name.trim(),
            quantity: Math.max(0, Number(quantity) || 0),
            unit: unit.trim() || "ea",
            expiryDate,
            location,
            notes: applyStructuredPantryLocationToNotes(itemNotes, {
              area: locationArea,
              detail: locationDetail,
              note: locationNote,
            }),
            category: category.trim() || "General",
          });
          onClose();
        }}
      >
        <div className="gf-pantry-edit-sheet__head">
          <div className="gf-pantry-edit-sheet__summary">
            <div className="gf-pantry-edit-sheet__media" aria-hidden>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" loading="lazy" />
              ) : (
                <span>{letter}</span>
              )}
              <span className="gf-pantry-edit-sheet__qty-pill">
                {quantity || "0"} {unit || "ea"}
              </span>
            </div>
            <div className="gf-pantry-edit-sheet__intro">
              <p className="gf-pantry-edit-sheet__eyebrow">Inventory item</p>
              <h2 id="pantry-edit-title" className="gf-pantry-edit-sheet__title">
                Edit item
              </h2>
              <p className="gf-pantry-edit-sheet__name">{name || item.name}</p>
              <div className="gf-pantry-edit-sheet__badges" aria-label="Item status">
                <span className={`gf-pantry-edit-sheet__badge gf-pantry-edit-sheet__badge--${expiryStatus}`}>
                  {expiryStatus === "expired" ? "Expired" : expiryLabel}
                </span>
                <span className="gf-pantry-edit-sheet__badge">{locationLabel}</span>
                <span className="gf-pantry-edit-sheet__badge">{sourceLabel}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="gf-pantry-edit-sheet__close"
            aria-label="Close inventory item editor"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="gf-pantry-edit-sheet__body">
          <section className="gf-pantry-edit-sheet__section">
            <div className="gf-pantry-edit-sheet__section-head">
              <Package className="h-4 w-4" aria-hidden />
              <div>
                <h3>Item details</h3>
                <p>Name and grocery category.</p>
              </div>
            </div>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Category</span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
          </section>

          <section className="gf-pantry-edit-sheet__section">
            <div className="gf-pantry-edit-sheet__section-head">
              <MapPin className="h-4 w-4" aria-hidden />
              <div>
                <h3>Stock and location</h3>
                <p>Quantity, unit, and where it lives.</p>
              </div>
            </div>
            <div className="gf-pantry-edit-sheet__field-grid">
              <label className="gf-pantry-edit-sheet__field">
                <span>Qty</span>
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
              <label className="gf-pantry-edit-sheet__field">
                <span>Unit</span>
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </label>
            </div>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Location group</span>
              <select
                value={locationArea}
                onChange={(e) => updateLocationArea(e.target.value as PantryLocationArea)}
              >
                {PANTRY_LOCATION_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Location detail</span>
              <select
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
              >
                {locationDetailOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Location note</span>
              <input
                value={locationNote}
                placeholder="Add shelf detail, other location, or notes"
                onChange={(e) => setLocationNote(e.target.value)}
              />
            </label>
          </section>

          <section className="gf-pantry-edit-sheet__section gf-pantry-edit-sheet__section--status">
            <div className="gf-pantry-edit-sheet__section-head">
              <CalendarDays className="h-4 w-4" aria-hidden />
              <div>
                <h3>Status</h3>
                <p>Expiry and source metadata.</p>
              </div>
            </div>
            <label className="gf-pantry-edit-sheet__field gf-pantry-edit-sheet__field--full">
              <span>Expiry</span>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </label>
            <div className="gf-pantry-edit-sheet__meta-row" aria-label="Current metadata">
              <span>{sourceLabel}</span>
              {item.barcode ? <span>Barcode saved</span> : null}
            </div>
          </section>
        </div>

        <div className="gf-pantry-edit-sheet__actions">
          <button
            type="button"
            className="gf-pantry-edit-sheet__btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="gf-pantry-edit-sheet__btn gf-pantry-edit-sheet__btn--primary">
            <Save className="h-4 w-4" aria-hidden />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

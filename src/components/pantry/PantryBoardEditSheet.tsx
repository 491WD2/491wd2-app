import { useEffect, useState } from "react";
import {
  FOOD_STORAGE_LOCATIONS,
  type FoodInventoryItem,
  type FoodStorageLocation,
} from "../../types/inventory";

export type PantryBoardEditSheetProps = {
  item: FoodInventoryItem | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Omit<FoodInventoryItem, "id">>) => void;
};

export function PantryBoardEditSheet({ item, onClose, onSave }: PantryBoardEditSheetProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ea");
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState<FoodStorageLocation>("pantry");
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
    setCategory(item.category);
  }, [item]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pantry-edit-title"
      onClick={onClose}
    >
      <form
        className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(item.id, {
            name: name.trim(),
            quantity: Math.max(0, Number(quantity) || 0),
            unit: unit.trim() || "ea",
            expiryDate,
            location,
            category: category.trim() || "General",
          });
          onClose();
        }}
      >
        <h2 id="pantry-edit-title" className="text-lg font-bold text-slate-900">
          Edit item
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-600">
            Name
            <input
              className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-slate-600">
              Qty
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-600">
              Unit
              <input
                className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-600">
            Expiry
            <input
              type="date"
              className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-600">
            Location
            <select
              className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5"
              value={location}
              onChange={(e) => setLocation(e.target.value as FoodStorageLocation)}
            >
              {FOOD_STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-600">
            Category
            <input
              className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2.5"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="fh-pantry-product__btn flex-1"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="fh-pantry-product__btn fh-pantry-product__btn--primary flex-1">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

import type { PantryItem } from "../../data/familyData";
import type { InventoryCrossCheckMatch } from "../../lib/inventoryCrossCheck";
import { effectiveBestByDate } from "../../lib/inventoryDates";
import { getInventoryLocationLabel } from "../../pages/inventory/inventoryUtils";
import { getRotationStatus } from "../../services/foodStorageGuidance";
import { Button } from "../ui/Button";

function rotationLabel(item: PantryItem): string {
  const rs = getRotationStatus(item);
  switch (rs) {
    case "fresh":
      return "Fresh / OK";
    case "use_first":
      return "Use first";
    case "rotate_soon":
      return "Rotate soon";
    case "past_best_quality":
      return "Past best quality · check before use";
    case "inspect_before_use":
      return "Inspect before use";
    case "discard_if_damaged":
      return "Discard if damaged";
    default:
      return "—";
  }
}

export function InventoryCrossCheckModal({
  open,
  matches,
  onCancel,
  onAddAnotherBatch,
  onIncreaseExisting,
  onUpdateExisting,
  onGoToItem,
}: {
  open: boolean;
  matches: InventoryCrossCheckMatch[];
  onCancel: () => void;
  onAddAnotherBatch: () => void;
  onIncreaseExisting: (itemId: string) => void;
  onUpdateExisting: (itemId: string) => void;
  onGoToItem: (itemId: string) => void;
}) {
  if (!open || matches.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className="max-h-[min(92dvh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-2xl sm:p-6"
        role="dialog"
        aria-labelledby="cross-check-title"
        aria-modal="true"
      >
        <h2 id="cross-check-title" className="text-lg font-semibold text-amber-950">
          Cross-check — you already have this item on hand
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
          This step keeps counts accurate before stock lands in inventory. Compare quantity and dates before
          merging. If the best-by date differs, prefer{" "}
          <span className="font-semibold">Add another batch</span> instead of combining.
        </p>

        <ul className="mt-4 space-y-3">
          {matches.map(({ item, reason }) => (
            <li
              key={`${item.id}-${reason}`}
              className="rounded-xl border border-amber-200/80 bg-white p-3 text-sm shadow-sm"
            >
              <p className="font-semibold text-slate-950">{item.name}</p>
              <p className="mt-1 text-xs text-slate-600">
                Match:{" "}
                {reason === "barcode"
                  ? "Barcode"
                  : reason === "name_brand"
                    ? "Name + brand"
                    : "Name (fallback)"}
              </p>
              <p className="mt-2 text-slate-800">
                {item.brand ? (
                  <>
                    Brand: <span className="font-medium">{item.brand}</span>
                    <br />
                  </>
                ) : null}
                Quantity:{" "}
                <span className="font-medium">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
                <br />
                Storage: {getInventoryLocationLabel(item)}
                <br />
                Best-by: {effectiveBestByDate(item) ?? "—"}
                <br />
                Rotation / guidance:{" "}
                <span className="font-medium">{rotationLabel(item)}</span>
                {item.status === "Low" ? (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-amber-900">
                    Low
                  </span>
                ) : null}
                {item.status === "Out" ? (
                  <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-slate-800">
                    Out
                  </span>
                ) : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 text-sm"
                  onClick={() => onGoToItem(item.id)}
                >
                  Go to item
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11 text-sm"
                  onClick={() => onIncreaseExisting(item.id)}
                >
                  Increase existing stock
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="min-h-11 text-sm"
                  onClick={() => onUpdateExisting(item.id)}
                >
                  Update this item
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="primary" className="min-h-12 flex-1 text-base" onClick={onAddAnotherBatch}>
            Add another batch
          </Button>
          <Button type="button" variant="ghost" className="min-h-12 flex-1 text-base" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

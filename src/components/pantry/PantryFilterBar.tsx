import { trackCardFilter } from "../../lib/kioskCardAnalytics";
import type { PantryBoardChip } from "../../types/pantryBoard";
import { PANTRY_BOARD_CHIPS } from "../../types/pantryBoard";
import { cn } from "../../lib/utils";
import "../../styles/pantry-shopping-grofast.css";

export type PantryFilterBarProps = {
  active: PantryBoardChip;
  onChange: (chip: PantryBoardChip) => void;
  className?: string;
  /** Kiosk analytics surface id (default food-inventory dashboard). */
  analyticsSurface?: string;
};

/** Horizontal filter chips — All, Expiring Soon, Low Stock, storage, Scanned. */
export function PantryFilterBar({
  active,
  onChange,
  className,
  analyticsSurface = "pantry:food-inventory",
}: PantryFilterBarProps) {
  return (
    <div
      className={cn("gf-pantry-filter", className)}
      role="tablist"
      aria-label="Filter pantry"
    >
      {PANTRY_BOARD_CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          role="tab"
          aria-selected={active === chip.id}
          className={cn(
            "gf-pantry-filter__chip",
            active === chip.id && "gf-pantry-filter__chip--active",
          )}
          onClick={() => {
            trackCardFilter(analyticsSurface, chip.id);
            onChange(chip.id);
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

import { useMemo, useState, type ReactNode } from "react";
import { matchesPantryBoardChip } from "../../lib/pantryBoard";
import type { FoodInventoryItem, FoodStorageLocation } from "../../types/inventory";
import type { PantryBoardChip } from "../../types/pantryBoard";
import { PANTRY_BOARD_SECTIONS } from "../../types/pantryBoard";
import { boardEmptyStateForChip, groupItemsForBoard } from "../../lib/pantryBoard";
import { PantryBoardChipBar } from "./PantryBoardChipBar";
import { PantryBoardSection } from "./PantryBoardSection";
import { PantryBoardEmpty } from "./PantryBoardEmpty";
import { PantryBoardEditSheet } from "./PantryBoardEditSheet";
import "./pantry-board.css";

export type PantryBoardProps = {
  items: FoodInventoryItem[];
  chip?: PantryBoardChip;
  onChipChange?: (chip: PantryBoardChip) => void;
  onUse: (id: string) => void;
  onEdit: (id: string, patch: Partial<Omit<FoodInventoryItem, "id">>) => void;
  onMove: (id: string, location: FoodStorageLocation) => void;
  onReorder: (item: FoodInventoryItem) => void;
  addPanel?: ReactNode;
};

export function PantryBoard({
  items,
  chip: chipProp,
  onChipChange,
  onUse,
  onEdit,
  onMove,
  onReorder,
  addPanel,
}: PantryBoardProps) {
  const [chipInternal, setChipInternal] = useState<PantryBoardChip>("all");
  const chip = chipProp ?? chipInternal;
  const setChip = onChipChange ?? setChipInternal;
  const [editing, setEditing] = useState<FoodInventoryItem | null>(null);

  const grouped = useMemo(() => groupItemsForBoard(items, chip), [items, chip]);

  const visibleCount = useMemo(
    () => items.filter((i) => matchesPantryBoardChip(i, chip)).length,
    [items, chip],
  );

  const globalEmpty = boardEmptyStateForChip(chip);

  return (
    <div className="fh-pantry-board">
      <PantryBoardChipBar active={chip} onChange={setChip} />

      <div className="fh-pantry-board__layout">
        {addPanel ? <div className="fh-pantry-board__add-panel">{addPanel}</div> : null}

        <div className="min-w-0">
          {visibleCount === 0 && globalEmpty ? (
            <PantryBoardEmpty
              title={globalEmpty.title}
              hint={globalEmpty.hint}
            />
          ) : visibleCount === 0 ? (
            <PantryBoardEmpty
              title="No items match this filter"
              hint="Try another chip or clear your search."
            />
          ) : (
            <div className="fh-pantry-board__lanes">
              {PANTRY_BOARD_SECTIONS.map((config) => (
                <PantryBoardSection
                  key={config.id}
                  config={config}
                  items={grouped[config.id]}
                  onUse={onUse}
                  onEdit={setEditing}
                  onMove={onMove}
                  onReorder={onReorder}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <PantryBoardEditSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={onEdit}
      />
    </div>
  );
}

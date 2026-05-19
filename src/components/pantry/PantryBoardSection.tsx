import type { FoodInventoryItem } from "../../types/inventory";
import type { PantryBoardSectionConfig } from "../../types/pantryBoard";
import { PantryBoardCard } from "./PantryBoardCard";
import { PantryBoardEmpty } from "./PantryBoardEmpty";
import type { FoodStorageLocation } from "../../types/inventory";
import "./pantry-board.css";

export type PantryBoardSectionProps = {
  config: PantryBoardSectionConfig;
  items: FoodInventoryItem[];
  onUse: (id: string) => void;
  onEdit: (item: FoodInventoryItem) => void;
  onMove: (id: string, location: FoodStorageLocation) => void;
  onReorder: (item: FoodInventoryItem) => void;
};

export function PantryBoardSection({
  config,
  items,
  onUse,
  onEdit,
  onMove,
  onReorder,
}: PantryBoardSectionProps) {
  return (
    <section className="fh-pantry-board__lane" aria-label={config.title}>
      <header className="fh-pantry-board__lane-head">
        <span className="fh-pantry-board__lane-emoji" aria-hidden>
          {config.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="fh-pantry-board__lane-title">{config.title}</h2>
          <p className="fh-pantry-board__lane-desc">{config.description}</p>
        </div>
        <span className="fh-pantry-board__lane-count">{items.length}</span>
      </header>

      <div className="fh-pantry-board__lane-cards">
        {items.length === 0 ? (
          <PantryBoardEmpty
            emoji={config.emoji}
            title={config.emptyTitle}
            hint={config.emptyHint}
            compact
          />
        ) : (
          items.map((item) => (
            <PantryBoardCard
              key={`${config.id}-${item.id}`}
              item={item}
              onUse={onUse}
              onEdit={onEdit}
              onMove={onMove}
              onReorder={onReorder}
            />
          ))
        )}
      </div>
    </section>
  );
}

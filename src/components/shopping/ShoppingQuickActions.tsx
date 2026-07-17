import { RotateCcw } from "lucide-react";
import "../../styles/pantry-shopping-grofast.css";

export type ShoppingQuickActionsProps = {
  itemCount: number;
  onSaveList: () => void;
  onReorderNote?: () => void;
  saveMessage?: string;
  saveDisabled?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export function ShoppingQuickActions({
  itemCount,
  onSaveList,
  onReorderNote,
  saveMessage,
  saveDisabled = false,
  primaryLabel = "Save shopping list",
  secondaryLabel = "Reorder list (local note)",
}: ShoppingQuickActionsProps) {
  return (
    <div className="gf-shopping-quick" aria-label="Shopping list actions">
      {saveMessage ? (
        <p className="gf-shopping-quick__status" role="status">
          {saveMessage}
        </p>
      ) : null}
      <button
        type="button"
        className="gf-shopping-quick__primary"
        onClick={onSaveList}
        disabled={saveDisabled}
      >
        <span>{primaryLabel}</span>
        <span className="gf-shopping-quick__count">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
      </button>
      {onReorderNote ? (
        <button type="button" className="gf-shopping-quick__ghost" onClick={onReorderNote}>
          <RotateCcw className="inline h-4 w-4" aria-hidden />
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}

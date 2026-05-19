import { RotateCcw } from "lucide-react";
import "../../styles/pantry-shopping-grofast.css";

export type ShoppingQuickActionsProps = {
  itemCount: number;
  onSaveList: () => void;
  onReorderNote?: () => void;
  saveMessage?: string;
  saveDisabled?: boolean;
};

export function ShoppingQuickActions({
  itemCount,
  onSaveList,
  onReorderNote,
  saveMessage,
  saveDisabled = false,
}: ShoppingQuickActionsProps) {
  return (
    <div className="gf-shopping-quick">
      {saveMessage ? (
        <p className="text-sm font-semibold text-emerald-800" role="status">
          {saveMessage}
        </p>
      ) : null}
      <button
        type="button"
        className="gf-shopping-quick__primary"
        onClick={onSaveList}
        disabled={saveDisabled}
      >
        <span>Save shopping list</span>
        <span>
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </span>
      </button>
      {onReorderNote ? (
        <button type="button" className="gf-shopping-quick__ghost" onClick={onReorderNote}>
          <RotateCcw className="inline h-4 w-4" aria-hidden />
          Reorder list (local note)
        </button>
      ) : null}
    </div>
  );
}

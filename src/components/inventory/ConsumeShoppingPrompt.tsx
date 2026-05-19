import { Button } from "../ui/Button";

/**
 * After a stock update leaves an item low or out — optional restock add.
 */
export function ConsumeShoppingPrompt({
  open,
  onYesAdd,
  onNo,
}: {
  open: boolean;
  onYesAdd: () => void;
  onNo: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md rounded-[8px] border border-white/10 bg-[#141c28] p-4 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consume-prompt-title"
      >
        <h2 id="consume-prompt-title" className="text-lg font-semibold text-slate-50">
          Add to shopping list?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This item is low or out. Do you want to add it to the shopping list?
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-12 w-full text-base"
            onClick={onYesAdd}
          >
            Yes, add to shopping
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full border-white/15 bg-[#0d131a] text-base text-slate-100 hover:bg-white/[0.06]"
            onClick={onNo}
          >
            No
          </Button>
        </div>
      </div>
    </div>
  );
}

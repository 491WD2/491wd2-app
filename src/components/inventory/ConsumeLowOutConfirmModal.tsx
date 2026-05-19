import { Button } from "../ui/Button";

export function ConsumeLowOutConfirmModal({
  open,
  itemName,
  currentQuantityLabel,
  amountUsedLabel,
  estimatedRemainingLabel,
  minQuantityLabel,
  alreadyOnShopping,
  alreadyLow,
  unitLabel,
  onContinueWithShopping,
  onContinueWithout,
  onCancel,
}: {
  open: boolean;
  itemName: string;
  currentQuantityLabel: string;
  amountUsedLabel: string;
  estimatedRemainingLabel: string;
  minQuantityLabel: string;
  alreadyOnShopping: boolean;
  alreadyLow: boolean;
  unitLabel: string;
  onContinueWithShopping: () => void;
  onContinueWithout: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[92] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="low-out-confirm-title"
      >
        <h2 id="low-out-confirm-title" className="text-lg font-semibold text-amber-950">
          {alreadyLow
            ? `${itemName} is already low`
            : `This may make ${itemName} low or empty`}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
          {alreadyLow
            ? "Add or confirm it on the shopping list?"
            : "Review quantities before updating stock (guidance only — inspect packaging as usual)."}
        </p>
        <dl className="mt-4 space-y-2 rounded-xl border border-amber-200/80 bg-white p-3 text-sm text-slate-800">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Current quantity</dt>
            <dd className="font-medium">
              {currentQuantityLabel}
              {unitLabel ? ` ${unitLabel}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Amount used</dt>
            <dd className="font-medium">{amountUsedLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Estimated remaining</dt>
            <dd className="font-medium">
              {estimatedRemainingLabel}
              {unitLabel ? ` ${unitLabel}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Minimum quantity</dt>
            <dd className="font-medium">
              {minQuantityLabel || "—"}
              {minQuantityLabel && unitLabel ? ` ${unitLabel}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-2 border-t border-amber-100 pt-2">
            <dt className="text-slate-500">Already on shopping list?</dt>
            <dd className="font-medium">{alreadyOnShopping ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-12 w-full text-base"
            onClick={onContinueWithShopping}
          >
            Continue and add to shopping
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-12 w-full text-base"
            onClick={onContinueWithout}
          >
            Continue without adding
          </Button>
          <Button type="button" variant="ghost" className="min-h-12 w-full text-base" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

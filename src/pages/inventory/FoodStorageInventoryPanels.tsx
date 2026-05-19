import { Minus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  FamilyData,
  FoodStorageCategory,
  FoodStoragePlanLine,
  PantryItem,
  StorageClass,
} from "../../data/familyData";
import { DEFAULT_FOOD_STORAGE_PLAN_LINES } from "../../data/familyData";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { cn } from "../../lib/utils";
import { effectiveBestByDate } from "../../lib/inventoryDates";
import { getRotationStatus } from "../../services/foodStorageGuidance";
import {
  getInventoryLocationLabel,
  parseQuantity,
  type OpenFilteredInventory,
} from "./inventoryUtils";
import { getFoodStoragePlanLines, mergeCustomizationUpdate } from "../../lib/customization";

export function FoodStorageSafetyCallout({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[#ededed] bg-white px-4 py-3 text-sm leading-relaxed text-[#1f1f1f] shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
        className,
      )}
    >
      <p className="font-semibold text-[#1f1f1f]">Rotation guidance</p>
      <p className="mt-2">
        Dates and shelf-life estimates are for planning and quality guidance. Always inspect packaging
        before use. Discard cans that are swollen, leaking, badly rusted, or severely dented.
      </p>
    </div>
  );
}

const ROTATION_LABELS: Record<string, string> = {
  use_first: "Use first",
  rotate_soon: "Rotate soon",
  past_best_quality: "Past best quality window",
  inspect_before_use: "Inspect before use",
  discard_if_damaged: "Discard if damaged",
  fresh: "Fresh / OK window",
};

function rotationBadgeClass(status: string): string {
  switch (status) {
    case "discard_if_damaged":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "inspect_before_use":
    case "past_best_quality":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "rotate_soon":
    case "use_first":
      return "border-orange-200 bg-orange-50 text-orange-950";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }
}

export function RotationPanel({
  items,
  updateItem,
  adjustQuantity,
  addToShopping,
  openFilteredInventory,
}: {
  items: PantryItem[];
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustQuantity: (item: PantryItem, delta: number) => void;
  addToShopping: (item: PantryItem) => void;
  openFilteredInventory: OpenFilteredInventory;
}) {
  const buckets = useMemo(() => {
    const map: Record<string, PantryItem[]> = {
      use_first: [],
      rotate_soon: [],
      past_best_quality: [],
      inspect_before_use: [],
      discard_if_damaged: [],
      missing_dates: [],
    };

    for (const item of items) {
      if (
        !effectiveBestByDate(item) &&
        !item.purchaseDate?.trim() &&
        item.itemType !== "household"
      ) {
        map.missing_dates.push(item);
        continue;
      }
      const rs = getRotationStatus(item);
      if (map[rs]) {
        map[rs].push(item);
      }
    }

    return map;
  }, [items]);

  return (
    <div className="space-y-6">
      <FoodStorageSafetyCallout />
      {(
        [
          "use_first",
          "rotate_soon",
          "past_best_quality",
          "inspect_before_use",
          "discard_if_damaged",
          "missing_dates",
        ] as const
      ).map((key) => (
        <section key={key} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            {key === "missing_dates"
              ? "Missing dates"
              : ROTATION_LABELS[key] ?? key}
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({buckets[key]?.length ?? 0})
            </span>
          </h3>
          <div className="grid gap-2 lg:grid-cols-2">
            {(buckets[key] ?? []).map((item) => (
              <RotationCard
                key={item.id}
                item={item}
                adjustQuantity={adjustQuantity}
                addToShopping={addToShopping}
                updateItem={updateItem}
              />
            ))}
          </div>
          {(buckets[key] ?? []).length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              None right now.
            </p>
          ) : null}
        </section>
      ))}
      <Button type="button" variant="ghost" onClick={() => openFilteredInventory({ status: "expiring" })}>
        View expiring filter (legacy)
      </Button>
    </div>
  );
}

function RotationCard({
  item,
  updateItem,
  adjustQuantity,
  addToShopping,
}: {
  item: PantryItem;
  updateItem: (id: string, updates: Partial<PantryItem>) => void;
  adjustQuantity: (item: PantryItem, delta: number) => void;
  addToShopping: (item: PantryItem) => void;
}) {
  const status = getRotationStatus(item);
  const best = effectiveBestByDate(item);

  return (
    <div className="flex flex-col gap-2 rounded-[8px] border border-[#ededed] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-950">{item.name}</p>
          {item.brand ? <p className="text-xs text-slate-600">{item.brand}</p> : null}
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
            rotationBadgeClass(status),
          )}
        >
          {ROTATION_LABELS[status] ?? status}
        </span>
      </div>
      <p className="text-xs text-slate-600">
        {item.quantity}
        {item.unit ? ` ${item.unit}` : ""} · {getInventoryLocationLabel(item)}
      </p>
      <p className="text-xs text-slate-600">Best-by / quality date: {best ?? "—"}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="h-8 text-xs" onClick={() => adjustQuantity(item, -1)}>
          <Minus className="mr-1 h-3.5 w-3.5" />
          Mark used
        </Button>
        <Button type="button" variant="ghost" className="h-8 text-xs" onClick={() => addToShopping(item)}>
          <ShoppingCart className="mr-1 h-3.5 w-3.5" />
          Shopping
        </Button>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          Update best-by
          <Input
            type="date"
            className="h-8 w-[11rem]"
            value={item.bestByDate ?? item.expiryDate ?? ""}
            onChange={(e) =>
              updateItem(item.id, {
                bestByDate: e.target.value,
                expiryDate: e.target.value,
              })
            }
          />
        </label>
      </div>
    </div>
  );
}

export function FoodStoragePlanPanel({
  data,
  setData,
}: {
  data: FamilyData;
  setData: React.Dispatch<React.SetStateAction<FamilyData>>;
}) {
  const lines = getFoodStoragePlanLines(data.adminSettings);
  const [draft, setDraft] = useState<FoodStoragePlanLine[]>(lines);

  const totalsByCategory = useMemo(() => {
    const m = new Map<FoodStorageCategory | "custom", number>();
    for (const item of data.pantry) {
      const cat = item.foodStorageCategory ?? "other";
      const q = parseQuantity(item.quantity) ?? 0;
      m.set(cat, (m.get(cat) ?? 0) + q);
    }
    return m;
  }, [data.pantry]);

  function persist(linesArg: FoodStoragePlanLine[]) {
    setData((d) => ({
      ...d,
      adminSettings: mergeCustomizationUpdate(d.adminSettings, {
        ...(d.adminSettings.customization ?? {}),
        foodStoragePlanLines: linesArg,
      }),
    }));
    setDraft(linesArg);
  }

  function resetDefaults() {
    setDraft([...DEFAULT_FOOD_STORAGE_PLAN_LINES]);
    persist([...DEFAULT_FOOD_STORAGE_PLAN_LINES]);
  }

  const GROUP_LABEL: Record<FoodStoragePlanLine["group"], string> = {
    three_month_supply: "Three-month supply",
    long_term_storage: "Long-term storage",
    water: "Water",
    household_essentials: "Home & supplies",
  };

  return (
    <div className="space-y-4">
      <FoodStorageSafetyCallout />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => persist(draft)}>
          Save targets
        </Button>
        <Button type="button" variant="ghost" onClick={resetDefaults}>
          Reset starter rows
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Target</th>
              <th className="px-3 py-2">Est. on hand</th>
              <th className="px-3 py-2">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {draft.map((row, idx) => {
              const cur =
                row.categoryKey === "custom"
                  ? 0
                  : (totalsByCategory.get(row.categoryKey) ?? 0);
              const targetNum = Number.parseFloat(row.targetAmount) || 0;
              const gap = Math.max(0, targetNum - cur);
              return (
                <tr key={row.id}>
                  <td className="px-3 py-2 text-slate-700">{GROUP_LABEL[row.group]}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    <Input
                      value={row.label}
                      onChange={(e) => {
                        const next = [...draft];
                        next[idx] = { ...row, label: e.target.value };
                        setDraft(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Input
                        value={row.targetAmount}
                        onChange={(e) => {
                          const next = [...draft];
                          next[idx] = { ...row, targetAmount: e.target.value };
                          setDraft(next);
                        }}
                      />
                      <Input
                        className="w-20"
                        value={row.targetUnit}
                        onChange={(e) => {
                          const next = [...draft];
                          next[idx] = { ...row, targetUnit: e.target.value };
                          setDraft(next);
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-slate-800">{cur}</td>
                  <td className="px-3 py-2 tabular-nums text-amber-900">{gap}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-600">
        “Food Storage Plan” totals are rough sums from inventory quantities by category — adjust targets to match how
        your household counts servings or pounds.
      </p>
    </div>
  );
}

export function StorageClassFilteredPanel({
  title,
  description,
  storageClass,
  items,
  alternateFilter,
}: {
  title: string;
  description: string;
  storageClass?: StorageClass;
  alternateFilter?: (item: PantryItem) => boolean;
  items: PantryItem[];
}) {
  const filtered = useMemo(() => {
    if (alternateFilter) {
      return items.filter(alternateFilter);
    }
    if (!storageClass) {
      return items;
    }
    return items.filter((i) => i.storageClass === storageClass);
  }, [alternateFilter, items, storageClass]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-[8px] border border-[#ededed] bg-white p-3 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
          >
            <p className="font-semibold text-slate-950">{item.name}</p>
            <p className="mt-1 text-xs text-slate-600">
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""} · {getInventoryLocationLabel(item)}
            </p>
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          No items in this view yet.
        </p>
      ) : null}
    </div>
  );
}

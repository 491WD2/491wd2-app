import { Brain, ClipboardCopy, PackageMinus, ShoppingCart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { PantryAIFilter, PantryAISuggestion, SmartGroceryLine } from "../../types/pantryInsights";
import { cn } from "../../lib/utils";
import { trackAiSuggestionDismissed } from "../../lib/hubAiAnalytics";
import type { HubAiSurface } from "../../lib/hubAiAnalytics";

export type AIInsightsProps = {
  surface: HubAiSurface;
  suggestions: PantryAISuggestion[];
  smartGroceryList: SmartGroceryLine[];
  aiFilter: PantryAIFilter;
  onAiFilterChange: (filter: PantryAIFilter) => void;
  categories: string[];
  categoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  onMarkItemUsed?: (itemId: string) => void;
  onCopyGroceryList: () => string;
  onSuggestionActed: (suggestionId: string, kind: string, action: string) => void;
};

const FILTER_CHIPS: { id: PantryAIFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "expiring", label: "Expiring" },
  { id: "expired", label: "Expired" },
  { id: "low_stock", label: "Low stock" },
];

const KIND_ICON = {
  use_first: Sparkles,
  low_stock: PackageMinus,
  replenish: ShoppingCart,
  smart_grocery: Brain,
} as const;

/**
 * Pantry AI panel — use-first, low-stock, smart grocery, and list filters.
 */
export function AIInsights({
  surface,
  suggestions,
  smartGroceryList,
  aiFilter,
  onAiFilterChange,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  onMarkItemUsed,
  onCopyGroceryList,
  onSuggestionActed,
}: AIInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!copyMsg) {
      return;
    }
    const t = window.setTimeout(() => setCopyMsg(null), 2400);
    return () => window.clearTimeout(t);
  }, [copyMsg]);

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  function dismiss(id: string, kind: string) {
    setDismissed((prev) => new Set(prev).add(id));
    trackAiSuggestionDismissed(surface, id, kind);
  }

  function handleAction(suggestion: PantryAISuggestion) {
    if (suggestion.kind === "use_first" && suggestion.itemIds[0] && onMarkItemUsed) {
      onMarkItemUsed(suggestion.itemIds[0]);
      onSuggestionActed(suggestion.id, suggestion.kind, "mark_used");
      return;
    }
    if (suggestion.kind === "smart_grocery" || suggestion.actionLabel?.includes("grocery")) {
      const text = onCopyGroceryList();
      void navigator.clipboard?.writeText(text);
      setCopyMsg("Grocery list copied");
      onSuggestionActed(suggestion.id, suggestion.kind, "copy_grocery");
      return;
    }
    if (suggestion.kind === "low_stock") {
      onAiFilterChange("low_stock");
      onSuggestionActed(suggestion.id, suggestion.kind, "filter_low_stock");
    }
  }

  return (
    <section
      className="wd-food-inv-ai rounded-[10px] border border-[#ededed] bg-white p-4 shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
      aria-label="Pantry AI insights"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#735DFF]/15 to-[#FF4B6C]/10 text-[#735DFF]"
          aria-hidden
        >
          <Brain className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-[#1f1f1f]">AI insights</h2>
          <p className="mt-0.5 text-[12px] text-[#637381]">
            Use-first ordering, low-stock alerts, and a smart grocery list from usage patterns.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="toolbar" aria-label="Inventory filters">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] font-semibold transition",
              aiFilter === chip.id
                ? "border-[#735DFF] bg-[#735DFF]/10 text-[#4c3d99]"
                : "border-[#ededed] bg-[#f8f9fa] text-[#637381] hover:bg-white",
            )}
            aria-pressed={aiFilter === chip.id}
            onClick={() => onAiFilterChange(chip.id)}
          >
            {chip.label}
          </button>
        ))}
        {categories.length > 0 ? (
          <select
            className="min-h-8 rounded-full border border-[#ededed] bg-white px-3 text-[12px] font-medium text-[#1f1f1f]"
            value={categoryFilter ?? ""}
            onChange={(e) => onCategoryFilterChange(e.target.value || null)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {copyMsg ? (
        <p className="mt-3 text-[12px] font-semibold text-emerald-700" role="status">
          {copyMsg}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {visible.length === 0 ? (
          <li className="rounded-[8px] border border-dashed border-[#ededed] px-3 py-4 text-center text-[13px] text-[#637381]">
            No suggestions right now — stock looks good.
          </li>
        ) : (
          visible.map((suggestion) => {
            const Icon = KIND_ICON[suggestion.kind] ?? Sparkles;
            return (
              <li
                key={suggestion.id}
                className={cn(
                  "rounded-[8px] border p-3",
                  suggestion.priority === "high"
                    ? "border-[#fecaca] bg-[#fffbfb]"
                    : "border-[#ededed] bg-[#fafafa]",
                )}
              >
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#735DFF]" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1f1f1f]">{suggestion.title}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[#637381]">
                      {suggestion.detail}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestion.actionLabel ? (
                        <button
                          type="button"
                          className="rounded-[6px] bg-[#735DFF] px-2.5 py-1 text-[11px] font-semibold text-white hover:brightness-105"
                          onClick={() => handleAction(suggestion)}
                        >
                          {suggestion.actionLabel}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-[6px] border border-[#ededed] px-2.5 py-1 text-[11px] font-medium text-[#637381] hover:bg-white"
                        onClick={() => dismiss(suggestion.id, suggestion.kind)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {smartGroceryList.length > 0 ? (
        <div className="mt-4 border-t border-[#ededed] pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[12px] font-bold uppercase tracking-wide text-[#637381]">
              Smart grocery list
            </h3>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[6px] border border-[#ededed] px-2 py-1 text-[11px] font-semibold text-[#1f1f1f] hover:bg-[#f8f9fa]"
              onClick={() => {
                const text = onCopyGroceryList();
                void navigator.clipboard?.writeText(text);
                setCopyMsg("Grocery list copied");
                onSuggestionActed("smart-grocery", "smart_grocery", "copy_grocery");
              }}
            >
              <ClipboardCopy className="h-3 w-3" aria-hidden />
              Copy
            </button>
          </div>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-[12px] text-[#1f1f1f]">
            {smartGroceryList.map((line) => (
              <li key={line.id} className="flex justify-between gap-2 border-b border-[#f1f5f9] py-1">
                <span>{line.name}</span>
                <span className="shrink-0 text-[#637381]">
                  {line.suggestedQty} {line.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

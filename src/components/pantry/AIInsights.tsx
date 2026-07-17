import {
  AlertTriangle,
  Brain,
  ClipboardCopy,
  ListChecks,
  PackageMinus,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
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
    <section className="wd-food-inv-ai" aria-label="Pantry AI insights">
      <div className="wd-food-inv-ai__hero">
        <div className="wd-food-inv-ai__hero-head">
          <span className="wd-food-inv-ai__icon" aria-hidden>
            <Brain className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="wd-food-inv-ai__eyebrow">Support rail</p>
            <h2 className="wd-food-inv-ai__title">Pantry health</h2>
          </div>
        </div>
        <p className="wd-food-inv-ai__summary">
          Use-first ordering, low-stock alerts, and smart grocery reminders.
        </p>
      </div>

      <div className="wd-food-inv-ai__stats" aria-label="Pantry insight summary">
        <div className="wd-food-inv-ai__stat">
          <span className="wd-food-inv-ai__stat-icon wd-food-inv-ai__stat-icon--warm" aria-hidden>
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="wd-food-inv-ai__stat-value">
              {visible.filter((s) => s.priority === "high").length}
            </span>
            <span className="wd-food-inv-ai__stat-label">Need attention</span>
          </span>
        </div>
        <div className="wd-food-inv-ai__stat">
          <span className="wd-food-inv-ai__stat-icon wd-food-inv-ai__stat-icon--cool" aria-hidden>
            <ListChecks className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="wd-food-inv-ai__stat-value">{smartGroceryList.length}</span>
            <span className="wd-food-inv-ai__stat-label">Smart list</span>
          </span>
        </div>
      </div>

      <div className="wd-food-inv-ai__filter-card">
        <p className="wd-food-inv-ai__section-label">Focus</p>
        <div className="wd-food-inv-ai__filters" role="toolbar" aria-label="Inventory filters">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={cn(
                "wd-food-inv-ai__filter-chip",
                aiFilter === chip.id && "wd-food-inv-ai__filter-chip--active",
              )}
              aria-pressed={aiFilter === chip.id}
              onClick={() => onAiFilterChange(chip.id)}
            >
              {chip.label}
            </button>
          ))}
          {categories.length > 0 ? (
            <select
              className="wd-food-inv-ai__category-select"
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
      </div>

      {copyMsg ? (
        <p className="wd-food-inv-ai__copy-status" role="status">
          {copyMsg}
        </p>
      ) : null}

      <div className="wd-food-inv-ai__section-head">
        <p className="wd-food-inv-ai__section-label">Insights</p>
        <span className="wd-food-inv-ai__count-pill">{visible.length}</span>
      </div>

      <ul className="wd-food-inv-ai__suggestions">
        {visible.length === 0 ? (
          <li className="wd-food-inv-ai__empty">
            No suggestions right now — stock looks good.
          </li>
        ) : (
          visible.map((suggestion) => {
            const Icon = KIND_ICON[suggestion.kind] ?? Sparkles;
            return (
              <li
                key={suggestion.id}
                className={cn(
                  "wd-food-inv-ai__suggestion",
                  suggestion.priority === "high" && "wd-food-inv-ai__suggestion--high",
                )}
              >
                <div className="wd-food-inv-ai__suggestion-row">
                  <span className="wd-food-inv-ai__suggestion-icon" aria-hidden>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="wd-food-inv-ai__suggestion-body">
                    <p className="wd-food-inv-ai__suggestion-title">{suggestion.title}</p>
                    <p className="wd-food-inv-ai__suggestion-detail">
                      {suggestion.detail}
                    </p>
                    <div className="wd-food-inv-ai__actions">
                      {suggestion.actionLabel ? (
                        <button
                          type="button"
                          className="wd-food-inv-ai__action wd-food-inv-ai__action--primary"
                          onClick={() => handleAction(suggestion)}
                        >
                          {suggestion.actionLabel}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="wd-food-inv-ai__action"
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
        <div className="wd-food-inv-ai__smart-card">
          <div className="wd-food-inv-ai__smart-head">
            <h3 className="wd-food-inv-ai__section-label">
              Smart grocery list
            </h3>
            <button
              type="button"
              className="wd-food-inv-ai__copy-btn"
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
          <ul className="wd-food-inv-ai__smart-list">
            {smartGroceryList.map((line) => (
              <li key={line.id}>
                <span>{line.name}</span>
                <span>
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

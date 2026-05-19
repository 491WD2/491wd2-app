import type { RecipeIdea } from "../../data/familyData";
import {
  filterHintsInPantry,
  getRuleBasedRecipeIdeas,
  pantryNameKeywords,
  type RecipeIdeaSuggestion,
} from "../../lib/useUpRecipeIdeas";
import { Button } from "../ui/Button";

function hintTokens(h: string): string[] {
  return h
    .split(/\s+or\s+|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function hintSatisfied(h: string, pantryKeywords: Set<string>): boolean {
  const tokens = hintTokens(h);
  if (!tokens.length) {
    return false;
  }
  return tokens.some((t) => filterHintsInPantry([t], pantryKeywords).length > 0);
}

function missingIngredientHints(
  hints: string[] | undefined,
  pantryKeywords: Set<string>,
): string[] {
  if (!hints?.length) {
    return [];
  }
  return hints.filter((h) => !hintSatisfied(h, pantryKeywords));
}

export function RecipeUseUpModal({
  open,
  itemName,
  pantryItemNames,
  inventoryStatusNote,
  onAddRecipeIdea,
  onAddMissingIngredientsToShopping,
  onClose,
}: {
  open: boolean;
  itemName: string;
  pantryItemNames: string[];
  /** Ties the prompt to current inventory status (use soon, past date, etc.). */
  inventoryStatusNote?: string;
  onAddRecipeIdea: (idea: RecipeIdea) => void;
  onAddMissingIngredientsToShopping?: (ingredientLabels: string[]) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const ideas: RecipeIdeaSuggestion[] = getRuleBasedRecipeIdeas(itemName);
  const pk = pantryNameKeywords(pantryItemNames);

  const now = new Date().toISOString();

  return (
    <div className="fixed inset-0 z-[91] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center">
      <div
        className="max-h-[min(90dvh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-use-up-title"
      >
        <h2 id="recipe-use-up-title" className="text-lg font-semibold text-slate-950">
          Recipe ideas for {itemName}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Simple starters based on this item — edit anytime. Check what you have on hand before
          cooking.
        </p>
        {inventoryStatusNote ? (
          <p className="mt-2 rounded-[8px] border border-[#ededed] bg-[#f8f9fa] px-3 py-2 text-sm text-[#575757]">
            <span className="font-semibold">Inventory note:</span> {inventoryStatusNote}
          </p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {ideas.map((idea) => {
            const overlap = filterHintsInPantry(idea.ingredientsHint, pk);
            const missing = missingIngredientHints(idea.ingredientsHint, pk);
            return (
              <li
                key={idea.title}
                className="rounded-[8px] border border-[#ededed] bg-white p-3 text-sm shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
              >
                <p className="font-semibold text-slate-950">{idea.title}</p>
                {idea.ingredientsHint?.length ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Often pairs with: {idea.ingredientsHint.join(", ")}
                    {overlap.length > 0 ? (
                      <span className="block pt-1 font-medium text-emerald-800">
                        Also in inventory (hint): {overlap.join(", ")}
                      </span>
                    ) : null}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-2 min-h-10 w-full text-sm"
                  onClick={() => {
                    const row: RecipeIdea = {
                      id: crypto.randomUUID(),
                      title: idea.title,
                      ingredients: [...(idea.ingredientsHint ?? [])],
                      usesInventoryItemIds: [],
                      notes: `Ideas for ${itemName}`,
                      source: "suggested",
                      createdAt: now,
                      updatedAt: now,
                    };
                    onAddRecipeIdea(row);
                  }}
                >
                  Add recipe idea
                </Button>
                {missing.length > 0 && onAddMissingIngredientsToShopping ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 min-h-10 w-full border border-sky-200 bg-sky-50 text-sm text-sky-950 hover:bg-sky-100"
                    onClick={() => onAddMissingIngredientsToShopping(missing)}
                  >
                    Add missing ingredients to shopping ({missing.length})
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

import { getGroceryCategoryTheme } from "../../lib/groceryCategoryTheme";
import { getShoppingCategoryLabel } from "../../lib/shoppingData";
import type { GroceryCartLine } from "../../types/grocery";
import { ShoppingListCard } from "./ShoppingListCard";
import "../../styles/pantry-shopping-grofast.css";

export type ShoppingCategorySectionProps = {
  category: string;
  lines: GroceryCartLine[];
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
};

export function ShoppingCategorySection({
  category,
  lines,
  onTogglePurchased,
  onQuantityChange,
  onRemove,
}: ShoppingCategorySectionProps) {
  const label = getShoppingCategoryLabel(category);
  const theme = getGroceryCategoryTheme(category);

  if (lines.length === 0) {
    return null;
  }

  return (
    <section className="gf-shopping-category">
      <div className="gf-shopping-category__head">
        <h3 className="gf-shopping-category__title" style={{ color: theme.accent }}>
          {label}
        </h3>
        <span className="gf-shopping-category__count">
          {lines.length} item{lines.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="gf-shopping-list">
        {lines.map((line) => (
          <ShoppingListCard
            key={line.id}
            line={line}
            onTogglePurchased={onTogglePurchased}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}

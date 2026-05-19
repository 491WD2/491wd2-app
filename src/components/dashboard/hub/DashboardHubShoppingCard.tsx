import { ShoppingCart, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { ShoppingItem } from "../../../data/familyData";
import {
  SMARTHR_HUB_CHECKBOX,
  SMARTHR_HUB_CHECKBOX_SLOT,
  SMARTHR_HUB_FOOTER_DIVIDER,
  SMARTHR_HUB_ITEM_TITLE,
  SMARTHR_HUB_LIST_ROW,
  SMARTHR_HUB_LIST_SHELL,
  SMARTHR_HUB_STORE_BADGE,
  SMARTHR_HUB_TAB_ACTIVE,
  SMARTHR_HUB_TAB_BUTTON,
  SMARTHR_HUB_TAB_IDLE,
  SMARTHR_HUB_TABLIST_DIVIDER,
} from "../../../lib/smarthrUi";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { hubCardClass, hubCardTitleClass, hubDashWidgetIconClass, hubMutedClass } from "./dashboardHubTokens";

type ShopTab = "all" | "grocery" | "household" | "personal";

function tabLabel(tab: ShopTab): string {
  switch (tab) {
    case "all":
      return "All";
    case "grocery":
      return "Grocery";
    case "household":
      return "Household";
    case "personal":
      return "Personal";
    default:
      return tab;
  }
}

function matchesTab(tab: ShopTab, item: ShoppingItem): boolean {
  if (tab === "all") {
    return true;
  }
  if (tab === "household") {
    return item.storeSection === "household";
  }
  const cat = item.category.toLowerCase();
  if (tab === "personal") {
    return /personal|health|beauty|hygiene|pharmacy|care/.test(cat) || item.storeSection === "checkout";
  }
  if (tab === "grocery") {
    if (item.storeSection === "household") {
      return false;
    }
    if (/personal|health|beauty|hygiene|pharmacy|care/.test(cat)) {
      return false;
    }
    return true;
  }
  return true;
}

export function DashboardHubShoppingCard({
  items,
  onTogglePurchased,
  onAddItem,
  onOpenShopping,
}: {
  items: ShoppingItem[];
  onTogglePurchased: (id: string) => void;
  onAddItem: () => void;
  onOpenShopping: () => void;
}) {
  const [tab, setTab] = useState<ShopTab>("all");
  const needed = useMemo(() => items.filter((i) => !i.purchased), [items]);
  const visible = useMemo(() => needed.filter((i) => matchesTab(tab, i)).slice(0, 10), [needed, tab]);

  return (
    <section className={cn(hubCardClass, "flex min-h-0 flex-col")} aria-labelledby="hub-shopping-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={hubDashWidgetIconClass} aria-hidden>
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <h2 id="hub-shopping-title" className={hubCardTitleClass}>
            Shopping List
          </h2>
        </div>
        <Button
          type="button"
          variant="primary"
          className="min-h-10 rounded-[8px] px-4 text-[15px] font-semibold"
          onClick={onAddItem}
        >
          <Plus className="mr-1.5 inline h-4 w-4" aria-hidden />
          Add Item
        </Button>
      </div>

      <div className={SMARTHR_HUB_TABLIST_DIVIDER} role="tablist" aria-label="Shopping category">
        {(["all", "grocery", "household", "personal"] as const).map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(SMARTHR_HUB_TAB_BUTTON, active ? SMARTHR_HUB_TAB_ACTIVE : SMARTHR_HUB_TAB_IDLE)}
              onClick={() => setTab(k)}
            >
              {tabLabel(k)}
            </button>
          );
        })}
      </div>

      <ul className={cn(SMARTHR_HUB_LIST_SHELL, "mt-2 max-h-[min(22rem,50vh)] space-y-0 overflow-y-auto")}>
        {visible.length === 0 ? (
          <li className={cn(hubMutedClass, "px-3 py-6 text-center text-[15px]")}>Nothing in this list.</li>
        ) : (
          visible.map((item) => {
            return (
              <li key={item.id} className={SMARTHR_HUB_LIST_ROW}>
                <label className={SMARTHR_HUB_CHECKBOX_SLOT}>
                  <input
                    type="checkbox"
                    className={SMARTHR_HUB_CHECKBOX}
                    checked={false}
                    onChange={() => onTogglePurchased(item.id)}
                    aria-label={`Mark purchased: ${item.name}`}
                  />
                </label>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={SMARTHR_HUB_ITEM_TITLE}>{item.name}</p>
                    <span className={SMARTHR_HUB_STORE_BADGE}>{item.storeSection}</span>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className={SMARTHR_HUB_FOOTER_DIVIDER}>
        <Button type="button" variant="secondary" className="min-h-10 w-full rounded-[8px] font-semibold" onClick={onOpenShopping}>
          Open full shopping list
        </Button>
      </div>
    </section>
  );
}

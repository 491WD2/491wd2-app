import { Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  SMARTHR_BODY,
  SMARTHR_HUB_FOOTER_DIVIDER,
  SMARTHR_HUB_NOTE_TINY,
  SMARTHR_HUB_SEARCH_INPUT,
  SMARTHR_HUB_TILE,
  SMARTHR_HUB_TILE_QTY,
  SMARTHR_HUB_TILE_TITLE,
} from "../../../lib/smarthrUi";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import { hubCardClass, hubCardTitleClass, hubDashWidgetIconClass, hubMutedClass } from "./dashboardHubTokens";

export type HubPantryTile = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  status: "good" | "low" | "out";
  note?: string;
};

function statusBadgeClasses(status: HubPantryTile["status"]) {
  switch (status) {
    case "good":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800";
    case "low":
      return "border-amber-500/35 bg-amber-500/10 text-amber-900";
    case "out":
      return "border-rose-500/35 bg-rose-500/10 text-rose-900";
    default:
      return "";
  }
}

function statusText(status: HubPantryTile["status"]) {
  switch (status) {
    case "good":
      return "Good";
    case "low":
      return "Low";
    case "out":
      return "Out";
    default:
      return "";
  }
}

export function DashboardHubPantryCard({
  tiles,
  lowOrOutCount,
  onAddItem,
  onOpenPantry,
}: {
  tiles: HubPantryTile[];
  lowOrOutCount: number;
  onAddItem: () => void;
  onOpenPantry: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      return tiles;
    }
    return tiles.filter((t) => t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
  }, [tiles, q]);

  return (
    <section className={cn(hubCardClass, "flex min-h-0 flex-col")} aria-labelledby="hub-pantry-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={hubDashWidgetIconClass} aria-hidden>
            <Package className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="hub-pantry-title" className={hubCardTitleClass}>
                Inventory
              </h2>
              {lowOrOutCount > 0 ? (
                <span
                  className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[12px] font-semibold text-amber-900"
                  aria-label={`${lowOrOutCount} items need attention`}
                >
                  {lowOrOutCount} low/out
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="relative mt-4">
        <Search
          className={cn("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", SMARTHR_BODY)}
          aria-hidden
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search inventory…"
          className={cn(SMARTHR_HUB_SEARCH_INPUT, "w-full min-h-10 outline-none transition")}
          aria-label="Search inventory"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 ? (
          <p className={cn(hubMutedClass, "col-span-full py-6 text-center text-[15px]")}>No matching items.</p>
        ) : (
          filtered.map((t) => (
            <article key={t.id} className={cn(SMARTHR_HUB_TILE, "flex flex-col")}>
              <div className="flex items-start justify-between gap-1">
                <p className={SMARTHR_HUB_TILE_TITLE}>{t.name}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    statusBadgeClasses(t.status),
                  )}
                >
                  {statusText(t.status)}
                </span>
              </div>
              <p className={SMARTHR_HUB_TILE_QTY}>{t.quantity}</p>
              <p className={cn(hubMutedClass, "mt-1 text-[12px]")}>
                {t.unit} · {t.category}
              </p>
              {t.note ? <p className={SMARTHR_HUB_NOTE_TINY}>{t.note}</p> : null}
            </article>
          ))
        )}
      </div>

      <div className={SMARTHR_HUB_FOOTER_DIVIDER}>
        <Button type="button" variant="secondary" className="min-h-10 w-full rounded-[8px] font-semibold" onClick={onOpenPantry}>
          Open full pantry
        </Button>
      </div>
    </section>
  );
}

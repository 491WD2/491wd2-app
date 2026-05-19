import { lazy, Suspense, useCallback } from "react";
import { WidgetPageShell } from "../components/widgets";
import PantryTabPage from "./PantryTabPage";
import type { PageProps } from "./pageTypes";

type PantrySurface = "kiosk" | "advanced";

const FoodInventoryDashboardLazy = lazy(() =>
  import("./FoodInventoryDashboard").then((m) => ({
    default: m.FoodInventoryDashboard,
  })),
);

function PantryAdvancedFallback() {
  return (
    <div className="wd-pantry-empty" role="status">
      <p className="wd-pantry-empty__title">Loading food inventory…</p>
    </div>
  );
}

function resolvePantrySurface(search: string | undefined): PantrySurface {
  const raw = search?.startsWith("?") ? search.slice(1) : search ?? "";
  const params = new URLSearchParams(raw);
  return params.get("view") === "pantry" ? "advanced" : "kiosk";
}

function pantrySurfaceHref(surface: PantrySurface, search: string | undefined): string {
  const raw = search?.startsWith("?") ? search.slice(1) : search ?? "";
  const params = new URLSearchParams(raw);
  params.delete("view");
  if (surface === "advanced") {
    params.set("view", "pantry");
  }
  const query = params.toString();
  return query ? `/pantry?${query}` : "/pantry";
}

/**
 * `/pantry` entry for CurrentBuild — kiosk inventory by default, advanced module optional.
 */
export function PantryPage(props: PageProps) {
  const surface = resolvePantrySurface(props.inventorySearch);

  const setSurface = useCallback(
    (next: PantrySurface) => {
      props.navigateWithinApp?.(pantrySurfaceHref(next, props.inventorySearch));
    },
    [props.inventorySearch, props.navigateWithinApp],
  );

  return (
    <div
      className={
        surface === "kiosk"
          ? "wd-pantry-route wd-pantry-route--kiosk"
          : "wd-pantry-route wd-pantry-route--advanced"
      }
    >
      <div className="wd-pantry-surface-toggle" role="tablist" aria-label="Pantry view">
        <button
          type="button"
          role="tab"
          className={
            surface === "kiosk"
              ? "wd-pantry-surface-toggle__btn wd-pantry-surface-toggle__btn--active"
              : "wd-pantry-surface-toggle__btn"
          }
          aria-selected={surface === "kiosk"}
          onClick={() => setSurface("kiosk")}
        >
          Inventory Kiosk
        </button>
        <button
          type="button"
          role="tab"
          className={
            surface === "advanced"
              ? "wd-pantry-surface-toggle__btn wd-pantry-surface-toggle__btn--active"
              : "wd-pantry-surface-toggle__btn"
          }
          aria-selected={surface === "advanced"}
          onClick={() => setSurface("advanced")}
        >
          Food inventory
        </button>
      </div>

      {surface === "kiosk" ? (
        <WidgetPageShell className="!min-h-0 !p-0 !bg-transparent">
          <PantryTabPage onOpenShopping={props.onOpenShopping} />
        </WidgetPageShell>
      ) : (
        <Suspense fallback={<PantryAdvancedFallback />}>
          <FoodInventoryDashboardLazy />
        </Suspense>
      )}
    </div>
  );
}

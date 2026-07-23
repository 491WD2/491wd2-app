import { PantryInventoryModulePage } from "./inventory/PantryInventoryModulePage";
import PantryTabPage from "./PantryTabPage";
import type { PageProps } from "./pageTypes";

type PantryInitialScreen =
  | "home"
  | "inventory"
  | "fridges"
  | "freezers"
  | "pantryLocation"
  | "homeLocation"
  | "foodStorage"
  | "settings";

function resolvePantryInitialScreen(search: string | undefined): PantryInitialScreen {
  const raw = search?.startsWith("?") ? search.slice(1) : search ?? "";
  const params = new URLSearchParams(raw);
  const view = params.get("view");
  if (view === "pantry") {
    return "pantryLocation";
  }
  if (view === "fridges") {
    return "fridges";
  }
  if (view === "freezers") {
    return "freezers";
  }
  if (view === "home") {
    return "homeLocation";
  }
  if (view === "inventory") {
    return "inventory";
  }
  if (view === "food-storage") {
    return "foodStorage";
  }
  if (view === "settings") {
    return "settings";
  }
  return "inventory";
}

/** Legacy kiosk location deep-links keep the grofast flow; default /pantry uses FamilyData inventory. */
function shouldUseKioskFlow(search: string | undefined): boolean {
  const raw = search?.startsWith("?") ? search.slice(1) : search ?? "";
  const params = new URLSearchParams(raw);
  const view = params.get("view");
  const flow = params.get("flow");
  if (flow === "kiosk") {
    return true;
  }
  return (
    view === "fridges" ||
    view === "freezers" ||
    view === "pantry" ||
    view === "home" ||
    view === "food-storage" ||
    view === "settings"
  );
}

/**
 * `/pantry` entry for CurrentBuild.
 * Default opens the AdminUX-styled FamilyData inventory dashboard.
 * Legacy `?view=` location routes continue to deep-link into the kiosk inventory sections.
 */
export function PantryPage(props: PageProps) {
  if (shouldUseKioskFlow(props.inventorySearch)) {
    const initialScreen = resolvePantryInitialScreen(props.inventorySearch);
    return (
      <div className="wd-pantry-route wd-pantry-route--kiosk">
        <PantryTabPage
          onOpenShopping={props.onOpenShopping}
          navigateWithinApp={props.navigateWithinApp}
          initialScreen={initialScreen}
        />
      </div>
    );
  }

  return (
    <div className="wd-pantry-route wd-pantry-route--adminux">
      <PantryInventoryModulePage {...props} />
    </div>
  );
}

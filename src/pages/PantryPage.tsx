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

/**
 * `/pantry` entry for CurrentBuild.
 * The default `/pantry` route opens the Inventory hub. Legacy location routes
 * such as `/pantry?view=pantry` continue to deep-link into inventory sections.
 */
export function PantryPage(props: PageProps) {
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

import type { RouteKey } from "../components/layout/shellRoutes";
import type { KioskNavId } from "./kioskShellConfig";

export type KioskShellNavigateArgs = {
  onRouteChange: (route: RouteKey) => void;
  onNavigateHref?: (href: string) => void;
};

/** Map sidebar nav id → app navigation (CurrentBuild / full household app). */
export function navigateKioskNav(nav: KioskNavId, args: KioskShellNavigateArgs) {
  const { onRouteChange, onNavigateHref } = args;
  switch (nav) {
    case "dashboard":
      onRouteChange("dashboard");
      return;
    case "shopping":
      onRouteChange("shopping");
      return;
    case "pantry":
      onNavigateHref?.("/pantry?view=pantry");
      return;
    case "calendar":
      onRouteChange("calendar");
      return;
    case "notifications":
      onRouteChange("notifications");
      return;
    case "subscriptions":
      onRouteChange("subscriptions");
      return;
    case "chores":
      onRouteChange("tasks");
      return;
    case "pets":
      onRouteChange("pets");
      return;
    case "settings":
      onRouteChange("settings");
      return;
    default:
      onRouteChange("dashboard");
  }
}

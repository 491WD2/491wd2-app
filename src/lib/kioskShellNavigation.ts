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
    case "pantry":
      onNavigateHref?.("/pantry?view=pantry");
      return;
    case "chores":
      onRouteChange("tasks");
      return;
    case "members":
      onRouteChange("family");
      return;
    case "calendar":
      onRouteChange("calendar");
      return;
    case "analytics":
      onNavigateHref?.("/chores?analytics=1");
      return;
    case "settings":
      onRouteChange("settings");
      return;
    default:
      onRouteChange("dashboard");
  }
}

/** My Build (`App.tsx`) navigation by page id from appNavigation registry. */
export function navigateKioskNavMyBuild(
  nav: KioskNavId,
  navigatePage: (pageId: string) => void,
) {
  switch (nav) {
    case "dashboard":
      navigatePage("home");
      return;
    case "pantry":
      navigatePage("pantry");
      return;
    case "chores":
      navigatePage("chores");
      return;
    case "members":
      navigatePage("family-hub");
      return;
    case "calendar":
      navigatePage("calendar");
      return;
    case "analytics":
      window.history.pushState(null, "", "/chores?analytics=1");
      navigatePage("chores");
      return;
    case "settings":
      navigatePage("settings");
      return;
    default:
      navigatePage("home");
  }
}

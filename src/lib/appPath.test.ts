import {
  CANONICAL_HOME_PATH,
  CANONICAL_TASKS_PATH,
  compatibilityRedirectPath,
  isLegacyChorePath,
  liveNavPaths,
  parseAppPath,
  routePathMap,
} from "./appPath";
import { navigateKioskNav } from "./kioskShellNavigation";
import {
  SIDEBAR_PRIMARY_KEYS,
  SIDEBAR_ROUTE_KEYS,
} from "../components/layout/shellRoutes";

describe("app path compatibility", () => {
  it("resolves canonical Home and landing aliases to adminux", () => {
    expect(parseAppPath("/adminux").activeRoute).toBe("adminux");
    expect(parseAppPath("/").activeRoute).toBe("adminux");
    expect(parseAppPath("/home").activeRoute).toBe("adminux");
    expect(parseAppPath("/dashboard").activeRoute).toBe("adminux");
    expect(compatibilityRedirectPath("/")).toBe(CANONICAL_HOME_PATH);
    expect(compatibilityRedirectPath("/dashboard")).toBe(CANONICAL_HOME_PATH);
    expect(compatibilityRedirectPath("/adminux")).toBeNull();
  });

  it("maps dead /chores and /cleaning/* to live /tasks without 404", () => {
    expect(isLegacyChorePath("/chores")).toBe(true);
    expect(isLegacyChorePath("/cleaning/rooms")).toBe(true);
    expect(parseAppPath("/chores").activeRoute).toBe("tasks");
    expect(parseAppPath("/cleaning").activeRoute).toBe("tasks");
    expect(parseAppPath("/cleaning/recurring").activeRoute).toBe("tasks");
    expect(compatibilityRedirectPath("/chores")).toBe(CANONICAL_TASKS_PATH);
    expect(compatibilityRedirectPath("/cleaning/rooms")).toBe(CANONICAL_TASKS_PATH);
  });

  it("keeps live module paths on their own routes", () => {
    expect(parseAppPath("/tasks").activeRoute).toBe("tasks");
    expect(parseAppPath("/messages").activeRoute).toBe("messages");
    expect(parseAppPath("/unknown-module").activeRoute).toBe("not-found");
  });

  it("does not put /chores or /cleaning in live nav destinations", () => {
    const paths = liveNavPaths();
    expect(paths).toContain(CANONICAL_HOME_PATH);
    expect(paths).toContain(CANONICAL_TASKS_PATH);
    expect(paths.some((path) => path === "/chores" || path.startsWith("/cleaning"))).toBe(
      false,
    );
    expect(SIDEBAR_ROUTE_KEYS).toContain("tasks");
    expect(SIDEBAR_ROUTE_KEYS).not.toContain("kiosk");
    expect(SIDEBAR_PRIMARY_KEYS).toContain("adminux");
    expect(Object.values(routePathMap)).not.toContain("/chores");
  });

  it("sends kiosk chore nav to the live tasks route", () => {
    const onRouteChange = jest.fn();
    navigateKioskNav("chores", { onRouteChange });
    expect(onRouteChange).toHaveBeenCalledWith("tasks");
    expect(routePathMap.tasks).toBe("/tasks");
  });
});

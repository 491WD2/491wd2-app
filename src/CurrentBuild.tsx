import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AppShell,
  type DashboardHeaderContext,
  type RouteKey,
  type ShellRoute,
} from "./components/layout/AppShell";
import { AppLoading } from "./components/layout/AppLoading";
import { ModuleGate } from "./components/layout/ModuleGate";
import { useFamilyData } from "./hooks/useFamilyData";
import { isRestrictedHouseholdMember } from "./lib/householdUx";
import { dedupeNotificationsForDisplay } from "./lib/householdNotify";
import {
  findMemberById,
  getMemberFullName,
} from "./lib/utils";
import {
  getAppDisplayName,
  getModuleCalendarLabel,
  getModuleDocsLabel,
  getModuleFamilyLabel,
  getModuleHouseholdInventoryLabel,
  getModuleProjectsLabel,
  getModuleSettingsLabel,
  getModuleShoppingLabel,
  getModuleTasksLabel,
} from "./lib/customization";
import { HouseholdProductProvider } from "./context/HouseholdProductContext";

const CalendarPage = lazy(() =>
  import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const AdminUxHouseholdDashboard = lazy(() =>
  import("./pages/AdminUxHouseholdDashboard").then((m) => ({
    default: m.AdminUxHouseholdDashboard,
  })),
);
const HiddenModulePage = lazy(() =>
  import("./pages/HiddenModulePage").then((m) => ({ default: m.HiddenModulePage })),
);
const FamilyMembersPage = lazy(() =>
  import("./pages/FamilyMembersPage").then((m) => ({ default: m.FamilyMembersPage })),
);
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const MemberDashboardPage = lazy(() =>
  import("./pages/MemberDashboardPage").then((m) => ({ default: m.MemberDashboardPage })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const PantryPage = lazy(() => import("./pages/PantryPage").then((m) => ({ default: m.PantryPage })));
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ShoppingPage = lazy(() =>
  import("./pages/ShoppingPage").then((m) => ({ default: m.ShoppingPage })),
);
const TasksPage = lazy(() => import("./pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const KioskPage = lazy(() => import("./pages/KioskPage").then((m) => ({ default: m.KioskPage })));
const QuickAddPage = lazy(() =>
  import("./pages/QuickAddPage").then((m) => ({ default: m.QuickAddPage })),
);
const KitchenChecklistPage = lazy(() =>
  import("./pages/KitchenChecklistPage").then((m) => ({ default: m.KitchenChecklistPage })),
);
const KitchenSchedulePage = lazy(() =>
  import("./pages/KitchenSchedulePage").then((m) => ({ default: m.KitchenSchedulePage })),
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })),
);
const SubscriptionsPage = lazy(() =>
  import("./pages/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage })),
);
const PetsPage = lazy(() => import("./pages/PetsPage").then((m) => ({ default: m.PetsPage })));

export default function App() {
  const [routeHref, setRouteHref] = useState(
    () =>
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
  const [data, setData] = useFamilyData();
  const pathname = routeHref.split("?")[0];
  const locationSearch = routeHref.includes("?")
    ? routeHref.slice(routeHref.indexOf("?"))
    : "";
  const { activeRoute, memberId } = parsePath(pathname);

  useEffect(() => {
    function handlePopState() {
      setRouteHref(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const explicitRouteMemberId = memberId ? decodeURIComponent(memberId) : undefined;
  const activeMember = explicitRouteMemberId
    ? findMemberById(data, explicitRouteMemberId)
    : undefined;
  const activeMemberLabel = activeMember ? getMemberFullName(activeMember) : undefined;

  const dashboardHeader = useMemo((): DashboardHeaderContext | undefined => {
    if (activeRoute !== "dashboard") {
      return undefined;
    }
    const raw = data.notifications.filter((n) => {
      if (n.dismissedAt) {
        return false;
      }
      return true;
    });
    const notificationCount = dedupeNotificationsForDisplay(raw).length;
    const groceryCount = data.shopping.filter((s) => !s.purchased).length;
    const statusLine = `${groceryCount} on your shopping list · ${notificationCount} notification${notificationCount === 1 ? "" : "s"}`;
    return { greeting: "Welcome home.", statusLine, notificationCount };
  }, [
    activeRoute,
    data.notifications,
    data.shopping,
  ]);

  /** Legacy landing aliases resolve to the Command Center (AdminUX) home. */
  useLayoutEffect(() => {
    const normalized = pathname.replace(/\/$/, "") || "/";
    if (
      normalized !== "/" &&
      normalized !== "/kiosk-login" &&
      normalized !== "/login" &&
      normalized !== "/home"
    ) {
      return;
    }
    window.history.replaceState(
      null,
      "",
      `/adminux${window.location.search}${window.location.hash}`,
    );
    setRouteHref(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }, [pathname]);

  function navigateTo(href: string) {
    const path = href.startsWith("/") ? href : `/${href}`;
    window.history.pushState(null, "", path);
    setRouteHref(
      `${window.location.pathname}${window.location.search}${window.location.hash}`,
    );
  }

  function navigateToRoute(route: RouteKey) {
    navigateTo(routePathMap[route]);
  }

  function navigateToMember(memberId: string) {
    navigateTo(`/family/${encodeURIComponent(memberId)}`);
  }

  return (
    <HouseholdProductProvider>
    <AppShell
      activeRoute={activeRoute}
      activeMemberLabel={activeMemberLabel}
      appModeLabel={data.adminSettings.appModeLabel}
      dataSourceMode={data.adminSettings.dataSourceMode ?? "local"}
      householdName={getAppDisplayName(data.adminSettings)}
      kioskNavEnabled={data.adminSettings.enableKioskMode === true}
      kioskShellMembers={data.familyMembers
        .filter((m) => m.status !== "archived")
        .map((m) => ({ id: m.id, label: getMemberFullName(m) }))}
      kioskActiveMemberId={activeMember?.id ?? null}
      onKioskMemberChange={(id) => {
        if (id) {
          navigateToMember(id);
        } else {
          navigateToRoute("dashboard");
        }
      }}
      restrictChildNavigation={isRestrictedHouseholdMember(activeMember)}
      moduleVisibility={data.adminSettings.moduleVisibility}
      onNavigateHref={navigateTo}
      onOpenLogin={() => navigateTo("/cloud-login")}
      onRouteChange={navigateToRoute}
      dashboardHeader={dashboardHeader}
      locationHref={routeHref}
      routeLabels={{
        dashboard: "Dashboard",
        adminux: "Command Center",
        family: getModuleFamilyLabel(data.adminSettings),
        tasks: getModuleTasksLabel(data.adminSettings),
        kitchen: "Kitchen Assignments",
        pets: "Pets",
        projects: getModuleProjectsLabel(data.adminSettings),
        pantry: getModuleHouseholdInventoryLabel(data.adminSettings),
        shopping: getModuleShoppingLabel(data.adminSettings),
        calendar: getModuleCalendarLabel(data.adminSettings),
        planner: getModuleCalendarLabel(data.adminSettings),
        docs: getModuleDocsLabel(data.adminSettings),
        kitchenSchedule: "Kitchen Schedule",
        notifications: "Notifications",
        subscriptions: "Subscriptions",
        settings: getModuleSettingsLabel(data.adminSettings),
      }}
    >
      <Suspense fallback={<AppLoading />}>
      {activeRoute === "cloud-login" ? (
        <LoginPage onBack={() => navigateTo("/adminux")} />
      ) : null}
      {activeRoute === "kiosk" ? (
        <KioskPage
          data={data}
          onNavigate={(route) => navigateToRoute(route)}
          openAppHref={navigateTo}
        />
      ) : null}
      {activeRoute === "quick-add" ? (
        <QuickAddPage
          data={data}
          locationSearch={locationSearch}
          navigateWithinApp={navigateTo}
          setData={setData}
          onOpenDashboard={() => navigateToRoute("dashboard")}
        />
      ) : null}
      {activeRoute === "dashboard" ? (
        <ModuleGate
          moduleKey="dashboard"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <DashboardPage
            data={data}
            setData={setData}
            navigateWithinApp={navigateTo}
            restrictChildNavigation={isRestrictedHouseholdMember(activeMember)}
            onOpenTasks={() => navigateToRoute("tasks")}
            onOpenPantry={() => navigateToRoute("pantry")}
            onOpenShopping={() => navigateToRoute("shopping")}
            onOpenCalendar={() => navigateToRoute("calendar")}
            onOpenPlanner={() => navigateToRoute("calendar")}
            onOpenSettings={() => navigateToRoute("settings")}
            onOpenMemberDashboard={navigateToMember}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "adminux" ? (
        <ModuleGate
          moduleKey="dashboard"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <AdminUxHouseholdDashboard
            data={data}
            setData={setData}
            navigateWithinApp={navigateTo}
            onOpenPantry={() => navigateToRoute("pantry")}
            onOpenShopping={() => navigateToRoute("shopping")}
            onOpenTasks={() => navigateToRoute("tasks")}
            onOpenCalendar={() => navigateToRoute("calendar")}
            onOpenSettings={() => navigateToRoute("settings")}
            onOpenDashboard={() => navigateToRoute("dashboard")}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "family" && memberId ? (
        <ModuleGate
          moduleKey="family"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <MemberDashboardPage
            data={data}
            setData={setData}
            memberId={memberId}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            onOpenTasks={() => navigateToRoute("tasks")}
            onOpenCalendar={() => navigateToRoute("calendar")}
            onBackToFamily={() => navigateToRoute("family")}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "family" && !memberId ? (
        <ModuleGate
          moduleKey="family"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <FamilyMembersPage
            data={data}
            setData={setData}
            onOpenTasks={() => navigateToRoute("tasks")}
            onOpenCalendar={() => navigateToRoute("calendar")}
            onOpenMemberDashboard={navigateToMember}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "tasks" ? (
        <ModuleGate
          moduleKey="tasks"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <TasksPage
            data={data}
            setData={setData}
            navigateWithinApp={navigateTo}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            restrictChildNavigation={isRestrictedHouseholdMember(activeMember)}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "kitchen" ? (
        <ModuleGate
          moduleKey="tasks"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <KitchenChecklistPage
            data={data}
            setData={setData}
            navigateWithinApp={navigateTo}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            restrictChildNavigation={isRestrictedHouseholdMember(activeMember)}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "pets" ? (
        <PetsPage
          data={data}
          setData={setData}
          onOpenDashboard={() => navigateToRoute("dashboard")}
        />
      ) : null}
      {activeRoute === "projects" ? (
        <HiddenModulePage
          title="Unused shortcut"
          onGoHome={() => navigateToRoute("dashboard")}
          onGoSettings={() => navigateToRoute("settings")}
        />
      ) : null}
      {activeRoute === "pantry" ? (
        <ModuleGate
          moduleKey="pantry"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <PantryPage
            data={data}
            inventorySearch={locationSearch}
            navigateWithinApp={navigateTo}
            setData={setData}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            onOpenShopping={() => navigateToRoute("shopping")}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "shopping" ? (
        <ModuleGate
          moduleKey="shopping"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <ShoppingPage
            data={data}
            setData={setData}
            navigateWithinApp={navigateTo}
            shoppingSearch={locationSearch}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            onOpenPantry={() => navigateToRoute("pantry")}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "calendar" ? (
        <ModuleGate
          moduleKey="calendar"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <CalendarPage data={data} setData={setData} />
        </ModuleGate>
      ) : null}
      {activeRoute === "docs" ? (
        <HiddenModulePage
          title="Notes"
          onGoHome={() => navigateToRoute("dashboard")}
          onGoSettings={() => navigateToRoute("settings")}
        />
      ) : null}
      {activeRoute === "kitchenSchedule" ? (
        <ModuleGate
          moduleKey="tasks"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <KitchenSchedulePage
            data={data}
            setData={setData}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            navigateWithinApp={navigateTo}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "notifications" ? (
        <ModuleGate
          moduleKey="dashboard"
          moduleVisibility={data.adminSettings.moduleVisibility}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        >
          <NotificationsPage
            data={data}
            setData={setData}
            onOpenDashboard={() => navigateToRoute("dashboard")}
            navigateWithinApp={navigateTo}
          />
        </ModuleGate>
      ) : null}
      {activeRoute === "subscriptions" ? (
        <SubscriptionsPage
          data={data}
          onOpenDashboard={() => navigateToRoute("dashboard")}
          navigateWithinApp={navigateTo}
        />
      ) : null}
      {activeRoute === "settings" ? (
        <SettingsPage
          data={data}
          setData={setData}
          navigateWithinApp={navigateTo}
          onOpenLogin={() => navigateTo("/cloud-login")}
        />
      ) : null}
      {activeRoute === "not-found" ? (
        <NotFoundPage
          onOpenDashboard={() => navigateToRoute("dashboard")}
          onOpenSettings={() => navigateToRoute("settings")}
        />
      ) : null}
      </Suspense>
    </AppShell>
    </HouseholdProductProvider>
  );
}

const routePathMap: Record<RouteKey, string> = {
  dashboard: "/dashboard",
  adminux: "/adminux",
  kiosk: "/kiosk",
  family: "/family",
  tasks: "/tasks",
  kitchen: "/kitchen",
  kitchenSchedule: "/kitchen-schedule",
  notifications: "/notifications",
  subscriptions: "/subscriptions",
  pets: "/pets",
  projects: "/projects",
  pantry: "/pantry",
  shopping: "/shopping",
  calendar: "/calendar",
  planner: "/planner",
  docs: "/docs",
  settings: "/settings",
};

function parsePath(pathname: string): {
  activeRoute: ShellRoute;
  memberId?: string;
} {
  const [, firstSegment, secondSegment] = pathname.split("/");

  if (!firstSegment) {
    return { activeRoute: "adminux" };
  }

  if (firstSegment === "login" || firstSegment === "kiosk-login") {
    return { activeRoute: "adminux" };
  }

  if (firstSegment === "home") {
    return { activeRoute: "adminux" };
  }

  if (firstSegment === "dashboard") {
    return { activeRoute: "dashboard" };
  }

  if (firstSegment === "cloud-login") {
    return { activeRoute: "cloud-login" };
  }

  if (firstSegment === "quick-add") {
    return { activeRoute: "quick-add" };
  }

  if (firstSegment === "kiosk") {
    return { activeRoute: "kiosk" };
  }

  if (firstSegment === "kitchen-schedule") {
    return { activeRoute: "kitchenSchedule" };
  }

  if (firstSegment === "planner") {
    return { activeRoute: "calendar" };
  }

  if (firstSegment === "family") {
    return {
      activeRoute: "family",
      memberId: secondSegment ? decodeURIComponent(secondSegment) : undefined,
    };
  }

  if (isRouteKey(firstSegment)) {
    return { activeRoute: firstSegment };
  }

  return { activeRoute: "not-found" };
}

function isRouteKey(value: string): value is RouteKey {
  return Object.keys(routePathMap).includes(value);
}

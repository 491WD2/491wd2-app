import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  X,
} from "lucide-react";
import type { AdminSettings, ModuleKey } from "../../data/familyData";
import { cn } from "../../lib/utils";
import { useUiCustomization } from "../../context/UiCustomizationContext";
import { setThemeMode } from "../../lib/appTheme";
import { DS_MAIN_COLUMN } from "../../lib/designSystem";
import {
  SMARTHR_FOCUS_RING_ACCENT_45,
  SMARTHR_FOCUS_RING_ACCENT_50,
  SMARTHR_FOCUS_RING_ACCENT_INSET_55,
  SMARTHR_HEADER_BAR_MIN_H,
  SMARTHR_HEADER_BAR_PADDING,
  SMARTHR_HEADER_ICON_BTN_DARK,
  SMARTHR_HEADER_ICON_BTN_LIGHT,
  SMARTHR_HEADER_KICKER,
  SMARTHR_HEADER_ICON_BTN_LIGHT_PRESS,
  SMARTHR_HEADER_PRIMARY_BTN_DARK,
  SMARTHR_HEADER_PRIMARY_BTN_LIGHT,
  SMARTHR_HEADER_SUBTITLE,
  SMARTHR_HEADER_TITLE,
  SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE,
  SMARTHR_MOBILE_NAV_WELL,
  SMARTHR_MOBILE_SHEET_HEADER_DARK,
  SMARTHR_MOBILE_SHEET_HEADER_LIGHT,
  SMARTHR_MOBILE_SHEET_SURFACE_DARK,
  SMARTHR_MOBILE_SHEET_SURFACE_LIGHT,
  SMARTHR_MOBILE_SHEET_BOTTOM_DARK,
  SMARTHR_MOBILE_SHEET_BOTTOM_LIGHT,
  SMARTHR_SHELL_HEADER,
} from "../../lib/smarthrUi";
import {
  isPrimaryNavRoute,
  routes,
  type RouteKey,
  type ShellRoute,
} from "./shellRoutes";
import { SidebarNav } from "./SidebarNav";
import { QuickActionsFab, QuickActionsPanel } from "../dashboard/QuickActionsPanel";
import { QuickActionsOpenerContext } from "../dashboard/quickActionsOpenerContext";
import { KioskShell } from "./KioskShell";
import type { KioskHeaderMember } from "./KioskHeader";
import {
  resolveKioskNavFromShell,
  type KioskNavId,
  usesUnifiedKioskShell,
} from "../../lib/kioskShellConfig";
import { navigateKioskNav } from "../../lib/kioskShellNavigation";

export type { RouteKey, ShellRoute };
export { routes };

/** Home · Calendar · Shopping · Pantry — Cleaning & Settings in “More”. */
const bottomNavRoutes: RouteKey[] = [
  "dashboard",
  "calendar",
  "shopping",
  "pantry",
];

/** Cleaning (`tasks`) includes kitchen workflow — no separate Kitchen tab. */
const moreMenuRouteKeys: RouteKey[] = ["tasks", "pets", "settings"];

function routeVisible(
  key: RouteKey,
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>,
) {
  if (key === "kitchen") {
    return moduleVisibility?.tasks !== false;
  }
  if (key === "notifications") {
    return moduleVisibility?.dashboard !== false;
  }
  if (key === "subscriptions") {
    return true;
  }
  if (key === "pets") {
    return true;
  }
  return (
    key === "dashboard" ||
    key === "adminux" ||
    key === "settings" ||
    moduleVisibility?.[key as ModuleKey] !== false
  );
}

export type DashboardHeaderContext = {
  greeting: string;
  statusLine: string;
  notificationCount: number;
};

type AppShellProps = {
  activeRoute: ShellRoute;
  /** Full URL state including hash — sidebar highlights Tasks vs Kitchen. */
  locationHref?: string;
  /** Kitchen kiosk: signed-in family member (PIN session). */
  activeMemberLabel?: string;
  appModeLabel: string;
  dataSourceMode?: "local" | "cloud-preview";
  householdName: string;
  /** Optional overrides for primary nav labels (Customization center). */
  routeLabels?: Partial<Record<RouteKey, string>>;
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>;
  /** Show Tablet Kiosk in primary nav (Settings → Kiosk mode). */
  kioskNavEnabled?: boolean;
  /** Larger base type for nav + main (workstation / arm's length). */
  largeTextMode?: boolean;
  /** Deep links (query strings) — e.g. pantry scan tab. */
  onNavigateHref?: (href: string) => void;
  /** Hide settings / cloud entry for younger kiosk profiles. */
  restrictChildNavigation?: boolean;
  onRouteChange: (route: RouteKey) => void;
  onOpenLogin?: () => void;
  /** Kiosk: return to family PIN screen without clearing session until Lock. */
  onSwitchUser?: () => void;
  /** Kiosk: clear active member and open PIN screen. */
  onLockScreen?: () => void;
  /** Rich Home header: greeting, status, notification affordance (dashboard route). */
  dashboardHeader?: DashboardHeaderContext | null;
  /** Use warm kiosk shell (sidebar + header panel) on hub routes. Default: auto from route. */
  unifiedKioskLayout?: boolean;
  kioskShellMembers?: KioskHeaderMember[];
  kioskActiveMemberId?: string | null;
  onKioskMemberChange?: (memberId: string) => void;
  children: ReactNode;
};

export function AppShell({
  activeRoute,
  locationHref,
  activeMemberLabel,
  appModeLabel,
  dataSourceMode,
  householdName,
  routeLabels,
  moduleVisibility,
  kioskNavEnabled,
  largeTextMode,
  onNavigateHref,
  restrictChildNavigation,
  onRouteChange,
  onOpenLogin,
  onSwitchUser,
  onLockScreen,
  dashboardHeader,
  unifiedKioskLayout,
  kioskShellMembers,
  kioskActiveMemberId,
  onKioskMemberChange,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const { pageLayout, updateGlobalLayout, resolveLayoutForRoute } = useUiCustomization();
  const sidebarCollapsed = pageLayout.global.sidebarCollapsed;
  const layoutResolved = resolveLayoutForRoute(activeRoute);
  const layoutCompact = layoutResolved.density === "compact";

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const moreKeysEffective = moreMenuRouteKeys.filter(
    (key) => !(restrictChildNavigation && key === "settings"),
  );

  const visibleRoutes = routes.filter(
    (route) =>
      isPrimaryNavRoute(route.key) && routeVisible(route.key, moduleVisibility),
  );

  const navRoutes = restrictChildNavigation
    ? visibleRoutes.filter((r) => r.key !== "settings")
    : visibleRoutes;

  const compactHeader = activeRoute === "kiosk";
  const showMobileChrome =
    activeRoute !== "login" &&
    activeRoute !== "cloud-login" &&
    activeRoute !== "not-found";
  const showBottomNav =
    showMobileChrome && activeRoute !== "kiosk";

  /** Bright AdminUX shell for signed-in routes (Command Center look site-wide). */
  const shellDark = false;
  const useAdminuxChrome = showMobileChrome;

  const hideStickyHeader =
    showMobileChrome && (activeRoute === "dashboard" || activeRoute === "adminux");

  useEffect(() => {
    if (!useAdminuxChrome) {
      return;
    }
    setThemeMode("light");
  }, [useAdminuxChrome]);

  const clockTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(clock);
  const clockDate = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(clock);

  const currentModuleLabel =
    activeRoute === "login" || activeRoute === "cloud-login" || activeRoute === "not-found"
      ? null
      : activeRoute === "quick-add"
        ? "Quick add"
        : activeRoute === "kiosk"
          ? "Kiosk"
          : (() => {
              const match = routes.find((r) => r.key === activeRoute);
              return match
                ? (routeLabels?.[match.key] ?? match.label)
                : householdName;
            })();

  const moreMenuActive =
    (moreKeysEffective.includes(activeRoute as RouteKey) &&
      routeVisible(activeRoute as RouteKey, moduleVisibility)) ||
    (activeRoute === "kiosk" && kioskNavEnabled === true);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }, [activeRoute]);

  useEffect(() => {
    if (!mobileMenuOpen && !moreOpen) {
      return;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setMoreOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen, moreOpen]);

  function go(route: RouteKey) {
    onRouteChange(route);
    setMobileMenuOpen(false);
    setMoreOpen(false);
  }

  const quickActionsGateOk =
    !!onNavigateHref &&
    activeRoute !== "login" &&
    activeRoute !== "cloud-login" &&
    activeRoute !== "not-found" &&
    activeRoute !== "kiosk";

  const unifiedKioskChrome =
    (unifiedKioskLayout ?? false) &&
    usesUnifiedKioskShell(activeRoute) &&
    showMobileChrome;

  if (unifiedKioskChrome) {
    const activeNav = resolveKioskNavFromShell(activeRoute, locationHref);
    const hiddenKioskNav: KioskNavId[] = [];
    if (!routeVisible("shopping", moduleVisibility)) hiddenKioskNav.push("shopping");
    if (!routeVisible("pantry", moduleVisibility)) hiddenKioskNav.push("pantry");
    if (!routeVisible("calendar", moduleVisibility)) hiddenKioskNav.push("calendar");
    if (!routeVisible("notifications", moduleVisibility)) hiddenKioskNav.push("notifications");
    if (restrictChildNavigation || !routeVisible("subscriptions", moduleVisibility)) {
      hiddenKioskNav.push("subscriptions");
    }
    if (!routeVisible("tasks", moduleVisibility)) hiddenKioskNav.push("chores");
    if (!routeVisible("pets", moduleVisibility)) hiddenKioskNav.push("pets");
    if (restrictChildNavigation) hiddenKioskNav.push("settings");
    return (
      <QuickActionsOpenerContext.Provider
        value={{
          openQuickActions: () => {
            if (!quickActionsGateOk) {
              return;
            }
            setQuickActionsOpen(true);
          },
        }}
      >
        <KioskShell
          activeNav={activeNav}
          householdName={householdName}
          onNavigate={(nav) =>
            navigateKioskNav(nav, {
              onRouteChange,
              onNavigateHref,
            })
          }
          members={kioskShellMembers}
          activeMemberId={kioskActiveMemberId}
          onMemberChange={onKioskMemberChange}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarCollapsedChange={(collapsed) =>
            updateGlobalLayout({ sidebarCollapsed: collapsed })
          }
          hiddenNav={hiddenKioskNav.length > 0 ? hiddenKioskNav : undefined}
          onScanFallback={() => onNavigateHref?.("/pantry?scan=1")}
          onAddFallback={() => {
            if (quickActionsGateOk) {
              setQuickActionsOpen(true);
            }
          }}
        >
          {children}
        </KioskShell>
        {quickActionsGateOk ? (
          <>
            {activeRoute !== "dashboard" && activeRoute !== "quick-add" ? (
              <QuickActionsFab onClick={() => setQuickActionsOpen(true)} />
            ) : null}
            <QuickActionsPanel
              navigateHref={onNavigateHref!}
              open={quickActionsOpen}
              onClose={() => setQuickActionsOpen(false)}
              moduleVisibility={moduleVisibility}
              restrictChildNavigation={restrictChildNavigation}
            />
          </>
        ) : null}
      </QuickActionsOpenerContext.Provider>
    );
  }

  return (
    <QuickActionsOpenerContext.Provider
      value={{
        openQuickActions: () => {
          if (!quickActionsGateOk) {
            return;
          }
          setQuickActionsOpen(true);
        },
      }}
    >
    <div
      className={cn(
        "min-h-screen overflow-x-hidden bg-transparent",
        useAdminuxChrome && "adminux-app",
        shellDark ? "text-slate-900 dark:text-slate-100" : "text-slate-900",
        largeTextMode && "text-[1.0625rem] [&_main_h1]:text-[1.35rem] [&_main_h2]:text-[1.2rem]",
      )}
    >
      <div
        className={cn(
          showMobileChrome
            ? "grid min-h-[100dvh] grid-cols-1 md:items-stretch"
            : "flex flex-col md:flex-row md:items-stretch",
          showMobileChrome &&
            (sidebarCollapsed ? "md:grid-cols-[minmax(0,76px)_1fr]" : "md:grid-cols-[minmax(0,252px)_1fr]"),
        )}
      >
        {showMobileChrome ? (
          <SidebarNav
            activeRoute={activeRoute}
            collapsed={sidebarCollapsed}
            householdName={householdName}
            kioskNavEnabled={kioskNavEnabled}
            locationHref={locationHref}
            moduleVisibility={moduleVisibility}
            onNavigateHref={onNavigateHref}
            restrictChildNavigation={restrictChildNavigation}
            routeLabels={routeLabels}
            onRouteChange={go}
            onToggleCollapsed={() =>
              updateGlobalLayout({ sidebarCollapsed: !sidebarCollapsed })
            }
          />
        ) : null}
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            shellDark && DS_MAIN_COLUMN,
          )}
        >
      {!hideStickyHeader ? (
      <header
        className={cn(
          showMobileChrome ? SMARTHR_SHELL_HEADER : "border-b border-slate-200/90 bg-white/90 text-slate-900 shadow-sm",
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col justify-center gap-3",
            SMARTHR_HEADER_BAR_MIN_H,
            SMARTHR_HEADER_BAR_PADDING,
            "max-w-none",
          )}
        >
          {showMobileChrome ? (
            <div className="flex items-center justify-between gap-3 md:hidden">
              <div className="min-w-0">
                <p
                  className={cn(
                    SMARTHR_HEADER_KICKER,
                  )}
                >
                  {householdName}
                </p>
                <p
                  className={cn(
                    SMARTHR_HEADER_TITLE,
                    "text-base",
                  )}
                >
                  {dashboardHeader
                    ? dashboardHeader.greeting
                    : (currentModuleLabel ?? householdName)}
                </p>
                {dashboardHeader ? (
                  <p
                    className={cn(
                      SMARTHR_HEADER_SUBTITLE,
                    )}
                  >
                    {dashboardHeader.statusLine}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {dashboardHeader ? (
                  <button
                    type="button"
                    aria-label={
                      dashboardHeader.notificationCount > 0
                        ? `Notifications, ${dashboardHeader.notificationCount} unread`
                        : "Notifications, no unread alerts"
                    }
                    onClick={() => {
                      onNavigateHref?.("/#home-notifications");
                      window.requestAnimationFrame(() =>
                        document
                          .getElementById("home-notifications")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      );
                    }}
                    className={cn(
                      "motion-button relative inline-flex min-h-11 min-w-11 items-center justify-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      SMARTHR_FOCUS_RING_ACCENT_50,
                      shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                    )}
                  >
                    <Bell className="h-5 w-5" aria-hidden />
                    {dashboardHeader.notificationCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-amber-500 px-1 text-[0.65rem] font-bold text-amber-950">
                        {dashboardHeader.notificationCount > 99
                          ? "99+"
                          : dashboardHeader.notificationCount}
                      </span>
                    ) : null}
                  </button>
                ) : null}
                <div
                  className={cn(
                    "text-right text-[0.7rem] font-medium tabular-nums",
                    shellDark ? "text-zinc-400" : "text-slate-600",
                  )}
                >
                  <div>{clockTime}</div>
                  <div className="text-[0.65rem] opacity-90">{clockDate}</div>
                </div>
                {activeMemberLabel ? (
                  <span
                    className={cn(
                      "max-w-[11rem] truncate rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
                      shellDark
                        ? "border-white/10 bg-white/[0.06] text-zinc-100"
                        : "border-stone-200/90 bg-stone-100/90 text-stone-800",
                    )}
                    title={activeMemberLabel}
                  >
                    {activeMemberLabel}
                  </span>
                ) : null}
                {onSwitchUser ? (
                  <button
                    type="button"
                    onClick={onSwitchUser}
                    aria-label="Switch user"
                    className={cn(
                      "motion-button min-h-11 px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      SMARTHR_FOCUS_RING_ACCENT_50,
                      shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                    )}
                  >
                    Switch user
                  </button>
                ) : null}
                {onLockScreen ? (
                  <button
                    type="button"
                    onClick={onLockScreen}
                    aria-label="Lock screen"
                    className={cn(
                      "motion-button min-h-11 px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      SMARTHR_FOCUS_RING_ACCENT_50,
                      shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                    )}
                  >
                    Lock
                  </button>
                ) : null}
                {onOpenLogin && !restrictChildNavigation ? (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    aria-label="Cloud account"
                    className={cn(
                      "motion-button rounded-md border px-3.5 py-2.5 text-sm font-semibold transition",
                      "min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      (activeRoute as ShellRoute) === "cloud-login"
                        ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm focus-visible:ring-blue-400/55"
                        : shellDark
                          ? SMARTHR_HEADER_ICON_BTN_DARK
                        : SMARTHR_HEADER_ICON_BTN_LIGHT_PRESS,
                      (activeRoute as ShellRoute) === "cloud-login" ? null : SMARTHR_FOCUS_RING_ACCENT_50,
                    )}
                  >
                    Account
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav-dialog"
                  aria-label="Open menu"
                  onClick={() => setMobileMenuOpen(true)}
                  className={cn(
                    "motion-button inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                  )}
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              "items-center justify-between gap-4",
              showMobileChrome ? "hidden md:flex" : "flex",
            )}
          >
            <div className="min-w-0">
              <p className={cn(SMARTHR_HEADER_KICKER, "tracking-[0.26em]")}>{householdName}</p>
              <h1
                className={cn(
                  SMARTHR_HEADER_TITLE,
                  "mt-1.5 sm:text-xl",
                  compactHeader ? "text-base sm:text-lg" : "text-lg",
                )}
              >
                {dashboardHeader
                  ? dashboardHeader.greeting
                  : compactHeader
                    ? "Household workstation"
                    : "Run the house from one calm place"}
              </h1>
              {dashboardHeader ? (
                <p className={cn(SMARTHR_HEADER_SUBTITLE, "mt-1 max-w-2xl text-sm leading-snug")}>
                  {dashboardHeader.statusLine}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {dashboardHeader ? (
                <div
                  className={cn(
                    "hidden flex-col items-end text-right text-xs font-medium tabular-nums sm:flex",
                    shellDark ? "text-zinc-300" : "text-slate-700",
                  )}
                >
                  <span>{clockTime}</span>
                  <span className={cn(shellDark ? "text-zinc-500" : "text-slate-500")}>
                    {clockDate}
                  </span>
                </div>
              ) : null}
              {dashboardHeader ? (
                <button
                  type="button"
                  aria-label={
                    dashboardHeader.notificationCount > 0
                      ? `Notifications, ${dashboardHeader.notificationCount} unread`
                      : "Notifications, no unread alerts"
                  }
                  onClick={() => {
                    onNavigateHref?.("/#home-notifications");
                    window.requestAnimationFrame(() =>
                      document
                        .getElementById("home-notifications")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    );
                  }}
                  className={cn(
                    "motion-button relative hidden min-h-11 items-center gap-2 px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:inline-flex",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                  )}
                >
                  <Bell className="h-4 w-4" aria-hidden />
                  {dashboardHeader.notificationCount > 0 ? (
                    <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[0.7rem] font-bold text-amber-950">
                      {dashboardHeader.notificationCount > 99
                        ? "99+"
                        : dashboardHeader.notificationCount}
                    </span>
                  ) : (
                    <span className="text-xs font-normal opacity-70">0</span>
                  )}
                </button>
              ) : null}
              {activeMemberLabel ? (
                <span
                  className={cn(
                    "hidden max-w-[14rem] truncate rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm sm:inline-block",
                    shellDark
                      ? "border-white/10 bg-white/[0.06] text-zinc-100"
                      : "border-stone-200/90 bg-stone-100/90 text-stone-800",
                  )}
                  title={activeMemberLabel}
                >
                  {activeMemberLabel}
                </span>
              ) : null}
              {onSwitchUser ? (
                <button
                  type="button"
                  onClick={onSwitchUser}
                  aria-label="Switch user"
                  className={cn(
                    "motion-button min-h-11 px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                  )}
                >
                  Switch user
                </button>
              ) : null}
              {onLockScreen ? (
                <button
                  type="button"
                  onClick={onLockScreen}
                  aria-label="Lock screen"
                  className={cn(
                    "motion-button min-h-11 px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                  )}
                >
                  Lock
                </button>
              ) : null}
              {onOpenLogin && !restrictChildNavigation ? (
                <button
                  type="button"
                  onClick={onOpenLogin}
                  aria-label="Cloud account"
                  className={cn(
                    "motion-button rounded-md border px-3.5 py-2.5 text-sm font-semibold transition min-h-11 sm:min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                    (activeRoute as ShellRoute) === "cloud-login"
                      ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm focus-visible:ring-blue-400/55"
                      : shellDark
                        ? SMARTHR_HEADER_ICON_BTN_DARK
                        : SMARTHR_HEADER_ICON_BTN_LIGHT_PRESS,
                    (activeRoute as ShellRoute) === "cloud-login" ? null : SMARTHR_FOCUS_RING_ACCENT_50,
                  )}
                >
                  Account
                </button>
              ) : null}
              {dataSourceMode === "cloud-preview" ? (
                <div
                  className={cn(
                    "hidden rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] sm:block",
                    shellDark
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
                      : "border-sky-200 bg-sky-50/90 text-sky-900",
                  )}
                >
                  Cloud Preview
                </div>
              ) : null}
              {quickActionsGateOk &&
              !restrictChildNavigation &&
              activeRoute !== "quick-add" ? (
                <button
                  type="button"
                  onClick={() => setQuickActionsOpen(true)}
                  aria-label="Open quick add"
                  className={cn(
                    "motion-button hidden min-h-11 items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold shadow-sm transition sm:inline-flex",
                    shellDark ? SMARTHR_HEADER_PRIMARY_BTN_DARK : SMARTHR_HEADER_PRIMARY_BTN_LIGHT,
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0" aria-hidden />
                  Quick Add
                </button>
              ) : null}
              <div
                className={cn(
                  "hidden rounded-md border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] sm:block",
                  shellDark
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                    : "border-emerald-200 bg-emerald-50/90 text-emerald-900",
                )}
              >
                {appModeLabel}
              </div>
            </div>
          </div>
          <nav
            className={cn(
              "-mx-1 gap-1.5 overflow-x-auto px-1 py-1.5 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:px-1.5",
              SMARTHR_MOBILE_NAV_WELL,
              showMobileChrome ? "flex md:hidden" : "flex",
            )}
            aria-label="Primary"
          >
            {navRoutes.flatMap((route) => {
              const Icon = route.icon;
              const isActive = activeRoute === route.key;
              const label = routeLabels?.[route.key] ?? route.label;

              const navButton = (
                <button
                  key={route.key}
                  type="button"
                  aria-label={`Open ${label}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onRouteChange(route.key)}
                  className={cn(
                    "motion-button inline-flex min-h-12 min-w-max shrink-0 items-center gap-2 rounded-md border px-3.5 py-2.5 text-[0.9rem] font-semibold transition sm:px-4 sm:text-sm",
                    "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    shellDark ? "active:bg-white/10" : "active:bg-slate-100",
                    isActive
                      ? shellDark
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-100 shadow-sm ring-1 ring-amber-400/25"
                        : "border-blue-300 bg-white text-blue-900 shadow-sm ring-1 ring-blue-200/60"
                      : shellDark
                        ? "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              );

              if (kioskNavEnabled && route.key === "dashboard") {
                const kioskActive = activeRoute === "kiosk";
                const kioskBtn = (
                  <button
                    key="kiosk"
                    type="button"
                    aria-label="Open wall display kiosk"
                    aria-current={kioskActive ? "page" : undefined}
                    onClick={() => onRouteChange("kiosk")}
                    className={cn(
                      "motion-button inline-flex min-h-12 min-w-max shrink-0 items-center gap-2 rounded-md border px-3.5 py-2.5 text-[0.9rem] font-semibold transition sm:px-4 sm:text-sm",
                      "active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                      SMARTHR_FOCUS_RING_ACCENT_50,
                      shellDark ? "active:bg-white/10" : "active:bg-slate-100",
                      kioskActive
                        ? shellDark
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-100 shadow-sm ring-1 ring-amber-400/25"
                          : "border-blue-300 bg-white text-blue-900 shadow-sm ring-1 ring-blue-200/60"
                        : shellDark
                          ? "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-zinc-100"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900",
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                    <span className="whitespace-nowrap">Kiosk</span>
                  </button>
                );
                return [navButton, kioskBtn];
              }

              return [navButton];
            })}
          </nav>
        </div>
      </header>
      ) : null}

      {mobileMenuOpen && showMobileChrome ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className={cn(
              "fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-[2px] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              SMARTHR_FOCUS_RING_ACCENT_INSET_55,
            )}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            id="mobile-nav-dialog"
            className={cn(
              "fixed inset-x-0 top-0 z-[61] max-h-[min(100dvh,32rem)] overflow-y-auto rounded-b-2xl shadow-2xl md:hidden",
              shellDark ? SMARTHR_MOBILE_SHEET_SURFACE_DARK : SMARTHR_MOBILE_SHEET_SURFACE_LIGHT,
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div
              className={cn(
                "sticky top-0 flex items-center justify-between gap-3 px-4 py-3",
                shellDark ? SMARTHR_MOBILE_SHEET_HEADER_DARK : SMARTHR_MOBILE_SHEET_HEADER_LIGHT,
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  shellDark ? "text-zinc-100" : "text-slate-900",
                )}
              >
                All modules
              </p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "motion-button inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  SMARTHR_FOCUS_RING_ACCENT_50,
                  shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                )}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {navRoutes.map((route) => {
                const Icon = route.icon;
                const label = routeLabels?.[route.key] ?? route.label;
                const isActive = activeRoute === route.key;
                return (
                  <button
                    key={route.key}
                    type="button"
                    aria-label={`Open ${label}`}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => go(route.key)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-[5px] border px-3.5 py-3 text-left text-[0.95rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                      SMARTHR_FOCUS_RING_ACCENT_45,
                      isActive
                        ? shellDark
                          ? "border-amber-500/35 bg-amber-500/15 text-amber-50"
                          : "border-blue-200 bg-blue-50 text-blue-900"
                        : shellDark
                          ? "border-transparent bg-white/[0.04] text-zinc-200 hover:border-white/12 hover:bg-white/[0.07]"
                          : SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE,
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                    {label}
                  </button>
                );
              })}
              {kioskNavEnabled ? (
                <button
                  type="button"
                  aria-label="Open wall display kiosk"
                  aria-current={(activeRoute as ShellRoute) === "kiosk" ? "page" : undefined}
                  onClick={() => go("kiosk")}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-[5px] border px-3.5 py-3 text-left text-[0.95rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                    SMARTHR_FOCUS_RING_ACCENT_45,
                    (activeRoute as ShellRoute) === "kiosk"
                      ? shellDark
                        ? "border-amber-500/35 bg-amber-500/15 text-amber-50"
                        : "border-blue-200 bg-blue-50 text-blue-900"
                      : shellDark
                        ? "border-transparent bg-white/[0.04] text-zinc-200 hover:border-white/12 hover:bg-white/[0.07]"
                        : SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE,
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  Kiosk
                </button>
              ) : null}
            </nav>
          </div>
        </>
      ) : null}

      {moreOpen && showBottomNav ? (
        <>
          <button
            type="button"
            aria-label="Close more menu"
            className={cn(
              "fixed inset-0 z-[45] bg-slate-900/40 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              SMARTHR_FOCUS_RING_ACCENT_INSET_55,
            )}
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="more-modules-dialog"
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-2xl md:hidden",
              shellDark ? SMARTHR_MOBILE_SHEET_BOTTOM_DARK : SMARTHR_MOBILE_SHEET_BOTTOM_LIGHT,
            )}
            role="dialog"
            aria-modal="true"
            aria-label="More modules"
          >
            <div
              className={cn(
                "sticky top-0 flex items-center justify-between gap-3 px-4 py-3",
                shellDark ? SMARTHR_MOBILE_SHEET_HEADER_DARK : SMARTHR_MOBILE_SHEET_HEADER_LIGHT,
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold",
                  shellDark ? "text-zinc-100" : "text-slate-900",
                )}
              >
                More
              </p>
              <button
                type="button"
                aria-label="Close more menu"
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "motion-button inline-flex min-h-11 min-w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  SMARTHR_FOCUS_RING_ACCENT_50,
                  shellDark ? SMARTHR_HEADER_ICON_BTN_DARK : SMARTHR_HEADER_ICON_BTN_LIGHT,
                )}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {moreKeysEffective
                .filter((key) => routeVisible(key, moduleVisibility))
                .map((key) => {
                  const route = routes.find((r) => r.key === key)!;
                  const Icon = route.icon;
                  const label = routeLabels?.[key] ?? route.label;
                  const isActive = activeRoute === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={`Open ${label}`}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => go(key)}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 rounded-[5px] border px-3.5 py-3 text-left text-[0.95rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                        SMARTHR_FOCUS_RING_ACCENT_45,
                        isActive
                          ? shellDark
                            ? "border-amber-500/35 bg-amber-500/15 text-amber-50"
                            : "border-blue-200 bg-blue-50 text-blue-900"
                          : shellDark
                            ? "border-transparent bg-white/[0.04] text-zinc-200 hover:border-white/12 hover:bg-white/[0.07]"
                            : SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE,
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                      {label}
                    </button>
                  );
                })}
              {kioskNavEnabled ? (
                <button
                  type="button"
                  aria-label="Open wall display kiosk"
                  aria-current={(activeRoute as ShellRoute) === "kiosk" ? "page" : undefined}
                  onClick={() => go("kiosk")}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-[5px] border px-3.5 py-3 text-left text-[0.95rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                    SMARTHR_FOCUS_RING_ACCENT_45,
                    (activeRoute as ShellRoute) === "kiosk"
                      ? shellDark
                        ? "border-amber-500/35 bg-amber-500/15 text-amber-50"
                        : "border-blue-200 bg-blue-50 text-blue-900"
                      : shellDark
                        ? "border-transparent bg-white/[0.04] text-zinc-200 hover:border-white/12 hover:bg-white/[0.07]"
                        : SMARTHR_MOBILE_MENU_ROW_LIGHT_IDLE,
                  )}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  Kiosk
                </button>
              ) : null}
            </nav>
          </div>
        </>
      ) : null}

      <main
        data-fs-density={layoutResolved.density}
        data-fs-width={layoutResolved.width}
        className={cn(
          "w-full overflow-y-auto",
          hideStickyHeader
            ? cn(
                "max-w-none flex-1",
                layoutCompact
                  ? "px-3 py-3 sm:px-5 md:px-5 md:py-3"
                  : "px-4 py-4 sm:px-6 md:px-6 md:py-4",
              )
            : cn(
                "max-w-none px-4 sm:px-5 lg:px-6 xl:px-7",
                layoutCompact ? "py-5 sm:py-6" : "sm:py-7",
              ),
          showBottomNav && !hideStickyHeader
            ? "pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 md:pb-7"
            : !hideStickyHeader
              ? "py-6 md:py-7"
              : "",
          showBottomNav && hideStickyHeader
            ? "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-6"
            : "",
        )}
      >
        <div
          className={cn("motion-page", useAdminuxChrome && "adminux-skin")}
          key={activeRoute}
        >
          {children}
        </div>
      </main>
        </div>
      </div>

      {showBottomNav ? (
        <nav
          className={cn(
            "fixed bottom-0 left-0 right-0 z-40 border-t pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-xl md:hidden",
            shellDark
              ? "border-white/[0.08] bg-[#1a1d24]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
              : "border-slate-200/90 bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]",
          )}
          aria-label="Quick navigation"
        >
          <div
            className={cn(
              "flex w-full max-w-none items-stretch justify-between gap-0.5 px-1",
            )}
          >
            {bottomNavRoutes.map((key) => {
              if (!routeVisible(key, moduleVisibility)) {
                return null;
              }
              const route = routes.find((r) => r.key === key)!;
              const Icon = route.icon;
              const label = routeLabels?.[key] ?? route.label;
              const short =
                key === "dashboard"
                  ? "Home"
                  : key === "shopping"
                    ? "Shop"
                    : key === "pantry"
                      ? "Pantry"
                      : key === "calendar"
                        ? "Calendar"
                        : "App";
              const isActive = activeRoute === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => go(key)}
                  aria-label={`${label}, ${short}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "motion-button flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[0.62rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:text-[0.65rem]",
                    SMARTHR_FOCUS_RING_ACCENT_50,
                    isActive
                      ? shellDark
                        ? "text-amber-300"
                        : "text-[#c2410c]"
                      : shellDark
                        ? "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  <span className="max-w-full truncate">{short}</span>
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              aria-controls="more-modules-dialog"
              aria-label="More modules"
              className={cn(
                "motion-button flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[0.62rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:text-[0.65rem]",
                SMARTHR_FOCUS_RING_ACCENT_50,
                moreMenuActive
                  ? shellDark
                    ? "text-amber-300"
                    : "text-[#c2410c]"
                  : shellDark
                    ? "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <MoreHorizontal className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
              More
            </button>
          </div>
        </nav>
      ) : null}
      {quickActionsGateOk ? (
        <>
          {activeRoute !== "dashboard" && activeRoute !== "quick-add" ? (
            <QuickActionsFab onClick={() => setQuickActionsOpen(true)} />
          ) : null}
          <QuickActionsPanel
            navigateHref={onNavigateHref!}
            open={quickActionsOpen}
            onClose={() => setQuickActionsOpen(false)}
            moduleVisibility={moduleVisibility}
            restrictChildNavigation={restrictChildNavigation}
          />
        </>
      ) : null}
    </div>
    </QuickActionsOpenerContext.Provider>
  );
}

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { AdminSettings, ModuleKey } from "../../data/familyData";
import {
  FeatherIconTile,
  ROUTE_FEATHER_ICONS,
  ROUTE_FEATHER_TONES,
} from "../icons/FeatherIcon";
import { ThemeToggle } from "../theme/ThemeToggle";
import { cn } from "../../lib/utils";
import {
  SMARTHR_SIDEBAR_ACTIVE_ROW,
  SMARTHR_SIDEBAR_ASIDE,
  SMARTHR_SIDEBAR_BRAND_CARD,
  SMARTHR_SIDEBAR_COLLAPSED_RULE,
  SMARTHR_SIDEBAR_DIVIDER,
  SMARTHR_SIDEBAR_GROUP_LABEL,
  SMARTHR_SIDEBAR_LOGO_TILE,
  SMARTHR_SIDEBAR_NAV_ROW_BASE,
  SMARTHR_SIDEBAR_ROW_HOVER,
  SMARTHR_SIDEBAR_ROW_LABEL_IDLE,
  SMARTHR_SIDEBAR_TOGGLE_BTN,
} from "../../lib/smarthrUi";
import {
  routes,
  type RouteKey,
  type ShellRoute,
  isSidebarRoute,
} from "./shellRoutes";

type Props = {
  activeRoute: ShellRoute;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  routeLabels?: Partial<Record<RouteKey, string>>;
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>;
  kioskNavEnabled?: boolean;
  restrictChildNavigation?: boolean;
  onRouteChange: (route: RouteKey) => void;
  locationHref?: string;
  onNavigateHref?: (href: string) => void;
  householdName?: string;
};

const NAV_LABEL: Partial<Record<RouteKey, string>> = {
  dashboard: "Home",
  adminux: "Command Center",
  shopping: "Shopping",
  pantry: "Inventory",
  calendar: "Calendar",
  notifications: "Notifications",
  subscriptions: "Subscriptions",
  tasks: "Cleaning",
  pets: "Pets",
  settings: "Settings",
};

function routeVisible(
  key: RouteKey,
  moduleVisibility?: Partial<AdminSettings["moduleVisibility"]>,
) {
  if (key === "kitchen") {
    return false;
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

/**
 * Sidebar — SmartHR tokens (`src/lib/smarthrUi.ts`); template SCSS/Tailwind reference only.
 */
export function SidebarNav({
  activeRoute,
  collapsed,
  onToggleCollapsed,
  routeLabels,
  moduleVisibility,
  kioskNavEnabled,
  restrictChildNavigation,
  onRouteChange,
  householdName,
}: Props) {
  function navRowClass(isActive: boolean) {
    return cn(
      SMARTHR_SIDEBAR_NAV_ROW_BASE,
      collapsed ? "justify-center px-2 py-2" : "gap-2.5 border border-transparent px-3 py-2",
      collapsed
        ? isActive
          ? SMARTHR_SIDEBAR_ACTIVE_ROW
          : cn(SMARTHR_SIDEBAR_ROW_LABEL_IDLE, SMARTHR_SIDEBAR_ROW_HOVER)
        : isActive
          ? cn("border-transparent", SMARTHR_SIDEBAR_ACTIVE_ROW)
          : cn("border-transparent", SMARTHR_SIDEBAR_ROW_LABEL_IDLE, SMARTHR_SIDEBAR_ROW_HOVER),
    );
  }

  function renderRoute(key: RouteKey) {
    const route = routes.find((r) => r.key === key);
    if (!route || !isSidebarRoute(key) || !routeVisible(key, moduleVisibility)) return null;
    if (restrictChildNavigation && (key === "settings" || key === "subscriptions")) return null;
    const label = NAV_LABEL[key] ?? routeLabels?.[key] ?? route.label;
    const isActive = activeRoute === key;
    const feather = ROUTE_FEATHER_ICONS[key] ?? "grid";
    const tone = ROUTE_FEATHER_TONES[key] ?? "cyan";
    return (
      <button
        key={key}
        type="button"
        title={collapsed ? label : undefined}
        aria-current={isActive ? "page" : undefined}
        onClick={() => onRouteChange(key)}
        className={navRowClass(Boolean(isActive))}
      >
        <FeatherIconTile name={feather} tone={tone} size={16} />
        <span className={cn(!collapsed ? "truncate" : "sr-only")}>{label}</span>
      </button>
    );
  }

  function renderGroup(title: string, keys: RouteKey[], options?: { isFirst?: boolean }) {
    const visible = keys.map((k) => renderRoute(k)).filter(Boolean);
    if (visible.length === 0) return null;
    const showCollapsedDivider = collapsed && !options?.isFirst;
    return (
      <div key={title}>
        {!collapsed ? (
          <p className={SMARTHR_SIDEBAR_GROUP_LABEL}>{title}</p>
        ) : showCollapsedDivider ? (
          <div className={SMARTHR_SIDEBAR_COLLAPSED_RULE} aria-hidden />
        ) : null}
        <div className="flex flex-col gap-1">{visible}</div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        SMARTHR_SIDEBAR_ASIDE,
        "min-h-0 w-full min-w-0 overflow-x-hidden overflow-y-auto",
        collapsed ? "px-2 py-4 pt-4" : "px-3 py-4 pt-5",
      )}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          "adminux-brand-card flex",
          SMARTHR_SIDEBAR_BRAND_CARD,
          collapsed ? "flex-col items-center gap-2 px-2 py-3" : "items-center gap-3 px-3 py-3",
        )}
      >
        <span className={cn(SMARTHR_SIDEBAR_LOGO_TILE, "overflow-visible bg-transparent p-0 shadow-none")} aria-hidden>
          <FeatherIconTile name="home" tone="cyan" size={18} />
        </span>
        {!collapsed ? (
          <div className="min-w-0 flex-1 d-inline-block">
            <p className="company-name">
              <b>Family</b>Hub
            </p>
            <p className="company-tagline">
              {householdName ? householdName : "Household command center"}
            </p>
          </div>
        ) : null}
      </div>

      <div className={cn("mb-3 flex", collapsed ? "justify-center" : "justify-end")}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="sidebar-primary-nav"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={SMARTHR_SIDEBAR_TOGGLE_BTN}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <nav
        id="sidebar-primary-nav"
        className="flex flex-1 flex-col gap-6 pb-4"
        aria-label="Primary sidebar"
      >
        {renderGroup("Home", ["adminux", "dashboard"], { isFirst: true })}
        {renderGroup("Household", ["shopping", "pantry", "calendar"])}
        {renderGroup("Updates", ["notifications", "subscriptions"])}
        {renderGroup("Cleaning", ["tasks", "pets"])}
        {renderGroup("System", ["settings"])}

        {kioskNavEnabled ? (
          <div className={cn(!collapsed && cn(SMARTHR_SIDEBAR_DIVIDER, "pt-4"))}>
            <button
              type="button"
              title={collapsed ? "Wall display" : undefined}
              aria-current={(activeRoute as ShellRoute) === "kiosk" ? "page" : undefined}
              onClick={() => onRouteChange("kiosk")}
              className={navRowClass((activeRoute as ShellRoute) === "kiosk")}
            >
              <FeatherIconTile name="monitor" tone="cyan" size={16} />
              <span className={cn(!collapsed ? "truncate" : "sr-only")}>Wall display</span>
            </button>
          </div>
        ) : null}
      </nav>

      <div className={cn(SMARTHR_SIDEBAR_DIVIDER, "mt-auto pt-4")}>
        <ThemeToggle collapsed={collapsed} variant="sidebar" />
      </div>
    </aside>
  );
}

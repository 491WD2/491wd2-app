import {
  Bell,
  CalendarDays,
  Home,
  Package,
  PawPrint,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { KioskNavId } from "../../lib/kioskShellConfig";
import { ThemeToggle } from "../theme/ThemeToggle";

const NAV_META: Record<
  KioskNavId,
  { label: string; icon: LucideIcon }
> = {
  dashboard: { label: "Home", icon: Home },
  shopping: { label: "Shopping", icon: ShoppingCart },
  pantry: { label: "Inventory", icon: Package },
  calendar: { label: "Calendar", icon: CalendarDays },
  notifications: { label: "Notifications", icon: Bell },
  subscriptions: { label: "Subscriptions", icon: Wallet },
  chores: { label: "Cleaning", icon: Sparkles },
  pets: { label: "Pets", icon: PawPrint },
  settings: { label: "Settings", icon: Settings },
};

const NAV_GROUPS: Array<{ title: string; items: KioskNavId[] }> = [
  { title: "Home", items: ["dashboard"] },
  { title: "Household", items: ["shopping", "pantry", "calendar"] },
  { title: "Updates", items: ["notifications", "subscriptions"] },
  { title: "Cleaning", items: ["chores", "pets"] },
  { title: "System", items: ["settings"] },
];

export type KioskSidebarProps = {
  activeNav: KioskNavId;
  householdName: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onNavigate: (nav: KioskNavId) => void;
  onToggleCollapsed?: () => void;
  onCloseMobile?: () => void;
  hiddenNav?: KioskNavId[];
};

export function KioskSidebar({
  activeNav,
  householdName,
  collapsed = false,
  mobileOpen = false,
  onNavigate,
  onToggleCollapsed,
  onCloseMobile,
  hiddenNav = [],
}: KioskSidebarProps) {
  const hidden = new Set(hiddenNav);

  function renderNavItem(id: KioskNavId) {
    if (hidden.has(id)) {
      return null;
    }
    const meta = NAV_META[id];
    if (!meta) {
      return null;
    }
    const Icon = meta.icon;
    const active = activeNav === id;
    return (
      <button
        key={id}
        type="button"
        title={collapsed ? meta.label : undefined}
        className={cn(
          "fh-kiosk-sidebar__link",
          active && "fh-kiosk-sidebar__link--active",
        )}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          onNavigate(id);
          onCloseMobile?.();
        }}
      >
        <Icon className="fh-kiosk-sidebar__icon" aria-hidden strokeWidth={2.15} />
        <span className="fh-kiosk-sidebar__label">{meta.label}</span>
      </button>
    );
  }

  function renderGroup(group: (typeof NAV_GROUPS)[number], index: number) {
    const items = group.items.map(renderNavItem).filter(Boolean);
    if (items.length === 0) {
      return null;
    }
    return (
      <div key={group.title} className="fh-kiosk-sidebar__group">
        {!collapsed ? (
          <p className="fh-kiosk-sidebar__group-label">{group.title}</p>
        ) : index > 0 ? (
          <span className="fh-kiosk-sidebar__group-rule" aria-hidden />
        ) : null}
        <div className="fh-kiosk-sidebar__group-list">{items}</div>
      </div>
    );
  }

  return (
    <aside
      className={cn("fh-kiosk-sidebar", mobileOpen && "fh-kiosk-sidebar--open")}
      aria-label="Main navigation"
    >
      <div className="fh-kiosk-sidebar__brand">
        <span className="fh-kiosk-sidebar__logo" aria-hidden>
          <Sparkles className="fh-kiosk-sidebar__logo-icon" aria-hidden strokeWidth={2.25} />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="fh-kiosk-sidebar__title">Household</p>
            <p className="fh-kiosk-sidebar__subtitle">Family Hub</p>
            <p className="fh-kiosk-sidebar__household">{householdName}</p>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "fh-kiosk-sidebar__collapse-row",
          collapsed && "fh-kiosk-sidebar__collapse-row--collapsed",
        )}
      >
        {onToggleCollapsed ? (
          <button
            type="button"
            className="fh-kiosk-sidebar__icon-collapse"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>

      <nav className="fh-kiosk-sidebar__nav">
        {NAV_GROUPS.map(renderGroup)}
      </nav>

      <div className="fh-kiosk-sidebar__footer">
        <ThemeToggle collapsed={collapsed} variant="sidebar" />
      </div>
    </aside>
  );
}

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Package,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { KioskNavId } from "../../lib/kioskShellConfig";
import { KIOSK_NAV_ORDER } from "../../lib/kioskShellConfig";

const NAV_META: Record<
  KioskNavId,
  { label: string; icon: LucideIcon; emoji: string }
> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard, emoji: "🏠" },
  pantry: { label: "Pantry", icon: Package, emoji: "🫙" },
  chores: { label: "Chores", icon: Sparkles, emoji: "✨" },
  members: { label: "Members", icon: Users, emoji: "👨‍👩‍👧" },
  calendar: { label: "Calendar", icon: CalendarDays, emoji: "📅" },
  analytics: { label: "Analytics", icon: BarChart3, emoji: "📊" },
  settings: { label: "Settings", icon: Settings, emoji: "⚙️" },
};

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
  const items = KIOSK_NAV_ORDER.filter((id) => !hidden.has(id));

  return (
    <aside
      className={cn("fh-kiosk-sidebar", mobileOpen && "fh-kiosk-sidebar--open")}
      aria-label="Main navigation"
    >
      <div className="fh-kiosk-sidebar__brand">
        <span className="fh-kiosk-sidebar__logo" aria-hidden>
          🏡
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="fh-kiosk-sidebar__title">{householdName}</p>
            <p className="fh-kiosk-sidebar__subtitle">Family Hub</p>
          </div>
        ) : null}
      </div>

      <nav className="fh-kiosk-sidebar__nav">
        {items.map((id) => {
          const meta = NAV_META[id];
          const Icon = meta.icon;
          const active = activeNav === id;
          return (
            <button
              key={id}
              type="button"
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
              <Icon className="fh-kiosk-sidebar__icon" aria-hidden strokeWidth={2.25} />
              <span className="fh-kiosk-sidebar__label">{meta.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="fh-kiosk-sidebar__footer">
        {onToggleCollapsed ? (
          <button
            type="button"
            className="fh-kiosk-sidebar__collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "← Collapse"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}

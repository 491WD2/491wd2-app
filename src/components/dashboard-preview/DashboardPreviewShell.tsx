import {
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";
import type { ReactNode } from "react";
import type { DashboardGo } from "./types";

const RAIL_NAV = [
  { key: "home", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard-preview" },
  { key: "shopping", icon: ShoppingCart, label: "Shopping", href: "/shopping" },
  { key: "pantry", icon: Package, label: "Storage", href: "/pantry" },
  { key: "calendar", icon: CalendarDays, label: "Calendar", href: "/calendar" },
  { key: "messages", icon: MessageCircle, label: "Messages", href: "/messages" },
  { key: "settings", icon: Settings, label: "Settings", href: "/settings" },
] as const;

type DashboardPreviewShellProps = {
  children: ReactNode;
  go: DashboardGo;
};

/**
 * Preview-only presentation shell — replaces AppShell chrome on /dashboard-preview.
 */
export function DashboardPreviewShell({ children, go }: DashboardPreviewShellProps) {
  return (
    <div className="dashboard-preview" data-testid="dashboard-preview-root" data-dp-build="presentation-v3-responsive">
      <div className="dp-app">
        <aside className="dp-rail" aria-label="Preview navigation">
          {RAIL_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                className={["dp-rail__btn", item.key === "home" ? "is-active" : ""].filter(Boolean).join(" ")}
                aria-label={item.label}
                aria-current={item.key === "home" ? "page" : undefined}
                onClick={() => {
                  if (item.key !== "home") {
                    go(item.href);
                  }
                }}
              >
                <Icon className="dp-rail__icon" aria-hidden="true" />
              </button>
            );
          })}
        </aside>

        <div className="dp-workspace">
          <header className="dp-topbar" aria-label="Preview header">
            <div className="dp-topbar__brand">
              <span className="dp-topbar__mark" aria-hidden="true">
                FH
              </span>
              <span className="dp-topbar__title">Household</span>
            </div>
            <div className="dp-topbar__search" aria-hidden="true">
              <span>Search household…</span>
            </div>
            <div className="dp-topbar__actions">
              <button type="button" className="dp-topbar__icon-btn" aria-label="Messages" onClick={() => go("/messages")}>
                <MessageCircle className="dp-topbar__icon" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="dp-topbar__icon-btn"
                aria-label="Notifications"
                onClick={() => go("/notifications")}
              >
                <span className="dp-topbar__badge">3</span>
                <CalendarDays className="dp-topbar__icon" aria-hidden="true" />
              </button>
            </div>
          </header>

          <main className="dp-canvas">{children}</main>
        </div>
      </div>
    </div>
  );
}

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";
import type { ReactNode } from "react";

const RAIL_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BarChart3, label: "Overview", active: false },
  { icon: ShoppingCart, label: "Shopping", active: false },
  { icon: Package, label: "Storage", active: false },
  { icon: CalendarDays, label: "Calendar", active: false },
  { icon: Settings, label: "Settings", active: false },
] as const;

type DashboardPreviewShellProps = {
  children: ReactNode;
  householdName: string;
};

/**
 * Reference-style inner app chrome for the dashboard preview experiment.
 * AppShell remains the only app-level navigation — this is preview-only chrome.
 */
export function DashboardPreviewShell({ children, householdName }: DashboardPreviewShellProps) {
  const householdInitial = householdName.trim().charAt(0).toUpperCase() || "H";

  return (
    <div className="dashboard-preview" data-testid="dashboard-preview-root" data-dp-build="reference-bento-v2">
      <div className="dashboard-preview__bleed">
        <div className="dashboard-preview__app">
          <aside className="dashboard-preview__rail" aria-label="Preview navigation rail">
            {RAIL_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    "dashboard-preview__rail-btn",
                    item.active ? "is-active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={item.label}
                  aria-current={item.active ? "page" : undefined}
                >
                  <Icon className="dashboard-preview__rail-icon" aria-hidden="true" />
                </button>
              );
            })}
          </aside>

          <div className="dashboard-preview__workspace">
            <header className="dashboard-preview__topbar" aria-label="Preview top bar">
              <div className="dashboard-preview__topbar-brand">
                <span className="dashboard-preview__topbar-logo" aria-hidden="true">
                  {householdInitial}
                </span>
                <div className="dashboard-preview__topbar-copy">
                  <p className="dashboard-preview__topbar-eyebrow">Household dashboard</p>
                  <p className="dashboard-preview__topbar-title">{householdName}</p>
                </div>
              </div>

              <div className="dashboard-preview__topbar-center">
                <span className="dashboard-preview__build-pill">Preview build</span>
              </div>

              <div className="dashboard-preview__topbar-actions" aria-label="Preview utilities">
                <span className="dashboard-preview__topbar-badge" aria-label="3 notifications">
                  3
                </span>
                <span className="dashboard-preview__topbar-avatar" aria-hidden="true">
                  {householdInitial}
                </span>
              </div>
            </header>

            <div className="dashboard-preview__canvas">
              <div className="dashboard-preview__viewport">
                <div className="dashboard-preview__frame">
                  <div className="dashboard-preview__content">{children}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

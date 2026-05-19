import {
  Boxes,
  Calendar,
  Home,
  LayoutDashboard,
  Library,
  ListChecks,
  MessageSquare,
  Package,
  ScanLine,
  ShoppingCart,
  StickyNote,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  getAppNavigation,
  isAdminNavEnabled,
  setAdminNavEnabled,
  type AppNavCategoryGroup,
} from "../lib/appNavigation";

const ICON_BY_ID: Record<string, LucideIcon> = {
  home: Home,
  "shopping-cart": ShoppingCart,
  package: Package,
  boxes: Boxes,
  library: Library,
  "scan-line": ScanLine,
  "list-checks": ListChecks,
  calendar: Calendar,
  "message-square": MessageSquare,
  "sticky-note": StickyNote,
  "layout-dashboard": LayoutDashboard,
  users: Users,
  wrench: Wrench,
};

function abbrevLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase();
  }
  return label.slice(0, Math.min(2, label.length)).toUpperCase();
}

function abbrevCategory(categoryId: string, label: string): string {
  const tokens = categoryId.replace(/-/g, " ").trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0]!.charAt(0)}${tokens[1]!.charAt(0)}`.toUpperCase();
  }
  return label.slice(0, Math.min(2, label.length)).toUpperCase();
}

function isMobileNavQuery() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(max-width: 767px)").matches;
}

export type AppSidebarProps = {
  activePageId: string;
  onNavigate: (pageId: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  expandedByCategory: Record<string, boolean>;
  onToggleCategory: (categoryId: string) => void;
  adminNavEnabled?: boolean;
  onAdminNavEnabledChange?: (enabled: boolean) => void;
};

export function AppSidebar({
  activePageId,
  onNavigate,
  collapsed,
  onCollapsedChange,
  expandedByCategory,
  onToggleCategory,
  adminNavEnabled: adminNavEnabledProp,
  onAdminNavEnabledChange,
}: AppSidebarProps) {
  const [adminNavLocal, setAdminNavLocal] = useState(() => isAdminNavEnabled());
  const adminNavEnabled = adminNavEnabledProp ?? adminNavLocal;
  const navGroups = getAppNavigation({ includeAdmin: adminNavEnabled, includeHidden: false });

  const toggleAdminNav = useCallback(() => {
    const next = !adminNavEnabled;
    setAdminNavEnabled(next);
    setAdminNavLocal(next);
    onAdminNavEnabledChange?.(next);
  }, [adminNavEnabled, onAdminNavEnabledChange]);

  useEffect(() => {
    if (adminNavEnabledProp !== undefined) {
      setAdminNavLocal(adminNavEnabledProp);
    }
  }, [adminNavEnabledProp]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const collapsedLayout = collapsed && isDesktop;

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen || typeof document === "undefined") {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) {
        setMobileNavOpen(false);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const selectPage = useCallback(
    (pageId: string) => {
      onNavigate(pageId);
      if (isMobileNavQuery()) {
        setMobileNavOpen(false);
      }
    },
    [onNavigate],
  );

  const renderCategory = (group: AppNavCategoryGroup) => {
    const categoryHasActive = group.pages.some((page) => page.id === activePageId);
    const open = categoryHasActive || expandedByCategory[group.categoryId] !== false;

    return (
      <div key={group.categoryId} className="wd-app-sidebar__group">
        <button
          type="button"
          className="wd-app-sidebar__category-toggle"
          aria-expanded={open}
          aria-label={
            collapsedLayout
              ? `${group.label}. ${open ? "Section expanded, press to collapse" : "Section collapsed, press to expand"}`
              : undefined
          }
          title={group.label}
          onClick={() => onToggleCategory(group.categoryId)}
        >
          <span className="wd-app-sidebar__category-chevron" aria-hidden data-open={open ? "true" : "false"} />
          {!collapsedLayout ? (
            <span className="wd-app-sidebar__category-label wd-app-sidebar__category-label--full">{group.label}</span>
          ) : null}
          <span className="wd-app-sidebar__category-label wd-app-sidebar__category-label--abbr" aria-hidden>
            {abbrevCategory(group.categoryId, group.label)}
          </span>
          <span className="wd-app-sidebar__category-expand" aria-hidden data-open={open ? "true" : "false"} />
        </button>
        {open ? (
          <ul className="wd-app-sidebar__page-list">
            {group.pages.map((page) => {
              const PageIcon = ICON_BY_ID[page.icon] ?? Home;
              return (
                <li key={page.id}>
                  <button
                    type="button"
                    className={
                      activePageId === page.id
                        ? "wd-app-sidebar__page-link wd-app-sidebar__page-link--active"
                        : "wd-app-sidebar__page-link"
                    }
                    onClick={() => selectPage(page.id)}
                    title={page.label}
                    aria-current={activePageId === page.id ? "page" : undefined}
                  >
                    <span className="wd-app-sidebar__page-chevron" aria-hidden />
                    <PageIcon aria-hidden className="wd-app-sidebar__page-icon" strokeWidth={1.6} />
                    {!collapsedLayout ? (
                      <span className="wd-app-sidebar__page-label">{page.label}</span>
                    ) : (
                      <span className="wd-visually-hidden">{page.label}</span>
                    )}
                    <span className="wd-app-sidebar__page-abbr" aria-hidden>
                      {abbrevLabel(page.label)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  };

  const sidebar = (
    <aside
      id="wd-app-sidebar"
      className={[
        mobileNavOpen ? "wd-app-sidebar wd-app-sidebar--drawer-open" : "wd-app-sidebar",
        collapsedLayout ? "wd-app-sidebar--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="My Build navigation"
    >
      <div className="wd-app-sidebar__inner">
        <div className="wd-app-sidebar__brand-card" title={collapsedLayout ? "My Build" : undefined}>
          <span className="wd-app-sidebar__brand-mark" aria-hidden>
            MB
          </span>
          <div className="wd-app-sidebar__brand-copy">
            <p className="wd-app-sidebar__brand-title">
              <span className="wd-app-sidebar__brand-title-full">My Build</span>
              <span className="wd-app-sidebar__brand-title-abbr" aria-hidden>
                MB
              </span>
            </p>
            {!collapsedLayout ? (
              <p className="wd-app-sidebar__brand-sub">Household kiosk — shopping, pantry, chores</p>
            ) : null}
          </div>
        </div>
        <nav className="wd-app-sidebar__nav" aria-label="My Build sections">
          {navGroups.map(renderCategory)}
        </nav>
        <div className="wd-app-sidebar__toolbar">
          <button
            type="button"
            className={
              adminNavEnabled
                ? "wd-app-sidebar__admin-toggle wd-app-sidebar__admin-toggle--on"
                : "wd-app-sidebar__admin-toggle"
            }
            aria-pressed={adminNavEnabled}
            title={adminNavEnabled ? "Hide admin tools in sidebar" : "Show admin tools (Release Checklist, Backend Console)"}
            onClick={toggleAdminNav}
          >
            {!collapsedLayout ? (
              <span className="wd-app-sidebar__admin-toggle-text">
                {adminNavEnabled ? "Hide admin tools" : "Show admin tools"}
              </span>
            ) : (
              <span className="wd-visually-hidden">
                {adminNavEnabled ? "Hide admin tools" : "Show admin tools"}
              </span>
            )}
            <span className="wd-app-sidebar__admin-toggle-abbr" aria-hidden>
              {adminNavEnabled ? "Adm−" : "Adm+"}
            </span>
          </button>
          <button
            type="button"
            className="wd-app-sidebar__collapse-btn"
            aria-label={collapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <span className="wd-app-sidebar__collapse-icon" aria-hidden>
              {collapsed ? "»" : "«"}
            </span>
            {!collapsedLayout ? <span className="wd-app-sidebar__collapse-text">Collapse</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="wd-app-sidebar-shell">
      <div className="wd-app-sidebar__mobile-bar">
        <button
          type="button"
          className="wd-app-sidebar__menu-btn"
          aria-expanded={mobileNavOpen}
          aria-controls="wd-app-sidebar"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          Menu
        </button>
        <span className="wd-app-sidebar__mobile-title">My Build</span>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="wd-app-sidebar__scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div
        className={[
          "wd-app-sidebar__layout",
          collapsedLayout ? "wd-app-sidebar__layout--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {sidebar}
      </div>
    </div>
  );
}

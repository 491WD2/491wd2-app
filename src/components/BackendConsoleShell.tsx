import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import type { BackendConsoleNavGroup } from "../lib/backendConsoleNav";

function abbrevNavItemLabel(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]!.charAt(0)}${words[1]!.charAt(0)}`.toUpperCase();
  }
  return label.slice(0, Math.min(2, label.length)).toUpperCase();
}

function abbrevGroupLabel(groupId: string, label: string): string {
  const tokens = groupId.replace(/-/g, " ").trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return `${tokens[0]!.charAt(0)}${tokens[1]!.charAt(0)}`.toUpperCase();
  }
  return label.slice(0, Math.min(2, label.length)).toUpperCase();
}

export type BackendConsoleShellProps = {
  navGroups: BackendConsoleNavGroup[];
  activeView: string;
  onSelectView: (id: string) => void;
  expandedByGroup: Record<string, boolean>;
  onToggleGroup: (groupId: string) => void;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
  main: ReactNode;
  sectionTitle: string;
  sectionDescription: string;
  breadcrumb: string;
};

function isMobileNavQuery() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(max-width: 767px)").matches;
}

export default function BackendConsoleShell({
  navGroups,
  activeView,
  onSelectView,
  expandedByGroup,
  onToggleGroup,
  sidebarCollapsed,
  onSidebarCollapsedChange,
  main,
  sectionTitle,
  sectionDescription,
  breadcrumb,
}: BackendConsoleShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const collapsedLayout = sidebarCollapsed && isDesktop;

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

  const selectView = useCallback(
    (id: string) => {
      onSelectView(id);
      if (isMobileNavQuery()) {
        setMobileNavOpen(false);
      }
    },
    [onSelectView],
  );

  const sidebar = (
    <aside
      id="wd-bc-sidebar"
      className={[
        mobileNavOpen ? "wd-bc__sidebar wd-bc__sidebar--drawer-open" : "wd-bc__sidebar",
        collapsedLayout ? "wd-bc__sidebar--collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Backend console navigation"
    >
      <div className="wd-bc__sidebar-inner">
        <div className="wd-bc__sidebar-toolbar">
          <button
            type="button"
            className="wd-bc__sidebar-collapse-btn"
            aria-label={sidebarCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar — show full labels" : "Collapse sidebar — more room for content"}
            onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
          >
            <span className="wd-bc__sidebar-collapse-icon" aria-hidden>
              {sidebarCollapsed ? "»" : "«"}
            </span>
            <span className="wd-bc__sidebar-collapse-text">{sidebarCollapsed ? "Expand" : "Collapse"}</span>
          </button>
        </div>
        <div className="wd-bc__brand" title={collapsedLayout ? "Backend Console" : undefined}>
          <p className="wd-bc__brand-title">
            <span className="wd-bc__brand-title-full">Backend Console</span>
            <span className="wd-bc__brand-title-abbr" aria-hidden>
              BC
            </span>
          </p>
          <p className="wd-bc__brand-sub">Internal builders, previews, and documentation</p>
        </div>
        <nav className="wd-bc__nav" aria-label="Sections">
          {navGroups.map((group) => {
            const groupHasActive = group.items.some((item) => item.id === activeView);
            const open = groupHasActive || expandedByGroup[group.groupId] !== false;
            return (
              <div key={group.groupId} className="wd-bc__group">
                <button
                  type="button"
                  className="wd-bc__group-toggle"
                  aria-expanded={open}
                  aria-label={
                    collapsedLayout
                      ? `${group.label}. ${open ? "Section expanded, press to collapse" : "Section collapsed, press to expand"}`
                      : undefined
                  }
                  title={group.label}
                  onClick={() => onToggleGroup(group.groupId)}
                >
                  <span className="wd-bc__group-chevron" aria-hidden>
                    {open ? "▼" : "▶"}
                  </span>
                  {!collapsedLayout ? (
                    <span className="wd-bc__group-label wd-bc__group-label--full">{group.label}</span>
                  ) : null}
                  <span className="wd-bc__group-label wd-bc__group-label--abbr" aria-hidden>
                    {abbrevGroupLabel(group.groupId, group.label)}
                  </span>
                </button>
                {open ? (
                  <ul className="wd-bc__list">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={[
                            activeView === item.id ? "wd-bc__link wd-bc__link--active" : "wd-bc__link",
                            item.sidebarHint ? "wd-bc__link--with-hint" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          onClick={() => selectView(item.id)}
                          title={`${item.label} — ${item.description}`}
                          aria-label={collapsedLayout ? undefined : `${item.label}. ${item.description}`}
                        >
                          {collapsedLayout ? (
                            <span className="wd-visually-hidden">
                              {item.label}. {item.description}
                            </span>
                          ) : (
                            <span className="wd-bc__link-stack">
                              <span className="wd-bc__link-text wd-bc__link-text--full">{item.label}</span>
                              {item.sidebarHint ? (
                                <span className="wd-bc__link-hint">{item.sidebarHint}</span>
                              ) : null}
                            </span>
                          )}
                          <span className="wd-bc__link-text wd-bc__link-text--abbr" aria-hidden>
                            {abbrevNavItemLabel(item.label)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  return (
    <div className="wd-bc">
      <div className="wd-bc__mobile-bar">
        <button
          type="button"
          className="wd-bc__menu-btn"
          aria-expanded={mobileNavOpen}
          aria-controls="wd-bc-sidebar"
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          Menu
        </button>
        <span className="wd-bc__mobile-title">{sectionTitle}</span>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="wd-bc__scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div
        className={["wd-bc__layout", collapsedLayout ? "wd-bc__layout--sidebar-collapsed" : ""].filter(Boolean).join(" ")}
      >
        {sidebar}
        <div className="wd-bc__main-wrap">
          <header className="wd-bc__header">
            <p className="wd-bc__crumb" title={breadcrumb}>
              {breadcrumb}
            </p>
            <h1 className="wd-bc__header-title">{sectionTitle}</h1>
            <p className="wd-bc__header-desc">{sectionDescription}</p>
          </header>
          <main className="wd-bc__main">{main}</main>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { getAppDisplayName } from "../../lib/customization";
import type { FamilyData } from "../../data/familyData";
import "../../styles/dashboard-preview/dashboard-preview.css";

export type DashboardPreviewProps = {
  data: FamilyData;
  householdName?: string;
};

function PreviewPlaceholder({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <section
      className={["dashboard-preview__card", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <header className="dashboard-preview__card-head">
        <h2 className="dashboard-preview__card-title">{title}</h2>
        {subtitle ? <p className="dashboard-preview__card-subtitle">{subtitle}</p> : null}
      </header>
      <div className="dashboard-preview__card-body">
        {children ?? <p className="dashboard-preview__placeholder">Widget placeholder</p>}
      </div>
    </section>
  );
}

/**
 * Isolated dashboard preview shell — layout + labeled placeholders only.
 * Business logic and live widgets are wired in a later pass.
 */
export function DashboardPreview({ data, householdName }: DashboardPreviewProps) {
  const name = householdName ?? getAppDisplayName(data.adminSettings) ?? "Household";

  return (
    <div className="dashboard-preview" data-testid="dashboard-preview-root">
      <div className="dashboard-preview__viewport">
        <div className="dashboard-preview__shell">
          <div className="dashboard-preview__body">
            <aside className="dashboard-preview__sidebar" aria-label="Preview navigation shell">
              <p className="dashboard-preview__shell-label">Preview shell</p>
              <ul className="dashboard-preview__nav-list">
                <li className="dashboard-preview__nav-item is-active">Home</li>
                <li className="dashboard-preview__nav-item">Calendar</li>
                <li className="dashboard-preview__nav-item">Shopping</li>
                <li className="dashboard-preview__nav-item">Messages</li>
              </ul>
            </aside>

            <div className="dashboard-preview__main">
              <header className="dashboard-preview__topbar" aria-label="Preview top bar">
                <span className="dashboard-preview__topbar-title">{name}</span>
                <span className="dashboard-preview__topbar-meta">Dashboard preview</span>
              </header>

              <div className="dashboard-preview__content">
                <section className="dashboard-preview__status" aria-label="Compact status header">
                  <div>
                    <p className="dashboard-preview__status-kicker">Good afternoon</p>
                    <p className="dashboard-preview__status-time" aria-hidden>
                      3:42 PM
                    </p>
                    <p className="dashboard-preview__status-date">Placeholder date</p>
                  </div>
                  <div>
                    <p className="dashboard-preview__status-label">Household status</p>
                    <p className="dashboard-preview__placeholder-inline">Kitchen · Chores · Shopping</p>
                  </div>
                  <div>
                    <p className="dashboard-preview__status-label">Weather</p>
                    <p className="dashboard-preview__placeholder-inline">Placeholder</p>
                  </div>
                </section>

                <div className="dashboard-preview__top-strip">
                  <PreviewPlaceholder
                    className="dashboard-preview__cell-family"
                    title="Family"
                    subtitle="Member access"
                  />
                  <PreviewPlaceholder
                    className="dashboard-preview__cell-quick"
                    title="Quick Add"
                    subtitle="Actions"
                  />
                  <PreviewPlaceholder
                    className="dashboard-preview__cell-today"
                    title="Today snapshot"
                    subtitle="Chores · Events · Shopping · Messages"
                  >
                    <div className="dashboard-preview__snapshot">
                      {["Chores", "Events", "Shopping", "Messages"].map((label) => (
                        <div key={label} className="dashboard-preview__snapshot-tile">
                          <span className="dashboard-preview__snapshot-num">—</span>
                          <span className="dashboard-preview__snapshot-label">{label}</span>
                        </div>
                      ))}
                    </div>
                  </PreviewPlaceholder>
                </div>

                <div className="dashboard-preview__grid">
                  <div className="dashboard-preview__utility">
                    <PreviewPlaceholder title="Kitchen duty & today's chores" />
                    <PreviewPlaceholder title="Shopping list" />
                    <PreviewPlaceholder title="Pantry & storage alerts" />
                  </div>

                  <div className="dashboard-preview__information">
                    <div className="dashboard-preview__calendar-row">
                      <PreviewPlaceholder title="Calendar" subtitle="Mini month" />
                      <PreviewPlaceholder title="Upcoming" subtitle="Event list" />
                    </div>
                    <PreviewPlaceholder title="Messages & notifications" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { FamilyData } from "../../data/familyData";
import "../../styles/dashboard-preview/dashboard-preview.css";
import { DashboardPreviewShell } from "./DashboardPreviewShell";

export type DashboardPreviewProps = {
  data: FamilyData;
};

const PLACEHOLDER_COPY = "Preview data will connect in the next implementation pass.";

const QUICK_ADD_ACTIONS = [
  { label: "Add shopping", hint: "Grocery item" },
  { label: "Add chore", hint: "Task for today" },
  { label: "Add event", hint: "Calendar" },
  { label: "Add note", hint: "Family message" },
] as const;

const SNAPSHOT_METRICS = [
  { key: "chores", label: "Chores", className: "dashboard-preview__metric--chores" },
  { key: "events", label: "Events", className: "dashboard-preview__metric--events" },
  { key: "shopping", label: "Shopping", className: "dashboard-preview__metric--shopping" },
  { key: "messages", label: "Messages", className: "dashboard-preview__metric--messages" },
] as const;

function PreviewCard({
  title,
  subtitle,
  compact,
  children,
}: {
  title: string;
  subtitle?: string;
  compact?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className={[
        "dashboard-preview__card",
        compact ? "dashboard-preview__card--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={title}
    >
      <header className="dashboard-preview__card-head">
        <h2 className="dashboard-preview__section-title">{title}</h2>
        {subtitle ? <p className="dashboard-preview__meta">{subtitle}</p> : null}
      </header>
      <div className="dashboard-preview__card-body">
        {children ?? <p className="dashboard-preview__placeholder">{PLACEHOLDER_COPY}</p>}
      </div>
    </section>
  );
}

/**
 * Dashboard preview — Pass 1: shell, layout, and labeled placeholders only.
 */
export function DashboardPreview({ data: _data }: DashboardPreviewProps) {
  void _data;

  return (
    <DashboardPreviewShell>
      <section className="dashboard-preview__status" aria-label="Household status header">
        <div className="dashboard-preview__status-col">
          <p className="dashboard-preview__status-label">Greeting</p>
          <p className="dashboard-preview__status-time" aria-hidden>
            —
          </p>
          <p className="dashboard-preview__status-sub">Date</p>
        </div>
        <div className="dashboard-preview__status-col">
          <p className="dashboard-preview__status-label">Household status</p>
          <div className="dashboard-preview__status-chips">
            <span className="dashboard-preview__chip dashboard-preview__chip--kitchen">
              Kitchen
            </span>
            <span className="dashboard-preview__chip dashboard-preview__chip--calendar">
              Chores
            </span>
            <span className="dashboard-preview__chip dashboard-preview__chip--shopping">
              Shopping
            </span>
          </div>
        </div>
        <div className="dashboard-preview__status-col">
          <p className="dashboard-preview__status-label">Weather</p>
          <p className="dashboard-preview__status-sub">Local forecast unavailable</p>
        </div>
      </section>

      <PreviewCard title="Family members" subtitle="Member access">
        <div className="dashboard-preview__family">
          <p className="dashboard-preview__placeholder">{PLACEHOLDER_COPY}</p>
        </div>
      </PreviewCard>

      <div className="dashboard-preview__tools-row">
        <PreviewCard title="Quick Add" subtitle="Household actions">
          <div className="dashboard-preview__quick-actions">
            {QUICK_ADD_ACTIONS.map((action) => (
              <div key={action.label} className="dashboard-preview__action-tile">
                {action.label}
                <small>{action.hint}</small>
              </div>
            ))}
          </div>
        </PreviewCard>

        <PreviewCard title="Today snapshot" subtitle="Chores · Events · Shopping · Messages">
          <div className="dashboard-preview__snapshot">
            {SNAPSHOT_METRICS.map((metric) => (
              <div
                key={metric.key}
                className={["dashboard-preview__metric", metric.className].join(" ")}
              >
                <span className="dashboard-preview__metric-count" aria-hidden>
                  —
                </span>
                <span className="dashboard-preview__metric-label">{metric.label}</span>
              </div>
            ))}
          </div>
        </PreviewCard>
      </div>

      <div className="dashboard-preview__household-grid">
        <div className="dashboard-preview__utility">
          <PreviewCard title="Kitchen duty & today's chores" />
          <PreviewCard title="Shopping list" />
          <PreviewCard title="Pantry & storage alerts" />
        </div>

        <div className="dashboard-preview__information">
          <div className="dashboard-preview__calendar-row">
            <PreviewCard title="Calendar" subtitle="Mini month" />
            <PreviewCard title="Upcoming" subtitle="Event list" compact />
          </div>
          <PreviewCard title="Messages & notifications" />
        </div>
      </div>
    </DashboardPreviewShell>
  );
}

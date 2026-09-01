import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";

type TodaySnapshotProps = {
  model: DashboardPreviewModel;
};

const METRICS = [
  { key: "chores", label: "Chores", field: "openChoreCount" as const, className: "dashboard-preview__metric--chores" },
  { key: "events", label: "Events", field: "todayEventCount" as const, className: "dashboard-preview__metric--events" },
  { key: "shopping", label: "Shopping", field: "shoppingCount" as const, className: "dashboard-preview__metric--shopping" },
  { key: "messages", label: "Messages", field: "messagesAndAlertsCount" as const, className: "dashboard-preview__metric--messages" },
];

export function TodaySnapshot({ model }: TodaySnapshotProps) {
  return (
    <section className="dashboard-preview__card dashboard-preview__card--snapshot" aria-label="Today snapshot">
      <header className="dashboard-preview__card-head dashboard-preview__card-head--compact">
        <h2 className="dashboard-preview__section-title">Today</h2>
        <p className="dashboard-preview__meta">At-a-glance counts</p>
      </header>

      <div className="dashboard-preview__snapshot" role="list" aria-label="Today's household counts">
        {METRICS.map((metric) => {
          const value = model[metric.field];
          return (
            <div
              key={metric.key}
              role="listitem"
              className={["dashboard-preview__metric", metric.className].join(" ")}
              aria-label={`${metric.label}: ${value}`}
            >
              <span className="dashboard-preview__metric-count" aria-hidden="true">
                {value}
              </span>
              <span className="dashboard-preview__metric-label">{metric.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

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
    <div className="dashboard-preview__metrics-inline" aria-label="Today snapshot">
      <p className="dashboard-preview__metrics-inline-label">Today</p>
      <div className="dashboard-preview__snapshot dashboard-preview__snapshot--inline" role="list">
        {METRICS.map((metric) => {
          const value = model[metric.field];
          return (
            <div
              key={metric.key}
              role="listitem"
              className={[
                "dashboard-preview__metric",
                "dashboard-preview__metric--inline",
                metric.className,
              ].join(" ")}
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
    </div>
  );
}

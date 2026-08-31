import type { DashboardPreviewModel } from "../../lib/dashboard-preview/useDashboardPreviewModel";

type TodaySnapshotProps = {
  model: DashboardPreviewModel;
};

export function TodaySnapshot({ model }: TodaySnapshotProps) {
  const { openChoreCount, todayEventCount, shoppingCount, messagesAndAlertsCount } = model;

  const metrics = [
    { key: "chores", label: "Chores", value: openChoreCount, className: "dashboard-preview__metric--chores" },
    { key: "events", label: "Events", value: todayEventCount, className: "dashboard-preview__metric--events" },
    { key: "shopping", label: "Shopping", value: shoppingCount, className: "dashboard-preview__metric--shopping" },
    {
      key: "messages",
      label: "Messages",
      value: messagesAndAlertsCount,
      className: "dashboard-preview__metric--messages",
    },
  ];

  return (
    <section className="dashboard-preview__card" aria-label="Today snapshot">
      <header className="dashboard-preview__card-head">
        <h2 className="dashboard-preview__section-title">Today</h2>
        <p className="dashboard-preview__meta">Household snapshot</p>
      </header>

      <div className="dashboard-preview__snapshot">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className={["dashboard-preview__metric", metric.className].join(" ")}
          >
            <span className="dashboard-preview__metric-count">{metric.value}</span>
            <span className="dashboard-preview__metric-label">{metric.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

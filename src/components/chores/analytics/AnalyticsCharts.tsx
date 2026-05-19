import type { AnalyticsBarDatum, AnalyticsPieSlice, AnalyticsTimelineBucket } from "../../../types/choreAnalyticsAgent";

export function AnalyticsBarChart({
  data,
  title,
  emptyLabel = "No data",
}: {
  data: AnalyticsBarDatum[];
  title: string;
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="wd-chore-agent__chart wd-chore-agent__chart--empty">
        <h4>{title}</h4>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="wd-chore-agent__chart">
      <h4>{title}</h4>
      <ul className="wd-chore-agent__bar-chart" role="list">
        {data.map((row) => (
          <li key={row.label}>
            <div className="wd-chore-agent__bar-row">
              <span className="wd-chore-agent__bar-label">{row.label}</span>
              <span className="wd-chore-agent__bar-value">{row.value}</span>
            </div>
            <div className="wd-chore-agent__bar-track" role="presentation">
              <div
                className="wd-chore-agent__bar-fill"
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AnalyticsPieChart({
  slices,
  title,
}: {
  slices: AnalyticsPieSlice[];
  title: string;
}) {
  let cursor = 0;
  const stops = slices
    .map((s) => {
      const start = cursor;
      cursor += s.percent;
      return `${s.color} ${start}% ${cursor}%`;
    })
    .join(", ");

  const conic =
    slices.length > 0 && slices[0]!.label !== "No chore actions"
      ? `conic-gradient(${stops})`
      : "conic-gradient(#e8e4f0 0% 100%)";

  return (
    <div className="wd-chore-agent__chart">
      <h4>{title}</h4>
      <div className="wd-chore-agent__pie-wrap">
        <div
          className="wd-chore-agent__pie"
          style={{ background: conic }}
          role="img"
          aria-label={slices.map((s) => `${s.label} ${s.percent}%`).join(", ")}
        />
        <ul className="wd-chore-agent__pie-legend">
          {slices.map((s) => (
            <li key={s.label}>
              <span className="wd-chore-agent__pie-swatch" style={{ background: s.color }} />
              <span>
                {s.label} <strong>{s.percent}%</strong> ({s.value})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AnalyticsGestureTimeline({
  buckets,
  title,
}: {
  buckets: AnalyticsTimelineBucket[];
  title: string;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.total));

  return (
    <div className="wd-chore-agent__chart wd-chore-agent__chart--wide">
      <h4>{title}</h4>
      <p className="wd-chore-agent__chart-hint">Drag-and-drop vs swipe by hour of day</p>
      <div className="wd-chore-agent__timeline" role="img" aria-label="Gesture activity by hour">
        {buckets.map((b) => (
          <div
            key={b.hour}
            className="wd-chore-agent__timeline-col"
            title={`${b.label}: ${b.dragDrop} drops, ${b.swipe} swipes`}
          >
            <div className="wd-chore-agent__timeline-bars">
              <div
                className="wd-chore-agent__timeline-bar wd-chore-agent__timeline-bar--drag"
                style={{ height: `${Math.round((b.dragDrop / max) * 100)}%` }}
              />
              <div
                className="wd-chore-agent__timeline-bar wd-chore-agent__timeline-bar--swipe"
                style={{ height: `${Math.round((b.swipe / max) * 100)}%` }}
              />
            </div>
            <span className="wd-chore-agent__timeline-label">{b.hour % 6 === 0 ? b.label : ""}</span>
          </div>
        ))}
      </div>
      <div className="wd-chore-agent__timeline-legend">
        <span>
          <i className="wd-chore-agent__swatch wd-chore-agent__swatch--drag" /> Drag / drop
        </span>
        <span>
          <i className="wd-chore-agent__swatch wd-chore-agent__swatch--swipe" /> Swipe
        </span>
      </div>
    </div>
  );
}

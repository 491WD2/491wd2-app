import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type {
  AnalyticsAgentFilters,
  ChoreAnalyticsAgentProps,
} from "../../types/choreAnalyticsAgent";
import { HOUSEHOLD_MEMBERS } from "../../types/chore";
import {
  buildAnalyticsAgentReport,
  listPageSurfaces,
} from "../../lib/choreAnalyticsAgentData";
import { generateAnalyticsAiBriefing } from "../../lib/choreAnalyticsAgentInsights";
import {
  isAnalyticsAiInsightsEnabled,
  setAnalyticsAiInsightsEnabled,
} from "../../lib/choreAnalyticsAgentPrefs";
import {
  clearKioskAnalytics,
  exportKioskAnalyticsJson,
  getKioskAnalyticsEvents,
  isKioskAnalyticsEnabled,
  setKioskAnalyticsEnabled,
  subscribeKioskAnalytics,
} from "../../lib/kioskAnalytics";
import { choreCn, choreCtaClass } from "../../lib/choreUi";
import {
  AnalyticsBarChart,
  AnalyticsGestureTimeline,
  AnalyticsPieChart,
} from "./analytics/AnalyticsCharts";

const DEFAULT_FILTERS: AnalyticsAgentFilters = {
  pageSurface: "all",
  member: "all",
  choreStatus: "all",
  dateRange: "all",
};

function useAnalyticsEvents() {
  return useSyncExternalStore(
    subscribeKioskAnalytics,
    () => getKioskAnalyticsEvents(),
    () => [],
  );
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChoreAnalyticsAgent({
  onClose,
  defaultAiInsights,
}: ChoreAnalyticsAgentProps) {
  const allEvents = useAnalyticsEvents();
  const [filters, setFilters] = useState<AnalyticsAgentFilters>(DEFAULT_FILTERS);
  const [aiInsights, setAiInsights] = useState(
    () => defaultAiInsights ?? isAnalyticsAiInsightsEnabled(),
  );
  const [trackingEnabled, setTrackingEnabled] = useState(isKioskAnalyticsEnabled);

  const pageOptions = useMemo(() => listPageSurfaces(allEvents), [allEvents]);

  const report = useMemo(
    () => buildAnalyticsAgentReport(allEvents, filters),
    [allEvents, filters],
  );

  const briefing = useMemo(
    () => (aiInsights ? generateAnalyticsAiBriefing(report) : null),
    [aiInsights, report],
  );

  const handleExport = useCallback(() => {
    const blob = new Blob([exportKioskAnalyticsJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `491wd-kiosk-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear all stored analytics events on this device?")) {
      clearKioskAnalytics();
    }
  }, []);

  const updateFilter = <K extends keyof AnalyticsAgentFilters>(
    key: K,
    value: AnalyticsAgentFilters[K],
  ) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  return (
    <section className="wd-chore-agent" aria-label="Chore analytics agent">
      <header className="wd-chore-agent__head">
        <div>
          <h2>Analytics agent</h2>
          <p>
            Visual summaries and AI insights from kiosk events — reads{" "}
            <code className="wd-chore-agent__code">localStorage</code> only.
          </p>
        </div>
        <div className="wd-chore-agent__head-actions">
          <label className="wd-chore-agent__toggle">
            <input
              type="checkbox"
              checked={trackingEnabled}
              aria-label="Enable kiosk analytics tracking"
              onChange={(e) => {
                setTrackingEnabled(e.target.checked);
                setKioskAnalyticsEnabled(e.target.checked);
              }}
            />
            Tracking on
          </label>
          <label className="wd-chore-agent__toggle">
            <input
              type="checkbox"
              checked={aiInsights}
              aria-label="Show AI insights briefing"
              onChange={(e) => {
                setAiInsights(e.target.checked);
                setAnalyticsAiInsightsEnabled(e.target.checked);
              }}
            />
            AI insights
          </label>
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), "wd-chore-agent__btn")}
            onClick={handleExport}
            aria-label="Export analytics as JSON"
          >
            Export JSON
          </button>
          <button
            type="button"
            className={choreCn(choreCtaClass("ghost"), "wd-chore-agent__btn")}
            onClick={handleClear}
            aria-label="Clear all stored analytics events"
          >
            Clear
          </button>
          {onClose ? (
            <button
              type="button"
              className={choreCn(choreCtaClass("ghost"), "wd-chore-agent__btn")}
              onClick={onClose}
              aria-label="Close analytics agent"
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="wd-chore-agent__filters">
        <label className="wd-chore-agent__field">
          <span>Page</span>
          <select
            value={filters.pageSurface}
            onChange={(e) => updateFilter("pageSurface", e.target.value)}
            aria-label="Filter by page"
          >
            <option value="all">All pages</option>
            {pageOptions.map((p) => (
              <option key={p} value={p}>
                {p.replace(/^chores:/, "")}
              </option>
            ))}
          </select>
        </label>
        <label className="wd-chore-agent__field">
          <span>Member</span>
          <select
            value={filters.member}
            onChange={(e) =>
              updateFilter("member", e.target.value as AnalyticsAgentFilters["member"])
            }
            aria-label="Filter by member"
          >
            <option value="all">All members</option>
            {HOUSEHOLD_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="wd-chore-agent__field">
          <span>Chore action</span>
          <select
            value={filters.choreStatus}
            onChange={(e) =>
              updateFilter("choreStatus", e.target.value as AnalyticsAgentFilters["choreStatus"])
            }
            aria-label="Filter by chore status"
          >
            <option value="all">All</option>
            <option value="complete">Completions</option>
            <option value="skip">Skips</option>
            <option value="assign">Assignments</option>
          </select>
        </label>
        <label className="wd-chore-agent__field">
          <span>Date range</span>
          <select
            value={filters.dateRange}
            onChange={(e) =>
              updateFilter("dateRange", e.target.value as AnalyticsAgentFilters["dateRange"])
            }
            aria-label="Filter by date range"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
      </div>

      <div className="wd-chore-agent__kpis">
        <article>
          <span>Events</span>
          <strong>{report.totalFiltered}</strong>
        </article>
        <article>
          <span>Completions</span>
          <strong>{report.completions}</strong>
        </article>
        <article>
          <span>Assignments</span>
          <strong>{report.assignments}</strong>
        </article>
        <article>
          <span>Skips</span>
          <strong>{report.skips}</strong>
        </article>
        <article>
          <span>Drag drops</span>
          <strong>{report.dragDrops}</strong>
        </article>
        <article>
          <span>Swipes</span>
          <strong>{report.swipes}</strong>
        </article>
      </div>

      {aiInsights && briefing ? (
        <aside className="wd-chore-agent__ai" aria-labelledby="agent-ai-title">
          <h3 id="agent-ai-title">AI assistant</h3>
          <p className="wd-chore-agent__ai-summary">{briefing.summary}</p>
          {briefing.insights.length > 0 ? (
            <ul className="wd-chore-agent__ai-list">
              {briefing.insights.map((item) => (
                <li
                  key={item.id}
                  className={choreCn(
                    "wd-chore-agent__ai-item",
                    `wd-chore-agent__ai-item--${item.tone}`,
                  )}
                >
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      ) : null}

      <div className="wd-chore-agent__charts">
        <AnalyticsBarChart data={report.pageViewBars} title="Page views" />
        <AnalyticsPieChart slices={report.choreOutcomeSlices} title="Chore outcomes" />
        <AnalyticsGestureTimeline
          buckets={report.gestureTimeline}
          title="Gesture timeline"
        />
      </div>

      {report.memberActivity.length > 0 ? (
        <div className="wd-chore-agent__members">
          <h3>Member activity (assign / skip)</h3>
          <ul>
            {report.memberActivity.map((m) => (
              <li key={m.member}>
                <span>{m.member}</span>
                <span>{m.assignments} assigned</span>
                {m.skips > 0 ? <span>{m.skips} skipped</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <details className="wd-chore-agent__log">
        <summary>Event log ({Math.min(report.events.length, 100)} shown)</summary>
        <div className="wd-chore-agent__log-scroll">
          <table className="wd-chore-agent__table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Category</th>
                <th scope="col">Action</th>
                <th scope="col">Surface</th>
              </tr>
            </thead>
            <tbody>
              {[...report.events].reverse().slice(0, 100).map((event) => (
                <tr key={event.id}>
                  <td>{formatTime(event.ts)}</td>
                  <td>{event.category}</td>
                  <td>{event.action}</td>
                  <td>{event.surface ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

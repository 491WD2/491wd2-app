/**
 * Client-side AI briefing for analytics agent — natural language from aggregates.
 */
import type { AnalyticsAgentReport, AnalyticsAiBriefing, AnalyticsAiInsight } from "../types/choreAnalyticsAgent";

function formatHour(h: number): string {
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour12}:00 ${ampm}`;
}

function viaLabel(report: AnalyticsAgentReport): string {
  const events = report.events;
  const viaCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.action !== "chore_complete") {
      continue;
    }
    const via = String(e.metadata?.via ?? "unknown");
    viaCounts[via] = (viaCounts[via] ?? 0) + 1;
  }
  const top = Object.entries(viaCounts).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]})` : "n/a";
}

export function generateAnalyticsAiBriefing(report: AnalyticsAgentReport): AnalyticsAiBriefing {
  const insights: AnalyticsAiInsight[] = [];
  const { totalFiltered, completions, skips, assignments, swipes, dragDrops } = report;

  if (totalFiltered === 0) {
    return {
      summary:
        "No events match the current filters. Use the kiosk or widen the date range to collect analytics.",
      insights: [],
      generatedAt: Date.now(),
    };
  }

  const choreTotal = completions + skips + assignments;
  const completionPct =
    choreTotal > 0 ? Math.round((completions / choreTotal) * 100) : 0;

  let summary = `Analyzed ${totalFiltered} events`;
  if (report.filters.dateRange !== "all") {
    summary += ` (${report.filters.dateRange})`;
  }
  summary += `. ${completions} completions, ${assignments} assignments, ${skips} skips recorded.`;

  if (report.topPage) {
    insights.push({
      id: "top-page",
      tone: "neutral",
      title: "Most visited screen",
      body: `${report.topPage} had the highest page-view activity in this period.`,
    });
  }

  if (report.peakActivityHour != null) {
    insights.push({
      id: "peak-hour",
      tone: "neutral",
      title: "Peak activity time",
      body: `Busiest hour: ${formatHour(report.peakActivityHour)} — schedule reminders or kiosk placement around this window.`,
    });
  }

  if (choreTotal > 0) {
    insights.push({
      id: "completion-mix",
      tone: completionPct >= 60 ? "positive" : completionPct < 40 ? "warning" : "neutral",
      title: "Chore outcome mix",
      body: `Completions are ${completionPct}% of chore actions (complete / skip / assign). Primary completion input: ${viaLabel(report)}.`,
    });
  }

  if (report.memberActivity.length > 0) {
    const top = report.memberActivity[0]!;
    insights.push({
      id: "top-member",
      tone: "positive",
      title: "Top assignee activity",
      body: `${top.member} leads with ${top.assignments} assignment(s) in the filtered set — strong household coordination.`,
    });
  }

  const skipped = report.memberActivity.filter((m) => m.skips > 0);
  if (skipped.length > 0) {
    const names = skipped.map((m) => `${m.member} (${m.skips})`).join(", ");
    insights.push({
      id: "skips",
      tone: "warning",
      title: "Skipped chores",
      body: `Skip events logged for: ${names}. Review reasons in the edit modal or task list.`,
    });
  }

  if (dragDrops + swipes > 0) {
    const prefer =
      dragDrops > swipes * 1.5
        ? "drag-and-drop on the assign board"
        : swipes > dragDrops * 1.5
          ? "swipe-to-complete on task lists"
          : "a mix of drag-and-drop and swipe gestures";
    insights.push({
      id: "gestures",
      tone: "neutral",
      title: "Touch interaction style",
      body: `${dragDrops} drag-drops and ${swipes} swipes — users favor ${prefer}.`,
    });
  }

  const gesturePeak = [...report.gestureTimeline].sort((a, b) => b.total - a.total)[0];
  if (gesturePeak && gesturePeak.total >= 2) {
    insights.push({
      id: "gesture-peak",
      tone: "neutral",
      title: "Gesture timeline",
      body: `Most drag/swipe activity around ${gesturePeak.label} (${gesturePeak.total} gestures).`,
    });
  }

  if (completions >= 5 && skips === 0) {
    insights.push({
      id: "strong-week",
      tone: "positive",
      title: "Strong completion streak",
      body: "No skips in the filtered window — household is staying on top of assigned chores.",
    });
  }

  return {
    summary,
    insights: insights.slice(0, 6),
    generatedAt: Date.now(),
  };
}

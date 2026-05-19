# Chore Analytics Agent

Interactive admin dashboard for kiosk usage — reads events from `kioskAnalytics` (`491wd-kiosk-analytics-events` in `localStorage`).

## Component

`ChoreAnalyticsAgent.tsx` — lazy-loaded on `/chores` when analytics panel is open (`?analytics=1` or **Analytics** toggle).

### Props (`ChoreAnalyticsAgentProps`)

| Prop | Type | Description |
| --- | --- | --- |
| `onClose` | `() => void` | Optional — hides analytics panel |
| `defaultAiInsights` | `boolean` | Initial **AI insights** toggle (default from `491wd-chore-analytics-ai-insights`) |

## Data sources

| Source | Key / module |
| --- | --- |
| Event queue | `getKioskAnalyticsEvents()` — `src/lib/kioskAnalytics.ts` |
| Aggregates | `buildAnalyticsAgentReport()` — `src/lib/choreAnalyticsAgentData.ts` |
| AI copy | `generateAnalyticsAiBriefing()` — `src/lib/choreAnalyticsAgentInsights.ts` |
| AI toggle pref | `491wd-chore-analytics-ai-insights` |

Events are **anonymized** (task keys truncated, household member names on assign/complete when available).

## Visualizations

| Chart | Component | Data |
| --- | --- | --- |
| Bar | `AnalyticsBarChart` | Page view counts by surface |
| Pie | `AnalyticsPieChart` | Complete / skip / assign % |
| Timeline | `AnalyticsGestureTimeline` | Drag-drop vs swipe by hour (0–23) |

Pure CSS/SVG — no chart library dependency.

## Filters

| Filter | Values |
| --- | --- |
| Page | `all` or `chores:*` surfaces |
| Member | `all` or household roster |
| Chore action | all, complete, skip, assign |
| Date range | all, today, 7d, 30d |

Filters apply before charts and AI briefing recompute.

## AI assistant mode

When **AI insights** is on, `generateAnalyticsAiBriefing()` produces:

- One-line **summary** (event counts, date context)
- Up to **6 insight cards** with tone: `positive` | `neutral` | `warning`

### AI behavior (heuristic, no API)

| Insight | Rule |
| --- | --- |
| Top page | Highest `page_view` surface in filtered set |
| Peak hour | Hour with most events |
| Chore mix | Completion % of complete+skip+assign; dominant `via` on completes |
| Top member | Most assignments in member activity |
| Skips | Members with `chore_skip` events |
| Gestures | Compare drag-drop vs swipe counts; peak gesture hour |

Regenerates when filters or underlying events change (`useMemo`).

## Admin actions

- **Export JSON** — `exportKioskAnalyticsJson()` (full queue + summary)
- **Clear** — `clearKioskAnalytics()` with confirm
- **Tracking on** — `setKioskAnalyticsEnabled()`

## Integration

```tsx
// ChoresPage.tsx
<ChoreAnalyticsAgent onClose={toggleAnalytics} defaultAiInsights={analyticsAiDefault} />
```

URL: `http://localhost:4173/chores?analytics=1` opens panel with AI insights default on.

## Types

`src/types/choreAnalyticsAgent.ts` — filters, report, pie/bar/timeline datums, AI briefing.

## UX impact

- Does not block chore store or real-time sync
- Subscribes via `subscribeKioskAnalytics` for live updates when new events are tracked
- Responsive grid: 1-col mobile → 2-col charts on tablet+

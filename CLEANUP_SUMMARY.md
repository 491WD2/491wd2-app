# Family Hub / Kiosk Dashboard — Cleanup Summary

**Date:** 2026-05-13  
**Project:** `familysite-491` (`/Users/stellaroskens/491WD2`)  
**Goal:** Remove unused and duplicate code while preserving chores, member pages, weekly/recurring tasks, analytics, and dashboard UX.

---

## Verification

| Check | Result |
| --- | --- |
| `npm run test` | 6 suites, 9 tests — pass |
| `npm run typecheck` | pass (`tsc -b`) |
| `npm run build` | pass (Vite + PWA) |
| Invalid `<motion` JSX | none in `src/` |

---

## What stayed (core surfaces)

| Feature | Primary entry |
| --- | --- |
| Kiosk home | `HomeDashboardPage` |
| My Build command center | `DashboardPage` + hub cards (`DashboardHubPantryCard`, `Shopping`, `Week`, `Activity`) |
| Member dashboard | `MemberDashboardPage` |
| Chore kiosk | `ChoresPage` → lazy tab views, `ChoreAnalyticsAgent`, predictive schedule |
| Weekly / family tasks | `TasksPage`, `FamilyData.tasks` |
| Recurring / room cleaning | `CleaningRouter` (`/cleaning/recurring`, `/cleaning/rooms`) |
| Analytics | `src/lib/kioskAnalytics.ts`, `ChoreAnalyticsAgent` (not legacy console) |

**Intentionally not deleted** (routed or product-adjacent): `DocsPage`, `PlannerPage`, `ProjectsPage` via `HiddenModulePage`; full `ui-builder.css`; `checkpoints/`, `backups/`, `public/template-workbench/`; `src/lib/smarthrUi.ts` (class helpers still used across the app).

---

## Removed files

### Chore module (superseded / unused barrel)

| Path | Reason |
| --- | --- |
| `src/components/chores/ChoreAnalyticsConsole.tsx` | Replaced by lazy `ChoreAnalyticsAgent` |
| `src/components/chores/index.ts` | Unused barrel; imports are direct paths |
| `src/components/chores/types.ts` | Duplicate of `src/types/chore*.ts` |

### Legacy dashboard (not mounted in `CurrentBuild`)

| Path | Reason |
| --- | --- |
| `src/components/dashboard/DashboardPriorityLoop.tsx` | Superseded by hub-card `DashboardPage` |
| `src/components/dashboard/DailyWorkflowStrip.tsx` | Only used by removed loop |
| `src/components/dashboard/HomeFamilyHub.tsx` | Unreferenced |
| `src/components/dashboard/DashboardHomeGlanceStrip.tsx` | Unreferenced |
| `src/components/dashboard/SetupChecklistPanel.tsx` | Unreferenced |
| `src/components/dashboard/HomeKitchenSchedule.tsx` | Unreferenced |
| `src/components/dashboard/HomeMiniCalendar.tsx` | Unreferenced |

### Hub cards (orphaned)

| Path | Reason |
| --- | --- |
| `src/components/dashboard/hub/DashboardHubQuickStatsCard.tsx` | No imports |
| `src/components/dashboard/hub/DashboardHubScheduleCard.tsx` | No imports |

### Layout / hooks only used by removed loop

| Path | Reason |
| --- | --- |
| `src/components/layout/PageSectionShell.tsx` | Only consumed by `DashboardPriorityLoop` |
| `src/hooks/useDashboardSectionLayout.ts` | Only consumed by removed loop |

### Libs, data, services (dead code)

| Path | Reason |
| --- | --- |
| `src/services/mockApi.ts` | No runtime imports |
| `src/data/mockData.ts` | No runtime imports |
| `src/data/referenceSystems.ts` | No runtime imports |
| `src/lib/recipeSuggestions.ts` | Only used by removed dashboard pieces |
| `src/lib/familyDataAdapter.ts` | Unused adapter layer |
| `src/lib/familyDataMigrations.ts` | Superseded by `src/data/familyMigrations.ts` |
| `src/lib/presence.ts` | Unused |
| `src/lib/pageLayoutPlan.ts` | Unused |
| `src/lib/memberAccentStyles.ts` | Unused |

### Orphan UI / pages / types

| Path | Reason |
| --- | --- |
| `src/components/CustomPantrySections.tsx` | Unreferenced |
| `src/components/FamilyMemberSwitcher.tsx` | Unreferenced |
| `src/pages/FamilyKioskLoginPage.tsx` | Unreferenced route |
| `src/pages/shopping/ShoppingViews.tsx` | Unreferenced |
| `src/components/workspace/NotionPage.tsx` | Unreferenced |
| `src/types/household.ts` | Unreferenced type file |

### Unused hooks

| Path | Reason |
| --- | --- |
| `src/hooks/useIsDarkMode.ts` | Unreferenced |
| `src/hooks/useLocalStorage.ts` | Unreferenced (app uses domain-specific storage) |

### Removed component trees (kept `smarthrUi.ts`)

| Path | Reason |
| --- | --- |
| `src/components/smart/**` | No imports from app routes |
| `src/components/smarthr/**` | Replaced by inline patterns + `smarthrUi.ts` tokens |

---

## Refactors and doc updates

- **`src/components/chores/README.md`** — Removed references to deleted barrel, `types.ts`, and `ChoreAnalyticsConsole`; documents lazy `ChoreAnalyticsAgent`.
- **Import graph** — All chore imports remain explicit file paths (e.g. `ChoresPage` → `ChoreNavTabs`, not `components/chores` index).
- **No changes** to `CurrentBuild.tsx`, `package.json` (beyond prior test script), `server/`, `src/styles.css`, `src/main.tsx` per project constraints.

---

## Architecture notes (unchanged)

Three task stores coexist by design:

1. **`FamilyData.tasks`** — `familysite-491:first-family-build` (Tasks page, dashboard cards).
2. **Chore kiosk** — `491wd-chore-*` keys in `choreData.ts`.
3. **Cleaning router** — `cleaningData.ts` for recurring / room templates.

Analytics for the chore kiosk: `kioskAnalytics.ts` + hourly rollup; do not remove when extending features.

---

## Stale references (documentation only)

These files still mention removed paths for historical / workbench context. They do **not** affect the build:

- `src/lib/layoutChoicesContent.ts` — catalog entries for `PageSectionShell`, `smarthr/*` (marked `visibleInApp: false` where applicable).
- `src/lib/templateWorkbenchContent.ts`, `docs/layout-choices.md`, `docs/template-workbench-inventory.md`
- `docs/handoff/COMPONENT_REFERENCE.md` — may still list `ChoreAnalyticsConsole` (use `ChoreAnalyticsAgent` instead).

Update those catalogs when editing Settings “layout choices” or handoff docs.

---

## Performance / quality retained from prior work

- Lazy-loaded chore tab views, analytics agent, edit modal, onboarding, drag board.
- Vite `manualChunks` for `chore-analytics` and `chore-data`.
- `React.memo` on hot chore UI paths; rAF-batched swipe (`useChoreSwipe`).
- Analytics event cap + rollup; offline chore snapshot banner.
- Jest coverage for analytics, a11y IDs, nav keyboard, predictive schedule.

---

## Optional follow-ups (not done in this pass)

- Prune or archive `checkpoints/`, `backups/`, and `public/template-workbench/` (knip reports ~155 unused non-`src` paths).
- Sync handoff `COMPONENT_REFERENCE.md` with `ChoreAnalyticsAgent`.
- CSS subsetting of `ui-builder.css` (risky for kiosk; only with visual regression checks).
- Route `PlannerPage` explicitly if it should differ from `CalendarPage`.

---

## How to re-verify locally

```bash
npm run test
npm run build
```

Core routes to smoke-test: `/`, `/chores`, My Build dashboard, member scope URLs, `/cleaning/recurring`, `/cleaning/rooms`.

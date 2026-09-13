# Live routes (current product)

This is the current developer-facing route map. Prefer it over `PROJECT_AUDIT.md`, the May passoff, and any `/chores` kiosk docs.

Router: custom History API in `src/CurrentBuild.tsx` (`src/lib/appPath.ts`). There is no React Router.

## Canonical Home

**`/adminux`** is the live Home surface (`AdminUxHouseholdDashboard` → `NotionHomeWorkspace`).

Intentional Home aliases (replace to `/adminux`):

- `/`
- `/home`
- `/dashboard`
- `/login`
- `/kiosk-login`

## Live household modules

| Path | Surface |
| --- | --- |
| `/adminux` | Home |
| `/messages` | Messages |
| `/calendar` | Calendar |
| `/planner` | Same calendar (label only) |
| `/shopping` | Shopping |
| `/pantry` | Pantry & inventory |
| `/tasks` | **Live Cleaning / Kitchen / chores hub** |
| `/kitchen` | Kitchen checklist |
| `/kitchen-schedule` | Kitchen schedule |
| `/emergency` | Emergency planning |
| `/pets` | Pets |
| `/subscriptions` | Subscriptions |
| `/projects` `/photos` `/routines` | Sidebar placeholders |
| `/family` `/family/:id` | Roster / member home |
| `/settings` | Settings |
| `/notifications` | Notifications |
| `/quick-add` | Quick add |
| `/kiosk` | Utility kiosk page |
| `/cloud-login` | Optional Supabase login |

## Dead paths (compatibility only)

These pages are **not mounted**. Do not document them as live product.

| Path | What happens now |
| --- | --- |
| `/chores` | Compatibility redirect → `/tasks` |
| `/cleaning` and `/cleaning/*` | Compatibility redirect → `/tasks` |
| `/product-library` | 404 (unmounted). Do not restore in this pass. |

`ChoresPage`, `CleaningRouter`, and `ProductLibraryPage` still exist on disk. That is **not** evidence they are live.

## Visible navigation

Sidebar Primary: Home, Messages, Calendar, Shopping, Pantry, Cleaning / Kitchen (`/tasks`), Emergency.

Mobile bottom: Home, Messages, Calendar, Shopping. More: Pantry, Cleaning / Kitchen, Pets, Settings.

Kiosk chrome “chores” control also opens `/tasks`.

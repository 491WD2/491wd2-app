# Page layout plan (491WD household app)

**Mode:** planning / inventory only — no implementation in this document.  
**Structured data:** `src/lib/pageLayoutPlan.ts` exports `PAGE_LAYOUT_PLAN` for future UI Builder, Page Composer, or docs automation.

**Sources of truth inspected:** `src/CurrentBuild.tsx`, `src/components/layout/AppShell.tsx`, `src/pages/*`, `src/lib/templateWorkbenchContent.ts`, `src/lib/sneatWorkbenchCatalog.json`, `public/template-workbench/`, `src/lib/pageComposerStorage.ts`, `src/lib/pageLayoutSectionCatalog.ts`, `docs/`.

---

## 1. Current app surfaces (My Build + auth)

| Route / surface | Page component | Primary data |
|------------------|----------------|--------------|
| `/` | `DashboardPage` | Greeting, notifications count, shopping count, module tiles, optional home sections |
| `/quick-add` | `QuickAddPage` | Fast capture flows (search-param driven) |
| `/kiosk` | `KioskPage` | Large-touch home / kiosk navigation |
| `/family` | `FamilyMembersPage` | Household member roster |
| `/family/:memberId` | `MemberDashboardPage` | Per-member summary + actions |
| `/tasks` | `TasksPage` | Chores / tasks |
| `/kitchen` | `KitchenChecklistPage` | Kitchen assignment checklist |
| `/kitchen-schedule` | `KitchenSchedulePage` | Schedule / rotation style data |
| `/pets` | `PetsPage` | Pet records |
| `/pantry` | `PantryPage` → inventory module | Inventory items, tabs, workflows |
| `/shopping` | `ShoppingPage` | Shopping list lines |
| `/calendar`, `/planner` | `CalendarPage` | Calendar / planner (planner aliases to calendar) |
| `/docs` | `HiddenModulePage` (“Notes”) | Placeholder — not a real notes DB yet |
| `/messages` | `MessagesPage` | Household messages |
| `/notifications` | `NotificationsPage` | Notification inbox |
| `/subscriptions` | `SubscriptionsPage` | Subscription tracking |
| `/settings` | `SettingsPage` | Admin + module settings |
| `/cloud-login` | `LoginPage` | Supabase / cloud auth |
| `/projects` | `HiddenModulePage` | Unused shortcut |
| unknown | `NotFoundPage` | — |

**Integrated app (outside `CurrentBuild` routes):** `App.tsx` toggles **My Build** vs **Backend Console**; backend hosts UI Builder, Template Workbench, Saved UI Preview, Help Center, Layout Choices, Reference Pages, Demo Lab, etc.

**Repo-only pages (not lazy-mounted in `CurrentBuild.tsx` today):** e.g. `ProjectsPage.tsx`, `PlannerPage.tsx`, `DocsPage.tsx` — treat as future or alternate routes if wired later.

---

## 2. Builder / internal tools (not household nav)

| Surface | Role | Persistence / notes |
|--------|------|----------------------|
| UI Builder | Compose sections from palette; export / apply | `491wd-ui-builder-layout` (local) |
| Saved UI Preview | Read-only saved builder layout | Same storage as builder apply |
| Page Composer | Map sections → page id | `491wd-page-composer-layouts`; page ids: `pantry` |
| Template Workbench | Sneat iframes + Pantry HTML + React SmartHR references | `public/template-workbench/` |
| Backend Console shell | Sidebar + main chrome | localStorage active view keys |

---

## 3. Layout style glossary (recommended vocabulary)

| Style | Best for |
|-------|----------|
| **quick-action-cards** | Home, kiosk — scannable tiles + status |
| **table-list** | Pantry primary list, subscriptions, dense schedules |
| **card-grid** | Family roster, pets, optional Pantry “gallery” view |
| **kanban-task-board** | Tasks / chores by state or assignee |
| **notes-grid** | Future household notes (`/docs`) |
| **calendar-layout** | Calendar + some schedule views |
| **message-feed** | Messages threads |
| **detail-page** | Single member profile |
| **form-page** | Settings, Quick Add, auth |
| **alert-status-page** | Notifications, errors |
| **list-group-checklist** | Shopping, kitchen checklist |
| **dashboard-analytics** | Optional heavy dashboard variant (Sneat analytics) |
| **embedded-tool-shell** | UI Builder, Workbench, Composer, backend chrome |

---

## 4. Per-area recommendations (summary)

Each row matches an entry in `PAGE_LAYOUT_PLAN` in `src/lib/pageLayoutPlan.ts` (single source of truth for ids, `sourceInspiration`, `components`, `priority`, and `notes`).

| Page / data area | Recommended layout | Primary Template Workbench inspiration | Why it fits | Build priority |
|-----------------|---------------------|----------------------------------------|-------------|----------------|
| Home / Dashboard | quick-action-cards | `tw-react-smarthr-dashboard-grid`, `tw-react-smarthr-card`, `sneat-dashboard-analytics` | Tiles + status match glanceable home | **P0** |
| Pantry | table-list (+ optional card-grid) | `tw-pantry-main`, `tw-react-smarthr-table`, `sneat-tables-basic` | Row-heavy inventory | **P0** |
| Shopping | list-group-checklist | `sneat-ui-list-groups`, `tw-react-smarthr-fields` | Checkbox-first list | **P0** |
| Settings | form-page | `tw-react-smarthr-tabs`, `tw-pantry-settings`, `sneat-form-layout-vertical` | Long grouped settings | **P0** |
| Tasks | kanban-task-board | `tw-react-smarthr-card`, `sneat-ui-progress` | State columns | **P1** |
| Calendar | calendar-layout | `sneat-dashboard-analytics`, `tw-react-smarthr-page-shell` | Time + widget stack | **P1** |
| Messages | message-feed | `tw-react-smarthr-card`, `sneat-ui-list-groups` | Chronological short content | **P1** |
| Notifications | alert-status-page | `sneat-ui-alerts`, `sneat-ui-toasts` | Severity + dismiss | **P1** |
| Kitchen checklist | list-group-checklist | `sneat-ui-list-groups` | Done / not done | **P2** |
| Kitchen schedule | calendar-layout / table-list | `sneat-tables-basic`, `tw-react-smarthr-table` | Rotations as rows | **P2** |
| Family roster | card-grid | `tw-react-smarthr-card`, `sneat-cards-basic` | Few entities, identity-forward | **P2** |
| Member dashboard | detail-page | `tw-react-smarthr-page-header`, `tw-react-smarthr-tabs` | Profile hub | **P2** |
| Quick Add | form-page | `tw-react-smarthr-fields`, `sneat-form-layout-horizontal` | Rapid fields | **P2** |
| Pets | card-grid | `tw-react-smarthr-card`, `sneat-cards-basic` | Low-count entities | **P3** |
| Subscriptions | table-list | `sneat-tables-basic`, `tw-react-smarthr-table` | Sortable renewals | **P3** |
| Kiosk | quick-action-cards | `tw-react-smarthr-dashboard-grid`, `sneat-ui-buttons` | Large targets | **P3** |
| Notes (`/docs`) | notes-grid (future) | `tw-react-smarthr-card`, `sneat-cards-basic` | Snippet tiles | **P3** |
| Cloud login | form-page | `sneat-auth-login-basic` | Auth card | **P2** |
| Not found | alert-status-page | `sneat-pages-misc-error`, `tw-react-smarthr-empty-state` | Recovery UX | **P3** |
| UI Builder / Workbench / Composer / Saved preview / Backend shell | embedded-tool-shell | `tw-react-smarthr-page-shell`, `sneat-layout-fluid`, catalog items | Admin density | **internal** |

**UI Builder components:** use palette definition ids from `uiBuilderLayout` (e.g. `card`, `table`, `tabs`, `alerts`, `buttons`, `list-groups`, `form-field` / `inputs`, `grid`, `typography`, `modals`, `badges`) — each `PAGE_LAYOUT_PLAN` entry lists a shortlist in `components[]`.

---

## 5. Template Workbench mapping tips

1. **Start from data shape:** many rows → `sneat-tables-basic` or `tw-react-smarthr-table`; few entities → `tw-react-smarthr-card` / `sneat-cards-basic`.  
2. **Pantry-specific HTML:** `tw-pantry-main`, `tw-pantry-settings`, `tw-pantry-backup` under `public/template-workbench/html/`.  
3. **Bootstrap parity:** Sneat ids in `sneatWorkbenchCatalog.json` (`sneat-ui-*`, `sneat-forms-*`, `sneat-layout-*`, `sneat-auth-*`, …).  
4. **React-native patterns:** `tw-react-smarthr-*` entries (no iframe) document in-repo SmartHR-styled building blocks.

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-05-11 | Initial plan from repo inventory; `PAGE_LAYOUT_PLAN` added in `src/lib/pageLayoutPlan.ts`. |

# FamilyHub / 491WD2 — ChatGPT Attention Brief

**Use this file as the source of truth** for what the current build is, what is already done, and what still needs to be attended to.

**Project:** FamilyHub / FamilySite 491 (`familysite-491`)  
**Repo:** `491wd2/491wd2-app`  
**Branch this brief describes:** `main` at `6af167d` (plus later Home/AdminUX polish already on that history)  
**Brief written:** 2026-09-08  
**Audience:** ChatGPT or any coding agent picking up this household app

If another document disagrees with this file, **trust this file**. Older audits and passoffs are stale.

---

## 0. How to work in this repo

### What this app is

A **local-first household kiosk web app** for a Surface Pro (portrait intended, still must work on desktop and phone). Family members share one Home “wake / start page,” then open Shopping, Pantry, Calendar, Cleaning/Kitchen, Messages, and other household tools.

It is **already a real React app**. Do not re-scaffold. Do not start a new Vite project. Do not replace the stack.

### Stack (do not change unless asked)

| Layer | Reality |
|---|---|
| UI | React + TypeScript + Vite + Tailwind CSS v4 |
| Routing | Custom `history.pushState` in `src/CurrentBuild.tsx` — **no React Router** |
| State | One `FamilyData` object via `useFamilyData` |
| Persistence | Browser **localStorage** key `familysite-491:first-family-build` |
| Deploy | Netlify (`netlify.toml` SPA fallback to `index.html`) |
| Optional extras | PWA, Supabase client (not required), Netlify functions for AI + Instacart |

### Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run test
npm run typecheck
npm run build        # typecheck + vite build
npm run start        # preview dist on :4173
```

### Hard constraints (never violate)

1. **Do not change** the storage key `familysite-491:first-family-build`.
2. **Do not reset or wipe localStorage** as a “fix.”
3. **Do not remove `FamilyData` fields.** Additive only.
4. **Do not remove modules or routes** unless the user explicitly asks. You may hide empty sidebar items behind visibility flags if that is the task.
5. **Do not add meal planning, recipes, nutrition, calories, macros, or diet features.**
6. **Do not add Bootstrap.** Do not restyle Home with a new template skin unless asked.
7. **Do not put secrets in the client.** No `VITE_` OpenAI / Instacart keys. Use Netlify env + functions.
8. **Do not force-push or rewrite git history.**
9. **Do not treat `references/` as app code.** It is third-party reference only.
10. Home visual layout is **locked** (August 2026 start-page pass). Refine **behavior** on Home, not another full visual rewrite.

### Preferred work style

- Continue the existing app. Small, reviewable changes.
- Match existing files and tokens (`src/styles/familyhub-theme.css`, `fh-pro-*` classes) instead of inventing a new design system.
- After UI changes, verify the route and any other pages that share the same state.
- `npm run typecheck` (and `npm run test` if you touch tested modules) before calling work done.

---

## 1. Product intent (what “done” looks like)

Primary device: **Surface Pro, vertical kiosk**. Home is a shared **wake / command / start page**. Anyone can see today and add a shopping item **without a PIN**.

### Intended Home (wake page) — not fully built

Top → bottom, daily household only:

1. Time, date, weather (placeholder OK if no API)
2. **Large member buttons** in this display order: Hershel, Lorraine, Stella, Nox, Jeremiah, Selena → each opens `/family/:memberId`
3. Prominent Quick Add (shopping / pantry)
4. Shopping preview
5. Pantry / storage alerts
6. Kitchen duty + chores due today
7. Messages / notifications preview
8. Upcoming events

**Do not put on Home:** Pets, Subscriptions, Projects, Photos, Planner, Routines (sidebar only).

**PIN policy:** No PIN on wake → member → Home. PIN fields may stay in data. Lock screen is optional/advanced later.

### Intended sidebar

**PRIMARY:** Home, Messages, Calendar, Shopping, Pantry, Cleaning / Kitchen, Emergency  
**HOUSEHOLD TOOLS:** Pets, Subscriptions, Projects, Photos, Planner, Routines  
**SYSTEM:** Settings

Mobile bottom nav already matches: Home · Messages · Calendar · Shopping, plus More.

---

## 2. Live routes (this is the real app)

Router: `src/CurrentBuild.tsx`  
Nav keys: `src/components/layout/shellRoutes.ts`  
Shell: `src/components/layout/AppShell.tsx`, `SidebarNav.tsx`

`/`, `/home`, `/dashboard`, `/login`, `/kiosk-login` all **rewrite to `/adminux`**.

| Path | Component | Status |
|---|---|---|
| `/` · `/adminux` | `AdminUxHouseholdDashboard` → `NotionHomeWorkspace` | Live Home. Visual polish done. Wake **behavior** incomplete. |
| `/messages` | `MessagesPage` | Live CRUD. Not shown on Home. |
| `/calendar` · `/planner` | **Same** `CalendarPage` | Live. Planner is only a label. |
| `/shopping` | `ShoppingPage` | Live, deep. |
| `/pantry` | `PantryPage` (+ inventory tabs) | Live, deepest module. Visually mixed. |
| `/tasks` | `TasksPage` | **The live chores / cleaning / kitchen hub.** |
| `/kitchen` | `KitchenChecklistPage` | Live deep link. |
| `/kitchen-schedule` | `KitchenSchedulePage` | Live deep link. |
| `/emergency` | `EmergencyPlanningPage` | Live UI. **Does not save.** |
| `/pets` | `PetsPage` | Live household tool. |
| `/subscriptions` | `SubscriptionsPage` | Thin wrapper around billing settings. |
| `/projects` · `/photos` · `/routines` | `HouseholdSidebarToolPage` | **Placeholder pages only.** |
| `/family` | `FamilyMembersPage` | Live roster. |
| `/family/:memberId` | `MemberDashboardPage` | Live member home. Home no longer links here. |
| `/settings` | `SettingsPage` (~3865 lines) | Live god page. Backup/roster work. Many placeholders. |
| `/notifications` | `NotificationsPage` | Live utility. |
| `/quick-add` | `QuickAddPage` | Live utility. |
| `/kiosk` | `KioskPage` | Utility. Do not promote as Home. |
| `/cloud-login` | `LoginPage` | Optional Supabase auth. No route guards. |
| `/docs` | `HiddenModulePage` “Notes” | Dead end. |

### Routes that 404 today but code/docs still mention them

| Path | Code that still exists | Problem |
|---|---|---|
| `/chores` | `src/pages/ChoresPage.tsx` + chore tab views | **Not mounted** in `CurrentBuild`. Cleaning views still `onNavigate("/chores")`. Docs tell people to open it. |
| `/cleaning/*` | `CleaningRouter` + cleaning views | **Not mounted.** |
| `/product-library` | `ProductLibraryPage` | Full UI, **not routed.** |

If you add a link to `/chores` or `/cleaning/...` without remounting those routes, you will ship a 404.

---

## 3. Dead / unrouted pages (do not “fix” by rewriting these as Home)

These files exist under `src/pages/` but are **not imported by the live router**:

- `DashboardPage.tsx`
- `HomeDashboardPage.tsx`
- `FamilyHubDashboard.tsx` — older wake page with member buttons + weather placeholder
- `ChoresPage.tsx` and `src/pages/chores/*`
- `cleaning/CleaningRouter.tsx` and `/cleaning/*` views
- `ProductLibraryPage.tsx`
- `DocsPage.tsx`
- `ProjectsPage.tsx` (real projects UI; route uses the placeholder instead)
- `PlannerPage.tsx` (list editor; live planner is `CalendarPage`)
- `FoodInventoryDashboard.tsx`

`FamilyHubDashboard` has the **intended wake behavior** (member grid, weather placeholder). Current Home has the **intended visual standard**. Do not create a third Home. Combine behavior into `NotionHomeWorkspace` if the task is Home.

---

## 4. What is already in good shape

Attend to gaps below. Do **not** redo these unless asked.

- Home **visual** start-page pass (August 2026): `fh-pro-*`, Wall Display language, locked card layout (kitchen, calendar, shopping, storage).
- Messages module exists (`/messages`, `FamilyData.messageBoard`).
- Shopping, pantry/inventory, calendar CRUD, kitchen duty, pets/flea meds, notifications, quick add.
- JSON backup + import in Settings (`backupFormat: familysite-491.backup.v1`) with migrations.
- Canonical roster helpers: `createCanonicalHouseholdFamilyMembers`, `WAKE_PAGE_MEMBER_DISPLAY_ORDER`, `repairCanonicalFamilyMembers`.
- Netlify SPA deploy, PWA plugin, typecheck-on-build.
- Sidebar IA already matches the intended primary / tools / settings split.

---

## 5. What needs to be attended to (priority order)

Work **top to bottom**. Do not start cloud sync, a new Home skin, or meal planning.

### P0 — Honesty and broken paths

**Attend to:** routing + docs that still describe a different app.

- `/chores` and `/cleaning/*` are dead. Either remount them in `CurrentBuild` **or** stop navigating to them from cleaning/chore code.
- Update stale docs that say open `/chores`, `/product-library`, or `AppSidebar`:
  - `README.md`
  - `docs/DEPLOYMENT.md`
  - `docs/QA_KIOSK.md`
  - `docs/491wd-build-passoff.md`
  - `src/components/chores/README.md` and sibling chore markdown
- `PROJECT_AUDIT.md` (2026-07-16) is outdated (says Messages is missing; Home is not AdminUX). Do not follow it for current status.

**Done when:** no in-app button sends the user to a 404; README/dev docs match live routes.

### P1 — Finish Home as the real wake page (behavior, not a new skin)

**File:** `src/components/notion/NotionHomeWorkspace.tsx`  
**Wrapper:** `src/pages/AdminUxHouseholdDashboard.tsx`  
**Customize stub:** `src/components/startPage/StartPageCustomizeBar.tsx` (disabled buttons: “Layout editing coming later.”)

Current Home has: greeting, household name, clock, kitchen duty, today’s chores, upcoming events + mini month, shopping list + add, pantry/fridge/freezer counts.

**Missing vs product intent:**

1. **Member buttons** — `onOpenMemberDashboard` is passed from `CurrentBuild` and then dropped. Wire it. Order: Hershel, Lorraine, Stella, Nox, Jeremiah, Selena (`WAKE_PAGE_MEMBER_DISPLAY_ORDER`).
2. **Weather** — placeholder card is fine (see unused `FamilyHubDashboard` weather block).
3. **Messages / alerts preview** on Home from `data.messageBoard` and notifications.
4. **Member navigation** from Home → `/family/:id`.
5. Customize / Add widget / Theme: **implement later or hide**. Do not leave three disabled buttons that look broken.

**Do not:** rebuild Home layout, add drag-and-drop widgets, or switch to a dark kiosk theme in this pass.

**Done when:** a person can tap a family member, see today’s messages/chores/shopping, and add a shopping item from Home without a PIN.

### P2 — One chores system

There are **three** chore products. Only `/tasks` is live.

| System | Storage | UI | Routed? |
|---|---|---|---|
| Household tasks | `FamilyData.tasks`, `cleaningRooms` | `/tasks` (`TasksPage`, ~3491 lines) | Yes |
| Chore kiosk / PWA | `491wd-chore-state`, `491wd-member-schedules`, `491wd-chore-notes` | `ChoresPage` | No |
| ZIP cleaning playbook | `491wd-chores-state`, supplies, legacy keys | `CleaningRouter` | No |

Also: roster spelling is **Hershel** on the wake path; chore seeds still say **Herschel**.

**Attend to:**

- Pick one product. Default recommendation: **`/tasks` is canonical.** Remount `/chores` only if the user wants the kiosk PWA back.
- Stop emitting `/chores` links from `src/pages/cleaning/*`.
- Include chore completions in the Settings backup, or migrate sidecar keys into `FamilyData`.
- Align assignee names (Hershel vs Herschel) without wiping member IDs.

**Done when:** “what’s due today” is one list on Home and Cleaning / Kitchen, and backup restores it.

### P3 — One visual language off Home

Home uses FamilyHub / `fh-pro` / start-page tokens. Other pages still mix:

- SmartHR orange (`#FE9F43`)
- Guided kiosk CSS (`guided-kiosk.css`)
- Hardcoded `#f7f7f7` / `#ededed` cards
- Grofast / AdminUX / Gogo / BankDash / Notion layers all imported in `src/styles.css`
- `ui-builder.css` pulled in from `src/App.tsx`

**Attend to (visual only, no logic rebuild):**

- Messages
- Cleaning / Kitchen (`TasksPage`)
- Pets
- Emergency
- Member dashboard
- Settings (at least the household/backup sections)

Reuse: `src/styles/familyhub-theme.css`, `familyhub-pro.css`, `ModuleWorkspace`, existing buttons/fields.

**Do not:** add Bootstrap, invent a new token file, or restyle Home again.

**Done when:** primary modules look like the same household product as Home.

### P4 — Sidebar tools: real or hidden

| Tool | Reality | Attend to |
|---|---|---|
| Pets | Real | Skin only unless asked |
| Subscriptions | Kiosk chrome around Settings billing | Make a simple household list **or** keep as Settings deep link |
| Projects / Photos / Routines | Placeholder copy | Build minimal CRUD **or** hide from sidebar until real |
| Planner | Alias of Calendar | Do not pretend it is a second planner |
| Emergency | Static checklists | **Persist** to `FamilyData` (additive fields OK) |
| Notes `/docs` | Hidden stub | Leave hidden unless asked |

Empty sidebar items train the household that nav is fake. Prefer hiding over more placeholder pages.

### P5 — Calendar household completeness

**File:** `src/pages/CalendarPage.tsx` (~2452 lines)  
**Data:** `FamilyData.planner`, `FamilyData.calendarLinks`  
**Plan (intent only):** `FAMILYHUB_CALENDAR_FOCUSED_PLAN.md`

**Attend to:**

- Multi-day events need `endDate` (travel blocks). Today there is only `date`.
- Recurrence fields exist; **occurrences are not generated.**
- No tentative status, school-day legend, or event tags.
- Seed events are still May 2026 demos (`plan-1`, `plan-2`, `plan-3`).
- `PlannerPage.tsx` is orphaned; `/planner` renders `CalendarPage`.
- `AdminUxFullCalendar` (FullCalendar) is unused.

**Do not** build meal planning, appointment booking, or business scheduling.

### P6 — Backup completeness + Settings split

Settings backup exports **`FamilyData` only**. These sidecar keys are **not** in the backup:

- `491wd-chore-state`, `491wd-member-schedules`, `491wd-chore-notes`
- `491wd-chores-state`, cleaning supplies, legacy chore keys
- `491wd-grocery-cart`, grocery library overrides
- `491wd-food-storage-state`
- `familysite-491:pantry-usage-patterns`
- Appearance / UI-builder / help-mode flags

Cloud preview (`dataSourceMode: "cloud-preview"`) also **does not** sync messages, pets, kitchen, projects, docs, activity log (`useFamilyData.ts`).

**Attend to:**

- Include sidecar data in backup **or** migrate it into `FamilyData` before telling anyone backup is complete.
- Split Settings into Household / Data / Devices / Advanced. Leave Home Assistant, AI, and cloud in Advanced until they work.
- Home Assistant card is a **placeholder** (“URL only; no live bridge”). Do not fake a live integration.

`SettingsPage.tsx` is ~3865 lines. Split only when you are already editing Settings.

### P7 — Shopping / pantry cleanup (after daily path is solid)

These modules work. Refinement, not a rewrite:

- `ProductLibraryPage` is unrouted — mount it or fold into Pantry/Settings.
- Include grocery sidecar keys in backup (see P6).
- One skin (FridgeWise aqua tokens already exist). Stop new `#FE9F43` orange.
- God files: `InventoryViews.tsx` (~3383), `PantryTabPage.tsx` (~2201), `groceryLibraryData.ts` (~5456). Split only when changing that module.

Preserve: barcode / OpenFoodFacts, Instacart hook, quantity steppers, locations/walls/shelves.

### P8 — Tests that match the real product

Current tests (~10 files) cover chore analytics, a11y IDs, pantry insights, Notion N1A. They can pass while Home, routing, and backup are wrong.

**Add tests when you touch a module:**

- Route aliases (`/` → adminux; `/chores` 404 or remounted)
- Backup export/import round-trip
- Home shopping quick-add
- Message create + pin
- Kitchen duty complete for today

Do not add a large chore-analytics test suite unless you are remounting `/chores`.

---

## 6. Data map (read before changing storage)

### Canonical household blob

- **Type / seed:** `src/data/familyData.ts`
- **Load/save:** `src/data/localFamilyRepository.ts`
- **Hook:** `src/hooks/useFamilyData.ts`
- **Migrations:** `src/data/familyMigrations.ts`
- **Key:** `familysite-491:first-family-build`

Important domains on `FamilyData`: `adminSettings`, `familyMembers`, `tasks`, `shopping`, `groceryItems`, `pantry`, `planner`, `calendarLinks`, `cleaningRooms`, `cleaningCompletionRecords`, `kitchenSchedule`, `kitchenDutyCompletions`, `kitchenChecklist`, `messageBoard`, `notifications`, `pets`, `petMedicationEntries`, `docs`, `projects`, `activityLog`.

### Roster

Seed names: Lorraine, Hershel, Stella, Nox, Jeremiah, Selena.  
IDs stay `member-1` … `member-6` (Selena is `member-6`).  
Wake display order is separate from seed array order. Use `WAKE_PAGE_MEMBER_DISPLAY_ORDER`.  
Repair helper: `src/lib/repairCanonicalFamilyMembers.ts` (renames Mom/Dad/Herschel/Avery safely; does not wipe IDs).

### Cloud (optional, incomplete)

- Schema: `supabase/migrations/`, `supabase/seed.sql`
- Client: `src/lib/supabaseClient.ts`, `src/auth/`
- Preview repo: `src/data/supabaseFamilyRepository.ts`
- Login: `/cloud-login` only. **No route guards.** Dashboard works signed out.
- Do not start live multi-device sync until P6 backup is honest.

---

## 7. Important files

| Path | Why it matters |
|---|---|
| `src/CurrentBuild.tsx` | Only live router |
| `src/components/layout/shellRoutes.ts` | Sidebar + route keys |
| `src/components/layout/AppShell.tsx` | Shell, mobile nav, unused PIN/lock props |
| `src/components/notion/NotionHomeWorkspace.tsx` | Live Home |
| `src/pages/AdminUxHouseholdDashboard.tsx` | Thin Home wrapper |
| `src/pages/FamilyHubDashboard.tsx` | Unused wake page (members + weather) — steal behavior, do not remount as Home |
| `src/pages/TasksPage.tsx` | Live cleaning/kitchen |
| `src/pages/MessagesPage.tsx` | Live messages |
| `src/pages/CalendarPage.tsx` | Live calendar |
| `src/pages/ShoppingPage.tsx` | Live shopping |
| `src/pages/PantryPage.tsx` | Live pantry entry |
| `src/pages/SettingsPage.tsx` | Backup, roster, integrations |
| `src/pages/EmergencyPlanningPage.tsx` | Static emergency UI |
| `src/pages/HouseholdSidebarToolPage.tsx` | Placeholder for Projects/Photos/Routines |
| `src/data/familyData.ts` | Model + seed |
| `src/hooks/useFamilyData.ts` | Persist + incomplete cloud preview |
| `src/styles/familyhub-theme.css` | Brand tokens |
| `src/styles/familyhub-pro.css` | Home / pro classes |
| `src/styles.css` | Stacked theme imports (do not add another layer lightly) |
| `FAMILYHUB_CAPSULE_ARCHITECTURE.md` | Wake-page product intent |
| `CLEAN_FAMILYHUB_REDESIGN_PLAN.md` | Page list + visual rules |
| `CLIENT_READY_VISUAL_REFINEMENT_PLAN.md` | Home visual status; leftover polish list |
| `FAMILYHUB_CALENDAR_FOCUSED_PLAN.md` | Calendar gaps |
| `docs/backend-plan.md` | Supabase/AI phases (future) |

### Stale — do not treat as current

| Path | Why stale |
|---|---|
| `PROJECT_AUDIT.md` | July 2026; Messages/Home/PIN story is old |
| `docs/491wd-build-passoff.md` | May 2026; different sidebar and `/chores` |
| `CLEANUP_SUMMARY.md` | Useful only as history of deleted files |
| `CURSOR_HANDOFF.md` | GitHub push handoff for a different machine |
| Chore `/chores` markdown under `src/components/chores/` | Describes an unrouted kiosk |

---

## 8. Auth, PIN, integrations (do not over-build)

| Topic | Reality | Attend to? |
|---|---|---|
| Wake PIN | Intentionally **not** on Home | Do not add a PIN wall on `/adminux` |
| Member PIN fields | Stored; editor on member page + Settings roster | Helpers in `src/lib/memberPin.ts` |
| `onSwitchUser` / `onLockScreen` | Props on `AppShell`, **not passed** from `CurrentBuild` | Only if user asks for kiosk lock |
| Supabase login | `/cloud-login` | Optional. No guards. |
| AI | `netlify/functions/ai-household-helper.ts`, `src/services/aiClient.ts` | Settings can test connection. Helpers mostly planned. |
| Instacart | `netlify/functions/create-instacart-list.ts` | Optional; server env only. |
| Home Assistant | Settings placeholder | Do not implement unless asked. |
| UI Builder / Help Center | Extra surfaces; README still mentions them | Not the daily household path. |
| `server/` Express | Paused | Ignore. |

---

## 9. God files (touch carefully)

| File | ~Lines |
|---|---|
| `src/lib/groceryLibraryData.ts` | 5456 |
| `src/pages/SettingsPage.tsx` | 3865 |
| `src/pages/TasksPage.tsx` | 3491 |
| `src/pages/inventory/InventoryViews.tsx` | 3383 |
| `src/lib/choreZipSeed.ts` | 3357 |
| `src/pages/CalendarPage.tsx` | 2452 |
| `src/pages/PantryTabPage.tsx` | 2201 |
| `src/data/familyMigrations.ts` | 2081 |
| `src/data/familyData.ts` | 1887 |

Prefer additive, local edits. Do not “clean up” a god file as a drive-by.

---

## 10. Suggested first tasks for ChatGPT

If the user does not specify a slice, do **one** of these — in this order — and stop:

1. **Home wake behavior** in `NotionHomeWorkspace`: member buttons, messages preview, weather placeholder, hide or implement customize stubs. Keep current card layout.
2. **Fix chore 404s:** remount `/chores` **or** retarget cleaning navigation to `/tasks`. Update docs that mention `/chores`.
3. **Emergency persist:** save checklist / meeting-place notes into `FamilyData` (additive fields + migration).
4. **Hide empty tools** (Projects, Photos, Routines) from sidebar until they have real UI — only if the user agrees; do not delete routes.
5. **Backup sidecar inventory:** document or include chore/grocery extra keys in export.

After any UI change: run the app, click the changed flow, and check Home + the module page still share the same data.

---

## 11. Out of scope unless the user explicitly asks

- New app / new repo / React Router migration
- Dark kiosk theme
- Configurable drag-and-drop Home widget editor
- Live Supabase sync / household invites
- Meal planning, recipes, nutrition
- Deleting `references/`, `handoff/`, or `server/`
- Changing npm package set (jQuery/moment/dragula/dropzone are leftover admin-template deps — do not rip them out in an unrelated pass)
- Rewriting Settings or Tasks “for cleanliness”
- Another Home visual template (Gogo, Bitrix, Figma restyle, etc.)

There are remote experiment branches (`dashboard-editorial-style`, `dashboard-figma-restyle`, `dashboard-live-data-refinement`, …). **`main` already chose the Notion / start-page Home.** Do not merge those branches unless the user asks.

---

## 12. Definition of a healthy next milestone

A family can:

1. Open the tablet → land on Home (`/adminux`).
2. See who has kitchen duty, what’s due, what’s on the shopping list, and any pinned messages.
3. Tap a person to open that member’s home, then tap Home to return. No PIN.
4. Add a shopping item from Home; it appears on `/shopping`.
5. Open Cleaning / Kitchen and complete today’s work; Home updates.
6. Export backup from Settings and restore it on another browser **without losing chores they actually use**.
7. Never tap a sidebar item that is an empty “coming later” page (or those items are hidden).

Until that is true, do not start cloud, AI features, or a new design system.

---

## 13. One-paragraph status for prompts

FamilyHub is a working localStorage household kiosk (React/Vite/Tailwind). Live Home is `/adminux` (`NotionHomeWorkspace`) — visually polished, missing member buttons, weather, and messages. Live chores are `/tasks`, not `/chores` (that route 404s). Messages, calendar, shopping, pantry, pets, settings backup exist. Projects/Photos/Routines are placeholders. Emergency does not save. Three chore stores and many localStorage sidecars are not in backup. Do not reskin Home, do not change the storage key, do not add recipes. Attend to Home wake behavior, chore route honesty, then visual consistency and backup completeness.

---

*End of ChatGPT attention brief. Prefer this file over `PROJECT_AUDIT.md` and May/July passoff docs.*

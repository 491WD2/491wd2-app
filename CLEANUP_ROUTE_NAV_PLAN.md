# CLEANUP_ROUTE_NAV_PLAN.md

**Project:** FamilySite_491 (`familysite-491`)  
**Folder:** `/Users/stellaroskens/491WD2`  
**Audit date:** 2026-07-21  
**Audit type:** Read-only — no source, packages, localStorage, or keys were changed.  
**Storage key (unchanged, do not touch):** `familysite-491:first-family-build`

---

## 1. Current routes

Routing lives in `src/CurrentBuild.tsx` (`parsePath`, `routePathMap`) with shell keys in `src/components/layout/shellRoutes.ts`.  
`src/App.tsx` only mounts `CurrentBuild`.

| Path | Component / page rendered | Visible nav or hidden/utility | Recommendation |
|------|---------------------------|-------------------------------|----------------|
| `/` | Redirects via `replaceState` → `/adminux` | Landing alias | **Keep** as alias to Home (Command Center). Do not leave as a second product. |
| `/home` | Same redirect → `/adminux` | Landing alias | **Keep** as Home alias. |
| `/login`, `/kiosk-login` | Redirect → `/adminux` | Legacy aliases | **Keep** redirect; do not advertise in nav. |
| `/adminux` | `AdminUxHouseholdDashboard` (lazy) via `ModuleGate(dashboard)` | **Main nav** — sidebar “Command Center” | **Rename to Home** in nav; treat as primary Home. Keep path `/adminux` short-term or later alias `/` only. |
| `/dashboard` | `DashboardPage` | **Main nav** — sidebar “Home”; mobile bottom “Home” | **Hide from main nav** or demote to utility (“Classic dashboard”) after Home = `/adminux`. Route can remain. |
| `/calendar` | `CalendarPage` | Main nav | **Keep**. Label: Calendar. |
| `/planner` | Parsed as `calendar` → `CalendarPage` | Not in sidebar; alias | **Keep** as alias; **remove-from-nav** (already out). Avoid “Planner” label in UI. |
| `/shopping` | `ShoppingPage` | Main nav | **Keep**. |
| `/pantry` | `PantryPage` | Main nav (label often “Inventory”) | **Keep**; **rename** nav label to **Pantry & Inventory**. |
| `/tasks` | `TasksPage` (cleaning + kitchen hub sections) | Main nav (“Cleaning”); More menu | **Keep**; **rename** to **Cleaning / Kitchen**. |
| `/kitchen` | `KitchenChecklistPage` | Hidden from sidebar (`routeVisible` false in SidebarNav); deep link | **Hide** from main nav (already); keep as utility under Cleaning / Kitchen. |
| `/kitchen-schedule` | `KitchenSchedulePage` | In primary strip (`isPrimaryNavRoute`); also Settings tab | **Remove-from-nav** (primary strip); keep as Settings / Cleaning utility. |
| `/pets` | `PetsPage` | Sidebar + More menu | **Keep**. |
| `/settings` | `SettingsPage` | Main nav | **Keep**. |
| `/notifications` | `NotificationsPage` | Sidebar “Updates” group | **Remove-from-main-nav**; **keep** as utility (header / Quick Add / deep link). |
| `/subscriptions` | `SubscriptionsPage` | Sidebar “Updates” group | **Remove-from-main-nav**; keep under Settings → Subscription (already mirrored). |
| `/quick-add` | `QuickAddPage` | Header “Quick Add” button (utility) | **Keep** as utility — not main nav. |
| `/kiosk` | `KioskPage` | Optional “Wall display” / “Kiosk” when kiosk mode enabled | **Keep** as allowed utility. |
| `/cloud-login` | `LoginPage` (Supabase email/password) | Account / Settings entry | **Keep** as utility login — not main nav. |
| `/family` | `FamilyMembersPage` | Not in sidebar (`PRIMARY_NAV_EXCLUDED` / not in `SIDEBAR_ROUTE_KEYS`) | **Keep** deep link; **do not show** as main nav (“Family Members”). Prefer Settings → Members & PINs. |
| `/family/:memberId` | `MemberDashboardPage` | Deep link / member chips | **Keep** utility; not main nav. |
| `/projects` | `HiddenModulePage` (“Unused shortcut”) | Not in main nav | **Keep** stub route; **remove-from-nav** (already). Do not resurrect Projects in nav. |
| `/docs` | `HiddenModulePage` (“Notes”) | Not in main nav | **Keep** stub; **remove-from-nav** (already). Do not show Docs/Documents. |
| Unknown paths | `NotFoundPage` | — | **Keep**. |
| `/messages` | **Does not exist** → `NotFoundPage` | Missing target module | **Add later** (new route + page); not in this audit’s code changes. |

### Orphan / unused page modules (not wired in `CurrentBuild`)

| File | Status | Cleanup note |
|------|--------|--------------|
| `src/pages/PlannerPage.tsx` | Exists; route `/planner` goes to `CalendarPage` instead | Do not put in nav; eventual delete or leave unused. |
| `src/pages/DocsPage.tsx` | Exists; `/docs` shows `HiddenModulePage` | Same. |
| `src/pages/ProjectsPage.tsx` | Exists; `/projects` shows `HiddenModulePage` | Same. |
| `src/pages/ChoresPage.tsx` | Exists; **not imported** by router | Chore kiosk UI lives partly here; `/tasks` uses `TasksPage`. Treat as secondary/orphan until Cleaning wiring pass. |
| `src/pages/cleaning/CleaningRouter.tsx` | Not mounted from `CurrentBuild` | Future Cleaning / Kitchen consolidation. |
| `src/pages/HomeDashboardPage.tsx`, `FamilyHubDashboard.tsx`, etc. | Alternate dashboards | Not current default Home. |

---

## 2. Current main navigation

### Desktop sidebar (`SidebarNav.tsx` — authoritative labels via `NAV_LABEL`)

Grouped as:

**Home**
1. Command Center  
2. Home *(this is `/dashboard`, not `/adminux`)*

**Household**
3. Shopping  
4. Inventory  
5. Calendar  

**Updates**
6. Notifications  
7. Subscriptions  

**Cleaning**
8. Cleaning  
9. Pets  

**System**
10. Settings  

**Conditional**
11. Wall display *(when `enableKioskMode`)*

### Mobile bottom bar (`AppShell` `bottomNavRoutes`)

1. Home → **`/dashboard`** (short label “Home”)  
2. Calendar  
3. Shop  
4. Pantry  
5. More → Cleaning, Pets, Settings  

### Mobile / compact primary strip (`isPrimaryNavRoute`)

Includes (when modules visible): Dashboard, Cleaning (`tasks`), Kitchen Schedule, Inventory, Shopping, Calendar, Settings (+ Kiosk button after Dashboard when enabled).  
**Does not include** Command Center (`adminux` is in `PRIMARY_NAV_EXCLUDED`).

### Exact visible main-nav label set (default customization)

> Command Center · Home · Shopping · Inventory · Calendar · Notifications · Subscriptions · Cleaning · Pets · Settings  
> *(+ Wall display / Kiosk when enabled)*  
> Mobile bottom shorts: Home · Calendar · Shop · Pantry · More  

**Not** currently shown as main nav: Messages, Planner, Routines, Put Away, Projects, Documents, Docs, Photos, Reports, Data Health, Backend Status, Family Members.

---

## 3. Desired navigation comparison

| Desired item | Current state | Gap |
|--------------|---------------|-----|
| **1. Home** | Split: `/adminux` = Command Center; `/dashboard` = “Home” in sidebar/bottom | Unify: one Home → Command Center (`/adminux`); demote classic dashboard |
| **2. Messages** | No route, no nav item | **Missing** — needs `/messages` + nav entry later |
| **3. Calendar** | Present | Align order; keep |
| **4. Shopping** | Present | Keep |
| **5. Pantry & Inventory** | Present as “Inventory” / “Pantry” | **Rename** label |
| **6. Cleaning / Kitchen** | “Cleaning” (`/tasks`); kitchen split across `/kitchen`, `/kitchen-schedule`, Settings | **Rename**; fold kitchen into this module in nav |
| **7. Pets** | Present (sidebar + More) | Promote to consistent main list position |
| **8. Settings** | Present | Keep last |

**Extra items to remove from main nav (present today):**  
Command Center *as a second home*, duplicate Home/Dashboard, Notifications, Subscriptions, Kitchen Schedule (primary strip), optional dual Dashboard/Command Center.

**Allowed utilities (keep, not main nav):**  
Quick Add, Notifications, `/kiosk` / chores surfaces if present, `/cloud-login` / PIN when wired.

---

## 4. Missing target modules

### Messages
| Question | Finding |
|----------|---------|
| Does `/messages` exist? | **No** — unknown path → Not Found |
| Does Messages appear in nav? | **No** |
| Is `FamilyData.messageBoard` used by a page? | **Data layer yes** (type, migrations, `selectImportantMessages*` in `familyDataSelectors.ts`). **No page currently imports those selectors.** No `MessagesPage.tsx`. Chores has a separate “Member message boards” string field in chore foundation — not the household `messageBoard` array. |
| Docs that claim Messages exists | `docs/layout-choices.md` / passoff docs are **ahead of code**; treat as plan, not reality |

### PIN login
| Question | Finding |
|----------|---------|
| Can PINs be set? | **Yes** — Settings → Members & PINs; `MemberDashboardPage` / `HouseholdRosterPanel` / `memberEditShared` |
| Helpers | `src/lib/memberPin.ts` (`isFourDigitPin`, `membersMatchingPin`, `isPinTakenByOther`) |
| Is PIN **entry** screen wired? | **No** — `membersMatchingPin` has **zero call sites** outside its definition. No PIN pad route. `/login` redirects to `/adminux`. |
| What “Login” exists? | `/cloud-login` → `LoginPage` = **Supabase cloud** email/password, not household PIN |
| AppShell Switch user / Lock | Props exist; only useful when parent passes `onSwitchUser` / `onLockScreen` (kiosk session). Not a full PIN gate on app open |

### `/adminux` vs Home
| Question | Finding |
|----------|---------|
| Default landing | `/`, `/home`, `/login` → **`/adminux`** |
| Product intent | AdminUX is the **Command Center** and current default home experience |
| Recommendation | **Treat `/adminux` as Home** for the final nav. Keep `/dashboard` as optional “Classic dashboard” utility (button already exists on AdminUX). Do not keep both as peer main-nav homes |

---

## 5. Legacy / confusing labels

Visible or semi-visible usage of banned-from-main-nav names:

| Label | Where it appears | Risk |
|-------|------------------|------|
| **Planner** | `HouseholdSmartWizard` module toggle (“Planner”); `homeDashboardData` sample label; `PlannerPage.tsx` title (unwired); customization key `modulePlanner` | Confusing if wizard/settings expose it; not in sidebar today |
| **Routines** | Doc category value `"routine"` in data (not a nav item) | Low for nav; ignore unless surfaced as module name |
| **Put Away** | Inventory `ScanPutAwayWizard`; shopping `needsPutAway`; FamilyHub copy; kitchen checklist helpers | Feature inside Pantry — **OK as workflow**, not main nav |
| **Projects** | `ProjectsPage` title; Settings module key filtered out of toggles; customization “Workspace” | Hidden stub only |
| **Documents / Docs** | Hidden `/docs` titled “Notes”; wizard “Docs”; customization `moduleDocs` | Do not add to main nav |
| **Photos** | Kitchen task notes drawer section “Photos” | In-feature, not nav |
| **Reports** | Not found as a main nav/settings section title in current Settings tabs | — |
| **Data Health** | Legacy settings tab id `data_health` maps → **Advanced**; Backup tab has “Data check” (not “Data Health”) | Soft rename already done; avoid resurrecting “Data Health” in main nav |
| **Backend Status** | Legacy tab id `backend` → Advanced; Integrations has “Workspace status” / connection copy | Not main nav |
| **Family Members** | `/family` page exists; sidebar comment says roster lives under Settings → Members & PINs; not in `SIDEBAR_ROUTE_KEYS` | Keep out of main nav |

Also confusing today (not on the ban list but important):
- **Command Center** vs **Home** vs **Dashboard** (three names, two routes)
- **Inventory** vs **Pantry** vs desired **Pantry & Inventory**
- **Cleaning** vs desired **Cleaning / Kitchen**
- **Subscriptions** as peer nav vs Settings → Subscription

---

## 6. Recommended cleanup sequence

Principles: one small change per step · `npm run build` after each · no localStorage / key / data seed changes · do not delete route stubs until nav is stable · do not add Messages page until nav shell is correct.

| Step | Change (smallest safe unit) | Primary files | Build |
|------|----------------------------|---------------|-------|
| **1** | **Unify Home target:** Sidebar + bottom nav “Home” navigate to `adminux` (`/adminux`); remove duplicate “Command Center” + “Home(`/dashboard`)” pair from sidebar Home group (single Home → adminux). Leave `/dashboard` route working. | `SidebarNav.tsx`, `AppShell.tsx` (`bottomNavRoutes`), maybe `shellRoutes.ts` | Yes |
| **2** | Align labels: Home / Calendar / Shopping / **Pantry & Inventory** / **Cleaning / Kitchen** / Pets / Settings in `NAV_LABEL`, `shellRoutes` defaults, and `CurrentBuild` `routeLabels` defaults (no storage writes). | `SidebarNav.tsx`, `shellRoutes.ts`, `CurrentBuild.tsx`, optionally `customization.ts` defaults | Yes |
| **3** | Remove Notifications + Subscriptions from sidebar main groups (keep routes + header/deep links + Settings subscription). | `SidebarNav.tsx`, `SIDEBAR_ROUTE_KEYS` | Yes |
| **4** | Remove Kitchen Schedule from primary/mobile strip; keep `/kitchen-schedule` + Settings tab. | `AppShell.tsx`, `PRIMARY_NAV_EXCLUDED` / `shellRoutes.ts` | Yes |
| **5** | Reorder main nav to match final list (Home → … → Settings); put Pets in primary list consistently (sidebar + bottom/More policy). | `SidebarNav.tsx`, `AppShell.tsx` | Yes |
| **6** | Soft-hide classic dashboard from remaining chrome (optional “Classic dashboard” only from AdminUX / Settings). | `AppShell.tsx`, `SidebarNav.tsx` | Yes |
| **7** | Sweep visible “Planner” / “Docs” strings in SmartWizard & customization labels (rename to Calendar / hide toggles) — still no data deletes. | `HouseholdSmartWizard.tsx`, Settings appearance/labels | Yes |
| **8** | **Later:** Add `/messages` + `MessagesPage` wired to `FamilyData.messageBoard` + nav item #2 — **new feature**, after nav shell is clean. | `CurrentBuild.tsx`, `shellRoutes.ts`, new page | Yes |
| **9** | **Later:** Wire PIN pad using `membersMatchingPin` if product requires kiosk gate — do not confuse with `/cloud-login`. | New or existing login surface, `CurrentBuild`, AppShell | Yes |
| **10** | **Last:** Delete or archive unused `PlannerPage` / `DocsPage` / `ProjectsPage` only after redirects confirmed — optional; stubs are safer short-term. | pages + imports | Yes |

### Explicitly defer
- Building Messages UI (step 8)  
- Full Cleaning / Kitchen page merge  
- PIN login productization  
- localStorage migrations or key changes  
- Removing `messageBoard` or member PIN fields from `FamilyData`

---

## 7. Settings page section names (reference)

Current Settings tabs (`SETTINGS_TABS`):

1. Household  
2. Backup & Data  
3. Members & PINs  
4. Kitchen Schedule  
5. Shopping & Pantry  
6. Notifications  
7. Subscription  
8. Appearance  
9. Help & Install  
10. Integrations  
11. Advanced  

Legacy hash ids still remap: `data_health` / `backend` → Advanced (no main-nav “Data Health” / “Backend Status”).

---

## 8. Files likely needing edits (future code passes)

| Area | Files |
|------|--------|
| Route table / landing | `src/CurrentBuild.tsx` |
| Route keys / nav membership | `src/components/layout/shellRoutes.ts` |
| Sidebar | `src/components/layout/SidebarNav.tsx` |
| Mobile bottom + primary strip + More | `src/components/layout/AppShell.tsx` |
| Kiosk sidebar mapping | `src/components/layout/KioskSidebar.tsx`, `src/lib/kioskShellNavigation.ts`, `src/lib/kioskShellConfig.ts` |
| Label defaults | `src/lib/customization.ts` |
| Icons / tones | `src/components/icons/FeatherIcon.tsx` |
| Module gate / hidden stubs | `src/components/layout/ModuleGate.tsx`, `src/pages/HiddenModulePage.tsx` |
| Settings nav toggles | `src/pages/SettingsPage.tsx` |
| Wizard legacy module names | `src/components/ui/HouseholdSmartWizard.tsx` |
| Future Messages | new `src/pages/MessagesPage.tsx` + selectors already in `src/lib/familyDataSelectors.ts` |
| Future PIN gate | `src/lib/memberPin.ts` + new UI; not `LoginPage.tsx` (cloud) |

**Do not touch for nav cleanup:** `src/data/localFamilyRepository.ts` storage key, `familyMigrations` shape, or messageBoard field removal.

---

## 9. Audit summary

- App already hides Projects/Docs/Family from main sidebar; landing is AdminUX Command Center.  
- Biggest structural mess: **two Homes** (`/adminux` vs `/dashboard`) and **extra** Notifications/Subscriptions/Kitchen Schedule in chrome.  
- Biggest product gap vs final plan: **Messages** (data ready, no page/nav) and **PIN entry** (PINs stored, no unlock UI).  
- Safest first code change (when implementation starts): **one Home nav item → `/adminux`**, remove the Command Center + Dashboard duplicate from the sidebar Home group, build, then rename labels.

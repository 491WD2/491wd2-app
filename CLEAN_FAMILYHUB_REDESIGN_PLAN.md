# Clean FamilyHub Redesign Plan

**Project:** FamilyHub / FamilySite 491 (`familysite-491`)  
**Workspace:** `/Users/stellaroskens/491WD2`  
**Document type:** Planning only — **no source code, packages, localStorage, or keys changed by this document.**  
**Storage key (do not change):** `familysite-491:first-family-build`  
**Created:** 2026-07-22  
**Visual reference:** FoodFlow / CozZo-style pantry inventory dashboard (light, green accent, white cards)  
**Brand:** FamilyHub / FamilySite 491 — **not** FoodFlow / CozZo branding

---

## 0. Non-negotiable constraints

| Rule | Detail |
|------|--------|
| No rebuild / scaffold | Evolve the existing Vite + React app |
| No new packages | Unless a later phase explicitly re-approves |
| Preserve storage | Never reset localStorage; never change `familysite-491:first-family-build` |
| Preserve FamilyData | Do not remove fields; additive only when needed |
| Preserve routes | Keep current paths; aliases may remain |
| Preserve integrations | Barcode / OpenFoodFacts, export/send, Instacart hooks, etc. stay |
| Preserve modules | Pets, Subscriptions, Projects, Photos, Planner, Routines remain in app |
| No recipe stack | No recipes, meal planning, nutrition, calories, macros, or diet features |
| Build after each phase | `npm run build` must pass before starting the next phase |

---

## 1. Current pages / routes likely involved

Routing lives in `src/CurrentBuild.tsx` (`parsePath`, `routePathMap`) with shell keys in `src/components/layout/shellRoutes.ts`.

| Path | Current surface | Redesign role |
|------|-----------------|---------------|
| `/`, `/home`, `/adminux`, `/dashboard` | Wake / Home (`FamilyHubDashboard`) | **Primary redesign target** — light FoodFlow-style command page |
| `/messages` | `MessagesPage` | Polish to shared card/list tokens |
| `/calendar`, `/planner` | `CalendarPage` | Calendar + Upcoming Events polish |
| `/shopping` | `ShoppingPage` | **Major redesign** — lists, scan, shared list, library |
| `/pantry` | `PantryPage` / inventory tabs | **Major redesign** — spaces, item rows, quantity steppers |
| `/tasks`, `/kitchen`, `/kitchen-schedule` | Cleaning / Kitchen | Polish; keep duty + chores |
| `/emergency` | `EmergencyPlanningPage` | Expand supplies + calm checklist UI |
| `/pets` | `PetsPage` | Household tools polish |
| `/subscriptions` | `SubscriptionsPage` | Household tools polish |
| `/projects`, `/photos`, `/routines` | Sidebar tool pages | Keep; light shell polish |
| `/settings` | `SettingsPage` | Later cleanup into sections |
| `/notifications` | `NotificationsPage` | Utility; wake shows preview |
| `/quick-add` | `QuickAddPage` | Keep utility; style to match Quick Add card |
| `/family/:memberId` | `MemberDashboardPage` | Keep; apply shared EventRow / cards |
| `/kiosk`, `/cloud-login` | Utilities | Keep; do not promote as Home |

**Likely style / shell files:**  
`AppShell.tsx`, `SidebarNav.tsx`, `shellRoutes.ts`, `smarthrUi.ts`, `styles.css`, `adminux-skin.css`, `family-hub-dashboard.css`, `ModuleWorkspace.tsx`, pantry/shopping CSS modules.

**Do not use / do not add:** recipe routes, meal planner product pages, nutrition dashboards.

---

## 2. Final page list

### PRIMARY (sidebar)

1. **Wake Page / Home** — `/adminux` (aliases `/`, `/home`, `/dashboard`)  
2. **Messages** — `/messages`  
3. **Calendar / Upcoming Events** — `/calendar` (`/planner` alias)  
4. **Shopping** — `/shopping`  
5. **Pantry & Inventory** — `/pantry`  
6. **Cleaning / Kitchen** — `/tasks` (kitchen utilities as deep links)  
7. **Emergency Planning** — `/emergency`

### HOUSEHOLD TOOLS (sidebar)

8. **Pets** — `/pets`  
9. **Subscriptions** — `/subscriptions`  
10. **Projects** — `/projects`  
11. **Photos** — `/photos`  
12. **Planner** — `/planner` → calendar surface (deeper planning label)  
13. **Routines** — `/routines`

### SYSTEM

14. **Settings** — `/settings`

### Utility (not primary tabs; keep)

- **Smart Inventory Filter** — pantry deep link / filter mode (e.g. `/pantry?filter=smart` or dedicated tab) — **not** recipes  
- **Notifications** — `/notifications`  
- **Quick Add** — `/quick-add` + wake embed  
- **Member Home** — `/family/:memberId`  
- **Kitchen checklist / schedule** — deep links under Cleaning / Kitchen  

### Explicitly out of scope

- Recipes  
- Meal planning product UI  
- Nutrition / calories / macros / diet  

---

## 3. Visual design tokens

Inspired by the pantry/inventory reference (light green accent, white cards, large touch targets) while keeping **FamilyHub** identity.

### 3.1 Colors

| Token | Suggested value | Use |
|-------|-----------------|-----|
| `--fh-bg` | `#F5F7F6` | App / page background |
| `--fh-surface` | `#FFFFFF` | Cards, panels, sidebar |
| `--fh-surface-muted` | `#F8FAF9` | Nested rows, empty wells |
| `--fh-accent` | `#2F9E5B` | Primary actions, active nav, selected chips |
| `--fh-accent-soft` | `#E8F7EE` | Selected row / soft highlight |
| `--fh-accent-strong` | `#248A4C` | Pressed / hover primary |
| `--fh-warning` | `#E67E22` | Low stock / due soon |
| `--fh-danger` | `#D64545` | Out / expired / overdue |
| `--fh-info` | `#3B82A8` | Neutral info badges |
| `--fh-border` | `#E2E8E6` | Thin card / row borders |
| `--fh-border-strong` | `#CBD5D1` | Inputs focus ring base |

### 3.2 Text colors

| Token | Suggested value | Use |
|-------|-----------------|-----|
| `--fh-text` | `#14201B` | Body / titles (high contrast) |
| `--fh-text-secondary` | `#4B5C55` | Supporting copy |
| `--fh-text-muted` | `#6B7C74` | Meta, timestamps |
| `--fh-text-on-accent` | `#FFFFFF` | Text on green buttons / headers |

Avoid pastel-on-pastel and dark neon glass for main household surfaces.

### 3.3 Card style

- Background: `--fh-surface`  
- Radius: `14px`–`16px`  
- Border: `1px solid --fh-border`  
- Shadow: soft only — e.g. `0 1px 2px rgba(20,32,27,0.06), 0 8px 24px rgba(20,32,27,0.04)`  
- Padding: `16px`–`20px`  
- No heavy multi-layer glow; no dark glass panels on Home / Pantry / Shopping

### 3.4 Border style

- Default hairline `--fh-border`  
- Dividers between list rows: `1px solid #EEF2F0`  
- Focus: `2px solid` accent soft ring (`--fh-accent` at ~35% opacity)

### 3.5 Button style

| Kind | Look |
|------|------|
| Primary | Green fill, white text, min-height `48px`, radius `12px` |
| Secondary | White fill, thin border, dark text |
| Ghost | Transparent, dark text, hover muted surface |
| Icon / stepper | Square or circular ≥ `44×44` for kiosk |
| Danger | Soft red border/fill for delete / out-of-stock actions |

Touch-first: large tap targets for Surface Pro portrait kiosk.

### 3.6 Table / list style

- Prefer **card list rows** over dense corporate tables  
- Optional compact table on wide desktop only  
- Row: leading category/location icon · title · qty/unit · status badge · trailing actions  
- Section headers: small uppercase tracking labels (e.g. `FREQUENTLY ADDED`, `EXPIRE AFTER 5 DAYS`) in muted green/grey  
- Quantity: prominent `−` / value / `+` steppers

### 3.7 Sidebar style

- White / near-white surface, thin right border  
- Groups: **PRIMARY** · **HOUSEHOLD TOOLS** · **SYSTEM**  
- Active item: green soft background + accent text/icon  
- Idle: dark readable text, minimal icons  
- Collapsed mode: icon-only, still touch-friendly  
- Brand: **FamilyHub** wordmark (not FoodFlow)

### 3.8 Top bar

- Light bar: page title, optional search, Quick Add, notifications  
- No breadcrumb-heavy admin chrome  
- No business Location / Working Hours widgets

---

## 4. Component system

Shared UI building blocks (new or wrapped over existing). Prefer reusing pantry/shopping primitives where they already exist.

| Component | Purpose |
|-----------|---------|
| **AppSidebar** | Grouped Primary / Household tools / System nav |
| **TopBar** | Page context, search entry, Quick Add, alerts |
| **PageHeader** | Title, short description, primary actions |
| **ActionCard** | Large touch action (Buy More, Used Up, Open List, Scan) |
| **DataTable** | Optional desktop tabular view with same row model |
| **InventoryItemRow** | Pantry row: icon, name, qty stepper, badges, edit |
| **ShoppingListRow** | Shopping row: name, qty, section, purchased toggle |
| **StatusBadge** | Low / Out / Expiring / Due / OK chips |
| **QuickAddCard** | Wake + module quick capture (shopping / pantry) |
| **MemberButton** | Large family member tap target → member home |
| **EventRow** | Align with existing `UpcomingEventsList` |
| **ChoreCard** | Due / overdue chore summary |
| **MessageCard** | Pinned / important message preview |
| **EmptyState** | Calm dashed card + next action |

**Related existing pieces to wrap (not delete):**  
`UpcomingEventsList`, `ModuleWorkspace`, Feather icon tiles, shopping/pantry list rows, barcode / ProductScan panels.

---

## 5. Page intent (redesign targets)

### 5.1 Wake Page / Home

Show only daily household value:

- Time · date · weather placeholder/card  
- Member buttons: Hershel, Lorraine, Stella, Nox, Jeremiah, Selena  
- Prominent Quick Add  
- Shopping list preview  
- Pantry / inventory alerts  
- Kitchen duty · chores due today  
- Messages / notifications  
- Upcoming events  

Do **not** show large cards for Pets, Subscriptions, Projects, Photos, Planner, Routines (sidebar only).

### 5.2 Shopping (preserve capabilities)

Keep / restyle:

- Lists · Add Product · Scan Item · Shared List · Settings  
- Current List · Saved Shopping List · Shared Household List  
- Inventory shortcut  
- Product library if present  
- Barcode / OpenFoodFacts if present  
- Export / send if present  

Visual: clean list rows, green primary add, category section headers, large `+` actions.

### 5.3 Pantry & Inventory

Include:

- Search · category filter · location filter · sort · export if present  
- Item table/list · quantity `±` · edit · status badges  
- Update Stock · Add to Shopping List  
- Low stock · out of stock · expiring soon **only if data supports**  

Spaces pattern (Fridge / Freezer / Pantry / …) as filters or section cards — not a recipe kitchen.

### 5.4 Smart Inventory Filter

Repurpose any existing “smart filter” as **Smart Inventory Filter**:

- Low stock · out of stock · expiring soon (if supported)  
- Recently updated  
- Household supplies · cleaning supplies · pet supplies · emergency supplies  
- Location filters  

**Do not** include recipes or meal suggestions.

### 5.5 Emergency Planning

- Emergency Contacts  
- Meeting Places  
- Medical Notes  
- Emergency Checklist  
- Evacuation Plan  
- Emergency Supplies  

Calm practical cards (already started); expand editable storage carefully in a later code phase without risky migrations in the first pass.

### 5.6 Settings (later organization)

- Household · Members · Kitchen Schedule  
- Shopping & Pantry · Messages · Notifications  
- Appearance · Backup & Data · Advanced  

---

## 6. Redesign phases

| Phase | Focus | Exit criteria |
|-------|--------|----------------|
| **1** | Global visual tokens + shared components | CSS variables + base Button/Card/Badge/EmptyState; build green |
| **2** | Sidebar + top bar redesign | AppSidebar groups + TopBar match tokens; build green |
| **3** | Pantry & Inventory redesign | InventoryItemRow, filters, steppers, badges; integrations intact; build green |
| **4** | Shopping redesign | ShoppingListRow, lists/scan/shared; library/barcode/export preserved; build green |
| **5** | Wake Page redesign | Light Home matches §5.1; no secondary-module large cards; build green |
| **6** | Smart Inventory Filter | Filter mode/page without recipes; build green |
| **7** | Emergency Planning page | Sections complete + supplies; safe data writes if added; build green |
| **8** | Calendar, Messages, Cleaning/Kitchen polish | Shared EventRow / MessageCard / ChoreCard; build green |
| **9** | Household Tools polish | Pets → Routines light shell consistency; build green |
| **10** | Settings cleanup | Sectioned settings IA; no storage wipe; build green |

**Rule:** Ship one phase at a time. Prefer restyle + composition over rewrites. Run `npm run build` after every phase.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| localStorage wipe | Never reset; never change key `familysite-491:first-family-build` |
| FamilyData breakage | Additive fields only; no field removal |
| Route breakage | Keep `/adminux`, `/shopping`, `/pantry`, etc.; aliases stay |
| Lost integrations | Inventory of barcode / OpenFoodFacts / export before Shopping & Pantry UI swaps |
| Accidental feature deletion | Pets, Subscriptions, Projects, Photos, Planner, Routines stay in sidebar |
| Recipe creep | Explicit ban; Smart Filter = inventory only |
| Contrast regression | Dark text on light surfaces; green for accent, not for body text |
| Dark / admin template relapse | Retire neon glass / AdminUX KPI walls from Home |
| Scope explosion | Phases 1→2 shell first; Pantry then Shopping before Wake |
| Member roster mismatch | Wake display order already planned; no destructive roster reset |

---

## 8. Files likely needing edits (by phase)

### Phase 1 — tokens / shared UI

- `src/styles.css` / token entry (or new `src/lib/familyHubTokens.ts` + CSS vars)  
- `src/lib/smarthrUi.ts` / `src/lib/designSystem.ts`  
- `src/components/ui/Button.tsx`, `Card.tsx`, `Field.tsx`, Badge patterns  
- Optional: `src/components/familyHub/ui/*` for ActionCard, StatusBadge, EmptyState

### Phase 2 — shell

- `src/components/layout/AppShell.tsx`  
- `src/components/layout/SidebarNav.tsx`  
- `src/components/layout/shellRoutes.ts`  
- Top bar / header pieces inside AppShell or new `TopBar.tsx`

### Phase 3 — pantry

- `src/pages/PantryPage.tsx`  
- `src/pages/inventory/*`, `src/components/pantry/*`  
- Pantry CSS modules  

### Phase 4 — shopping

- `src/pages/ShoppingPage.tsx`  
- `src/pages/shopping/*`, shopping components / CSS  
- Scan / product library entry points (preserve behavior)

### Phase 5 — wake

- `src/pages/FamilyHubDashboard.tsx`  
- `src/components/familyHub/family-hub-dashboard.css`  
- `src/lib/familyHubDashboardData.ts` (selectors only if needed)

### Phase 6 — smart inventory filter

- Pantry filter UI / query params  
- Inventory selectors / utils (`inventoryUtils`, pantry status helpers)

### Phase 7 — emergency

- `src/pages/EmergencyPlanningPage.tsx`  
- Optional safe additive FamilyData later (not required in first UI pass)

### Phase 8 — calendar / messages / cleaning

- `src/pages/CalendarPage.tsx`, `MessagesPage.tsx`, `TasksPage.tsx`  
- `src/components/events/UpcomingEventsList.tsx`

### Phase 9 — household tools

- `PetsPage`, `SubscriptionsPage`, `HouseholdSidebarToolPage`, projects/photos/routines

### Phase 10 — settings

- `src/pages/SettingsPage.tsx` (+ section components under `src/components/settings/`)

### Leave intact unless a phase requires touch

- `useFamilyData`, migrations, storage key constants  
- Supabase / cloud login paths  
- FamilyData type definitions (except careful additive fields)

---

## 9. Recommended first code phase

**Phase 1: global visual tokens and shared components.**

Why first:

1. Unlocks consistent light/green UI without rewriting modules  
2. Lets Sidebar, Pantry, Shopping, and Wake adopt the same tokens incrementally  
3. Lowest risk to routes, storage, and integrations  

Concrete first steps when coding begins:

1. Add FamilyHub CSS variables (bg, surface, accent, text, border, radius, shadow)  
2. Map primary/secondary buttons and StatusBadge to those tokens  
3. Add EmptyState + ActionCard shells  
4. Run `npm run build`  
5. Only then start Phase 2 (sidebar / top bar)

---

## 10. Success criteria (overall)

- App still boots on existing localStorage without reset  
- Home looks light, kiosk-friendly, FamilyHub-branded  
- Pantry & Shopping feel like a clean inventory dashboard (not admin template)  
- Secondary modules remain reachable from Household Tools  
- No recipe / meal / nutrition surfaces introduced  
- Each phase builds cleanly  

---

*End of Clean FamilyHub Redesign Plan — planning pass only.*

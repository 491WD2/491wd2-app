# PROJECT_AUDIT.md

**Project:** FamilySite_491 (`familysite-491`)  
**Folder audited:** `/Users/stellaroskens/491WD2`  
**Audit date:** 2026-07-16  
**Audit type:** Read-only inspection — no code, files, or packages were changed.

---

## 1. Folder summary

### Top-level layout

| Path | Purpose | Size (approx.) |
|------|---------|----------------|
| `src/` | React application source | ~4.3 MB, **366** `.ts`/`.tsx` files |
| `public/` | Static assets (PWA icons, member photos) | 10 files |
| `dist/` | Production build output | ~2.9 MB |
| `node_modules/` | Installed dependencies | ~329 MB |
| `references/` | Third-party template/reference copies (not the app) | ~639 MB |
| `docs/` | Project documentation | ~156 KB |
| `handoff/` | Client handoff bundle (dist + docs + manifest) | ~14 MB |
| `scripts/` | Build/handoff utilities | 1 script |
| `server/` | Minimal Express scaffold (optional, paused) | ~4 KB |
| `server_DISABLED/` | Disabled server experiment | ~16 MB |
| `supabase/` | Supabase migrations (optional cloud preview) | ~80 KB |
| `.tmp-pantry-export/`, `.zip-inspect/` | Temporary inspection artifacts | small |

### Key file presence

| Item | Present? | Notes |
|------|----------|-------|
| React app | **Yes** | `src/App.tsx`, `src/main.tsx`, 140+ components |
| Vite app | **Yes** | `vite.config.ts`, `index.html` entry |
| TypeScript | **Yes** | `typescript` in devDependencies; `tsconfig.json`, `tsconfig.app.json` |
| Tailwind CSS | **Yes** | `tailwindcss` + `@tailwindcss/vite`; `@import "tailwindcss"` in `src/styles.css` |
| `package.json` | **Yes** | Name: `familysite-491`, version `0.1.0` |
| `src/` | **Yes** | Full app tree (pages, components, lib, data, hooks, types, auth, context) |
| `index.html` | **Yes** | Root HTML; mounts `#root`, loads `/src/main.tsx` |
| `package-lock.json` | **Yes** | npm lockfile present |
| `deno.lock` | **Yes** | Secondary lockfile (npm is primary) |

### `src/` structure (high level)

```
src/
├── App.tsx              → renders CurrentBuild
├── CurrentBuild.tsx     → routing + lazy-loaded pages
├── main.tsx             → React root, AuthProvider, PWA SW
├── auth/                → Supabase auth context (cloud login)
├── components/          → 140+ TSX (layout, pantry, shopping, chores, dashboard, …)
├── context/             → UI customization, chore shell, household product
├── data/                → FamilyData model, localStorage repo, migrations, Supabase repo
├── hooks/               → useFamilyData, chore/dashboard hooks
├── lib/                 → 118 utility modules (seeds, analytics, preferences, …)
├── pages/               → 27 top-level page components + sub-routes
├── services/            → quick actions, Instacart export, inventory status
├── styles/              → design tokens, module-specific CSS
└── types/               → 18 TypeScript type modules
```

### Conclusion for section 1

This folder **already is** a React + TypeScript + Vite + Tailwind application named **FamilySite 491**. It is not an empty scaffold or a non-React template dump.

---

## 2. Current technology detected

### Frameworks & libraries

| Technology | Detected | Evidence |
|------------|----------|----------|
| **React** | Yes | `react`, `react-dom` dependencies; JSX throughout `src/` |
| **TypeScript** | Yes | `.ts`/`.tsx` sources; `tsc -b` in build |
| **Vite** | Yes | `vite.config.ts`, `@vitejs/plugin-react` |
| **Tailwind CSS v4** | Yes | `@tailwindcss/vite`, `@import "tailwindcss"` in `src/styles.css`, `tailwind.config.js` |
| **React Router** | **No** | Custom `history.pushState` / `popstate` routing in `CurrentBuild.tsx` |
| **PWA** | Yes | `vite-plugin-pwa`, service worker in `dist/` |
| **Jest + RTL** | Yes | 9 test files; `jest.config.cjs` |
| **Supabase** | Optional | `@supabase/supabase-js`; cloud-preview data mode |
| **Lucide React** | Yes | Icon set used in navigation and pages |
| **ESLint** | Yes | `eslint.config.js` |

### Package manager

- **Primary:** npm (`package-lock.json`, scripts use `npm run`)
- **Secondary artifact:** `deno.lock` (not used by main app scripts)

### `package.json` scripts

| Script | Command |
|--------|---------|
| `dev` | `vite --host localhost --port 5173 --strictPort` |
| `build` | `npm run typecheck && vite build` |
| `build:production` | same as `build` |
| `typecheck` | `tsc -b` |
| `start` / `preview` | `vite preview --host 0.0.0.0 --port 4173` |
| `lint` | `eslint .` |
| `test` | `jest` |
| `test:watch` | `jest --watch` |
| `handoff` | `node scripts/package-client-handoff.mjs` |

### Runtime architecture notes

- Entry: `index.html` → `src/main.tsx` → `App.tsx` → `CurrentBuild.tsx`
- State: single `FamilyData` object persisted to **localStorage** via `useFamilyData`
- Routing: path segments (`/dashboard`, `/pantry`, `/shopping`, …) parsed manually — no `react-router-dom`
- Extra product surfaces beyond the target spec: UI customization, kiosk mode, cloud login preview, subscriptions, docs/notes, projects placeholder, chore analytics PWA

---

## 3. Data audit

### Central data model

**File:** `src/data/familyData.ts` (~1,900+ lines)

Defines `FamilyData` with:

| Domain | In model | Seed data in `initialFamilyData` |
|--------|----------|----------------------------------|
| Admin / settings | `adminSettings` | Yes (household name `FamilySite_491`, module visibility, kiosk flags) |
| Family members | `familyMembers` | Yes (canonical household via `createCanonicalHouseholdFamilyMembers()`) |
| Tasks / chores | `tasks` | Yes (4 sample tasks) |
| Shopping | `shopping`, `groceryItems` | Yes (6 grocery catalog items) |
| Pantry / inventory | `pantry` | Yes (sample items) |
| Calendar / planner | `planner`, `calendarLinks` | Yes |
| Cleaning | `cleaningRooms`, `cleaningCompletionRecords` | Yes (playbook templates) |
| Kitchen | `kitchenSchedule`, `kitchenDutyCompletions`, `kitchenChecklist` | Yes |
| **Messages** | `messageBoard: MessageBoardItem[]` | **Empty array** in seed |
| Notifications | `notifications` | Yes |
| Pets | `pets`, `petMedicationEntries` | Normalized via migrations when missing |
| Docs / projects | `docs`, `projects` | Yes |
| Activity log | `activityLog` | Yes |

`createDefaultFamilyData()` deep-clones `initialFamilyData` for first-run / reset behavior.

### LocalStorage layer

| File | Role |
|------|------|
| `src/data/localFamilyRepository.ts` | Read/write `FamilyData` to localStorage key `familysite-491:first-family-build` |
| `src/hooks/useFamilyData.ts` | React state + auto-save; optional Supabase cloud-preview mode |
| `src/data/familyMigrations.ts` | Versioned migration + normalization on load |
| `src/lib/dataSafety.ts` | Pre-migration backup keys, last-export timestamp |
| `src/lib/userPreferences.ts`, `appearancePreferences.ts`, `sidebarUi.ts`, etc. | UI-only localStorage (not in household backup) |

### Seed / import data files

| File | Contents |
|------|----------|
| `src/data/familyData.ts` | Built-in `initialFamilyData` seed |
| `src/lib/choreSeeds.ts` | Chore import seeds |
| `src/lib/grocerySeeds.ts` | Grocery import seeds |
| `src/lib/choreZipSeed.ts` | Notion ZIP chore export seed (159 records) |
| `src/data/cleaningPlaybookTemplates.ts` | Room cleaning starter templates |
| `src/lib/groceryLibraryData.ts` | Large household product library (~4,900 lines) |

**No standalone JSON seed files** in the repo root; seeds are TypeScript modules.

### TypeScript interfaces / types

`src/types/` contains 18 modules including: `inventory`, `shopping`, `grocery`, `pantry`, `pantryBoard`, `chore`, `cleaning`, `calendarPlanner`, `homeDashboard`, `memberTasks`, and chore-AI/analytics types.

Core household types live in `src/data/familyData.ts` (exported types for members, tasks, pantry, messages, pets, etc.).

### Backup / import / export utilities

| Location | Capability |
|----------|------------|
| `src/pages/SettingsPage.tsx` | **Export backup** → downloads `familysite-491-backup-YYYY-MM-DD.json` (`backupFormat: familysite-491.backup.v1`) |
| `src/pages/SettingsPage.tsx` | **Import backup** → file picker + paste JSON; runs `migrateFamilyData` / `normalizeFamilyData` |
| `src/pages/SettingsPage.tsx` | Staged imports for chores, groceries, inventory |
| `src/data/localFamilyRepository.ts` | `exportFamilyData()` / repository interface |
| `src/data/familyRepository.ts` | Abstract `FamilyRepository` contract |
| `src/lib/dataSafety.ts` | Automatic pre-migration localStorage snapshots |
| `src/services/instacartExport.ts` | Shopping list export to Instacart (optional integration) |

### Family / member / message / module data status

| Data type | Stored where | UI surface |
|-----------|--------------|------------|
| Family members | `FamilyData.familyMembers` | Settings → Members & PINs, `/family`, member dashboards |
| Member PINs | `FamilyMember.pinCode` (4-digit) | Settings roster, Member dashboard PIN editor; helpers in `src/lib/memberPin.ts` |
| Household messages | `FamilyData.messageBoard` | **Data + selectors only** — shown on dashboard via `selectImportantMessages*`; **no `/messages` route** |
| Calendar | `planner`, `calendarLinks` | `/calendar` (`CalendarPage.tsx`, ~2,000 lines) |
| Shopping | `shopping`, `groceryItems` | `/shopping` |
| Pantry | `pantry` | `/pantry` |
| Cleaning | `tasks`, `cleaningRooms` | `/tasks`, `/cleaning/*` |
| Kitchen | `kitchenSchedule`, `kitchenChecklist` | `/kitchen`, `/kitchen-schedule` |
| Pets | `pets`, `petMedicationEntries` | `/pets` |
| Notifications | `notifications` | `/notifications` + dashboard cards |

**Important:** App data at runtime lives in the **browser localStorage** of each device, not in committed project files. The repo ships **seed templates**, not live household data.

---

## 4. Template / assets audit

### Reference-only folders (not part of the React app)

| Path | Technology | Status |
|------|------------|--------|
| `references/pantry-tracker/pantry_tracker-main/` | **Python Flask** webapp (`app.py`, Jinja templates) | Reference only |
| `references/sneat-bootstrap-html-laravel-admin-template-free-main/` | **Laravel + Bootstrap** admin template (includes its own `node_modules`) | Reference only |
| `references/notion-pantry-mcp/` | **Node/TypeScript** MCP server | Reference only |
| `references/instacart-token-refresh/` | **Python** token refresh example | Reference only |

### Previously served template copies (removed from working tree)

Git status and docs indicate these were deleted locally (not present on disk now):

- `public/reference-pages/` — static HTML pantry demos
- `public/template-workbench/` — Sneat HTML workbench + pantry HTML copies

Docs still reference them (`docs/reference-pages-inventory.md`, `docs/template-workbench-inventory.md`) but **`public/` currently contains only PWA icons and `public/images/members/*.png`**.

### App assets (in use)

| Path | Contents |
|------|----------|
| `public/pwa-*.png`, `apple-touch-icon.png` | PWA / home-screen icons |
| `public/images/members/` | 5 member avatar PNGs (stella, lorraine, herschel, jeremiah, nox) |
| `src/styles/`, `src/**/*.css` | App styling (Tailwind + custom CSS modules) |
| `handoff/` | Packaged delivery artifact (dist + screenshots + docs) |

### Non-React template files in repo

- **Angular:** not detected
- **Vue:** not detected in app; Sneat reference uses Laravel/Vite internally
- **PHP/Yii:** not detected
- **Plain HTML:** in `references/` only (Pantry Tracker templates, Sneat generated HTML)
- **Python:** Pantry Tracker reference webapp

**Marking:** Everything under `references/` is **reference only**. The running app is entirely under `src/` + `public/` icons.

---

## 5. Missing pieces checklist

Legend: ✅ exists and routed · 🟡 partial / needs completion · ❌ missing · ➕ extra (beyond spec)

### Project foundation

| Item | Status | Notes |
|------|--------|-------|
| React + TS + Vite + Tailwind scaffold | ✅ | Fully configured and building (`dist/` present) |
| npm scripts (dev/build/test) | ✅ | Documented in README |
| PWA / offline shell | ➕ | Extra — not in original spec |
| Supabase cloud preview | ➕ | Extra — optional backend path |

### Core architecture

| Item | Status | Notes |
|------|--------|-------|
| Routing | 🟡 | Works via custom history API; no `react-router-dom`; many legacy route aliases |
| Layout / sidebar / navigation | ✅ | `AppShell`, `SidebarNav`, mobile bottom nav, kiosk shell |
| Data model (`FamilyData`) | ✅ | Comprehensive single-store model |
| LocalStorage persistence | ✅ | `localFamilyRepository` + `useFamilyData` |
| Seed data | ✅ | `initialFamilyData` + chore/grocery ZIP seeds |
| TypeScript types | ✅ | `src/types/` + inline exports in `familyData.ts` |

### Utility features

| Item | Status | Notes |
|------|--------|-------|
| Member / PIN login | 🟡 | PIN **storage & management** in Settings/Member pages; `onSwitchUser` / `onLockScreen` props exist in shell but **not wired in `CurrentBuild.tsx`**; no dedicated PIN-entry screen found |
| Quick Add | ✅ | `/quick-add` (`QuickAddPage.tsx`) |
| LocalStorage persistence | ✅ | Primary data path |
| Backup / export | ✅ | Settings → Backup & Data → JSON download |
| Import / restore | ✅ | Settings import + migration pipeline |
| Notifications / reminders | ✅ | `/notifications` + sync helpers (chores, calendar, kitchen, pets) |

### Main modules (target spec)

| # | Module | Status | Current implementation |
|---|--------|--------|------------------------|
| 1 | **Home** | ✅ | `/dashboard` → `DashboardPage` (hub cards, today snapshot, cleaning, pantry, shopping, week view) |
| 2 | **Messages** | 🟡 | `messageBoard` data model + dashboard selectors; chore per-member message strings; **no dedicated Messages page or nav item** |
| 3 | **Calendar** | ✅ | `/calendar` → `CalendarPage` (planner, links, reminders) |
| 4 | **Shopping** | ✅ | `/shopping` → `ShoppingPage` |
| 5 | **Pantry & Inventory** | ✅ | `/pantry` → `PantryPage` (+ inventory sub-pages, barcode/QR tooling) |
| 6 | **Cleaning / Kitchen** | ✅ | `/tasks` (cleaning), `/kitchen`, `/kitchen-schedule`, `/chores` kiosk |
| 7 | **Pets** | ✅ | `/pets` → `PetsPage` |
| 8 | **Settings** | ✅ | `/settings` → large `SettingsPage` (members, backup, customization, kitchen, notifications) |

### Quality / cleanup

| Item | Status | Notes |
|------|--------|-------|
| Responsive / mobile styling | ✅ | Mobile header, bottom nav, guided kiosk sheets, drawer patterns |
| Build pipeline | ✅ | `npm run build` produces `dist/` |
| Tests | 🟡 | 9 unit tests (chore analytics, a11y, pantry insights); not full module coverage |
| Reference folder hygiene | 🟡 | `references/` is 639 MB including vendored `node_modules`; docs describe deleted `public/template-workbench` |
| Legacy / duplicate pages | 🟡 | `HomeDashboardPage`, `FoodInventoryDashboard`, `PlannerPage`, `ProjectsPage`, `DocsPage` exist alongside canonical routes; some hidden behind `HiddenModulePage` |
| UI Builder / customization | ➕ | `ui-builder.css`, `UiCustomizationContext` — extra complexity beyond baseline family app |

---

## 6. Recommended next step

### **Path A — Continue from the existing app** ✅ Recommended

This folder **already contains a usable React + TypeScript + Vite + Tailwind family management application** (`FamilySite_491`). Re-scaffolding (Path B) would duplicate substantial working code. Separating templates (Path C) is partially done — references are already isolated under `references/`, though that folder is large and could be trimmed or gitignored later.

### Suggested immediate priorities (no code changes in this audit)

1. **Run the app locally** — `npm run dev` → http://localhost:5173/ (per README).
2. **Map spec modules to existing routes** — most modules exist; align naming/navigation with the 8-module spec (especially **Messages**).
3. **Build the Messages module** — add a `/messages` route and CRUD UI for `FamilyData.messageBoard` (data layer already exists).
4. **Finish Member/PIN login UX** — wire `onSwitchUser` / `onLockScreen` and add a PIN pad screen using `membersMatchingPin()`.
5. **Decide on extras** — kiosk mode, UI builder, subscriptions, cloud preview, and `references/` bulk: keep, hide, or remove in a future cleanup pass (not part of this audit).
6. **Verify backup round-trip** — export from Settings, clear localStorage, import, confirm migrations.

### Why not Path B or C?

| Path | Verdict |
|------|---------|
| **B** (create clean app) | Not needed — foundation is complete and production-built |
| **C** (separate templates + new app) | Templates are already under `references/`; app is already separate; optional cleanup of `references/` size only |

---

## 7. Audit constraints observed

- No application source was modified.
- No packages were installed.
- No files were deleted, moved, or overwritten.
- Only this audit document (`PROJECT_AUDIT.md`) was created.

---

*End of audit.*

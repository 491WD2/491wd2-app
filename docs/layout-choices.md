# Layout choices (491WD)

This document lists **page-level layouts, shells, previews, builder surfaces, help content, and export templates** discovered under `src/`, plus the integrated tool shell in `src/App.tsx`. The **authoritative structured list** used by the in-app **Layout Choices** tab lives in `src/lib/layoutChoicesContent.ts` — update that file first, then keep this document aligned.

**How to preview in the app:** use the top switcher tab **Layout Choices** (next to Help Center). For household routes, use **My Build** and navigate with the sidebar or URLs documented below.

---

## App Pages

### 491WD integrated tool shell

- **File path:** `src/App.tsx`
- **Used for:** Top-level wrapper with tab switcher between My Build, UI Builder, Saved UI Preview, Help Center, and Layout Choices.
- **Main sections / components:** `IntegratedSwitcher`, `AppRoutes`, `HelpModeProvider`
- **Visible in app:** Yes — always at the root.
- **How to open / preview:** Load the SPA; the switcher is sticky at the top.

### My Build (CurrentBuild)

- **Category:** App Pages
- **File path:** `src/CurrentBuild.tsx`
- **Used for:** Lazy-loaded household router: `AppShell`, `parsePath`, `Suspense`, `ModuleGate`, and all lazy module pages.
- **Main sections / components:** Route switch, `AppShell` outlet, lazy page components
- **Visible in app:** Yes — **My Build** tab.
- **How to open / preview:** Top tab → **My Build**; use sidebar and URLs.

### Layout Choices

- **Category:** Documentation / Help
- **File path:** `src/pages/LayoutChoicesPage.tsx`
- **Used for:** Visual catalog with search, filters, cards, and detail panel for every documented layout surface.
- **Main sections / components:** Toolbar, filter chips, card grid, sticky detail panel
- **Visible in app:** Yes — **Layout Choices** tab.
- **How to open / preview:** Top tab → **Layout Choices**.

### Original household app shell (AppShell)

- **File path:** `src/components/layout/AppShell.tsx`
- **Used for:** Sidebar, headers, and main outlet for all household modules routed from `CurrentBuild`.
- **Main sections / components:** Sidebar, main content, mobile nav patterns
- **Visible in app:** Yes — inside **My Build** for routed pages.
- **How to open / preview:** **My Build** → navigate to `/`, `/settings`, `/calendar`, etc.

### ModuleGate

- **File path:** `src/components/layout/ModuleGate.tsx`
- **Used for:** Locked overlay when a module is disabled in admin settings.
- **Main sections / components:** Locked overlay, children outlet
- **Visible in app:** Yes — when a gated route is hidden.
- **How to open / preview:** Disable a module in Settings, then open that route.

### AppLoading (Suspense fallback)

- **File path:** `src/components/layout/AppLoading.tsx`
- **Used for:** Lazy-route loading state inside `CurrentBuild` Suspense.
- **Main sections / components:** Centered loading UI
- **Visible in app:** Yes — briefly during chunk loads.
- **How to open / preview:** Throttle network and switch routes in **My Build**.

### DashboardPage (home)

- **File path:** `src/pages/DashboardPage.tsx`
- **Used for:** Household home dashboard and shortcuts.
- **Main sections / components:** Greeting, tiles, notifications snapshot, `DashboardLayoutControls`
- **Visible in app:** Yes — route `/`.
- **How to open / preview:** **My Build** → Home.

### FamilyMembersPage

- **File path:** `src/pages/FamilyMembersPage.tsx`
- **Used for:** Member roster before drilling into a member dashboard.
- **Main sections / components:** Member list, navigation to member view
- **Visible in app:** Yes — `/family`.
- **How to open / preview:** **My Build** → Members (no id in path).

### MemberDashboardPage

- **File path:** `src/pages/MemberDashboardPage.tsx`
- **Used for:** Per-member household dashboard.
- **Main sections / components:** Member summary, widgets, back to roster
- **Visible in app:** Yes — `/family/:memberId`.
- **How to open / preview:** Pick a member from the roster.

### TasksPage (cleaning)

- **File path:** `src/pages/TasksPage.tsx`
- **Used for:** Cleaning / task workflows.
- **Main sections / components:** Task lists, scheduling UI
- **Visible in app:** Yes — `/tasks`.
- **How to open / preview:** **My Build** → Cleaning.

### KitchenChecklistPage

- **File path:** `src/pages/KitchenChecklistPage.tsx`
- **Used for:** Kitchen assignment checklist.
- **Main sections / components:** Checklist, nav to dashboard
- **Visible in app:** Yes — `/kitchen`.
- **How to open / preview:** **My Build** → Kitchen Assignments.

### KitchenSchedulePage

- **File path:** `src/pages/KitchenSchedulePage.tsx`
- **Used for:** Kitchen schedule surface.
- **Main sections / components:** Schedule UI, navigation
- **Visible in app:** Yes — `/kitchen-schedule`.
- **How to open / preview:** **My Build** → Kitchen Schedule.

### PetsPage

- **File path:** `src/pages/PetsPage.tsx`
- **Used for:** Pets module.
- **Main sections / components:** Pet list, detail areas
- **Visible in app:** Yes — `/pets`.
- **How to open / preview:** **My Build** → Pets.

### HiddenModulePage (projects & docs routes)

- **File path:** `src/pages/HiddenModulePage.tsx`
- **Used for:** Placeholder for `/projects` and `/docs` instead of full `ProjectsPage` / `DocsPage`.
- **Main sections / components:** Title, navigation to home/settings
- **Visible in app:** Yes — `/projects`, `/docs`.
- **How to open / preview:** **My Build** → those URLs or nav shortcuts.

### PantryPage

- **File path:** `src/pages/PantryPage.tsx`
- **Used for:** Pantry and inventory.
- **Main sections / components:** Inventory grid, shopping links
- **Visible in app:** Yes — `/pantry`.
- **How to open / preview:** **My Build** → Pantry & Inventory.

### ShoppingPage

- **File path:** `src/pages/ShoppingPage.tsx`
- **Used for:** Shopping list.
- **Main sections / components:** List, purchased filters, pantry handoff
- **Visible in app:** Yes — `/shopping`.
- **How to open / preview:** **My Build** → Shopping.

### CalendarPage (planner alias)

- **File path:** `src/pages/CalendarPage.tsx`
- **Used for:** Calendar; `/planner` resolves to the same route in `parsePath`.
- **Main sections / components:** Calendar grid, events
- **Visible in app:** Yes — `/calendar` and `/planner`.
- **How to open / preview:** **My Build** → Calendar or planner URL.

### MessagesPage

- **File path:** `src/pages/MessagesPage.tsx`
- **Used for:** Household messaging.
- **Main sections / components:** Threads, composer patterns
- **Visible in app:** Yes — `/messages`.
- **How to open / preview:** **My Build** → Messages.

### NotificationsPage

- **File path:** `src/pages/NotificationsPage.tsx`
- **Used for:** Notification center.
- **Main sections / components:** Feed, dismiss actions
- **Visible in app:** Yes — `/notifications`.
- **How to open / preview:** **My Build** → Notifications.

### SubscriptionsPage

- **File path:** `src/pages/SubscriptionsPage.tsx`
- **Used for:** Subscriptions tracking.
- **Main sections / components:** List, detail drawers
- **Visible in app:** Yes — `/subscriptions`.
- **How to open / preview:** **My Build** → Subscriptions.

### SettingsPage

- **File path:** `src/pages/SettingsPage.tsx`
- **Used for:** Admin and household settings.
- **Main sections / components:** Tabbed sections, `AppearanceLayoutEditor`
- **Visible in app:** Yes — `/settings`.
- **How to open / preview:** **My Build** → Settings.

### QuickAddPage

- **File path:** `src/pages/QuickAddPage.tsx`
- **Used for:** Fast capture from `/quick-add`.
- **Main sections / components:** Forms, return to dashboard
- **Visible in app:** Yes — `/quick-add`.
- **How to open / preview:** **My Build** → `/quick-add`.

### KioskPage

- **File path:** `src/pages/KioskPage.tsx`
- **Used for:** Kiosk home when enabled.
- **Main sections / components:** Greeting, launcher grid
- **Visible in app:** Yes — `/kiosk` (with kiosk enabled).
- **How to open / preview:** Enable kiosk in settings, then open `/kiosk`.

### LoginPage (cloud login)

- **File path:** `src/pages/LoginPage.tsx`
- **Used for:** Cloud login surface.
- **Main sections / components:** Form, back to app
- **Visible in app:** Yes — `/cloud-login`.
- **How to open / preview:** Login affordance in shell or direct URL.

### NotFoundPage

- **File path:** `src/pages/NotFoundPage.tsx`
- **Used for:** Unknown routes.
- **Main sections / components:** Message, recovery buttons
- **Visible in app:** Yes — invalid first path segment.
- **How to open / preview:** Visit a non-existent path under **My Build**.

### ProjectsPage (file only)

- **File path:** `src/pages/ProjectsPage.tsx`
- **Used for:** Full workspace UI — **not** wired in `CurrentBuild` (placeholder used instead).
- **Main sections / components:** Project columns, boards
- **Visible in app:** No — swap routing to mount it.
- **How to open / preview:** Wire into `CurrentBuild` for `/projects`.

### DocsPage (file only)

- **File path:** `src/pages/DocsPage.tsx`
- **Used for:** Notes module — **not** wired; `/docs` uses `HiddenModulePage`.
- **Main sections / components:** Docs list, editor patterns
- **Visible in app:** No.
- **How to open / preview:** Replace `HiddenModulePage` mapping for `/docs`.

### PlannerPage (file only)

- **File path:** `src/pages/PlannerPage.tsx`
- **Used for:** Alternate planner — routing uses `CalendarPage` for `/planner`.
- **Main sections / components:** Planner-specific layout
- **Visible in app:** No.
- **How to open / preview:** Change `parsePath` / route switch if split from calendar.

### PageSectionShell

- **File path:** `src/components/layout/PageSectionShell.tsx`
- **Used for:** Collapsible sections (e.g. dashboard priority loop).
- **Main sections / components:** Header, size cycle, collapse, optional hide
- **Visible in app:** Yes — e.g. `DashboardPriorityLoop` on Home.
- **How to open / preview:** **My Build** → Home → expandable sections.

### DashboardLayoutControls

- **File path:** `src/components/dashboard/DashboardLayoutControls.tsx`
- **Used for:** Dashboard density and ordering.
- **Main sections / components:** Control strip, presets
- **Visible in app:** Yes — on `DashboardPage`.
- **How to open / preview:** **My Build** → Home → layout controls.

### AppearanceLayoutEditor

- **File path:** `src/components/settings/AppearanceLayoutEditor.tsx`
- **Used for:** Theme and appearance layout preferences.
- **Main sections / components:** Tokens, preview, toggles
- **Visible in app:** Yes — within Settings.
- **How to open / preview:** **My Build** → Settings → appearance area.

### PageHeader (ui)

- **File path:** `src/components/ui/PageHeader.tsx`
- **Used for:** Generic page header primitive.
- **Main sections / components:** Title, description, actions
- **Visible in app:** No — no current imports.
- **How to open / preview:** Import into a new page.

### SmarthrPageShell

- **File path:** `src/components/smarthr/SmarthrPageShell.tsx`
- **Used for:** Smarthr-style max-width shell.
- **Main sections / components:** Centered container, children
- **Visible in app:** No — compose manually.
- **How to open / preview:** Wrap a new route component.

### SmarthrPageHeader

- **File path:** `src/components/smarthr/SmarthrPageHeader.tsx`
- **Used for:** Admin-style header paired with `SmarthrPageShell`.
- **Main sections / components:** Eyebrow, title row, toolbar
- **Visible in app:** No.
- **How to open / preview:** Compose with `SmarthrPageShell`.

### NotionPage workspace primitives

- **File path:** `src/components/workspace/NotionPage.tsx`
- **Used for:** Notion-like document layout blocks.
- **Main sections / components:** Cover, header, title, body
- **Visible in app:** No — unused in routes today.
- **How to open / preview:** Import into a notes/docs screen.

---

## Builder Layouts

### UiBuilderPage

- **File path:** `src/UiBuilderPage.tsx`
- **Used for:** Drag-and-drop UI Builder (palette, canvas, inspector, export, apply).
- **Main sections / components:** `wd-app-shell` grid, sidebar, canvas, inspector, export modal
- **Visible in app:** Yes — **UI Builder** tab.
- **How to open / preview:** Top tab → UI Builder.

### uiBuilderLayout (data + preview helpers)

- **File path:** `src/lib/uiBuilderLayout.tsx`
- **Used for:** Starter canvas, serialization, `renderPreview` wiring.
- **Main sections / components:** Starter canvas, catalog metadata, preview hooks
- **Visible in app:** Yes — indirectly via builder and previews.
- **How to open / preview:** Edit in IDE or use builder/preview tabs.

### UI Builder — component preview cards (canvas)

- **Category:** Builder Layouts
- **File path:** `src/UiBuilderPage.tsx` (canvas) + `src/lib/uiBuilderLayout.tsx` (`renderPreview`)
- **Used for:** Inline preview cards on each canvas row while editing (distinct from the read-only Saved UI Preview grid).
- **Main sections / components:** Canvas cells, `renderPreview`, row inspector
- **Visible in app:** Yes — **UI Builder** tab.
- **How to open / preview:** Top tab → UI Builder → inspect rows on the canvas.

---

## Preview Layouts

### UiLayoutRenderer (Saved UI Preview tab)

- **File path:** `src/components/UiLayoutRenderer.tsx`
- **Used for:** Read-only full-page preview of saved layout from storage.
- **Main sections / components:** Hero, `CanvasPreviewGrid`
- **Visible in app:** Yes — **Saved UI Preview** tab.
- **How to open / preview:** Top tab → Saved UI Preview.

### CanvasPreviewGrid

- **File path:** `src/components/CanvasPreviewGrid.tsx`
- **Used for:** 12-column read-only preview cards.
- **Main sections / components:** Grid, per-component preview
- **Visible in app:** Yes — Saved UI Preview and Applied section.
- **How to open / preview:** Same as above or scroll **My Build** after apply.

---

## Applied Layouts

### AppliedUiSection (My Build)

- **File path:** `src/components/AppliedUiSection.tsx`
- **Used for:** Shows applied builder layout below `CurrentBuild` on **My Build**.
- **Main sections / components:** Section heading, `CanvasPreviewGrid` (applied storage key)
- **Visible in app:** Yes — **My Build** after Apply.
- **How to open / preview:** UI Builder → Apply to My Build → **My Build** (scroll down).

---

## Documentation / Help

### HelpCenterPage

- **File path:** `src/pages/HelpCenterPage.tsx`
- **Used for:** In-app help with search, filters, TOC, articles.
- **Main sections / components:** Toolbar, TOC, article reader
- **Visible in app:** Yes — **Help Center** tab.
- **How to open / preview:** Top tab → Help Center.

### helpCenterContent (static articles)

- **File path:** `src/lib/helpCenterContent.ts`
- **Used for:** Article data for Help Center.
- **Main sections / components:** Article groups, blocks, cross-links
- **Visible in app:** Yes — when reading articles in Help Center.
- **How to open / preview:** Help Center → pick an article.

---

## Export / Generated Layouts

### generateExportedUiLayoutTsx

- **File path:** `src/lib/generateExportedUiLayoutTsx.ts`
- **Used for:** Generates standalone `ExportedUiLayout` TSX string for **Export React Code**.
- **Main sections / components:** String template, `EXPORTED_ITEMS`, standalone render helpers
- **Visible in app:** Yes — export modal in UI Builder.
- **How to open / preview:** **UI Builder** → Export React Code.

### ExportedUiLayout (generated React layout)

- **Category:** Export / Generated Layouts
- **File path:** Generated TSX (produced by `src/lib/generateExportedUiLayoutTsx.ts`; not a fixed committed file)
- **Used for:** Portable default-export React component with embedded `EXPORTED_ITEMS` and preview helpers.
- **Main sections / components:** `EXPORTED_ITEMS`, render helpers, `ExportedUiLayout` root
- **Visible in app:** Yes — as copied text in the export modal.
- **How to open / preview:** **UI Builder** → Export React Code → copy TSX.

---

## Related in-repo references

- Route wiring and lazy pages: `src/CurrentBuild.tsx`
- Nav keys and icons: `src/components/layout/shellRoutes.ts`
- Integrated tab shell styles: `src/ui-builder.css` (`wd-integrated-*`, `wd-layout-choices*`)
- UI Builder preview variants: `src/lib/componentVariantOptions.ts`, `settings.variant` in canvas JSON, `_standaloneRenderFragment.txt` (embedded in Export React Code)

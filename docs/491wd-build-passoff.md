# 491WD My Build — client passoff

Last updated: 2026-05-14

## Scope

Production QA pass for the My Build kiosk shell before new feature work. Focus: sidebar navigation, browser route restore, layout stability on Surface Pro landscape, and Shopping/Pantry/Inventory grocery flows.

## QA status

| Check | Status | Notes |
| --- | --- | --- |
| Sidebar: Home, Shopping, Pantry, Inventory, Product Library, Scan Product | Pass | Registered in `src/lib/appNavigation.ts` and rendered from `src/components/AppSidebar.tsx`. |
| Browser path / back-forward restore | Pass | `resolveAppShellFromHref()` hydrates My Build shell state from the current URL; `popstate` keeps sidebar selection aligned. |
| Sidebar collapse / expand | Pass | Collapsed width and labels persist via localStorage; main content keeps `min-width: 0`. |
| Surface Pro landscape overflow | Pass | `overflow-x: clip` on integrated app, My Build layout, and Shopping kiosk at 1368px landscape. |
| Shopping Most Used Add buttons | Pass | Card grid uses five columns on Surface Pro landscape; labels clamp and Add buttons stay below text. |
| Pantry / Inventory kiosk actions | Pass | No regressions in this pass; routes `/pantry` and `/pantry?view=pantry` resolve separately. |
| Scan Product / Product Detail | Pass | Scan opens `/shopping?action=scan`; product detail and scan panels remain in the module shell. |
| Production build | Pass | `npm run build` completes successfully. |
| Inventory activity history | Pass | Saved add/use/shopping actions persist in localStorage and show in the Inventory Summary panel. |
| Inventory undo last change | Pass | Restores the latest saved add_stock or use_item quantity; add_to_shopping stays in history only. |
| Product Library Manager | Pass | Header stats, filters, product grid, duplicate review, and merge confirmation via Product Detail. |
| Release Checklist (Tools) | Pass | Internal Surface Pro sign-off page with Pass / Needs Fix / Notes; persists to localStorage. |
| Chores (Housekeeping Tracker) | Pass | Notion ZIP export (159 tasks), checklist pages, room detail, supplies, localStorage completions. |

## Chores (Household schedule foundation)

- `/chores` — verification view (today, week, per-member schedules) while UI is rebuilt.
- Foundation: `src/lib/choreData.ts` — rule seed + ZIP-derived chores (159 export rows, trash filtered per household rules).
- Members: Lorraine, Herschel, Stella, Nox, Jeremiah.
- Rules: weekday kitchen rotation (M–F), 3-week weekend kitchen cycle, Saturday deep-clean rotation, Nox/Jeremiah living room & bathroom alternation, entry/laundry/trash duties for Jeremiah, personal responsibility daily for all.
- Kitchen duty priority: other chores for that member are skipped with reason when kitchen duty applies.
- localStorage: `491wd-chore-state`, `491wd-member-schedules`, `491wd-chore-notes` (legacy `491wd-chores-state` completions migrated).
- Types: `ChoreTask`, `MemberSchedule`, `Checklist` in `src/types/cleaning.ts`.
- Legacy ZIP kiosk layer remains in `src/lib/cleaningData.ts` for `/cleaning/*` routes until migrated.
- No gamification (no points, stars, prizes, badges, or allowance).

## Release Checklist

- Sidebar: **Tools → Release Checklist** (`/release-checklist`).
- Storage key: `491wd-kiosk-release-checklist`.
- Sections: sidebar navigation, Home, Shopping, Pantry, Inventory, Product Library, Scan Product, Product Detail, Surface Pro layout, localStorage persistence.
- Each row: **Pass**, **Needs fix**, notes textarea; **Reset checklist** restores defaults.

## Product Library Manager

- Route: `/product-library` (sidebar **Product Library**).
- Header: total products, missing images, missing barcodes, possible duplicates; **Scan Product** and **New Product** gradient actions.
- Toolbar filters: search, category, store, status (all, missing image/barcode/store, duplicates, on shopping list, in pantry).
- Product cards: image or letter tile, name, brand, category badge, store, barcode/shopping/pantry chips, missing-data badges, card actions (view/edit, add to shopping/pantry, OpenFoodFacts).
- Duplicate review: same barcode or normalized name + category; **Review**, **Merge** (opens Product Detail with confirm merge), **Keep separate**.
- Persistence: existing grocery library localStorage (`491wd-grocery-extra-products`, library overrides, duplicate dismissals, merged targets) — no backend changes.

## Navigation map

### Kiosk sidebar (default)

| Sidebar label | Page id | Browser path |
| --- | --- | --- |
| Home | `home` | `/` |
| Shopping | `shopping` | `/shopping` |
| Pantry | `pantry` | `/pantry?view=pantry` |
| Inventory | `inventory` | `/pantry` |
| Product Library | `product-library` | `/product-library` |
| Scan Product | `scan-product` | `/shopping?action=scan` |
| Chores | `chores` | `/chores` |
| Members | `members` | `/family` |

### Admin sidebar (Tools — enable with sidebar **Show admin tools** or `localStorage` key `491wd-show-admin-nav` = `1`, or open `/admin/backend` / `?admin=1`)

| Sidebar label | Page id | Browser path |
| --- | --- | --- |
| Release Checklist | `release-checklist` | `/release-checklist` |
| Backend Console | `backend-console` | `/admin/backend` |

### Hidden from sidebar (deep links still work)

| Label | Page id | Browser path |
| --- | --- | --- |
| Cleaning sub-flows | `cleaning-*` | `/cleaning/...` |
| Calendar | `calendar` | `/calendar` |
| Messages | `messages` | `/messages` |
| Notes | `notes` | `/` (planned module) |
| Family Hub | `family-hub` | `/` |

### Backend Console only (builder / reference — not in My Build sidebar)

UI Builder, Template Workbench, Saved UI Preview, Reference Pages, Layout Choices, Page Composer, Help Center, and related palette entries live in `src/lib/backendConsoleNav.ts` and render inside `BackendConsolePage` at `/admin/backend`.

## Inventory activity history

- Storage key: `491wd-grocery-inventory-activity`
- Entry fields: `id`, `productId`, `productName`, `action` (`add_stock` | `use_item` | `add_to_shopping`), `quantityChange`, `previousQuantity`, `newQuantity`, `unit`, `timestamp`, optional `cartLineId`, optional `undone`
- Save commits staged kiosk quantity deltas and appends activity rows.
- Recent Activity in the Inventory Summary panel lists product name, action label, quantity change with unit, and a friendly timestamp.
- Undo Last Change restores the most recent undoable add_stock or use_item row, marks that row `undone`, and refreshes kiosk quantities through the household product context.

## Fixes in this pass

- Product Library Manager polish: header, filters, quality badges, duplicate merge confirmation (`src/pages/ProductLibraryPage.tsx`, `src/components/ProductDetailPanel.tsx`, `src/lib/groceryLibraryData.ts`, `src/ui-builder.css`).
- Inventory activity history and quantity-only undo in the Inventory Summary panel (`src/lib/groceryProductActions.ts`, `src/pages/inventory/InventoryViews.tsx`, `src/types/grocery.ts`, `src/ui-builder.css`).
- URL hydration and `popstate` sync for My Build shell state (`src/App.tsx`, `src/lib/appNavigation.ts`).
- Surface Pro landscape overflow guards and Shopping Most Used card spacing (`src/ui-builder.css`).

## Known limits

- Family Hub and Home both use `/`; a full reload on `/` opens the Home dashboard unless navigation state is already in memory.
- In-module navigation inside `CurrentBuild` updates the URL without always updating My Build shell state until the next sidebar click or history event.

## Build

```bash
npm run build
```

Expected: TypeScript project build and Vite production bundle complete with no errors.

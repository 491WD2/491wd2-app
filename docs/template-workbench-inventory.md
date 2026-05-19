# Template Workbench inventory

## Summary

| Kind | Count | Live iframe |
|------|------:|-------------|
| Pantry Tracker HTML (copied) | 3 pages + static bundle | Yes (`/template-workbench/html/…`) |
| **Sneat (Laravel free pack)** | ~44 generated standalone HTML pages | Yes (`/template-workbench/sneat/html/…`) |
| SmartHR-style React sources | 10 modules | No (paths under `src/components/smarthr/`) |

Original Sneat sources live under `references/sneat-bootstrap-html-laravel-admin-template-free-main/` and are **not** edited by the workbench build. Generated HTML and vendored build output are written to `public/template-workbench/sneat/`.

### Catalog path rules (Workbench UI)

- **Static HTML** entries use `publicPath` under `public/template-workbench/…` and `iframeSrc` as a **site-root URL** starting with `/template-workbench/…` (never a filesystem path).
- **React-only** entries use `publicPath` under `src/…` and `iframeSrc: null`.
- Optional **`thumbnailSrc`**: site-root image URL (e.g. `/template-workbench/thumbs/foo.png`) for raster card thumbnails when you add assets.

### List card previews

The Template Workbench list shows, per card:

- **Optional image** when `thumbnailSrc` is set on the catalog item.
- Otherwise, for **static HTML** with a reachable preview URL: a **lazy-loaded mini iframe** after the row scrolls near the viewport (reduces load vs embedding every page at once).
- **HEAD checks** (same-origin) mark cards as preview-ready or missing; the main pane reuses the same rules and only enables **Open Full Page** when the preview responds successfully.

---

## Regenerating Sneat previews

From the **repo root**:

1. Build the Sneat template once (installs its own `node_modules`):  
   `cd references/sneat-bootstrap-html-laravel-admin-template-free-main && npm install --legacy-peer-deps && npm run build`
2. Generate HTML + sync catalog JSON:  
   `node scripts/build-sneat-template-workbench.mjs`

That script:

- Copies `public/build` → `public/template-workbench/sneat/build` (hashed CSS/JS from Vite `manifest.json`).
- Copies `public/assets` → `public/template-workbench/sneat/assets`.
- Emits standalone HTML under `public/template-workbench/sneat/html/*.html`.
- Writes `public/template-workbench/sneat/catalog.generated.json` (short index).
- Writes **`src/lib/sneatWorkbenchCatalog.json`** (full workbench item metadata consumed by `src/lib/templateWorkbenchContent.ts`).

---

## Live static demos

### Pantry (`public/template-workbench/html/`)

| Page | Original source | Public path | Notes |
|------|-----------------|-------------|--------|
| Pantry Manager — main | `references/pantry-tracker/.../webapp/templates/index.html` | `public/template-workbench/html/pantry-index.html` | Tabs, tables, modals |
| Pantry Manager — settings | `…/settings.html` | `pantry-settings.html` | Forms |
| Pantry Manager — backup | `…/backup.html` | `pantry-backup.html` | Two-column actions |

### Sneat (`public/template-workbench/sneat/html/`)

Representative iframe URLs (all listed in `src/lib/sneatWorkbenchCatalog.json`):

| User intent | Closest Sneat iframe | Pack limitation |
|-------------|----------------------|-----------------|
| Alerts | `ui-alerts.html` | — |
| Buttons | `ui-buttons.html` | — |
| List groups | `ui-list-groups.html` | — |
| Layouts | `layout-*.html` (blank, container, fluid, without-menu, without-navbar) | Content-only shell in generator (no full Laravel menu tree) |
| CRM-style settings | `pages-account-settings-*.html` | Account settings, not a full CRM product |
| Application / auth | `auth-login-basic.html`, `auth-register-basic.html`, `auth-forgot-password-basic.html`, `pages-misc-*.html` | — |
| Dashboard | `dashboard-analytics.html` | — |
| Advanced UI | `extended-ui-perfect-scrollbar.html`, `extended-ui-text-divider.html` | **No** separate Blade demos for **dragula** or **clipboard** in this free pack |
| Employees / contacts lists | `tables-basic.html` | No dedicated `employees.html` / `contacts.html` in this pack; use tables + Pantry index |
| Notes / card grids | `cards-basic.html` + account settings pages | No dedicated `notes.html` |

---

## React references (not copied)

| Title | Path |
|-------|------|
| SmarthrTable, SmarthrCard, … | `src/components/smarthr/*.tsx` |

---

## Screenshots

Raster packs: see `docs/reference-pages-inventory.md` if present.

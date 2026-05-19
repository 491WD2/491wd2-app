# Reference pages inventory

Visual reference assets discovered under `references/`, `public/`, `docs/`, and `src/` (excluding `node_modules`, `dist`, `build`, `.git`, `server`, `checkpoints`).

## Summary

| Category | Count | Notes |
|----------|------:|-------|
| Raster screenshots (PNG/JPEG/WebP) | 0 | None in searched paths. |
| HTML templates / demos | 3 | Pantry Tracker webapp templates (copied for static serving). |
| Vector / other images | 1 | Settings cog SVG in Pantry static bundle. |

No CRM-specific screenshots, layout grid shots, or card-layout PNGs were present in the repository at inventory time.

---

## Inventory (every visual / demo reference)

### 1. Pantry Manager — main interface (HTML)

| Field | Value |
|--------|--------|
| **Name** | Pantry Manager — main interface |
| **File path (source)** | `references/pantry-tracker/pantry_tracker-main/webapp/templates/index.html` |
| **File path (served copy)** | `public/reference-pages/html/pantry-index.html` (paths rewritten to load assets from `../pantry-tracker-webapp/static/`). Identical root-level copies also exist at `public/reference-pages/pantry-tracker-webapp/index.html` for the full static bundle. |
| **File type** | HTML |
| **Category** | Application Pages |
| **What it shows** | Documented Pantry Manager shell: navigation, category/product tabs, modals, dark mode toggle, barcode-related scripts. |
| **Open directly in browser** | Yes — e.g. `/reference-pages/html/pantry-index.html` (gallery default) or `/reference-pages/pantry-tracker-webapp/index.html` when `public/` is served. |
| **Appear in app gallery** | Yes |

### 2. Pantry Manager — settings (HTML)

| Field | Value |
|--------|--------|
| **Name** | Pantry Manager — settings page |
| **File path (source)** | `references/pantry-tracker/pantry_tracker-main/webapp/templates/settings.html` |
| **File path (served copy)** | `public/reference-pages/html/pantry-settings.html` (plus bundle copy at `public/reference-pages/pantry-tracker-webapp/settings.html`). |
| **File type** | HTML |
| **Category** | Forms |
| **What it shows** | Settings-style form layout: sections, labels, inputs, example copy blocks. |
| **Open directly in browser** | Yes — `/reference-pages/html/pantry-settings.html` |
| **Appear in app gallery** | Yes |

### 3. Pantry Manager — backup & restore (HTML)

| Field | Value |
|--------|--------|
| **Name** | Pantry Manager — backup & restore |
| **File path (source)** | `references/pantry-tracker/pantry_tracker-main/webapp/templates/backup.html` |
| **File path (served copy)** | `public/reference-pages/html/pantry-backup.html` (plus bundle copy at `public/reference-pages/pantry-tracker-webapp/backup.html`). |
| **File type** | HTML |
| **Category** | Application Pages |
| **What it shows** | Two-column backup/restore layout; contains a Jinja `{{ base_path }}` placeholder in the source (renders literally in static preview). |
| **Open directly in browser** | Yes — `/reference-pages/html/pantry-backup.html` (server actions like `download_db` will not work statically). |
| **Appear in app gallery** | Yes |

### 4. Settings cog icon (SVG)

| Field | Value |
|--------|--------|
| **Name** | Pantry Manager — settings cog (SVG) |
| **File path (source)** | `references/pantry-tracker/pantry_tracker-main/webapp/static/images/cog.svg` |
| **File path (served copy)** | `public/reference-pages/pantry-tracker-webapp/static/images/cog.svg` (full `static/` tree copied with webapp) |
| **File type** | SVG (image) |
| **Category** | Base UI |
| **What it shows** | Small monochrome gear icon used in the Pantry UI chrome. |
| **Open directly in browser** | Yes — image URL or embedded in the HTML demos above. |
| **Appear in app gallery** | Yes |

---

## `public/reference-pages/html/` (path-adjusted HTML)

Three static HTML files were generated here from the webapp copies, with `static/` rewritten to `../pantry-tracker-webapp/static/` so they load correctly when opened from the `html/` directory. Originals under `references/` were not edited.

## Duplicates under `public/` (not listed separately in gallery)

The entire `webapp` directory was copied to `public/reference-pages/pantry-tracker-webapp/` so CSS/JS/images resolve. That includes `templates/index.html`, `templates/settings.html`, and `templates/backup.html`. Those **template** paths resolve `static/` relative to `templates/`, which is **incorrect** in a static server; the in-app gallery and “Open demo page” links use **`public/reference-pages/html/pantry-*.html`**. Root-level copies at `pantry-tracker-webapp/index.html` (etc.) remain valid alternate entry points.

---

## Non-visual reference material (excluded from gallery)

Under `references/` there are additional code-only trees (e.g. Instacart token refresh examples, Notion MCP server). They contain no HTML demo pages or screenshots matching this inventory’s scope.

---

## Vite app shell (excluded)

| Field | Value |
|--------|--------|
| **Name** | Root Vite `index.html` |
| **Path** | `index.html` (project root) |
| **Type** | HTML |
| **Gallery** | No — build entry, not a design reference page. |

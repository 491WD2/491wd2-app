# UI variant inventory (491WD)

## Template Workbench vs HTML packs

The **Template Workbench** tab loads real static HTML in iframes from `public/template-workbench/`:

1. **Pantry Tracker** — `html/pantry-*.html` (original Jinja/Flask templates copied for layout reference).
2. **Sneat (Bootstrap admin, free Laravel pack)** — `sneat/html/*.html` generated from Blade by `scripts/build-sneat-template-workbench.mjs`, with CSS/JS from `sneat/build/` and images/fonts from `sneat/assets/`.

The workbench **HEAD-probes** each preview URL; when the file is missing, the UI explains how to regenerate (Sneat) or copy assets (Pantry).

**Not in the free Sneat reference tree:** dedicated demos named like `ui-dragula`, `clipboard.js` showcase pages, `employees.html`, `contacts.html`, or `notes.html`. For those concepts use:

- **Sneat:** `tables-basic.html` (dense tables), `cards-basic.html` (card grids), `extended-ui-*.html`, plus **UI Builder** variant matrices below.
- **Optional extra HTML:** drop additional admin-pack files under `public/template-workbench/html/` and add a row to `src/lib/templateWorkbenchContent.ts` if you want more iframes.

## Variants discoverable from shipped HTML

Pantry pages are **composed apps** (navigation, tabs, tables). Sneat `ui-*.html` pages expose **Bootstrap component matrices** (alerts, buttons, list groups, modals, etc.) with real theme CSS.

For **dragula**, **clipboard**, **sweet-alerts**, **lightbox** rows, the **UI Builder** preview matrix (`src/lib/componentVariantOptions.ts`, `src/lib/uiBuilderLayout.tsx`, `src/ui-builder.css`) remains the primary discrete control lab until you vendor matching HTML.

## Template / example sources

- **Sneat:** `references/sneat-bootstrap-html-laravel-admin-template-free-main/`
- **Pantry:** `references/pantry-tracker/…/webapp/templates/`

**Maintaining React export:** `src/lib/generateExportedUiLayoutTsx.ts` embeds `src/lib/_standaloneRenderFragment.txt` (Vite `?raw`). After editing `renderPreview` in `uiBuilderLayout.tsx`, keep that fragment in sync so “Export React Code” stays aligned.

## Builder coverage

| Component (`definitionId`) | Variants (see `componentVariantOptions.ts`) | In React builder inspector |
| -------------------------- | -------------------------------------------- | --------------------------- |
| buttons | primary, secondary, success, danger, warning, info, light, dark, outline-*, rounded, pill, icon, block, small, large | Variant select + existing labels |
| alerts | primary–dark, bordered, icon (+ dismissible boolean) | Variant select + dismissible |
| badges | solid, outline, soft, rounded, pill, status-dot | Variant select + labels |
| card | basic, shadow, bordered, metric, image, profile, action, horizontal | Variant select + metric fields |
| modals | basic, centered, large, small, confirmation, form, danger | Variant select + confirm label |
| dropdowns | basic, split, icon, right-aligned, dark, grouped | Variant select + menu items |
| progress | basic, striped, animated, stacked, thin, thick | Variant select + percent |
| spinner | border, grow, small, large, colored | Variant select |
| tabs | basic, pills, underline, vertical, boxed | Variant select + tab labels |
| toasts | basic, success, warning, danger, dark, stacked | Variant select + time label |
| accordion | basic, flush, bordered, icon, numbered | Variant select |
| avatar | initials, image, rounded, stacked, status | Variant select |
| breadcrumb | basic, arrow, slash, pill, compact | Variant select |
| button-group | basic, segmented, vertical, toolbar | Variant select + options |
| carousel | basic, indicators, controls, caption, card-slider | Variant select + slide number |
| collapse | basic, multi, card, faq | Variant select |
| ratio | 1x1, 4x3, 16x9, 21x9 | Variant select |
| grid | 2-column–responsive | Variant select + columns fallback |
| images | rounded, circle, thumbnail, figure, overlay | Variant select + image label |
| links | default, muted, underline, button-link, external | Variant select + labels |
| list-groups | basic, active, flush, numbered, checkbox, action | Variant select + items |
| offcanvas | left, right, top, bottom, filter-panel, details-panel | Variant select |
| pagination | basic, rounded, small, large, simple, with-labels | Variant select + pages |
| placeholders | text, card, image, paragraph, animated | Variant select |
| popovers | top, right, bottom, left, rich-content | Variant select |
| tooltips | top, right, bottom, left, dark, light | Variant select |
| typography | heading, display, paragraph, quote, list, code | Variant select + heading level |
| dragula | kanban, two-column, task-board, compact, card-sort | Variant select + lane titles |
| clipboard | input-copy, code-copy, button-copy, success-state | Variant select + value |
| sweet-alerts | success, warning, error, info, confirmation, delete-confirm | Variant select |
| lightbox | gallery, single-image, masonry-gallery, caption-gallery, grid-preview | Variant select + image count |
| scrollbar | vertical, horizontal, compact, panel, long-content | Variant select + items |

Legacy layouts without `settings.variant` fall back to the first variant in each list (`normalizeVariant`).

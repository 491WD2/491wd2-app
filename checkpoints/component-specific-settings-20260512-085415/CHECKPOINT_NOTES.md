# Checkpoint: component-specific-settings-20260512-085415

**Created:** 2026-05-12 08:54:15 (local machine time, folder name)

## Current working features

- UI Builder canvas with drag-and-drop, palette, inspector (title, body, accent, size).
- **Component Settings** inspector section: dynamic fields per component type (text, number, checkbox, multiline string lists).
- Canvas preview, localStorage autosave for the builder layout, import/export JSON, duplicate/delete/reorder.
- **Saved UI Preview** (`UiLayoutRenderer` + `CanvasPreviewGrid`) and **Applied UI** (`AppliedUiSection` + `CanvasPreviewGrid`) render the same `renderPreview` output.
- **Export React Code** standalone TSX includes optional `settings` on each item and an inlined `renderExportedPreview` aligned with `renderPreview`.

## New component settings supported

Optional `settings` on each canvas row (`Record<string, string | number | boolean | string[]>`), with defaults from `makeInstance` / `starterCanvas` where defined:

| definitionId | Keys |
|--------------|------|
| alerts | variant, dismissible |
| buttons | primaryLabel, secondaryLabel, outlineLabel |
| button-group | options |
| badges | labels |
| card | metricLabel, metricValue, trendLabel |
| carousel | slideNumber |
| dropdowns | menuItems |
| grid | columns |
| images | imageLabel |
| links | labels |
| list-groups | items |
| modals | confirmLabel |
| pagination | pages |
| progress | percent |
| tabs | labels |
| toasts | timeLabel |
| typography | headingLevel |
| dragula | leftTitle, rightTitle |
| clipboard | value |
| lightbox | imageCount |
| scrollbar | items |

## Files copied (paths relative to repo root)

- `src/App.tsx`
- `src/UiBuilderPage.tsx`
- `src/ui-builder.css`
- `src/lib/uiBuilderLayout.tsx`
- `src/lib/generateExportedUiLayoutTsx.ts`
- `src/components/UiLayoutRenderer.tsx`
- `src/components/CanvasPreviewGrid.tsx`
- `src/components/AppliedUiSection.tsx`

## npm run build status

After this checkpoint was written, `npm run build` was run from the repository root: **PASS** (`tsc -b` and `vite build` completed successfully).

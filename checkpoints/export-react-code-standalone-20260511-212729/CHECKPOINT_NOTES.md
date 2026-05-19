# Checkpoint: export-react-code-standalone-20260511-212729

**Created:** 2026-05-11 21:27:29 (local machine time)

## npm run build

**Build status:** passed (verified immediately after creating this checkpoint, from project root).

## Files copied (mirrors `src/` layout)

| Path |
|------|
| `src/App.tsx` |
| `src/UiBuilderPage.tsx` |
| `src/ui-builder.css` |
| `src/lib/uiBuilderLayout.tsx` |
| `src/lib/generateExportedUiLayoutTsx.ts` |
| `src/components/UiLayoutRenderer.tsx` |
| `src/components/CanvasPreviewGrid.tsx` |
| `src/components/AppliedUiSection.tsx` |

## Current working features

- **My Build** — `CurrentBuild` plus optional **Applied layout** (`491wd-applied-ui-layout`) via `AppliedUiSection`.
- **UI Builder** — Full canvas editor; autosave `491wd-ui-builder-layout`; import/export/reset; drag reorder; Apply / Clear applied layout; layout status messages.
- **Saved UI Preview** — Read-only full-page preview from draft layout storage (`CanvasPreviewGrid`).
- **Apply to My Build** / **Clear Applied Layout** — Promotes or clears `491wd-applied-ui-layout`.
- **Export React Code** — Modal with copy/download; generates **standalone** `ExportedUiLayout` TSX (no `renderPreview` / `uiBuilderLayout` imports; inlined `renderExportedPreview` + CSS comment); `generateExportedUiLayoutTsx.ts` embeds synced switch from `uiBuilderLayout`.
- **Top switcher** — My Build / UI Builder / Saved UI Preview; integrated chrome in `ui-builder.css` (including `.wd-ui-preview-page` for exports).

## Restore hint

Copies are for reference; restore by copying paths back into the live `src/` tree and running `npm run build`.

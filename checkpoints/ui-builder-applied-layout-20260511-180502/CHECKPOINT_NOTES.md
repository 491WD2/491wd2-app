# Checkpoint: ui-builder-applied-layout-20260511-180502

**Created:** 2026-05-11 18:05:02 (local machine time)

## npm run build

**Build status:** passed (verified immediately after creating this checkpoint, from project root).

## Date/time created

- **Folder suffix:** `20260511-180502` (local time)
- **Notes file:** written in the same run as the snapshot copies

| Original path |
|---------------|
| `src/App.tsx` |
| `src/UiBuilderPage.tsx` |
| `src/ui-builder.css` |
| `src/lib/uiBuilderLayout.tsx` |
| `src/components/UiLayoutRenderer.tsx` |
| `src/components/CanvasPreviewGrid.tsx` |
| `src/components/AppliedUiSection.tsx` |

## Features working at this checkpoint

- **My Build** — Original app (`CurrentBuild`) with optional **Applied layout** section below when `491wd-applied-ui-layout` has a valid non-empty layout.
- **UI Builder** — Editable canvas; autosave to `491wd-ui-builder-layout`; import/export/reset; drag reorder; status messages.
- **Saved UI Preview** — Read-only full-page preview from `491wd-ui-builder-layout`.
- **Apply to My Build** — Confirms, copies current canvas to `491wd-applied-ui-layout`, status “Applied to My Build”.
- **Clear Applied Layout** — Confirms, removes `491wd-applied-ui-layout`, status “Applied layout cleared”.
- **Top switcher** — My Build / UI Builder / Saved UI Preview with integrated styling in `ui-builder.css`.

## Restore hint

These copies are for reference only; to restore, copy files from this folder back into the live `src/` paths (and run `npm run build`).

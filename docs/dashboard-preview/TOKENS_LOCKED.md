# Dashboard Preview — Locked Tokens

**Status:** Approved for implementation (token layer only).  
**Root scope class:** `.dashboard-preview`  
**Isolation:** Preview route imports CSS directly — not in `src/styles.css`.

## Files

| File | Purpose |
|------|---------|
| `src/styles/dashboard-preview/dashboard-preview-tokens.css` | All `--dp-*` CSS custom properties + base scope |
| `src/styles/dashboard-preview/dashboard-preview-layout.css` | Grid/shell structure (no widget skin) |
| `src/styles/dashboard-preview/dashboard-preview.css` | Entry `@import` for preview page |

## Isolation guarantee

1. Tokens live under `.dashboard-preview { … }` — no `:root` overrides.
2. `dashboard-preview.css` is imported **only** from `AdminUxDashboardPreviewPage` (planned).
3. Global Tailwind `@theme` in `styles.css` is untouched.
4. FullCalendar overrides (when added) will be scoped `.dashboard-preview .fc …`.

## Desktop grid structure

```
.dashboard-preview__viewport          ← 24px pad, atmospheric bg
  .dashboard-preview__shell            ← glass shell, max 1720px
    .dashboard-preview__body
      .dashboard-preview__sidebar     ← 220px (preview chrome mirror)
      .dashboard-preview__main
        .dashboard-preview__topbar     ← 60px
        .dashboard-preview__content    ← 22px pad
          .dashboard-preview__status   ← compact header ~160px
          .dashboard-preview__top-strip ← 12-col: family(4) quick(4) today(4)
          .dashboard-preview__snapshot ← optional 4-col metrics row
          .dashboard-preview__grid
            .dashboard-preview__utility    ← 38%
              kitchen + chores
              shopping
              pantry
            .dashboard-preview__information ← 62%
              .dashboard-preview__calendar-row
                calendar (~64%)
                upcoming (~36%)
              messages (full width)
```

## Widget → accent mapping

| Widget | Dominant accent |
|--------|-----------------|
| Status header | `--dp-accent` (blue) |
| Family | member dot colors (existing data) |
| Quick Add | neutral + icon tint |
| Today snapshot | per-metric soft chips |
| Kitchen / chores | `--dp-accent-kitchen` |
| Shopping | `--dp-accent-shopping` |
| Pantry | `--dp-accent-pantry` |
| Calendar | `--dp-accent-calendar` |
| Upcoming | `--dp-accent-calendar` |
| Messages | `--dp-accent-messages` |

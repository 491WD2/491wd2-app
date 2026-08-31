# Dashboard Preview — Visual Specification

**Route (planned):** `/adminux-preview`  
**Scope:** Home dashboard presentation only. All data, mutations, and navigation contracts stay identical to production Home.  
**Status:** Spec only — no UI implementation yet.

---

## 1. Design intent

The preview should read as a **modern household control center**: calm, bright, legible, and intentional. It replaces the current Home feel (warm beige/orange scrapbook, oversized decorative hero, heavy gradients) with a **clean information grid** and **restrained glass surfaces**.

### Character

| Quality | Target |
|---------|--------|
| Overall | Clean, colorful, bright, calm, sophisticated, highly legible |
| Glass | Accent treatment on shell + major cards — not the gimmick of the page |
| Hierarchy | Concise headers, crisp controls, consistent card geometry, subtle elevation |
| Density | Information-forward; no decorative blobs or giant brand moments |

### Reference inspiration (yes)

- Clean information grids
- Concise headers and section labels
- Crisp, compact controls
- Consistent card geometry
- Attractive but muted accent color
- Clear visual hierarchy
- Subtle elevation (not heavy 3D)

### Reference inspiration (no)

- Analytics charts
- CRM / financial tiles
- Huge widget counts
- Fake or demo data
- Corporate dashboard copy (“Revenue”, “Pipeline”, etc.)

---

## 2. Glassmorphism rules

Glass is used **sparingly** and **never stacked deeply**.

### Where glass is allowed

| Surface | Blur | Notes |
|---------|------|-------|
| Preview app frame / shell inset | `blur(16–20px)` | Outer “device” frame around dashboard |
| Top navigation strip (if shown inside preview) | `blur(12–16px)` | Single layer only |
| Major dashboard cards | `blur(10–14px)` | Status header + widget cards |
| Selected floating controls (FAB, popover triggers) | `blur(8–12px)` | Rare on Home preview |

### Where glass is **not** used

- List rows inside cards
- Metric numbers and labels
- Form inputs (shopping quick-add)
- Nested content panels
- Second-level containers inside a glass card

### Stacking rule

**Maximum one glass layer per visual stack.**  
Structure: `glass card` → `opaque or semi-opaque inner rows` → content.  
Never: glass card → glass sub-card → glass row.

### Fallback readability

All glass surfaces must remain readable **without** `backdrop-filter`:

- Minimum background opacity on glass: **72%** (`rgba(255,255,255,0.72)` light mode)
- Text contrast: body text ≥ **4.5:1** against effective background
- Borders: **1px** `rgba(255,255,255,0.55)` + `rgba(15,23,42,0.06)` outer edge for definition

---

## 3. Background

### Atmosphere

A **very soft contemporary field** — atmospheric color, not a rainbow gradient or warm scrapbook wash.

**Base stack (example):**

```css
/* Layer 1 — cool wash */
radial-gradient(120% 80% at 8% -10%, rgba(147, 197, 253, 0.22), transparent 55%)

/* Layer 2 — lavender hint */
radial-gradient(100% 70% at 92% 8%, rgba(196, 181, 253, 0.16), transparent 50%)

/* Layer 3 — peach whisper */
radial-gradient(90% 60% at 50% 100%, rgba(251, 207, 193, 0.12), transparent 45%)

/* Layer 4 — optional mint anchor */
radial-gradient(70% 50% at 70% 40%, rgba(167, 243, 208, 0.08), transparent 40%)

/* Base */
linear-gradient(180deg, #f6f8fc 0%, #f3f6fa 48%, #eef2f8 100%)
```

**Avoid:** beige `#f7f4ef`, orange scrapbook tones, heavy aqua 3D gradients, large decorative radial blobs behind the hero.

### Application frame

The dashboard content sits inside a **framed inset** with **20–28px** visible breathing room from the browser edges (see Spacing). The frame background uses the atmospheric stack above; the inner dashboard canvas may be slightly brighter (`#fafbfd` at 85% opacity) to separate shell from content.

---

## 4. Typography

**No new font imports.** Use project stack:

| Role | Family | Fallback |
|------|--------|----------|
| UI + body | `Mulish` | `Inter`, system-ui |
| Numbers + time | `Inter` | tabular-nums |
| Headings (section) | `Mulish` | weight 600–700 |

Reference existing tokens: `--font-body`, `--font-sans` from `src/styles.css` / `familyhub-theme.css`.

### Scale (desktop)

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--dp-text-xs` | 11px | 600 | Eyebrow labels, meta |
| `--dp-text-sm` | 13px | 500–600 | Secondary copy, row meta |
| `--dp-text-base` | 14px | 500 | Body, list titles |
| `--dp-text-md` | 15px | 600 | Card titles |
| `--dp-text-lg` | 18px | 600 | Section headers (rare) |
| `--dp-text-time` | clamp(28px, 2.8vw, 36px) | 700 | Status header clock |
| `--dp-text-greeting` | 14px | 600 | Greeting line |
| `--dp-text-household` | 20px | 700 | Household name (compact, not billboard) |

**Avoid:** clamp(2.7rem…) clock sizes, 2rem+ household titles, ornamental letter-spacing, emoji in production copy (strip `👋` from greeting display).

---

## 5. Surfaces

### Major cards (widgets + status header)

| Property | Value |
|----------|-------|
| Border radius | **20px** (range 18–24px) |
| Border | `1px solid rgba(255,255,255,0.55)` + `1px solid rgba(15,23,42,0.06)` |
| Background | `rgba(255,255,255,0.78)` + optional `backdrop-filter: blur(12px)` |
| Shadow | `0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)` |
| Padding | **18px 20px** (comfortable, not oversized) |

### Accent edge (optional, one per card)

A **4px left border** or **top inner highlight** in the card’s semantic accent color at ~40% opacity — not a full-card gradient fill.

### Nested list rows

| Property | Value |
|----------|-------|
| Border radius | **14px** (range 12–16px) |
| Background | `rgba(255,255,255,0.92)` or `rgba(248,250,252,0.95)` — **opaque** |
| Border | `1px solid rgba(15,23,42,0.06)` |
| Shadow | `0 1px 2px rgba(15,23,42,0.03)` only |
| Blur | **none** |

### Status header (compact hero replacement)

Single glass card, **not** a banner. Target height **140–190px** on a 1280–1440px desktop viewport. Contains greeting, date, time, weather, and status chips in one horizontal band — no decorative illustration area.

---

## 6. Controls

- **Icons:** Lucide only (already installed)
- **Touch target:** min **40×40px** (prefer 44px for primary actions)
- **Shape:** Pills `border-radius: 999px` for chips; buttons `12–14px` radius
- **Style:** Opaque or high-opacity fills; glass only on shell-level controls
- **States:** `:hover` lift `translateY(-1px)` + slightly stronger shadow; `:focus-visible` ring `0 0 0 3px` accent at 25% opacity

### Control tiers

| Tier | Example | Height |
|------|---------|--------|
| Primary | “Add”, “Mark done” | 40–44px |
| Secondary | “Open calendar”, card actions | 36–40px |
| Chip / status | Kitchen, shopping count | 32–36px |

---

## 7. Color — semantic accents

Muted contemporary accents. **One accent per widget category** via left edge, icon tile, or chip — not full-card gradients.

| Domain | Accent hue | Example token | Use |
|--------|------------|---------------|-----|
| Status / time | Cool slate-blue | `--dp-accent-status` `#5b8def` | Header, clock icon |
| Kitchen / chores | Warm amber | `--dp-accent-kitchen` `#e8a317` | Kitchen duty, chore ring |
| Calendar / events | Blue-violet | `--dp-accent-calendar` `#7c6fe8` | Calendar card, event dots |
| Shopping | Mint / green | `--dp-accent-shopping` `#3cbc95` | Shopping card, add button |
| Messages | Lavender / pink | `--dp-accent-messages` `#c084fc` | Messages card |
| Pantry / alerts | Coral / amber | `--dp-accent-pantry` `#f59e6b` | Alert rows, storage |
| Family | Soft cyan | `--dp-accent-family` `#4fc3d9` | Member avatars (existing dot palette OK) |
| Neutral ink | Slate | `--dp-ink` `#1e293b` | Primary text |
| Muted | Cool gray | `--dp-muted` `#64748b` | Meta, labels |

**Ink on glass:** `#1e293b` primary, `#475569` secondary.  
**Do not:** assign a different bright gradient to every card.

---

## 8. Spacing

| Token | Value | Use |
|-------|-------|-----|
| `--dp-frame-pad` | **24px** (20–28px) | Browser edge → app frame |
| `--dp-grid-gap` | **18px** (16–22px) | Gap between dashboard cards |
| `--dp-card-pad` | **20px** | Card internal padding |
| `--dp-row-gap` | **8px** | Between list rows |
| `--dp-section-gap` | **12px** | Head → body within card |

### Grid

12-column CSS grid, desktop-first (1280px+):

- Gutter: `var(--dp-grid-gap)`
- Cards align to consistent row heights where possible; no masonry chaos

---

## 9. Layout proposal (desktop 1280px+)

Root class: `.fh-dash-preview` (scoped — does not affect production Home).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  FRAME PAD (24px) — atmospheric background visible                           │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ STATUS HEADER (span 12) — ~160px tall, glass, single row               │  │
│  │ [Greeting + date]  [TIME]  [Weather]  [Kitchen|Chores|Shopping chips]  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                          │
│  │ Family (4)   │ │ Quick Add(4) │ │ Today (4)    │   Row 1                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                          │
│                                                                              │
│  ┌────────────────────────────┐ ┌────────────────────────────┐               │
│  │ Kitchen + chores (6)       │ │ Calendar + upcoming (6)  │   Row 2       │
│  └────────────────────────────┘ └────────────────────────────┘               │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                          │
│  │ Messages (4) │ │ Shopping (4) │ │ Pantry (4)   │   Row 3                  │
│  └──────────────┘ └──────────────┘ └──────────────┘                          │
│                                                                              │
│  FRAME PAD                                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Column spans (12-col)

| Widget | `grid-column` | Priority |
|--------|---------------|----------|
| Status header | `span 12` | 1 |
| Family | `span 4` | 2 |
| Quick Add | `span 4` | 3 |
| Today snapshot | `span 4` | 4 |
| Kitchen + chores | `span 6` | 5 |
| Calendar + upcoming + mini-month | `span 6` | 6 |
| Messages | `span 4` | 7 |
| Shopping | `span 4` | 8 |
| Pantry & storage | `span 4` | 9 |

### Status header internal layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Eyebrow: Good afternoon · Mon, Aug 31          [Customize?]     │
│ Household Name (20px)                                           │
│ ┌─────────┐  ┌──────────────┐  ┌─────────────────────────────┐ │
│ │ 3:42 PM │  │ ☁  Weather   │  │ Kitchen · Chores · Shopping │ │
│ │         │  │  placeholder │  │ (compact chips, 32–36px)      │ │
│ └─────────┘  └──────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

- **No** full-width gradient hero
- **No** clock larger than ~36px
- Weather remains honest placeholder (no fake forecast data)
- Customize bar: optional, subdued, right-aligned — same disabled behavior as production

### Tablet / mobile

**Out of scope for this pass.** Grid may collapse to single column later; structure components with BEM blocks so breakpoints can be added without markup rewrites.

---

## 10. Widget presentation notes

| Widget | Accent | Glass | Notes |
|--------|--------|-------|-------|
| Status header | `--dp-accent-status` | Yes | Single compact band |
| Family | `--dp-accent-family` | Yes | Horizontal member pills, opaque inner |
| Quick Add | neutral + icon color | Yes | 2×2 grid of opaque action tiles inside |
| Today | `--dp-accent-kitchen` (ring) | Yes | Ring + opaque metric rows |
| Kitchen + chores | `--dp-accent-kitchen` | Yes | Name prominent; opaque chore rows |
| Calendar | `--dp-accent-calendar` | Yes | List + mini-cal side-by-side; opaque rows |
| Messages | `--dp-accent-messages` | Yes | Opaque rows; Bell for notifications |
| Shopping | `--dp-accent-shopping` | Yes | Opaque rows; opaque input composer |
| Pantry | `--dp-accent-pantry` | Yes | Alert row + opaque zone stat tiles |

---

## 11. CSS token proposal

All tokens scoped under `.fh-dash-preview` in `src/styles/dashboard-preview/dashboard-preview-tokens.css` (preview-only import).

```css
.fh-dash-preview {
  /* —— Layout —— */
  --dp-frame-pad: 24px;
  --dp-grid-gap: 18px;
  --dp-card-pad: 20px;
  --dp-radius-card: 20px;
  --dp-radius-row: 14px;
  --dp-radius-control: 12px;
  --dp-status-min-h: 140px;
  --dp-status-max-h: 190px;

  /* —— Glass —— */
  --dp-glass-bg: rgba(255, 255, 255, 0.78);
  --dp-glass-bg-fallback: rgba(255, 255, 255, 0.92);
  --dp-glass-border: rgba(255, 255, 255, 0.55);
  --dp-glass-edge: rgba(15, 23, 42, 0.06);
  --dp-glass-blur: 12px;

  /* —— Elevation —— */
  --dp-shadow-card:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px rgba(15, 23, 42, 0.06);
  --dp-shadow-row: 0 1px 2px rgba(15, 23, 42, 0.03);
  --dp-shadow-hover:
    0 2px 4px rgba(15, 23, 42, 0.06),
    0 12px 28px rgba(15, 23, 42, 0.08);

  /* —— Typography —— */
  --dp-font: "Mulish", "Inter", system-ui, sans-serif;
  --dp-font-mono-nums: "Inter", system-ui, sans-serif;
  --dp-text-time: clamp(28px, 2.8vw, 36px);

  /* —— Ink —— */
  --dp-ink: #1e293b;
  --dp-ink-soft: #475569;
  --dp-muted: #64748b;
  --dp-line: rgba(15, 23, 42, 0.08);

  /* —— Semantic accents —— */
  --dp-accent-status: #5b8def;
  --dp-accent-kitchen: #e8a317;
  --dp-accent-calendar: #7c6fe8;
  --dp-accent-shopping: #3cbc95;
  --dp-accent-messages: #c084fc;
  --dp-accent-pantry: #f59e6b;
  --dp-accent-family: #4fc3d9;

  /* —— Background (applied to preview frame, not :root) —— */
  --dp-page-bg: #f3f6fa;
}
```

### File plan (implementation phase)

```
docs/dashboard-preview/VISUAL_SPEC.md          ← this file
src/styles/dashboard-preview/
  dashboard-preview-tokens.css                 ← tokens above
  dashboard-preview-layout.css                 ← grid + frame + status header
  dashboard-preview-widgets.css                ← card + row + control styles
  dashboard-preview.css                        ← @import entry (preview route only)
src/components/dashboard-preview/
  DashboardPreviewWorkspace.tsx
src/pages/AdminUxDashboardPreviewPage.tsx
```

**Do not** add preview CSS to `src/styles.css` global imports.

---

## 12. Accessibility

- Maintain all existing `aria-label`, `aria-live` on clock, `aria-pressed` on toggles
- Focus rings on every interactive control
- Color is not the only indicator (icons + labels on chips)
- Minimum 40px touch targets
- `prefers-reduced-motion`: disable hover lift transforms

---

## 13. Production Home — explicit non-goals

The preview experiment must **not**:

- Change `/adminux` or `NotionHomeWorkspace.tsx`
- Add global CSS that affects other routes
- Introduce fake weather, analytics, or demo widgets
- Replace mini-month with FullCalendar on Home
- Import new fonts or npm dependencies

---

## 14. Approval checklist

Before implementation, confirm:

- [ ] Status header replaces oversized hero (~160px target)
- [ ] Glass on shell + cards only; opaque list rows inside
- [ ] Atmospheric cool background (no beige/orange scrapbook)
- [ ] Mulish/Inter typography, compact household title
- [ ] 12-col grid with 9 widgets + status header
- [ ] Semantic accent colors (muted, not per-card gradients)
- [ ] 24px frame padding, 18px card gap
- [ ] All functionality map items preserved (Quick Add, family access, mutations)

---

*Last updated: dashboard-preview branch — spec pass 1*

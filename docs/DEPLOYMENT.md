# Production build & deployment

Household kiosk app: **React 19 + TypeScript (strict) + Tailwind CSS v4 + Vite 8**.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

## Build commands

| Script | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run typecheck` | TypeScript project references (`strict`, unused locals/params) |
| `npm run build` | Typecheck + optimized production bundle → `dist/` |
| `npm run build:production` | Alias for `npm run build` |
| `npm run test` | Jest + React Testing Library (analytics, offline, a11y, nav) |
| `npm run start` | Serve `dist/` locally (preview server, all interfaces `:4173`) |
| `npm run dev` | Development server (`localhost:5173`) |
| `npm run handoff` | Build + package `handoff/` for client delivery |

### One-shot production build

```bash
cd /Users/stellaroskens/491WD2
npm ci
npm run test
npm run build
```

Output: **`dist/`** — static files ready for any static host or CDN.

### Verify locally before deploy

```bash
npm run start
```

Open **http://localhost:4173/** (or your machine’s LAN IP for kiosk hardware).

Chore kiosk: **http://localhost:4173/chores** (sidebar → Chores).

## What the build optimizes

### JavaScript

- **esbuild** minification, `target: es2022`
- **Tree-shaking** via Rollup (Vite)
- **Manual chunks**: `vendor-react`, `vendor-lucide`, `supabase`, `vendor-zxing`, `vendor-qrcode`, plus app splits `chore-analytics` and `chore-data`
- **Lazy routes** in `App.tsx` and `CurrentBuild.tsx`: chores, dashboard home, cleaning, backend console, and module pages load on demand
- **Chore shell code-splitting**: Analytics Agent, edit modal, onboarding tour, tab views, and drag assign board load on demand (`ChoresPage.tsx`, `ChoresScheduleView.tsx`)
- **`sideEffects`** in `package.json` marks `**/*.css` so JS tree-shaking stays aggressive

### Chore kiosk performance

- **Analytics queue**: max **1000** events (`KIOSK_ANALYTICS_MAX_EVENTS`); older rows roll into hourly aggregates (`KIOSK_ANALYTICS_ROLLUP_KEY`)
- **Offline snapshot**: `491wd-chore-offline-snapshot` written on every chore persist; banner when `navigator.onLine === false`
- **Gestures**: swipe offset updates batched with `requestAnimationFrame` (`useChoreSwipe`); drag/swipe CSS uses `will-change` and `touch-action: pan-y`
- **Memoized** shell chrome: nav tabs, tab panel, stat cards, drag board, and tab views

### CSS

- **Tailwind v4** scans `src/**/*.{ts,tsx}` via `@source` in `styles.css` — unused utility classes are dropped in production
- **`ui-builder.css`** is a shared design system (BEM `wd-*` rules); it is minified but not purged — required for builder + kiosk chrome
- Combined CSS is minified (`cssMinify: true`)

### PWA

- Service worker + precache generated under `dist/sw.js` (vite-plugin-pwa)
- Suitable for installed kiosk / tablet home-screen use

## Deploy targets

Upload **`dist/`** contents to:

| Host | Notes |
| --- | --- |
| **Netlify / Vercel / Cloudflare Pages** | Build command: `npm run build`, publish directory: `dist` |
| **nginx / Apache** | Point document root at `dist`; SPA fallback below |
| **S3 + CloudFront** | Static website or OAI; set `index.html` error → 200 for client routes |
| **Docker** | `nginx:alpine` copying `dist` to `/usr/share/nginx/html` |

### SPA routing (required)

All client paths (`/chores`, `/shopping`, etc.) must serve `index.html`:

**nginx example:**

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Environment

- No build-time API keys required for core kiosk (localStorage + client heuristics)
- Optional Supabase: configure in app settings at runtime (not baked into `dist` unless you add `import.meta.env` vars)

## Accessibility

Chore kiosk a11y audit: **[docs/ACCESSIBILITY.md](ACCESSIBILITY.md)** (ARIA, keyboard, contrast, 76px targets).

## Kiosk / responsive QA checklist

Full step-by-step QA (accessibility, analytics, AI, offline): **[QA_KIOSK.md](QA_KIOSK.md)**.

Test on **phone**, **tablet landscape**, and **large touch display** after `npm run start`:

### Chores (`/chores`)

| Area | Check |
| --- | --- |
| **Home** | Greeting, AI cards, stats grid 2×2 → 4 cols, task list, swipe-to-complete |
| **Dashboard** | Member cards grid, tap → Users tab |
| **Schedule** | Week pills wrap, Assign drag board scrolls horizontally on narrow screens |
| **Users** | Member chips wrap, message board, task list |
| **Touch** | Buttons ≥ 76px; tab bar targets; modal close |
| **Real-time** | Complete task on Home → Dashboard counts update; second tab shows sync toast |

### Global

- Sidebar collapse on narrow widths
- PWA install (optional): Add to Home Screen, offline shell loads

## TypeScript

- Root: `tsconfig.json` → `tsconfig.app.json` / `tsconfig.node.json`
- App: `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- CI gate: `npm run typecheck` must pass before `vite build`

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Blank page after deploy | Configure SPA fallback to `index.html` |
| Old assets cached | Bump deploy or clear CDN; PWA may need refresh (auto-update enabled) |
| Chunk load 404 | Ensure entire `dist/assets/` uploaded; don’t partial-sync |
| `tsc` errors | Run `npm run typecheck` locally; fix before build |

## Bundle size notes

- Largest chunks: main app shell, `vendor-zxing` (barcode), `supabase` — only loaded when routes/features need them
- CSS ~480KB minified — mostly `ui-builder.css`; gzip ~72KB over the wire

For stricter CSS splitting long-term, consider splitting builder-only CSS from kiosk routes (future refactor).

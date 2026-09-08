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
| `npm run dev` | Development server (`0.0.0.0:5173`) |
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

Canonical Home: **http://localhost:4173/adminux** (aliases `/`, `/home`, `/dashboard`).  
Live Cleaning / Kitchen: **http://localhost:4173/tasks**.  
`/chores` and `/cleaning/*` are **not** live pages; they redirect to `/tasks`. See **[ROUTES.md](ROUTES.md)**.

## What the build optimizes

### JavaScript

- **esbuild** minification, `target: es2022`
- **Tree-shaking** via Rollup (Vite)
- **Manual chunks**: `vendor-react`, `vendor-lucide`, `supabase`, `vendor-zxing`, `vendor-qrcode`, plus app splits `chore-analytics` and `chore-data`
- **Lazy routes** in `CurrentBuild.tsx` load live module pages on demand (Home, shopping, pantry, calendar, tasks, settings, …)
- **Unmounted chore kiosk** (`ChoresPage.tsx`) is leftover source — not a live route. Do not QA it as `/chores`.
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

All client paths (`/adminux`, `/tasks`, `/shopping`, etc.) must serve `index.html`:

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

Historical chore-kiosk a11y notes (unmounted `/chores` UI): **[ACCESSIBILITY.md](ACCESSIBILITY.md)**.

## Kiosk / responsive QA checklist

Full step-by-step QA (accessibility, analytics, AI, offline): **[QA_KIOSK.md](QA_KIOSK.md)**.

Test on **phone**, **tablet landscape**, and **large touch display** after `npm run start`:

### Cleaning / Kitchen (`/tasks`)

| Area | Check |
| --- | --- |
| **Home → Cleaning / Kitchen** | Sidebar and Home “chores” actions open `/tasks`, not `/chores` |
| **Legacy URLs** | `/chores` and `/cleaning/*` replace to `/tasks` (no 404) |
| **Kitchen** | `/kitchen` and `/kitchen-schedule` still work as deep links |

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

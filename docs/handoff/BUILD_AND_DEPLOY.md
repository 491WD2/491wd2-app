# Build & deployment guide

(Full copy for client handoff — see also project root `docs/DEPLOYMENT.md`.)

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+

## Commands

| Script | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run typecheck` | TypeScript strict check |
| `npm run build` | Typecheck + production bundle → `dist/` |
| `npm run start` | Serve `dist/` on port **4173** (all interfaces) |
| `npm run dev` | Development server on **5173** |
| `npm run handoff` | Build + assemble `handoff/` package |

## Production build

```bash
npm ci
npm run build
```

Output directory: **`dist/`**

- Minified JS/CSS, code-split chunks
- PWA service worker (`sw.js`)
- Lazy-loaded routes (including `/chores`)

## Local verification

```bash
npm run start
```

- App: http://localhost:4173/
- Chores: http://localhost:4173/chores

For kiosk hardware on LAN, use `http://<device-ip>:4173/chores`.

## Hosting

Upload **all files inside `dist/`** to your static host.

### SPA routing (required)

All paths must fall back to `index.html`:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Suggested platforms

- Netlify / Vercel / Cloudflare Pages — build: `npm run build`, publish: `dist`
- nginx / Apache / S3+CloudFront — copy `dist/` + configure fallback

### PWA

The build registers a service worker for offline shell caching. Updates use `autoUpdate` (vite-plugin-pwa).

## Environment

Core chore kiosk does **not** require build-time API keys. Optional Supabase and family data use runtime configuration in the main app Settings.

## Bundle notes

| Chunk (typical) | ~Size (gzip) |
| --- | --- |
| Main shell | ~63 KB |
| ChoresPage | ~13 KB |
| vendor-react | ~57 KB |
| CSS | ~72 KB |

Largest optional chunks: barcode scanner (ZXing), Supabase — load only when those features are opened.

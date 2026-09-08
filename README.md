# 491WD2

Family / household web app (FamilyHub / FamilySite 491). React + TypeScript + Vite + Tailwind. Custom History API routing — not React Router.

**Current Home:** `/adminux` (also `/`, `/home`, `/dashboard`).  
**Live chores / cleaning:** `/tasks`.  
**Do not open `/chores` or `/cleaning/*` as product pages** — those paths only redirect to `/tasks`.

Live route map: **[docs/ROUTES.md](docs/ROUTES.md)**.

## Frontend dev & build

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** (Vite on port 5173). The `dev` script binds `0.0.0.0` so IPv4 preview works.

**Production:**

```bash
npm run test       # Jest + React Testing Library
npm run build      # typecheck + optimized dist/
npm run start      # serve dist/ on :4173
```

Deployment and SPA fallback: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

### Deploy to production

1. `npm ci && npm run test && npm run build`
2. Upload the **`dist/`** folder to your static host (Netlify, Vercel, nginx, S3, etc.).
3. Configure **SPA fallback** so all routes serve `index.html` (see DEPLOYMENT.md).
4. Open **`/adminux`** (or `/`) on the household tablet. Cleaning / Kitchen is **`/tasks`**.
5. Optional client handoff zip: `npm run handoff` → `handoff/` at repo root.

## Optional: AI backend (paused)

A separate `server/` Express proxy was scaffolded for a future assistant and is **not required**.

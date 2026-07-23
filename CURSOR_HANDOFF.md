# Cursor account handoff — 491WD2 → GitHub

**For:** Another Cursor account / agent picking up this machine  
**Written:** 2026-07-17  
**Primary goal left open:** Authenticate GitHub CLI, create private repo `491wd2-app`, push `main`.

---

## 1. Open the correct folder in Cursor

**Real app (use this):**

```
/Users/stellaroskens/491WD2
```

**Do not confuse with:**

```
/Users/stellaroskens/Desktop/491wd2
```

That Desktop path was a nearly empty GitHub *profile* README repo, not the app. Always open **`/Users/stellaroskens/491WD2`**.

In Cursor: **File → Open Folder →** `/Users/stellaroskens/491WD2`

---

## 2. What this project is

- Name: **491WD2** / package `familysite-491`
- Stack: React + Vite + Tailwind + TypeScript + Jest; Supabase client; Netlify; PWA for chore kiosk
- Features: household UI / AdminUX command center, UI Builder, Help Center, chore kiosk at `/chores`
- Local deps: `node_modules` already present
- Dev: `npm run dev` → http://localhost:5173  
- Test / build: `npm run test` · `npm run build` · `npm run start` (preview :4173)  
- Client zip package: `npm run handoff` → `handoff/`

Env template: `.env.example` (do not commit real `.env*`)

---

## 3. Git state (already done — do not redo)

| Fact | Value |
|------|--------|
| Branch | `main` @ `dd791d3` |
| Latest message | Rebuild household UI around the AdminUX command center |
| History | Full history already exists — **do not** `git init` or invent an “Initial import” commit |
| Current remote | `origin` → `https://github.com/stellaroskens/491wd2.git` |
| Push status | Remote not verified (HTTPS needs credentials); new target repo not created |
| Untracked (ignore) | `.cursor/` — local editor config; **do not commit** |
| Untracked (this handoff) | `CURSOR_HANDOFF.md`, `GITHUB_PUSH_HANDOFF.md` — commit only if the user wants them in the repo |

Recent commits:

```
dd791d3 Rebuild household UI around the AdminUX command center
3388a6a Add PROJECT_AUDIT.md documenting current FamilySite_491 app state.
f8e65de Upload clean 491WD2 app
e3afc2d first commit
c1d6f08 Initial 491WD2 Family Hub build
```

---

## 4. What the previous session already did

1. Identified correct project path vs Desktop stub.
2. Confirmed git already initialized with history on `main`.
3. Installed GitHub CLI: `/opt/homebrew/bin/gh` (Homebrew, ~2.96.0).
4. Started `gh auth login --web` once; device login did **not** complete.
5. **Stopped before** creating `491wd2-app` or pushing.

---

## 5. Blocker

```text
gh auth status → not logged into any GitHub hosts
```

HTTPS `git` also cannot prompt for credentials in non-interactive agent shells (`could not read Username for 'https://github.com': Device not configured`).

**A human must complete `gh auth login` in a terminal (or paste a token).** After that, the agent can create the repo and push.

---

## 6. Exact next steps for the next agent / account

Ask the user to run auth if needed, then execute:

### A. Authenticate (user-interactive)

```bash
cd /Users/stellaroskens/491WD2
gh auth login --hostname github.com --git-protocol https --web
gh auth status
```

Optional: also configure git to use gh credentials:

```bash
gh auth setup-git
```

### B. Create private repo and push

`origin` already points at `stellaroskens/491wd2`. Rename it before attaching the new remote:

```bash
cd /Users/stellaroskens/491WD2
git remote rename origin old-origin
gh repo create 491wd2-app --private --source=. --remote=origin --push
```

**If the empty repo already exists on GitHub** (confirm owner — user vs org `491WD2`):

```bash
cd /Users/stellaroskens/491WD2
git remote rename origin old-origin   # skip if already renamed
git remote add origin https://github.com/<OWNER>/491wd2-app.git
git branch -M main
git push -u origin main
```

Possible owners mentioned in prior chat:

- `stellaroskens/491wd2-app` (personal)
- `491WD2/491wd2-app` (org) — **confirm with user before pushing**

### C. Verify

```bash
gh repo view --web
git remote -v
git status -sb
```

### D. Safety rules for this handoff

- Do **not** force-push unless the user explicitly asks.
- Do **not** commit `.env`, `.env.local`, `.env.production`, or `.cursor/`.
- Do **not** rewrite history / amend old commits unless asked.
- Prefer committing handoff markdown only if the user wants it tracked.

---

## 7. Suggested first message to paste in the other Cursor account

```text
Open /Users/stellaroskens/491WD2 and follow CURSOR_HANDOFF.md.

Goal: finish publishing this app to a new private GitHub repo named 491wd2-app.

Already done: git history on main, gh CLI installed.
Blocked: gh is not authenticated — run `gh auth login` with me if needed,
then rename existing origin, create 491wd2-app --private, and push main.
Confirm whether the owner should be my user or the 491WD2 org.
```

---

## 8. Useful paths

| Path | Why |
|------|-----|
| `/Users/stellaroskens/491WD2` | App root |
| `/Users/stellaroskens/491WD2/CURSOR_HANDOFF.md` | This file |
| `/Users/stellaroskens/491WD2/README.md` | App overview |
| `/Users/stellaroskens/491WD2/docs/` | Deployment, a11y, kiosk QA |
| `/Users/stellaroskens/491WD2/handoff/` | Prior client deliverable package |
| `/Users/stellaroskens/491WD2/.env.example` | Env keys template |
| `/opt/homebrew/bin/gh` | GitHub CLI binary |

---

## 9. Done definition

- [ ] `gh auth status` shows logged-in user/org access
- [ ] Private GitHub repo `491wd2-app` exists under the correct owner
- [ ] `origin` points at that repo
- [ ] `main` is pushed (`git push -u origin main` succeeded)
- [ ] User can open the repo in the browser

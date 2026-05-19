# Backend plan: Supabase-ready architecture

This document tracks a future **Supabase-backed** household app alongside today’s **localStorage-first** browser app.

## Supabase Phase 1 — local schema only (current)

**What exists in the repo**

- **`supabase/config.toml`** — Local Supabase CLI config (no remote project ID, no secrets). `project_id` is a local label derived from the folder name.
- **`supabase/migrations/20260504120000_create_family_hub_schema.sql`** — Initial Postgres schema: tables, indexes, `updated_at` trigger helper, RLS enabled on all listed tables, starter policies, SQL comments for **future** Storage buckets (buckets are **not** created in this migration).
- **`supabase/seed.sql`** — Development-only rows (demo household, two roster members, admin settings JSON, one task, one planner event, one activity log entry). Loaded after migrations when seeding is enabled in config.

**What is intentionally not connected (data layer)**

- **`VITE_SUPABASE_*`** env vars are optional; without them the app behaves as before (no Supabase session).
- **`useFamilyData`**, **`LocalFamilyRepository`**, and **localStorage** remain the only source of **`FamilyData`**; the app does not read or write Postgres for household data yet.

---

## Supabase Phase 2 — Auth UI and session scaffold (frontend)

**What exists**

- **`@supabase/supabase-js`** — Auth (and later PostgREST).
- **`src/lib/supabaseClient.ts`** — `getSupabaseBrowserClient()`, `isSupabaseConfigured()`.
- **`src/auth/`** — `AuthProvider`, **`useAuth()`** (`session`, `user`, `loading`, **`signOut`**), shared context in **`authContext.ts`**.
- **`src/main.tsx`** — wraps the app with **`AuthProvider`**; **`useFamilyData`** unchanged.
- **Route `/login`** — **`src/pages/LoginPage.tsx`**: email/password, sign in & sign up, sign out when a session exists, status and error text, disabled calm state when env is missing (no crash).
- **`src/components/layout/AppShell.tsx`** — optional **Account** control (header) → `/login`.
- **Settings** — **Current Build** card: local storage status, “Supabase schema: Prepared”, Supabase auth configured/not, **Active data source: Local storage**, plus backend-sync disclaimer. **Household Access** card: signed-in email, “Local only” mode, future roles list (display only), link to sign-in.
- **`.env.example`** — public Supabase URL + anon key placeholders.

**Intentionally not done in Phase 2**

- No route guards; dashboard and settings stay open without signing in.
- No **`profiles`**, **`household_members`**, or **`households`** writes from the app.
- No **`SupabaseFamilyRepository`**; **localStorage** remains the only **`FamilyData`** persistence.

**Bundle note**

- The Supabase client is in the main chunk today (~hundreds of kB gzipped). A **later** pass can **`import()`** a tiny login route module or split **`@supabase/supabase-js`** behind a dynamic import **after** careful checks (SSR/hydration, `AuthProvider` ordering, and session timing). Not required for this pass.

---

## AI Assistant / OpenAI setup

**Architecture**

- **`OPENAI_API_KEY`** and **`OPENAI_MODEL`** belong **only** on the server (e.g. Netlify environment variables). Never prefix secrets with **`VITE_`** and never import API keys into React.
- **ChatGPT web login / password** is **not** used inside FamilySite and is **never** stored; household helpers will call the **OpenAI API** from a **serverless function** only.
- The browser calls **`/.netlify/functions/ai-household-helper`** via **`src/services/aiClient.ts`** (`testAiConnection`, `requestHouseholdAiHelp`). The app does **not** call OpenAI directly from the client.

**Repository pieces**

- **`.env.example`** — documents server-side `OPENAI_*` vars and optional **`VITE_AI_MODEL_LABEL`** (display-only in Settings).
- **`netlify/functions/ai-household-helper.ts`** — validates JSON (`task` + optional `input`), avoids sending private family data by default, uses **`fetch`** to OpenAI when the key is set, otherwise returns a structured placeholder response.
- **Settings → Backend status → AI Assistant** — status display, connection test, planned feature list, privacy notes (no API key field in the UI).

**Future AI features (planned; most not wired yet)**

- Summarize today · suggest chores · grocery list helper · pantry meal ideas · cleaning checklist assistant · message board rewrite helper · schedule prep suggestions.

**Privacy guardrails**

- Send **minimum** necessary text per request; no automatic **full localStorage** or household snapshot.
- Treat **sensitive docs**, **health / allergies**, **emergency contacts**, and **private messages** as opt-in only when a feature explicitly asks the user what to include.

---

## Supabase Phase 3 — next: household bootstrap

- Link **`auth.users`** to **`profiles`** and **`household_members`** (invites, roles).
- First household creation / join flows; still no automatic **`FamilyData`** migration until a dedicated import/cutover phase.

---

## Supabase Phase 5 — Controlled Cloud Upload (device → cloud; no live sync)

**What this phase adds**

- A signed-in user can **connect** (select) a cloud household and, if needed, **create** one.
- After running a **preview** and confirming a safety checkbox, the app can upload a **one-way snapshot** of the current device data into the connected cloud household tables.
- Upload is **append/upsert only**: it does not delete cloud rows, and it does not delete or replace the device data.

**What stays intentionally local**

- The app remains **localStorage-first** for reads and writes.
- “Cloud sync” is still **disabled**. Upload is a manual, controlled import step only.

**Mapping strategy**

- Cloud tables gain `local_id` + `source_metadata` + `imported_at` fields (and unique indexes on `(household_id, local_id)`) so the uploader can avoid duplicates and safely upsert repeated uploads.

**Next phase**

- Preview switching the repository reads/writes to a Supabase-backed implementation behind a deliberate cutover flow.

---

**Household tenancy (schema recap)**

- Tables **`family_members`**, **`tasks`**, **`planner_events`**, **`calendar_links`**, **`projects`**, **`docs`**, **`shopping_items`**, **`grocery_items`**, **`inventory_items`**, **`activity_log`**, and **`admin_settings`** include **`household_id uuid not null references households(id) on delete cascade`**.
- **`profiles`** links to **`auth.users`**; **`household_members`** links users to households with a **role** check constraint.

**Roles on `household_members`**

- Allowed values: **`owner`**, **`adult_admin`**, **`caregiver`**, **`member`**, **`child`**, **`viewer`** (`check` constraint).

**RLS summary (starter)**

- Helper functions ( **`security definer`**, fixed **`search_path`** ): **`current_user_is_household_member(uuid)`**, **`current_user_can_write_household(uuid)`**, **`current_user_is_household_owner(uuid)`**.
- **`profiles`**: each user may **`select` / `insert` / `update` / `delete`** only their own row (`auth.uid() = id`).
- **Household-owned data**: **`select`** if the user is a **`household_members`** row for that household (`user_id = auth.uid()`). **`insert` / `update` / `delete`** require **`current_user_can_write_household`**, i.e. role in **`owner`**, **`adult_admin`**, or **`caregiver`** (Phase 1 simplification).
- **`households`**: **`select`** for members; **`insert`** for **`authenticated`**; **`update`** for privileged roles; **`delete`** for **`owner`** only.
- **`household_members`**: **`select`** for members; **`insert`** either (**a**) privileged users, or (**b**) **bootstrap**: user inserts self as **`owner`** when **no** existing **`household_members`** row exists for that `household_id`; **`update` / `delete`** for privileged roles.
- **Task / planner child tables** (no `household_id` column): policies **`exist`** join to parent **`tasks`** / **`planner_events`** for tenancy.
- **`activity_log`**: **`insert`** allowed for any household **member** (append-only); **no** `update` / `delete` policies for authenticated users (service role bypasses RLS for admin tooling).

**Known Phase 1 gaps (expect follow-up migrations)**

- **`member` / `child` / `viewer`** cannot mutate most rows under current write policies (e.g. a child completing a chore may need narrower exceptions or RPCs).
- **`docs.visibility`** and sensitive categories are **not** yet enforced in RLS.
- **`profiles`** does not yet expose cross-household display data to other members.

### Mapping notes (TypeScript ↔ SQL)

| App / `FamilyData` | Postgres |
| ------------------ | -------- |
| `TaskChecklistItem.text` | `task_checklist_items.line_text` |
| `TaskReferenceMedia.type` | `task_reference_media.media_type` |
| `TaskCompletionProof.type` | `task_completion_proof.proof_type` |
| `Task.owner` | `tasks.owner_label` |
| `Task.assignedMemberId` | `tasks.assigned_member_id` → `family_members` |
| `FamilyMember` (optional auth link) | `family_members.auth_user_id` → `auth.users` |
| `AdminSettings` | `admin_settings.settings` **jsonb** (one row per household, PK = `household_id`) |
| `ActivityLogItem.memberId` | `activity_log.member_id` → `family_members` (nullable) |

### Local commands (on your machine)

Requires **[Docker Desktop](https://docs.docker.com/desktop)** for **`supabase start`**.

```bash
# One-time: add the CLI as a dev dependency (optional; npx also works)
npm install supabase --save-dev

# Already done in this repo; if you clone fresh:
npx supabase init

# Start local stack and apply migrations + seed
npx supabase start

# Re-run migrations from scratch and re-apply seed (destructive to local DB)
npx supabase db reset
```

Do **not** commit the output of **`supabase link`**, remote project refs, or **anon / service** keys. Production deploy and hosted linking are out of scope for this phase.

---

## Data adapter plan


- **Current:** The app is **localStorage-first**. `FamilyRepository` is defined in `src/data/familyRepository.ts` and implemented by **`LocalFamilyRepository`** (`src/data/localFamilyRepository.ts`). `useFamilyData` loads via `loadFamilyDataFromLocalStorageSync()` and persists with `localFamilyRepository.saveFamilyData()` after each state change.
- **Auth (Phase 2):** Optional Supabase Auth session via **`AuthProvider`** / **`useAuth()`** when **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** are set. Session state does **not** drive **`FamilyData`**.
- **Future:** A **`SupabaseFamilyRepository`** stub exists in `src/data/supabaseFamilyRepository.ts` (not wired, no client usage inside that file). When Auth, RLS, and Storage are ready, the app can swap the active repository implementation while keeping the same interface.
- **Source of truth:** **localStorage** under key `familysite-491:first-family-build` remains authoritative in the browser until a deliberate cutover to remote persistence. Export/import/reset UX continues to operate on in-memory `FamilyData` + the same persistence path as today.

---

## Planned Postgres tables

Canonical names (draft — same set as detailed below):

```
households
profiles
household_members
family_members
tasks
task_checklist_items
task_reference_media
task_completion_proof
planner_events
planner_event_members
calendar_links
projects
docs
shopping_items
grocery_items
inventory_items
activity_log
admin_settings
```

Naming follows snake_case in Postgres; UUID primary keys are assumed unless noted. Foreign keys reference `households.id` where the row belongs to a household.

| Table | Purpose |
| ----- | ------- |
| **households** | One row per household/tenant; display name, slug, created_at, settings pointers. |
| **profiles** | Maps `auth.users` to app identity: display name, avatar URL, default household, timestamps. |
| **household_members** | Junction: `household_id`, `user_id` (nullable for child accounts pending invite), `role`, `invited_at`, `accepted_at`. |
| **family_members** | In-app roster (sync with today’s `FamilyMember`): name, nickname, role labels, status, color theme, notes, allergies, etc.; `household_id`. |
| **tasks** | Chores and tasks (`Task` shape); `household_id`, assignee links, status, frequency, zone, due dates, brain-dump flags, etc. |
| **task_checklist_items** | `task_id`, `line_text` (maps to app checklist `text`), `completed`, `completed_at`, sort order. |
| **task_reference_media** | `task_id`, `media_type`, `url`, `caption`, `display_order` (URLs may point to Storage). |
| **task_completion_proof** | `task_id`, `proof_type`, `url`, `note`, `uploaded_by_label`, `uploaded_at`. |
| **planner_events** | Local planner events; `household_id`, category, dates, repeat, location, notes. |
| **planner_event_members** | Junction: `planner_event_id`, `family_member_id` (many-to-many assignees). |
| **calendar_links** | Saved calendar URLs/embeds per household. |
| **projects** | `Project` rows; `household_id`, lead member, status, priority, dates, milestones JSON or normalized later. |
| **docs** | Knowledge base docs; category, visibility, pins, related members/projects. |
| **shopping_items** | Active shopping list rows. |
| **grocery_items** | Grocery library / templates. |
| **inventory_items** | Pantry / inventory (`PantryItem` shape). |
| **activity_log** | Append-only style activity entries for audit/history (`ActivityLogItem`). |
| **admin_settings** | Per-household settings (module visibility, Instacart flags, welcome message, etc.)—either one row per household JSON blob or normalized fields. |

Embedded JSON in `FamilyData` today (e.g. milestone arrays on projects) can stay JSONB columns initially and normalize in later phases.

---

## Planned household roles

These are **app-level** roles (stored on `household_members` or similar), distinct from Postgres roles.

| Role | Intent |
| ---- | ------ |
| **owner** | Full control: billing, delete household, all data, invite/remove members. |
| **adult_admin** | Manage modules, imports, settings, sensitive docs; cannot necessarily delete household. |
| **caregiver** | Trusted adult with broad edit access; may exclude financial or destructive actions. |
| **member** | Standard household member: edit assigned tasks, own planner items, limited settings. |
| **child** | Limited edit: complete assigned chores, view safe docs; no access to sensitive health/settings. |
| **viewer** | Read-only or near read-only (e.g. extended family). |

Exact permission matrices belong in policy tables or documented RLS helpers.

---

## Row Level Security (RLS) notes

- **Tenancy:** Every data table carries `household_id`. Policies must restrict `SELECT`/`INSERT`/`UPDATE`/`DELETE` to rows where the caller belongs to that household (`household_members` join to `auth.uid()`).
- **Child / member limits:** Use role claims (JWT custom claims or lookup table) so `child` cannot update `admin_settings`, certain `docs` categories, or other members’ private fields.
- **Sensitive docs:** `docs` (and future health notes) need `visibility` or `sensitivity` flags; RLS should hide restricted rows from `child`/`viewer` and optionally from non-adults.
- **Activity log:** Insert allowed for authenticated household members; update/delete typically denied or owner-only.
- **Storage:** Bucket paths should be scoped by `household_id` / user id; policies mirror table access (see migration Phase 6).

RLS is **not** optional if the Supabase anon key ships in the client: the anon key is public; security must live in Postgres policies.

---

## Environment variables and secrets (Vite)

- **Browser / Vite `VITE_*` variables are public.** Anything prefixed for client bundle exposure must be treated as world-readable. Do not put Instacart API secrets, Google OAuth client secrets, or service keys in `VITE_*`.
- **Supabase anon key** is designed to be embedded in the client **only when RLS is correctly enforced** on all exposed tables and Storage.
- **Supabase service role key** must run **only** on a trusted server or serverless function; never in the SPA bundle.
- **Instacart / Google / other third-party secrets** require a backend or Supabase Edge Function that holds server-side env vars and performs token exchange or signed requests.
- **File uploads (chore proof, doc attachments, media URLs)** should use Supabase Storage with per-object or path-based RLS; direct “public URL without checks” patterns are unsafe for private household data.

No real secrets are committed in this repository.

---

## Migration strategy (phases)

### Phase 1 — Repository boundary (browser; unchanged)

- **`useFamilyData`** and **localStorage** remain authoritative in the SPA.
- **`SupabaseFamilyRepository`** stays a stub until a later phase.

### Phase 2 — Supabase schema and RLS (local / staging) — **schema draft in repo**

- ✅ Initial migration: **`supabase/migrations/20260504120000_create_family_hub_schema.sql`** (tables + RLS starter policies).
- **`supabase start` / `supabase db reset`** apply migrations and **`supabase/seed.sql`** when run locally with Docker.
- ⏳ Hosted project linking and remote **`db push`** are not part of this pass.

### Phase 3 — Auth and household membership

- Supabase Auth (email, OAuth, etc.).
- `profiles` + `household_members`; invite flows; map `family_members` rows to optional `user_id` when a roster person logs in.

### Phase 4 — Dual-write or one-shot import

- **Option A:** Export JSON from app (same shape as today’s backup) and **import into Supabase** via admin script or Edge Function.
- **Option B:** Short period of **dual-write** (local + remote) behind a feature flag—higher complexity; validate conflict handling.

### Phase 5 — Switch reads/writes to Supabase

- Implement `SupabaseFamilyRepository` (or split read/write ports if needed).

---

## Supabase Phase 4 — Cloud Migration Preview (dry run)

**What this phase adds**

- A **Preview cloud migration** tool that scans the current device `FamilyData`, counts records by type, and reports readiness.
- When Supabase is configured and a cloud household is connected, the preview performs a **read-only** cloud comparison (counts per table) using the anon client under RLS.
- The preview logs a local activity entry: **“Reviewed cloud migration preview.”**

**What this phase explicitly does not do**

- No upload/import to Postgres.
- No deletes.
- No live sync.
- No change to the active data source (device remains localStorage-first).

**Next phase**

- Controlled cloud upload/import (device → cloud) after preview validation and a backup reminder.
- Replace default repository in app bootstrap; keep **export/import** for backups and offline escape hatch if product requires it.

### Phase 6 — Storage

- Buckets for media/proof/doc files; signed URLs; policies aligned with doc/task visibility.

### Phase 7 — Serverless functions

- Edge Functions (or other backend) for **Instacart**, **Google Calendar** secrets, webhooks, and any operation that must not trust the client.

---

## Mapping to current `FamilyData`

The TypeScript type `FamilyData` in `src/data/familyData.ts` remains the **in-memory contract**. A future adapter layer will map `FamilyData` ↔ Supabase rows (single-household export today becomes multi-tenant `household_id` on each entity). **SQL schema** for that mapping is started in **`supabase/migrations/20260504120000_create_family_hub_schema.sql`**; the frontend **does not** use it yet.

---

## Voice and assistant integration roadmap (browser app)

How **quick-action URLs** and future **server-side** voice features relate to this SPA. Security is unchanged: the app stays localStorage-first until authenticated backend phases exist.

| Phase | Scope |
| ----- | ----- |
| **Phase 1** | **Local quick-action URLs** (`/quick-add?type=…`) with an allowlist of query keys; confirmation UI before any write. See `src/services/quickActions.ts` and `src/pages/QuickAddPage.tsx`. |
| **Phase 2** | **Siri Shortcuts using URLs** — User-built Shortcuts that open the site in Safari; **not** native Apple App Intents. |
| **Phase 3** | **Authenticated webhook endpoints** — Trusted server validates secrets/JWT, maps payloads to household actions under tenancy and RLS. |
| **Phase 4** | **Google Home / Home Assistant bridge** — Backend receives assistant intents; **no** Google API credentials in the browser bundle. |
| **Phase 5** | **Native Apple App Intents** — Only if a native iOS wrapper exists; delegates to the same APIs as Phase 3+. |

**Privacy:** Do not put medical notes, emergency contacts, private doc bodies, member PII, auth tokens, or API keys in quick-action URLs—only coarse types and short, non-sensitive titles (and inventory filter params where already supported).


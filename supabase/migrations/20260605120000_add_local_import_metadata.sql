-- Phase 5 — Controlled Cloud Upload metadata columns
-- Adds local-to-cloud mapping fields without changing existing RLS.

--------------------------------------------------------------------------------
-- Core tables: mapping metadata
--------------------------------------------------------------------------------

alter table public.family_members
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists family_members_household_local_id_unique
  on public.family_members (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.tasks
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists tasks_household_local_id_unique
  on public.tasks (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.task_checklist_items
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists task_checklist_items_task_local_id_unique
  on public.task_checklist_items (task_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.task_reference_media
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists task_reference_media_task_local_id_unique
  on public.task_reference_media (task_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.task_completion_proof
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists task_completion_proof_task_local_id_unique
  on public.task_completion_proof (task_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.planner_events
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists planner_events_household_local_id_unique
  on public.planner_events (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.calendar_links
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists calendar_links_household_local_id_unique
  on public.calendar_links (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.projects
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists projects_household_local_id_unique
  on public.projects (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.docs
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists docs_household_local_id_unique
  on public.docs (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.grocery_items
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists grocery_items_household_local_id_unique
  on public.grocery_items (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.shopping_items
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists shopping_items_household_local_id_unique
  on public.shopping_items (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.inventory_items
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists inventory_items_household_local_id_unique
  on public.inventory_items (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.activity_log
  add column if not exists local_id text,
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

create unique index if not exists activity_log_household_local_id_unique
  on public.activity_log (household_id, local_id)
  where local_id is not null and local_id <> '';

alter table public.admin_settings
  add column if not exists source_metadata jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;


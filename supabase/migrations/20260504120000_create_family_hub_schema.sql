-- FamilySite_491 — Phase 1 schema (local / planning only).
-- Household tenancy via household_id; Supabase Auth via auth.users + profiles + household_members.
--
-- Future Supabase Storage buckets (not created in this migration):
--   - chore-reference-media  — task_reference_media.url may point here
--   - chore-completion-proof — task_completion_proof.url may point here
--   - family-documents     — doc attachments
--   - profile-photos       — profiles.avatar_url may point here

--------------------------------------------------------------------------------
-- Helpers: updated_at
--------------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

--------------------------------------------------------------------------------
-- Helpers: RLS (SECURITY DEFINER; fixed search_path)
--------------------------------------------------------------------------------

-- True if auth.uid() appears on household_members for this household.
create or replace function public.current_user_is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id is not null
      and hm.user_id = auth.uid()
  );
$$;

-- Member with privilege to mutate most household-owned rows.
create or replace function public.current_user_can_write_household(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'adult_admin', 'caregiver')
  );
$$;

-- Household delete / destructive ops (Phase 1 baseline).
create or replace function public.current_user_is_household_owner(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  );
$$;

grant execute on function public.current_user_is_household_member(uuid) to authenticated, anon;
grant execute on function public.current_user_can_write_household(uuid) to authenticated, anon;
grant execute on function public.current_user_is_household_owner(uuid) to authenticated, anon;

--------------------------------------------------------------------------------
-- Core tenancy
--------------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index households_slug_idx on public.households (slug)
  where slug is not null;

create trigger households_set_updated_at
  before update on public.households
  for each row execute function public.set_updated_at();

-- One row per auth user (synced from Supabase Auth).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  default_household_id uuid references public.households (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in (
      'owner',
      'adult_admin',
      'caregiver',
      'member',
      'child',
      'viewer'
    )),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index household_members_household_id_idx on public.household_members (household_id);
create index household_members_user_id_idx on public.household_members (user_id);

-- At most one membership row per (household, user) when user_id is set.
create unique index household_members_household_user_unique
  on public.household_members (household_id, user_id)
  where user_id is not null;

create trigger household_members_set_updated_at
  before update on public.household_members
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Family roster (app family_members)
--------------------------------------------------------------------------------

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  auth_user_id uuid references auth.users (id) on delete set null,
  name text not null,
  nickname text,
  role text,
  role_label text,
  status text not null,
  color_theme text not null default 'slate',
  animal_icon text,
  age_group text,
  school_work_label text,
  allergies text,
  emergency_contact text,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index family_members_household_id_idx on public.family_members (household_id);

create trigger family_members_set_updated_at
  before update on public.family_members
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Tasks
--------------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  description text,
  owner_label text,
  status text not null,
  priority text,
  due_date text,
  due_time text,
  type text not null default 'task',
  frequency text not null default 'one-time',
  last_completed_date text,
  next_due_date text,
  assigned_member_id uuid references public.family_members (id) on delete set null,
  zone text,
  room text,
  category text,
  notes text,
  reward_points numeric,
  requires_verification boolean not null default false,
  requires_proof boolean not null default false,
  is_brain_dump boolean not null default false,
  brain_dump_type text,
  source text,
  source_system text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_household_id_idx on public.tasks (household_id);
create index tasks_assigned_member_id_idx on public.tasks (assigned_member_id);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  line_text text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_checklist_items_task_id_idx on public.task_checklist_items (task_id);

create trigger task_checklist_items_set_updated_at
  before update on public.task_checklist_items
  for each row execute function public.set_updated_at();

create table public.task_reference_media (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  url text not null,
  caption text not null default '',
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index task_reference_media_task_id_idx on public.task_reference_media (task_id);

create table public.task_completion_proof (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  proof_type text not null check (proof_type in ('image', 'video')),
  url text not null,
  note text not null default '',
  uploaded_by_label text not null,
  uploaded_at timestamptz not null default now()
);

create index task_completion_proof_task_id_idx on public.task_completion_proof (task_id);

--------------------------------------------------------------------------------
-- Planner & calendar
--------------------------------------------------------------------------------

create table public.planner_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  date text not null,
  time text not null default '',
  category text not null,
  assigned_member_id uuid references public.family_members (id) on delete set null,
  assigned_person text not null default '',
  assigned_member_ids jsonb,
  responsible_adult_id uuid references public.family_members (id) on delete set null,
  start_time text,
  end_time text,
  is_all_day boolean not null default false,
  repeat_enabled boolean not null default false,
  repeat_rule text,
  location text,
  notes text,
  prep_checklist jsonb,
  reminder_settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index planner_events_household_id_idx on public.planner_events (household_id);

create trigger planner_events_set_updated_at
  before update on public.planner_events
  for each row execute function public.set_updated_at();

create table public.planner_event_members (
  planner_event_id uuid not null references public.planner_events (id) on delete cascade,
  family_member_id uuid not null references public.family_members (id) on delete cascade,
  primary key (planner_event_id, family_member_id)
);

create index planner_event_members_family_member_id_idx on public.planner_event_members (family_member_id);

create table public.calendar_links (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  calendar_url text not null,
  display_name text not null,
  public_url text not null default '',
  embed_url text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_links_household_id_idx on public.calendar_links (household_id);

create trigger calendar_links_set_updated_at
  before update on public.calendar_links
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Projects & docs
--------------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  description text not null default '',
  name text not null default '',
  lead_label text not null default '',
  lead_member_id uuid references public.family_members (id) on delete set null,
  status text not null,
  priority text not null,
  start_date text not null default '',
  target_date text not null default '',
  completed_date text not null default '',
  milestones jsonb not null default '[]'::jsonb,
  milestone_ids jsonb,
  tags jsonb not null default '[]'::jsonb,
  notes text not null default '',
  next_step text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_household_id_idx on public.projects (household_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.docs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  title text not null,
  content text not null default '',
  body text not null default '',
  category text not null,
  tags jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  related_member_ids jsonb not null default '[]'::jsonb,
  related_project_id text not null default '',
  visibility text not null default 'household',
  source text,
  source_system text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index docs_household_id_idx on public.docs (household_id);

create trigger docs_set_updated_at
  before update on public.docs
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Shopping, grocery, inventory
--------------------------------------------------------------------------------

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  quantity text,
  unit text,
  category text not null default '',
  store_section text not null,
  preferred_store text,
  needed_by text not null default '',
  purchased boolean not null default false,
  needs_put_away boolean not null default false,
  destination text,
  destination_detail text,
  custom_destination_name text,
  pantry_note text,
  wall text,
  shelf text,
  grocery_item_id uuid,
  barcode text,
  brand text,
  product_image_url text,
  notes text,
  source text,
  source_system text,
  lookup_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_items_household_id_idx on public.shopping_items (household_id);

create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  category text not null default '',
  store_section text not null,
  preferred_store text,
  amount_default text,
  default_location text,
  default_wall text,
  default_shelf text,
  barcode text,
  brand text,
  product_image_url text,
  notes text,
  source text,
  source_system text,
  lookup_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grocery_items_household_id_idx on public.grocery_items (household_id);

create trigger grocery_items_set_updated_at
  before update on public.grocery_items
  for each row execute function public.set_updated_at();

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  quantity text not null,
  unit text,
  category text not null default '',
  storage_area text,
  location text not null,
  location_detail text,
  custom_location_name text,
  kitchen_location_detail text,
  pantry_location_note text,
  cold_location_detail text,
  pantry_wall text,
  pantry_shelf text,
  wall text,
  shelf text,
  status text not null,
  grocery_item_id uuid,
  barcode text,
  brand text,
  product_image_url text,
  lookup_metadata jsonb,
  expiry_date text,
  notes text,
  is_staple boolean not null default false,
  min_quantity text,
  tags jsonb not null default '[]'::jsonb,
  source text,
  source_system text,
  last_updated_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_items_household_id_idx on public.inventory_items (household_id);

create trigger inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Activity & settings
--------------------------------------------------------------------------------

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  type text not null,
  entity_type text not null,
  entity_id text not null,
  entity_title text not null,
  member_id uuid references public.family_members (id) on delete set null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_household_id_idx on public.activity_log (household_id);
create index activity_log_created_at_idx on public.activity_log (household_id, created_at desc);

-- One settings document per household (matches planned admin_settings).
create table public.admin_settings (
  household_id uuid primary key references public.households (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger admin_settings_set_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

--------------------------------------------------------------------------------
-- Row Level Security
--------------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.household_members enable row level security;
alter table public.family_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.task_reference_media enable row level security;
alter table public.task_completion_proof enable row level security;
alter table public.planner_events enable row level security;
alter table public.planner_event_members enable row level security;
alter table public.calendar_links enable row level security;
alter table public.projects enable row level security;
alter table public.docs enable row level security;
alter table public.shopping_items enable row level security;
alter table public.grocery_items enable row level security;
alter table public.inventory_items enable row level security;
alter table public.activity_log enable row level security;
alter table public.admin_settings enable row level security;

-- Profiles: self only (Phase 1). TODO: optional display names for same household via policy expansion.
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_delete_own
  on public.profiles for delete
  using (auth.uid() = id);

-- Households
create policy households_select_member
  on public.households for select
  using (public.current_user_is_household_member(id));

create policy households_insert_authenticated
  on public.households for insert
  with check (auth.role() = 'authenticated');

create policy households_update_privileged
  on public.households for update
  using (public.current_user_can_write_household(id))
  with check (public.current_user_can_write_household(id));

create policy households_delete_owner
  on public.households for delete
  using (public.current_user_is_household_owner(id));

-- household_members
create policy household_members_select_member
  on public.household_members for select
  using (public.current_user_is_household_member(household_id));

-- First owner row: creator may insert themselves when no other rows exist for the household.
create policy household_members_insert_initial_owner
  on public.household_members for insert
  with check (
    auth.uid() = user_id
    and role = 'owner'
    and not exists (
      select 1 from public.household_members hm0
      where hm0.household_id = household_members.household_id
    )
  );

create policy household_members_insert_privileged
  on public.household_members for insert
  with check (public.current_user_can_write_household(household_id));

create policy household_members_update_privileged
  on public.household_members for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy household_members_delete_privileged
  on public.household_members for delete
  using (public.current_user_can_write_household(household_id));

-- family_members
create policy family_members_select
  on public.family_members for select
  using (public.current_user_is_household_member(household_id));

create policy family_members_insert
  on public.family_members for insert
  with check (public.current_user_can_write_household(household_id));

create policy family_members_update
  on public.family_members for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy family_members_delete
  on public.family_members for delete
  using (public.current_user_can_write_household(household_id));

-- tasks
create policy tasks_select
  on public.tasks for select
  using (public.current_user_is_household_member(household_id));

create policy tasks_insert
  on public.tasks for insert
  with check (public.current_user_can_write_household(household_id));

create policy tasks_update
  on public.tasks for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy tasks_delete
  on public.tasks for delete
  using (public.current_user_can_write_household(household_id));

-- task children (scoped via parent task)
create policy task_checklist_items_select
  on public.task_checklist_items for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_checklist_items.task_id
      and public.current_user_is_household_member(t.household_id)
  ));

create policy task_checklist_items_write
  on public.task_checklist_items for insert
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_checklist_items.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_checklist_items_update
  on public.task_checklist_items for update
  using (exists (
    select 1 from public.tasks t
    where t.id = task_checklist_items.task_id
      and public.current_user_can_write_household(t.household_id)
  ))
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_checklist_items.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_checklist_items_delete
  on public.task_checklist_items for delete
  using (exists (
    select 1 from public.tasks t
    where t.id = task_checklist_items.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_reference_media_select
  on public.task_reference_media for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_reference_media.task_id
      and public.current_user_is_household_member(t.household_id)
  ));

create policy task_reference_media_write
  on public.task_reference_media for insert
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_reference_media.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_reference_media_update
  on public.task_reference_media for update
  using (exists (
    select 1 from public.tasks t
    where t.id = task_reference_media.task_id
      and public.current_user_can_write_household(t.household_id)
  ))
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_reference_media.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_reference_media_delete
  on public.task_reference_media for delete
  using (exists (
    select 1 from public.tasks t
    where t.id = task_reference_media.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_completion_proof_select
  on public.task_completion_proof for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_completion_proof.task_id
      and public.current_user_is_household_member(t.household_id)
  ));

create policy task_completion_proof_write
  on public.task_completion_proof for insert
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_completion_proof.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_completion_proof_update
  on public.task_completion_proof for update
  using (exists (
    select 1 from public.tasks t
    where t.id = task_completion_proof.task_id
      and public.current_user_can_write_household(t.household_id)
  ))
  with check (exists (
    select 1 from public.tasks t
    where t.id = task_completion_proof.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

create policy task_completion_proof_delete
  on public.task_completion_proof for delete
  using (exists (
    select 1 from public.tasks t
    where t.id = task_completion_proof.task_id
      and public.current_user_can_write_household(t.household_id)
  ));

-- planner
create policy planner_events_select
  on public.planner_events for select
  using (public.current_user_is_household_member(household_id));

create policy planner_events_write
  on public.planner_events for insert
  with check (public.current_user_can_write_household(household_id));

create policy planner_events_update
  on public.planner_events for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy planner_events_delete
  on public.planner_events for delete
  using (public.current_user_can_write_household(household_id));

create policy planner_event_members_select
  on public.planner_event_members for select
  using (exists (
    select 1 from public.planner_events e
    where e.id = planner_event_members.planner_event_id
      and public.current_user_is_household_member(e.household_id)
  ));

create policy planner_event_members_write
  on public.planner_event_members for insert
  with check (exists (
    select 1 from public.planner_events e
    where e.id = planner_event_members.planner_event_id
      and public.current_user_can_write_household(e.household_id)
  ));

create policy planner_event_members_update
  on public.planner_event_members for update
  using (exists (
    select 1 from public.planner_events e
    where e.id = planner_event_members.planner_event_id
      and public.current_user_can_write_household(e.household_id)
  ))
  with check (exists (
    select 1 from public.planner_events e
    where e.id = planner_event_members.planner_event_id
      and public.current_user_can_write_household(e.household_id)
  ));

create policy planner_event_members_delete
  on public.planner_event_members for delete
  using (exists (
    select 1 from public.planner_events e
    where e.id = planner_event_members.planner_event_id
      and public.current_user_can_write_household(e.household_id)
  ));

-- calendar_links
create policy calendar_links_select
  on public.calendar_links for select
  using (public.current_user_is_household_member(household_id));

create policy calendar_links_write
  on public.calendar_links for insert
  with check (public.current_user_can_write_household(household_id));

create policy calendar_links_update
  on public.calendar_links for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy calendar_links_delete
  on public.calendar_links for delete
  using (public.current_user_can_write_household(household_id));

-- projects & docs
create policy projects_select
  on public.projects for select
  using (public.current_user_is_household_member(household_id));

create policy projects_write
  on public.projects for insert
  with check (public.current_user_can_write_household(household_id));

create policy projects_update
  on public.projects for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy projects_delete
  on public.projects for delete
  using (public.current_user_can_write_household(household_id));

create policy docs_select
  on public.docs for select
  using (public.current_user_is_household_member(household_id));

create policy docs_write
  on public.docs for insert
  with check (public.current_user_can_write_household(household_id));

create policy docs_update
  on public.docs for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy docs_delete
  on public.docs for delete
  using (public.current_user_can_write_household(household_id));

-- shopping / grocery / inventory
create policy shopping_items_select
  on public.shopping_items for select
  using (public.current_user_is_household_member(household_id));

create policy shopping_items_write
  on public.shopping_items for insert
  with check (public.current_user_can_write_household(household_id));

create policy shopping_items_update
  on public.shopping_items for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy shopping_items_delete
  on public.shopping_items for delete
  using (public.current_user_can_write_household(household_id));

create policy grocery_items_select
  on public.grocery_items for select
  using (public.current_user_is_household_member(household_id));

create policy grocery_items_write
  on public.grocery_items for insert
  with check (public.current_user_can_write_household(household_id));

create policy grocery_items_update
  on public.grocery_items for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy grocery_items_delete
  on public.grocery_items for delete
  using (public.current_user_can_write_household(household_id));

create policy inventory_items_select
  on public.inventory_items for select
  using (public.current_user_is_household_member(household_id));

create policy inventory_items_write
  on public.inventory_items for insert
  with check (public.current_user_can_write_household(household_id));

create policy inventory_items_update
  on public.inventory_items for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy inventory_items_delete
  on public.inventory_items for delete
  using (public.current_user_can_write_household(household_id));

-- activity_log: append-friendly — any member may insert; no update/delete for authenticated (service role bypasses RLS).
create policy activity_log_select
  on public.activity_log for select
  using (public.current_user_is_household_member(household_id));

create policy activity_log_insert
  on public.activity_log for insert
  with check (public.current_user_is_household_member(household_id));

-- admin_settings
create policy admin_settings_select
  on public.admin_settings for select
  using (public.current_user_is_household_member(household_id));

create policy admin_settings_write
  on public.admin_settings for insert
  with check (public.current_user_can_write_household(household_id));

create policy admin_settings_update
  on public.admin_settings for update
  using (public.current_user_can_write_household(household_id))
  with check (public.current_user_can_write_household(household_id));

create policy admin_settings_delete
  on public.admin_settings for delete
  using (public.current_user_can_write_household(household_id));

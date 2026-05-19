-- Development-only seed data (runs after migrations on `supabase db reset`).
-- Uses fixed UUIDs for reproducible local testing. Not for production.
-- RLS is bypassed when this file runs as the database superuser.

insert into public.households (id, name, slug, metadata)
values (
  '10000000-0000-4000-8000-000000000001',
  'Demo Household',
  'demo-household',
  '{"seed": true}'::jsonb
);

insert into public.family_members (
  id,
  household_id,
  name,
  status,
  color_theme,
  notes
)
values
  (
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000001',
    'Alex',
    'active',
    'blue',
    ''
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000001',
    'Sam',
    'active',
    'slate',
    ''
  );

insert into public.admin_settings (household_id, settings)
values (
  '10000000-0000-4000-8000-000000000001',
  jsonb_build_object(
    'householdName', 'Demo Household',
    'dashboardWelcomeMessage', 'Local Supabase seed — browser app still uses localStorage.',
    'appModeLabel', 'Dev seed',
    'colorThemeOptions', 'blue, slate, purple',
    'animalIconHelpText', '',
    'instacart', jsonb_build_object(
      'enableInstacartExport', false,
      'preferredStoreName', '',
      'preferredZipCode', '',
      'notes', ''
    ),
    'moduleVisibility', jsonb_build_object(
      'dashboard', true,
      'family', true,
      'tasks', true,
      'projects', true,
      'pantry', true,
      'shopping', true,
      'calendar', true,
      'planner', true,
      'docs', true
    )
  )
);

insert into public.tasks (
  id,
  household_id,
  title,
  status,
  priority,
  due_date,
  type,
  frequency,
  last_completed_date,
  next_due_date,
  assigned_member_id,
  source
)
values (
  '10000000-0000-4000-8000-000000000201',
  '10000000-0000-4000-8000-000000000001',
  'Recycle bins to curb',
  'Not Started',
  'Medium',
  (current_date + 1)::text,
  'chore',
  'weekly',
  '',
  (current_date + 1)::text,
  '10000000-0000-4000-8000-000000000101',
  'seed'
);

insert into public.planner_events (
  id,
  household_id,
  title,
  date,
  time,
  category,
  assigned_member_id,
  assigned_person
)
values (
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000001',
  'Week plan review',
  current_date::text,
  '09:00',
  'Home',
  '10000000-0000-4000-8000-000000000102',
  'Sam'
);

insert into public.activity_log (
  id,
  household_id,
  type,
  entity_type,
  entity_id,
  entity_title,
  message,
  metadata
)
values (
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000001',
  'created',
  'task',
  '10000000-0000-4000-8000-000000000201',
  'Recycle bins to curb',
  'Seed row: demo task created.',
  '{}'::jsonb
);

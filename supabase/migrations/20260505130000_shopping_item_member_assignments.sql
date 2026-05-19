-- Optional shopping list ownership fields (local member ids as text).

alter table public.shopping_items
  add column if not exists requested_by_member_id text,
  add column if not exists assigned_to_member_id text;

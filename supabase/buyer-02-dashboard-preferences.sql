-- ============================================================
-- SouthCaravan — Buyer dashboard preferences (settings page)
-- Run after `buyer-01-dashboard-tables.sql`
-- ============================================================

create extension if not exists pgcrypto;

-- Keep this re-runnable.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customer_preferences (
  user_id uuid primary key, -- auth.users.id
  currency_preference text not null default 'AUTO',
  language text not null default 'en',
  time_zone text not null default 'UTC',
  allow_analytics boolean not null default true,
  personalized_recommendations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_preferences_set_updated_at on public.customer_preferences;
create trigger customer_preferences_set_updated_at
  before update on public.customer_preferences
  for each row execute function public.set_updated_at();

alter table public.customer_preferences enable row level security;
drop policy if exists "customer_preferences_select_blocked" on public.customer_preferences;
create policy "customer_preferences_select_blocked" on public.customer_preferences for select using (false);
drop policy if exists "customer_preferences_insert_blocked" on public.customer_preferences;
create policy "customer_preferences_insert_blocked" on public.customer_preferences for insert with check (false);
drop policy if exists "customer_preferences_update_blocked" on public.customer_preferences;
create policy "customer_preferences_update_blocked" on public.customer_preferences for update using (false);
drop policy if exists "customer_preferences_delete_blocked" on public.customer_preferences;
create policy "customer_preferences_delete_blocked" on public.customer_preferences for delete using (false);


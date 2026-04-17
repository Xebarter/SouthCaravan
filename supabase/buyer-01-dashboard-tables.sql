-- ============================================================
-- SouthCaravan — Buyer dashboard tables (orders/quotes/messages/wishlist/etc.)
-- Run this in Supabase SQL Editor after `schema.sql` and `auth-01-customers.sql`
-- ============================================================

create extension if not exists pgcrypto;

-- `schema.sql` defines `public.set_updated_at()` already, but keep this re-runnable.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Extended buyer profile fields (kept separate from `customers`)
create table if not exists public.customer_profiles (
  user_id uuid primary key, -- auth.users.id
  company_name text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  country text not null default '',
  tax_id text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();

alter table public.customer_profiles enable row level security;
drop policy if exists "customer_profiles_select_blocked" on public.customer_profiles;
create policy "customer_profiles_select_blocked" on public.customer_profiles for select using (false);
drop policy if exists "customer_profiles_insert_blocked" on public.customer_profiles;
create policy "customer_profiles_insert_blocked" on public.customer_profiles for insert with check (false);
drop policy if exists "customer_profiles_update_blocked" on public.customer_profiles;
create policy "customer_profiles_update_blocked" on public.customer_profiles for update using (false);
drop policy if exists "customer_profiles_delete_blocked" on public.customer_profiles;
create policy "customer_profiles_delete_blocked" on public.customer_profiles for delete using (false);

-- Notification prefs for buyers
create table if not exists public.customer_notification_prefs (
  user_id uuid primary key,
  email text not null default '',
  order_updates boolean not null default true,
  new_products boolean not null default true,
  vendor_messages boolean not null default true,
  promo boolean not null default false,
  newsletter boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_notification_prefs_set_updated_at on public.customer_notification_prefs;
create trigger customer_notification_prefs_set_updated_at
  before update on public.customer_notification_prefs
  for each row execute function public.set_updated_at();

alter table public.customer_notification_prefs enable row level security;
drop policy if exists "customer_notification_prefs_select_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_select_blocked" on public.customer_notification_prefs for select using (false);
drop policy if exists "customer_notification_prefs_insert_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_insert_blocked" on public.customer_notification_prefs for insert with check (false);
drop policy if exists "customer_notification_prefs_update_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_update_blocked" on public.customer_notification_prefs for update using (false);
drop policy if exists "customer_notification_prefs_delete_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_delete_blocked" on public.customer_notification_prefs for delete using (false);


-- ============================================================
-- SouthCaravan — Auth support: customers table (buyer phone gate)
-- Run this in Supabase SQL Editor AFTER `schema.sql`
-- ============================================================

create extension if not exists pgcrypto;

-- Keep updated_at current on every row update.
-- (Safe to re-run; `schema.sql` also defines this function.)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $set_updated_at$
begin
  new.updated_at = now();
  return new;
end;
$set_updated_at$;

create table if not exists public.customers (
  id uuid primary key,               -- should match auth.users.id
  email text unique not null,
  name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (email);

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- RLS: lock down direct browser access.
-- The server uses the service-role key, which bypasses RLS.
alter table public.customers enable row level security;

drop policy if exists "customers_select_blocked" on public.customers;
create policy "customers_select_blocked"
  on public.customers for select
  using (false);

drop policy if exists "customers_insert_blocked" on public.customers;
create policy "customers_insert_blocked"
  on public.customers for insert
  with check (false);

drop policy if exists "customers_update_blocked" on public.customers;
create policy "customers_update_blocked"
  on public.customers for update
  using (false);

drop policy if exists "customers_delete_blocked" on public.customers;
create policy "customers_delete_blocked"
  on public.customers for delete
  using (false);


-- ============================================================
-- SouthCaravan — Auth support: authoritative user_roles mapping
-- Run this in Supabase SQL Editor AFTER `auth-02-portal-signup-blocked-rpc.sql`
-- ============================================================
--
-- Purpose
-- -------
-- The app must enforce that holding an auth account for one portal
-- (e.g. "vendor") does NOT automatically grant access to another
-- portal (e.g. "buyer") — even when both portals would use the same
-- email. Supabase Auth allows only one auth.users row per email, so
-- we model per-portal membership explicitly with this table.
--
-- Authoritative rules
-- -------------------
-- * An auth user "has the <portal> role" iff a row exists in
--   public.user_roles with (user_id, role) matching the user and portal.
-- * Admin role is determined by auth.users.raw_app_meta_data->>'role'
--   = 'admin' and is NOT tracked here — admins are provisioned out-of-band.
--
-- Backfill
-- --------
-- Buyer role is seeded from public.customers (existing buyers).
-- Vendor role is seeded from public.vendors (existing vendors).
-- Services role is NOT seeded automatically: an existing vendor does not
-- implicitly have services access and must go through the upgrade flow.

create table if not exists public.user_roles (
  user_id uuid not null,
  role text not null check (role in ('buyer', 'vendor', 'services', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists user_roles_user_idx on public.user_roles (user_id);
create index if not exists user_roles_role_idx on public.user_roles (role);

alter table public.user_roles enable row level security;

-- Lock down direct browser access; server uses service-role (bypasses RLS).
drop policy if exists "user_roles_select_blocked" on public.user_roles;
create policy "user_roles_select_blocked"
  on public.user_roles for select
  using (false);

drop policy if exists "user_roles_insert_blocked" on public.user_roles;
create policy "user_roles_insert_blocked"
  on public.user_roles for insert
  with check (false);

drop policy if exists "user_roles_update_blocked" on public.user_roles;
create policy "user_roles_update_blocked"
  on public.user_roles for update
  using (false);

drop policy if exists "user_roles_delete_blocked" on public.user_roles;
create policy "user_roles_delete_blocked"
  on public.user_roles for delete
  using (false);

-- ---------------- Backfill (idempotent) ----------------

insert into public.user_roles (user_id, role)
select c.id, 'buyer'
from public.customers c
where c.id is not null
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select v.id, 'vendor'
from public.vendors v
where v.id is not null
on conflict (user_id, role) do nothing;

-- ---------------- RPC: portal membership check ----------------

create or replace function public.user_has_portal_role(p_user_id uuid, p_portal text)
returns boolean
language sql
security definer
as $fn$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role = lower(coalesce(p_portal, ''))
  );
$fn$;

revoke all on function public.user_has_portal_role(uuid, text) from public;
grant execute on function public.user_has_portal_role(uuid, text) to service_role;

-- ---------------- RPC: email / portal status ----------------
-- Returns:
--   auth_exists  — true if an auth.users row exists for this email
--   has_role     — true if that user already holds the requested portal role
--
-- Used by the sign-in / sign-up UI to decide whether to:
--   1. Sign in normally,
--   2. Offer to add the portal role to an existing account, or
--   3. Create a brand-new auth account.

create or replace function public.auth_email_portal_status(check_email text, portal text)
returns table(auth_exists boolean, has_role boolean)
language plpgsql
security definer
as $fn$
declare
  v_email text := lower(coalesce(check_email, ''));
  v_portal text := lower(coalesce(portal, ''));
  v_user_id uuid;
  v_has boolean := false;
begin
  if v_email = '' then
    auth_exists := false;
    has_role := false;
    return next;
    return;
  end if;

  select id into v_user_id from auth.users where lower(email) = v_email limit 1;

  if v_user_id is null then
    auth_exists := false;
    has_role := false;
    return next;
    return;
  end if;

  auth_exists := true;

  if v_portal = 'admin' then
    select coalesce((raw_app_meta_data ->> 'role') = 'admin', false)
      into v_has
      from auth.users
      where id = v_user_id;
    has_role := coalesce(v_has, false);
    return next;
    return;
  end if;

  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = v_user_id
      and ur.role = v_portal
  ) into v_has;

  has_role := coalesce(v_has, false);
  return next;
end;
$fn$;

revoke all on function public.auth_email_portal_status(text, text) from public;
grant execute on function public.auth_email_portal_status(text, text) to service_role;

-- ---------------- RPC: refresh portal-block to use user_roles ----------------

create or replace function public.auth_portal_signup_blocked(check_email text, portal text)
returns boolean
language plpgsql
security definer
as $fn$
declare
  v_status record;
begin
  select * into v_status from public.auth_email_portal_status(check_email, portal);
  return coalesce(v_status.has_role, false);
end;
$fn$;

revoke all on function public.auth_portal_signup_blocked(text, text) from public;
grant execute on function public.auth_portal_signup_blocked(text, text) to service_role;

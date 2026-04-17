-- ============================================================
-- SouthCaravan — Auth support: portal sign-up gating RPC
-- Run this in Supabase SQL Editor AFTER `schema.sql`
-- ============================================================
--
-- Used by: POST /api/auth/check-email-registered
-- RPC name: auth_portal_signup_blocked(check_email, portal)
--
-- IMPORTANT:
-- The app expects the endpoint to return `{ registered: boolean }`.
-- The current API route treats the RPC result as "registered" (blocked).
-- Implement the rule you want inside this function.
--
-- Portal-aware default:
-- - buyer: block if customers.email exists
-- - vendor: block if vendors.email exists
-- - services: never block
-- - admin/unknown: block if auth.users contains email

create or replace function public.auth_portal_signup_blocked(check_email text, portal text)
returns boolean
language sql
security definer
as $$
  with norm as (
    select lower(coalesce(check_email, '')) as email, lower(coalesce(portal, '')) as portal
  )
  select case
    when (select portal from norm) = 'buyer' then
      exists (select 1 from public.customers c where lower(c.email) = (select email from norm))
    when (select portal from norm) = 'vendor' then
      exists (select 1 from public.vendors v where lower(v.email) = (select email from norm))
    when (select portal from norm) = 'services' then
      false
    else
      exists (select 1 from auth.users u where lower(u.email) = (select email from norm))
  end;
$$;

revoke all on function public.auth_portal_signup_blocked(text, text) from public;
grant execute on function public.auth_portal_signup_blocked(text, text) to service_role;


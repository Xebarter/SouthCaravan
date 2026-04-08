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
-- Safe default below: never block sign-up (returns false).

create or replace function public.auth_portal_signup_blocked(check_email text, portal text)
returns boolean
language sql
security definer
as $$
  select false;
$$;

revoke all on function public.auth_portal_signup_blocked(text, text) from public;
grant execute on function public.auth_portal_signup_blocked(text, text) to anon, authenticated;


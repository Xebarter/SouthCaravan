-- ============================================================
-- SouthCaravan — Separate verification for marketplace vs services
-- Run in Supabase SQL Editor (after vendor-verification.sql)
-- ============================================================
-- is_verified / verified_at  → marketplace (vendor) dashboard
-- services_verified / services_verified_at → services dashboard

alter table public.vendors
  add column if not exists services_verified boolean not null default false;

alter table public.vendors
  add column if not exists services_verified_at timestamptz;

create index if not exists vendors_services_verified_idx
  on public.vendors (services_verified, created_at desc);

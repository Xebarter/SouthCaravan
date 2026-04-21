-- ============================================================
-- SouthCaravan — Vendor verification support
-- Run this in your Supabase project's SQL Editor
-- ============================================================

alter table public.vendors
  add column if not exists is_verified boolean not null default false;

alter table public.vendors
  add column if not exists verified_at timestamptz;

create index if not exists vendors_is_verified_idx
  on public.vendors (is_verified, created_at desc);


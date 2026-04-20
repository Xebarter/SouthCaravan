-- ============================================================
-- SouthCaravan — DPO Payment Integration Migration
-- Run in Supabase SQL Editor after buyer-02-crud-core.sql
-- ============================================================

-- Allow orders to be created without a vendor (checkout orders span multiple vendors).
alter table public.orders
  alter column vendor_user_id drop not null;

-- DPO transaction token (returned by DPO createToken).
alter table public.orders
  add column if not exists dpo_trans_token text;

-- DPO transaction reference number.
alter table public.orders
  add column if not exists dpo_trans_ref text;

-- Payment status separate from fulfillment status.
alter table public.orders
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed'));

-- Index for fast lookup when DPO redirects back with a token.
create index if not exists orders_dpo_trans_token_idx
  on public.orders (dpo_trans_token)
  where dpo_trans_token is not null;

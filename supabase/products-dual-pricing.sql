-- ============================================================
-- SouthCaravan — Dual pricing (retail + bulk)
-- Run in Supabase SQL Editor after products table exists.
-- Existing `price` remains the bulk price; MOQ unchanged.
-- ============================================================

alter table public.products
  add column if not exists retail_price numeric(12, 2);

comment on column public.products.price is 'Bulk unit price — applies when order quantity >= minimum_order';
comment on column public.products.retail_price is 'Retail (single) unit price — applies when quantity < minimum_order; null = bulk only';
comment on column public.products.minimum_order is 'Minimum quantity for bulk pricing threshold (MOQ)';

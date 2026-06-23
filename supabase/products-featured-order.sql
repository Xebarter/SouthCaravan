-- Featured product display order (homepage hero + featured listings)
-- Run in Supabase SQL Editor after schema.sql

alter table public.products
  add column if not exists featured_sort_order int not null default 0;

drop index if exists products_featured_idx;
create index if not exists products_featured_idx
  on public.products (is_featured, featured_sort_order asc, updated_at desc);

-- Backfill existing featured products: newest first (matches prior created_at desc behavior)
with ranked as (
  select
    id,
    (row_number() over (order by created_at desc) - 1) * 10 as sort_order
  from public.products
  where is_featured = true
)
update public.products p
set featured_sort_order = r.sort_order
from ranked r
where p.id = r.id;

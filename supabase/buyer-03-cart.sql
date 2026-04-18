-- ============================================================
-- SouthCaravan — Buyer shopping cart (persisted; API + service role)
-- Run after buyer-02-crud-core.sql (needs products + auth.users)
-- ============================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0 and quantity <= 999999),
  list_kind text not null default 'cart' check (list_kind in ('cart', 'saved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, product_id, list_kind)
);

create index if not exists cart_items_buyer_list_idx on public.cart_items (buyer_id, list_kind, updated_at desc);

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_blocked" on public.cart_items;
create policy "cart_items_select_blocked" on public.cart_items for select using (false);
drop policy if exists "cart_items_insert_blocked" on public.cart_items;
create policy "cart_items_insert_blocked" on public.cart_items for insert with check (false);
drop policy if exists "cart_items_update_blocked" on public.cart_items;
create policy "cart_items_update_blocked" on public.cart_items for update using (false);
drop policy if exists "cart_items_delete_blocked" on public.cart_items;
create policy "cart_items_delete_blocked" on public.cart_items for delete using (false);

-- Optional applied promo (code only; rates resolved server-side from KNOWN_COUPONS)
create table if not exists public.buyer_cart_meta (
  buyer_id uuid primary key references auth.users (id) on delete cascade,
  coupon_code text,
  updated_at timestamptz not null default now()
);

drop trigger if exists buyer_cart_meta_set_updated_at on public.buyer_cart_meta;
create trigger buyer_cart_meta_set_updated_at
  before update on public.buyer_cart_meta
  for each row execute function public.set_updated_at();

alter table public.buyer_cart_meta enable row level security;

drop policy if exists "buyer_cart_meta_select_blocked" on public.buyer_cart_meta;
create policy "buyer_cart_meta_select_blocked" on public.buyer_cart_meta for select using (false);
drop policy if exists "buyer_cart_meta_insert_blocked" on public.buyer_cart_meta;
create policy "buyer_cart_meta_insert_blocked" on public.buyer_cart_meta for insert with check (false);
drop policy if exists "buyer_cart_meta_update_blocked" on public.buyer_cart_meta;
create policy "buyer_cart_meta_update_blocked" on public.buyer_cart_meta for update using (false);
drop policy if exists "buyer_cart_meta_delete_blocked" on public.buyer_cart_meta;
create policy "buyer_cart_meta_delete_blocked" on public.buyer_cart_meta for delete using (false);

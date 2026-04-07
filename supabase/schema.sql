-- ============================================================
-- SouthCaravan — Products table
-- Run this in your Supabase project's SQL Editor
-- ============================================================

create table if not exists public.products (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     text,                          -- nullable; null = platform product
  name          text        not null,
  description   text        not null default '',
  category      text        not null,
  subcategory   text        not null default 'General',
  sub_subcategory text      not null default 'General',
  price         numeric(12, 2) not null default 0,
  minimum_order integer     not null default 1,
  unit          text        not null default 'piece',
  images        text[]      not null default '{}',
  in_stock      boolean     not null default true,
  is_featured   boolean     not null default false,
  specifications jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Backward-compatible migrations for existing tables
alter table public.products add column if not exists subcategory text not null default 'General';
alter table public.products add column if not exists sub_subcategory text not null default 'General';
alter table public.products add column if not exists is_featured boolean not null default false;

create index if not exists products_category_idx on public.products (category, subcategory, sub_subcategory);
create index if not exists products_featured_idx on public.products (is_featured);

-- Keep updated_at current on every row update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ── Row Level Security ──────────────────────────────────────
alter table public.products enable row level security;

-- Anyone (including unauthenticated visitors) can read products
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public"
  on public.products for select
  using (true);

-- Only the service-role key (used by the admin API route) can write.
-- All INSERT / UPDATE / DELETE from the browser are denied.
drop policy if exists "products_insert_service_role" on public.products;
create policy "products_insert_service_role"
  on public.products for insert
  with check (false);   -- blocked for browser; service_role bypasses RLS entirely

drop policy if exists "products_update_service_role" on public.products;
create policy "products_update_service_role"
  on public.products for update
  using (false);

drop policy if exists "products_delete_service_role" on public.products;
create policy "products_delete_service_role"
  on public.products for delete
  using (false);

-- ============================================================
-- product-images Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can view uploaded product images
drop policy if exists "product_images_select_public" on storage.objects;
create policy "product_images_select_public"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Browser uploads are blocked; only service_role (API route) can write
drop policy if exists "product_images_insert_blocked" on storage.objects;
create policy "product_images_insert_blocked"
  on storage.objects for insert
  with check (false);

drop policy if exists "product_images_delete_blocked" on storage.objects;
create policy "product_images_delete_blocked"
  on storage.objects for delete
  using (false);

-- ============================================================
-- Managed taxonomy for categories/subcategories/sub-subcategories
-- ============================================================

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  level int not null check (level in (1, 2, 3)),
  parent_id uuid references public.product_categories(id) on delete cascade,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, slug)
);

create index if not exists product_categories_parent_idx on public.product_categories (parent_id, level, sort_order);
create index if not exists product_categories_active_idx on public.product_categories (is_active);

drop trigger if exists product_categories_set_updated_at on public.product_categories;
create trigger product_categories_set_updated_at
  before update on public.product_categories
  for each row execute function public.set_updated_at();

alter table public.product_categories enable row level security;

drop policy if exists "product_categories_select_public" on public.product_categories;
create policy "product_categories_select_public"
  on public.product_categories for select
  using (true);

drop policy if exists "product_categories_insert_blocked" on public.product_categories;
create policy "product_categories_insert_blocked"
  on public.product_categories for insert
  with check (false);

drop policy if exists "product_categories_update_blocked" on public.product_categories;
create policy "product_categories_update_blocked"
  on public.product_categories for update
  using (false);

drop policy if exists "product_categories_delete_blocked" on public.product_categories;
create policy "product_categories_delete_blocked"
  on public.product_categories for delete
  using (false);

-- ============================================================
-- Sponsored product ads (carousel above featured products)
-- ============================================================

create table if not exists public.product_ads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  banner_image_url text not null default '',
  headline text not null default '',
  cta_label text not null default 'Shop now',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id)
);
alter table public.product_ads add column if not exists banner_image_url text not null default '';

create index if not exists product_ads_active_idx on public.product_ads (is_active, sort_order, created_at desc);

drop trigger if exists product_ads_set_updated_at on public.product_ads;
create trigger product_ads_set_updated_at
  before update on public.product_ads
  for each row execute function public.set_updated_at();

alter table public.product_ads enable row level security;

drop policy if exists "product_ads_select_public" on public.product_ads;
create policy "product_ads_select_public"
  on public.product_ads for select
  using (true);

drop policy if exists "product_ads_insert_blocked" on public.product_ads;
create policy "product_ads_insert_blocked"
  on public.product_ads for insert
  with check (false);

drop policy if exists "product_ads_update_blocked" on public.product_ads;
create policy "product_ads_update_blocked"
  on public.product_ads for update
  using (false);

drop policy if exists "product_ads_delete_blocked" on public.product_ads;
create policy "product_ads_delete_blocked"
  on public.product_ads for delete
  using (false);

-- ============================================================
-- ad-banners Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('ad-banners', 'ad-banners', true)
on conflict (id) do nothing;

drop policy if exists "ad_banners_select_public" on storage.objects;
create policy "ad_banners_select_public"
  on storage.objects for select
  using (bucket_id = 'ad-banners');

drop policy if exists "ad_banners_insert_blocked" on storage.objects;
create policy "ad_banners_insert_blocked"
  on storage.objects for insert
  with check (false);

drop policy if exists "ad_banners_delete_blocked" on storage.objects;
create policy "ad_banners_delete_blocked"
  on storage.objects for delete
  using (false);

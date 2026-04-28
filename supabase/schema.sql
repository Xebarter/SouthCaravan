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

-- ============================================================
-- Vendor profiles + notification preferences
-- ============================================================

-- ============================================================
-- Vendors (bootstrap support for vendor/services portals)
-- ============================================================

create table if not exists public.vendors (
  id uuid primary key,               -- should match auth.users.id
  name text not null default '',
  email text unique not null,
  company_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendors_email_idx on public.vendors (email);

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

alter table public.vendors enable row level security;

-- Lock down direct browser access; server uses service-role which bypasses RLS.
drop policy if exists "vendors_select_blocked" on public.vendors;
create policy "vendors_select_blocked"
  on public.vendors for select
  using (false);

drop policy if exists "vendors_insert_blocked" on public.vendors;
create policy "vendors_insert_blocked"
  on public.vendors for insert
  with check (false);

drop policy if exists "vendors_update_blocked" on public.vendors;
create policy "vendors_update_blocked"
  on public.vendors for update
  using (false);

drop policy if exists "vendors_delete_blocked" on public.vendors;
create policy "vendors_delete_blocked"
  on public.vendors for delete
  using (false);

create table if not exists public.vendor_profiles (
  user_id text primary key,
  company_name text not null default '',
  description text not null default '',
  public_email text not null default '',
  contact_email text not null default '',
  phone text not null default '',
  website text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  country text not null default '',
  logo_url text not null default '',
  public_profile_enabled boolean not null default false,
  public_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backward-compatible migrations
alter table public.vendor_profiles add column if not exists public_profile_enabled boolean not null default false;
alter table public.vendor_profiles add column if not exists public_profile jsonb not null default '{}'::jsonb;

drop trigger if exists vendor_profiles_set_updated_at on public.vendor_profiles;
create trigger vendor_profiles_set_updated_at
  before update on public.vendor_profiles
  for each row execute function public.set_updated_at();

alter table public.vendor_profiles enable row level security;

-- Browser writes are blocked; only service_role (API routes) can write.
drop policy if exists "vendor_profiles_select_owner" on public.vendor_profiles;
create policy "vendor_profiles_select_owner"
  on public.vendor_profiles for select
  using (auth.uid()::text = user_id);

drop policy if exists "vendor_profiles_insert_blocked" on public.vendor_profiles;
create policy "vendor_profiles_insert_blocked"
  on public.vendor_profiles for insert
  with check (false);

drop policy if exists "vendor_profiles_update_blocked" on public.vendor_profiles;
create policy "vendor_profiles_update_blocked"
  on public.vendor_profiles for update
  using (false);

drop policy if exists "vendor_profiles_delete_blocked" on public.vendor_profiles;
create policy "vendor_profiles_delete_blocked"
  on public.vendor_profiles for delete
  using (false);

create table if not exists public.vendor_notification_prefs (
  user_id text primary key,
  email text not null default '',
  orders boolean not null default true,
  quotes boolean not null default true,
  messages boolean not null default true,
  marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Vendor public profile showcase images
-- ============================================================

create table if not exists public.vendor_profile_showcase_images (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  url text not null default '',
  kind text not null default 'other', -- premises | machinery | storage | team | qa | packaging | logistics | other
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_profile_showcase_images_user_idx
  on public.vendor_profile_showcase_images (user_id, sort_order, created_at desc);

drop trigger if exists vendor_profile_showcase_images_set_updated_at on public.vendor_profile_showcase_images;
create trigger vendor_profile_showcase_images_set_updated_at
  before update on public.vendor_profile_showcase_images
  for each row execute function public.set_updated_at();

alter table public.vendor_profile_showcase_images enable row level security;

drop policy if exists "vendor_profile_showcase_images_select_owner" on public.vendor_profile_showcase_images;
create policy "vendor_profile_showcase_images_select_owner"
  on public.vendor_profile_showcase_images for select
  using (auth.uid()::text = user_id);

drop policy if exists "vendor_profile_showcase_images_insert_blocked" on public.vendor_profile_showcase_images;
create policy "vendor_profile_showcase_images_insert_blocked"
  on public.vendor_profile_showcase_images for insert
  with check (false);

drop policy if exists "vendor_profile_showcase_images_update_blocked" on public.vendor_profile_showcase_images;
create policy "vendor_profile_showcase_images_update_blocked"
  on public.vendor_profile_showcase_images for update
  using (false);

drop policy if exists "vendor_profile_showcase_images_delete_blocked" on public.vendor_profile_showcase_images;
create policy "vendor_profile_showcase_images_delete_blocked"
  on public.vendor_profile_showcase_images for delete
  using (false);

-- ============================================================
-- vendor-showcase Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vendor-showcase', 'vendor-showcase', true)
on conflict (id) do nothing;

drop policy if exists "vendor_showcase_select_public" on storage.objects;
create policy "vendor_showcase_select_public"
  on storage.objects for select
  using (bucket_id = 'vendor-showcase');

drop policy if exists "vendor_showcase_insert_blocked" on storage.objects;
create policy "vendor_showcase_insert_blocked"
  on storage.objects for insert
  with check (false);

drop policy if exists "vendor_showcase_delete_blocked" on storage.objects;
create policy "vendor_showcase_delete_blocked"
  on storage.objects for delete
  using (false);

drop trigger if exists vendor_notification_prefs_set_updated_at on public.vendor_notification_prefs;
create trigger vendor_notification_prefs_set_updated_at
  before update on public.vendor_notification_prefs
  for each row execute function public.set_updated_at();

alter table public.vendor_notification_prefs enable row level security;

drop policy if exists "vendor_notification_prefs_select_owner" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_select_owner"
  on public.vendor_notification_prefs for select
  using (auth.uid()::text = user_id);

drop policy if exists "vendor_notification_prefs_insert_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_insert_blocked"
  on public.vendor_notification_prefs for insert
  with check (false);

drop policy if exists "vendor_notification_prefs_update_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_update_blocked"
  on public.vendor_notification_prefs for update
  using (false);

drop policy if exists "vendor_notification_prefs_delete_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_delete_blocked"
  on public.vendor_notification_prefs for delete
  using (false);

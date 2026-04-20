-- ============================================================
-- SouthCaravan — Full database setup (run this once)
-- Paste the entire file into Supabase SQL Editor and click Run.
-- All statements are idempotent (safe to re-run).
--
-- Order:
--   1. schema.sql              — products, vendors, storage buckets
--   2. auth-01-customers.sql   — customers table
--   3. auth-02-portal-signup-blocked-rpc.sql
--   4. auth-03-user-roles.sql  — user_roles table + RPCs
--   5. buyer-01-dashboard-tables.sql
--   6. buyer-02-crud-core.sql  — orders, order_items, quotes, etc.
--   7. payments-dpo.sql        — DPO payment columns on orders
-- ============================================================


-- ============================================================
-- 1. schema.sql
-- ============================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.products (
  id            uuid        primary key default gen_random_uuid(),
  vendor_id     text,
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

alter table public.products add column if not exists subcategory text not null default 'General';
alter table public.products add column if not exists sub_subcategory text not null default 'General';
alter table public.products add column if not exists is_featured boolean not null default false;

create index if not exists products_category_idx on public.products (category, subcategory, sub_subcategory);
create index if not exists products_featured_idx on public.products (is_featured);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products for select using (true);
drop policy if exists "products_insert_service_role" on public.products;
create policy "products_insert_service_role" on public.products for insert with check (false);
drop policy if exists "products_update_service_role" on public.products;
create policy "products_update_service_role" on public.products for update using (false);
drop policy if exists "products_delete_service_role" on public.products;
create policy "products_delete_service_role" on public.products for delete using (false);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_select_public" on storage.objects;
create policy "product_images_select_public" on storage.objects for select
  using (bucket_id = 'product-images');
drop policy if exists "product_images_insert_blocked" on storage.objects;
create policy "product_images_insert_blocked" on storage.objects for insert with check (false);
drop policy if exists "product_images_delete_blocked" on storage.objects;
create policy "product_images_delete_blocked" on storage.objects for delete using (false);

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
create policy "product_categories_select_public" on public.product_categories for select using (true);
drop policy if exists "product_categories_insert_blocked" on public.product_categories;
create policy "product_categories_insert_blocked" on public.product_categories for insert with check (false);
drop policy if exists "product_categories_update_blocked" on public.product_categories;
create policy "product_categories_update_blocked" on public.product_categories for update using (false);
drop policy if exists "product_categories_delete_blocked" on public.product_categories;
create policy "product_categories_delete_blocked" on public.product_categories for delete using (false);

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
create policy "product_ads_select_public" on public.product_ads for select using (true);
drop policy if exists "product_ads_insert_blocked" on public.product_ads;
create policy "product_ads_insert_blocked" on public.product_ads for insert with check (false);
drop policy if exists "product_ads_update_blocked" on public.product_ads;
create policy "product_ads_update_blocked" on public.product_ads for update using (false);
drop policy if exists "product_ads_delete_blocked" on public.product_ads;
create policy "product_ads_delete_blocked" on public.product_ads for delete using (false);

insert into storage.buckets (id, name, public)
values ('ad-banners', 'ad-banners', true)
on conflict (id) do nothing;

drop policy if exists "ad_banners_select_public" on storage.objects;
create policy "ad_banners_select_public" on storage.objects for select using (bucket_id = 'ad-banners');
drop policy if exists "ad_banners_insert_blocked" on storage.objects;
create policy "ad_banners_insert_blocked" on storage.objects for insert with check (false);
drop policy if exists "ad_banners_delete_blocked" on storage.objects;
create policy "ad_banners_delete_blocked" on storage.objects for delete using (false);

create table if not exists public.vendors (
  id uuid primary key,
  name text not null default '',
  email text unique not null,
  company_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists vendors_email_idx on public.vendors (email);
drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at before update on public.vendors
  for each row execute function public.set_updated_at();
alter table public.vendors enable row level security;
drop policy if exists "vendors_select_blocked" on public.vendors;
create policy "vendors_select_blocked" on public.vendors for select using (false);
drop policy if exists "vendors_insert_blocked" on public.vendors;
create policy "vendors_insert_blocked" on public.vendors for insert with check (false);
drop policy if exists "vendors_update_blocked" on public.vendors;
create policy "vendors_update_blocked" on public.vendors for update using (false);
drop policy if exists "vendors_delete_blocked" on public.vendors;
create policy "vendors_delete_blocked" on public.vendors for delete using (false);

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists vendor_profiles_set_updated_at on public.vendor_profiles;
create trigger vendor_profiles_set_updated_at before update on public.vendor_profiles
  for each row execute function public.set_updated_at();
alter table public.vendor_profiles enable row level security;
drop policy if exists "vendor_profiles_select_owner" on public.vendor_profiles;
create policy "vendor_profiles_select_owner" on public.vendor_profiles for select
  using (auth.uid()::text = user_id);
drop policy if exists "vendor_profiles_insert_blocked" on public.vendor_profiles;
create policy "vendor_profiles_insert_blocked" on public.vendor_profiles for insert with check (false);
drop policy if exists "vendor_profiles_update_blocked" on public.vendor_profiles;
create policy "vendor_profiles_update_blocked" on public.vendor_profiles for update using (false);
drop policy if exists "vendor_profiles_delete_blocked" on public.vendor_profiles;
create policy "vendor_profiles_delete_blocked" on public.vendor_profiles for delete using (false);

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
drop trigger if exists vendor_notification_prefs_set_updated_at on public.vendor_notification_prefs;
create trigger vendor_notification_prefs_set_updated_at before update on public.vendor_notification_prefs
  for each row execute function public.set_updated_at();
alter table public.vendor_notification_prefs enable row level security;
drop policy if exists "vendor_notification_prefs_select_owner" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_select_owner" on public.vendor_notification_prefs for select
  using (auth.uid()::text = user_id);
drop policy if exists "vendor_notification_prefs_insert_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_insert_blocked" on public.vendor_notification_prefs for insert with check (false);
drop policy if exists "vendor_notification_prefs_update_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_update_blocked" on public.vendor_notification_prefs for update using (false);
drop policy if exists "vendor_notification_prefs_delete_blocked" on public.vendor_notification_prefs;
create policy "vendor_notification_prefs_delete_blocked" on public.vendor_notification_prefs for delete using (false);


-- ============================================================
-- 2. auth-01-customers.sql
-- ============================================================

create table if not exists public.customers (
  id uuid primary key,
  email text unique not null,
  name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_email_idx on public.customers (email);
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
alter table public.customers enable row level security;
drop policy if exists "customers_select_blocked" on public.customers;
create policy "customers_select_blocked" on public.customers for select using (false);
drop policy if exists "customers_insert_blocked" on public.customers;
create policy "customers_insert_blocked" on public.customers for insert with check (false);
drop policy if exists "customers_update_blocked" on public.customers;
create policy "customers_update_blocked" on public.customers for update using (false);
drop policy if exists "customers_delete_blocked" on public.customers;
create policy "customers_delete_blocked" on public.customers for delete using (false);


-- ============================================================
-- 3. auth-02-portal-signup-blocked-rpc.sql
-- ============================================================

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


-- ============================================================
-- 4. auth-03-user-roles.sql
-- ============================================================

create table if not exists public.user_roles (
  user_id uuid not null,
  role text not null check (role in ('buyer', 'vendor', 'services', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index if not exists user_roles_user_idx on public.user_roles (user_id);
create index if not exists user_roles_role_idx on public.user_roles (role);
alter table public.user_roles enable row level security;
drop policy if exists "user_roles_select_blocked" on public.user_roles;
create policy "user_roles_select_blocked" on public.user_roles for select using (false);
drop policy if exists "user_roles_insert_blocked" on public.user_roles;
create policy "user_roles_insert_blocked" on public.user_roles for insert with check (false);
drop policy if exists "user_roles_update_blocked" on public.user_roles;
create policy "user_roles_update_blocked" on public.user_roles for update using (false);
drop policy if exists "user_roles_delete_blocked" on public.user_roles;
create policy "user_roles_delete_blocked" on public.user_roles for delete using (false);

insert into public.user_roles (user_id, role)
select c.id, 'buyer' from public.customers c where c.id is not null
on conflict (user_id, role) do nothing;

insert into public.user_roles (user_id, role)
select v.id, 'vendor' from public.vendors v where v.id is not null
on conflict (user_id, role) do nothing;

create or replace function public.user_has_portal_role(p_user_id uuid, p_portal text)
returns boolean
language sql
security definer
as $fn$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_user_id and ur.role = lower(coalesce(p_portal, ''))
  );
$fn$;

revoke all on function public.user_has_portal_role(uuid, text) from public;
grant execute on function public.user_has_portal_role(uuid, text) to service_role;

create or replace function public.auth_email_portal_status(check_email text, portal text)
returns table(auth_exists boolean, has_role boolean)
language plpgsql
security definer
as $fn$
declare
  v_email text := lower(coalesce(check_email, ''));
  v_portal text := lower(coalesce(portal, ''));
  v_user_id uuid;
  v_has boolean := false;
begin
  if v_email = '' then
    auth_exists := false; has_role := false; return next; return;
  end if;
  select id into v_user_id from auth.users where lower(email) = v_email limit 1;
  if v_user_id is null then
    auth_exists := false; has_role := false; return next; return;
  end if;
  auth_exists := true;
  if v_portal = 'admin' then
    select coalesce((raw_app_meta_data ->> 'role') = 'admin', false) into v_has
    from auth.users where id = v_user_id;
    has_role := coalesce(v_has, false); return next; return;
  end if;
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = v_user_id and ur.role = v_portal
  ) into v_has;
  has_role := coalesce(v_has, false);
  return next;
end;
$fn$;

revoke all on function public.auth_email_portal_status(text, text) from public;
grant execute on function public.auth_email_portal_status(text, text) to service_role;

create or replace function public.auth_portal_signup_blocked(check_email text, portal text)
returns boolean
language plpgsql
security definer
as $fn$
declare
  v_status record;
begin
  select * into v_status from public.auth_email_portal_status(check_email, portal);
  return coalesce(v_status.has_role, false);
end;
$fn$;

revoke all on function public.auth_portal_signup_blocked(text, text) from public;
grant execute on function public.auth_portal_signup_blocked(text, text) to service_role;


-- ============================================================
-- 5. buyer-01-dashboard-tables.sql
-- ============================================================

create table if not exists public.customer_profiles (
  user_id uuid primary key,
  company_name text not null default '',
  address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  country text not null default '',
  tax_id text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at before update on public.customer_profiles
  for each row execute function public.set_updated_at();
alter table public.customer_profiles enable row level security;
drop policy if exists "customer_profiles_select_blocked" on public.customer_profiles;
create policy "customer_profiles_select_blocked" on public.customer_profiles for select using (false);
drop policy if exists "customer_profiles_insert_blocked" on public.customer_profiles;
create policy "customer_profiles_insert_blocked" on public.customer_profiles for insert with check (false);
drop policy if exists "customer_profiles_update_blocked" on public.customer_profiles;
create policy "customer_profiles_update_blocked" on public.customer_profiles for update using (false);
drop policy if exists "customer_profiles_delete_blocked" on public.customer_profiles;
create policy "customer_profiles_delete_blocked" on public.customer_profiles for delete using (false);

create table if not exists public.customer_notification_prefs (
  user_id uuid primary key,
  email text not null default '',
  order_updates boolean not null default true,
  new_products boolean not null default true,
  vendor_messages boolean not null default true,
  promo boolean not null default false,
  newsletter boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists customer_notification_prefs_set_updated_at on public.customer_notification_prefs;
create trigger customer_notification_prefs_set_updated_at
  before update on public.customer_notification_prefs
  for each row execute function public.set_updated_at();
alter table public.customer_notification_prefs enable row level security;
drop policy if exists "customer_notification_prefs_select_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_select_blocked" on public.customer_notification_prefs for select using (false);
drop policy if exists "customer_notification_prefs_insert_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_insert_blocked" on public.customer_notification_prefs for insert with check (false);
drop policy if exists "customer_notification_prefs_update_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_update_blocked" on public.customer_notification_prefs for update using (false);
drop policy if exists "customer_notification_prefs_delete_blocked" on public.customer_notification_prefs;
create policy "customer_notification_prefs_delete_blocked" on public.customer_notification_prefs for delete using (false);


-- ============================================================
-- 6. buyer-02-crud-core.sql
-- ============================================================

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  label text not null default 'Address',
  name text not null default '',
  phone text not null default '',
  line1 text not null default '',
  line2 text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  country text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_buyer_idx on public.customer_addresses (buyer_id, is_default, created_at desc);
drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at before update on public.customer_addresses
  for each row execute function public.set_updated_at();
alter table public.customer_addresses enable row level security;
drop policy if exists "customer_addresses_select_blocked" on public.customer_addresses;
create policy "customer_addresses_select_blocked" on public.customer_addresses for select using (false);
drop policy if exists "customer_addresses_insert_blocked" on public.customer_addresses;
create policy "customer_addresses_insert_blocked" on public.customer_addresses for insert with check (false);
drop policy if exists "customer_addresses_update_blocked" on public.customer_addresses;
create policy "customer_addresses_update_blocked" on public.customer_addresses for update using (false);
drop policy if exists "customer_addresses_delete_blocked" on public.customer_addresses;
create policy "customer_addresses_delete_blocked" on public.customer_addresses for delete using (false);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  subject text not null default '',
  message text not null default '',
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_buyer_idx on public.support_tickets (buyer_id, status, created_at desc);
drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
alter table public.support_tickets enable row level security;
drop policy if exists "support_tickets_select_blocked" on public.support_tickets;
create policy "support_tickets_select_blocked" on public.support_tickets for select using (false);
drop policy if exists "support_tickets_insert_blocked" on public.support_tickets;
create policy "support_tickets_insert_blocked" on public.support_tickets for insert with check (false);
drop policy if exists "support_tickets_update_blocked" on public.support_tickets;
create policy "support_tickets_update_blocked" on public.support_tickets for update using (false);
drop policy if exists "support_tickets_delete_blocked" on public.support_tickets;
create policy "support_tickets_delete_blocked" on public.support_tickets for delete using (false);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, product_id)
);
create index if not exists wishlist_items_buyer_idx on public.wishlist_items (buyer_id, created_at desc);
alter table public.wishlist_items enable row level security;
drop policy if exists "wishlist_items_select_blocked" on public.wishlist_items;
create policy "wishlist_items_select_blocked" on public.wishlist_items for select using (false);
drop policy if exists "wishlist_items_insert_blocked" on public.wishlist_items;
create policy "wishlist_items_insert_blocked" on public.wishlist_items for insert with check (false);
drop policy if exists "wishlist_items_delete_blocked" on public.wishlist_items;
create policy "wishlist_items_delete_blocked" on public.wishlist_items for delete using (false);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  vendor_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, vendor_user_id)
);
create index if not exists conversations_buyer_idx on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_vendor_idx on public.conversations (vendor_user_id, updated_at desc);
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();
alter table public.conversations enable row level security;
drop policy if exists "conversations_select_blocked" on public.conversations;
create policy "conversations_select_blocked" on public.conversations for select using (false);
drop policy if exists "conversations_insert_blocked" on public.conversations;
create policy "conversations_insert_blocked" on public.conversations for insert with check (false);
drop policy if exists "conversations_update_blocked" on public.conversations;
create policy "conversations_update_blocked" on public.conversations for update using (false);
drop policy if exists "conversations_delete_blocked" on public.conversations;
create policy "conversations_delete_blocked" on public.conversations for delete using (false);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  recipient_id uuid not null,
  content text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at asc);
create index if not exists messages_recipient_read_idx on public.messages (recipient_id, read, created_at desc);
alter table public.messages enable row level security;
drop policy if exists "messages_select_blocked" on public.messages;
create policy "messages_select_blocked" on public.messages for select using (false);
drop policy if exists "messages_insert_blocked" on public.messages;
create policy "messages_insert_blocked" on public.messages for insert with check (false);
drop policy if exists "messages_update_blocked" on public.messages;
create policy "messages_update_blocked" on public.messages for update using (false);
drop policy if exists "messages_delete_blocked" on public.messages;
create policy "messages_delete_blocked" on public.messages for delete using (false);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  vendor_user_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  total_amount numeric(12, 2) not null default 0,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quotes_buyer_idx on public.quotes (buyer_id, status, created_at desc);
create index if not exists quotes_vendor_idx on public.quotes (vendor_user_id, status, created_at desc);
drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
alter table public.quotes enable row level security;
drop policy if exists "quotes_select_blocked" on public.quotes;
create policy "quotes_select_blocked" on public.quotes for select using (false);
drop policy if exists "quotes_insert_blocked" on public.quotes;
create policy "quotes_insert_blocked" on public.quotes for insert with check (false);
drop policy if exists "quotes_update_blocked" on public.quotes;
create policy "quotes_update_blocked" on public.quotes for update using (false);
drop policy if exists "quotes_delete_blocked" on public.quotes;
create policy "quotes_delete_blocked" on public.quotes for delete using (false);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity int not null default 1,
  unit_price numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0
);
create index if not exists quote_items_quote_idx on public.quote_items (quote_id);
alter table public.quote_items enable row level security;
drop policy if exists "quote_items_select_blocked" on public.quote_items;
create policy "quote_items_select_blocked" on public.quote_items for select using (false);
drop policy if exists "quote_items_insert_blocked" on public.quote_items;
create policy "quote_items_insert_blocked" on public.quote_items for insert with check (false);
drop policy if exists "quote_items_update_blocked" on public.quote_items;
create policy "quote_items_update_blocked" on public.quote_items for update using (false);
drop policy if exists "quote_items_delete_blocked" on public.quote_items;
create policy "quote_items_delete_blocked" on public.quote_items for delete using (false);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  vendor_user_id uuid,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) not null default 0,
  shipping_address text not null default '',
  notes text,
  estimated_delivery timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders (buyer_id, status, created_at desc);
create index if not exists orders_vendor_idx on public.orders (vendor_user_id, status, created_at desc);
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
alter table public.orders enable row level security;
drop policy if exists "orders_select_blocked" on public.orders;
create policy "orders_select_blocked" on public.orders for select using (false);
drop policy if exists "orders_insert_blocked" on public.orders;
create policy "orders_insert_blocked" on public.orders for insert with check (false);
drop policy if exists "orders_update_blocked" on public.orders;
create policy "orders_update_blocked" on public.orders for update using (false);
drop policy if exists "orders_delete_blocked" on public.orders;
create policy "orders_delete_blocked" on public.orders for delete using (false);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity int not null default 1,
  unit_price numeric(12, 2) not null default 0,
  subtotal numeric(12, 2) not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);
alter table public.order_items enable row level security;
drop policy if exists "order_items_select_blocked" on public.order_items;
create policy "order_items_select_blocked" on public.order_items for select using (false);
drop policy if exists "order_items_insert_blocked" on public.order_items;
create policy "order_items_insert_blocked" on public.order_items for insert with check (false);
drop policy if exists "order_items_update_blocked" on public.order_items;
create policy "order_items_update_blocked" on public.order_items for update using (false);
drop policy if exists "order_items_delete_blocked" on public.order_items;
create policy "order_items_delete_blocked" on public.order_items for delete using (false);


-- ============================================================
-- 7. payments-dpo.sql
-- ============================================================

-- vendor_user_id is nullable in the create above; this is a no-op if already nullable.
alter table public.orders alter column vendor_user_id drop not null;

alter table public.orders add column if not exists dpo_trans_token text;
alter table public.orders add column if not exists dpo_trans_ref   text;
alter table public.orders add column if not exists payment_status  text
  not null default 'pending'
  check (payment_status in ('pending', 'paid', 'failed'));

create index if not exists orders_dpo_trans_token_idx
  on public.orders (dpo_trans_token)
  where dpo_trans_token is not null;

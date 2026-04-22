-- ============================================================
-- SouthCaravan — Services portal (offerings + requests)
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Service offerings managed by service providers (services role).
create table if not exists public.service_offerings (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null, -- auth.users.id
  category text not null,
  subcategory text not null,
  title text not null,
  description text not null default '',
  pricing_type text not null default 'fixed' check (pricing_type in ('fixed', 'hourly')),
  rate numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  featured_sort_order int not null default 0,
  is_ad boolean not null default false,
  ad_sort_order int not null default 0,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_offerings add column if not exists is_featured boolean not null default false;
alter table public.service_offerings add column if not exists featured_sort_order int not null default 0;
alter table public.service_offerings add column if not exists is_ad boolean not null default false;
alter table public.service_offerings add column if not exists ad_sort_order int not null default 0;
alter table public.service_offerings add column if not exists images text[] not null default '{}';

create index if not exists service_offerings_provider_idx
  on public.service_offerings (provider_user_id, created_at desc);

create index if not exists service_offerings_featured_idx
  on public.service_offerings (is_featured, featured_sort_order, updated_at desc);

create index if not exists service_offerings_ads_idx
  on public.service_offerings (is_ad, ad_sort_order, updated_at desc);

drop trigger if exists service_offerings_set_updated_at on public.service_offerings;
create trigger service_offerings_set_updated_at
  before update on public.service_offerings
  for each row execute function public.set_updated_at();

alter table public.service_offerings enable row level security;

-- Providers can read their own offerings from the browser.
drop policy if exists "service_offerings_select_owner" on public.service_offerings;
create policy "service_offerings_select_owner"
  on public.service_offerings for select
  using (auth.uid() = provider_user_id);

-- Browser writes are blocked; server uses service_role (bypasses RLS).
drop policy if exists "service_offerings_insert_blocked" on public.service_offerings;
create policy "service_offerings_insert_blocked"
  on public.service_offerings for insert
  with check (false);

drop policy if exists "service_offerings_update_blocked" on public.service_offerings;
create policy "service_offerings_update_blocked"
  on public.service_offerings for update
  using (false);

drop policy if exists "service_offerings_delete_blocked" on public.service_offerings;
create policy "service_offerings_delete_blocked"
  on public.service_offerings for delete
  using (false);

-- Promotion requests (Featured / Ads) submitted by service providers; reviewed in Admin.
create table if not exists public.service_promotion_requests (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null,
  offering_id uuid not null references public.service_offerings(id) on delete cascade,
  kind text not null check (kind in ('featured', 'ad')),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text not null default '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_promotion_requests_provider_idx
  on public.service_promotion_requests (provider_user_id, status, created_at desc);

create index if not exists service_promotion_requests_offering_idx
  on public.service_promotion_requests (offering_id, status, created_at desc);

drop trigger if exists service_promotion_requests_set_updated_at on public.service_promotion_requests;
create trigger service_promotion_requests_set_updated_at
  before update on public.service_promotion_requests
  for each row execute function public.set_updated_at();

alter table public.service_promotion_requests enable row level security;

drop policy if exists "service_promotion_requests_select_owner" on public.service_promotion_requests;
create policy "service_promotion_requests_select_owner"
  on public.service_promotion_requests for select
  using (auth.uid() = provider_user_id);

drop policy if exists "service_promotion_requests_insert_owner" on public.service_promotion_requests;
create policy "service_promotion_requests_insert_owner"
  on public.service_promotion_requests for insert
  with check (auth.uid() = provider_user_id);

drop policy if exists "service_promotion_requests_update_blocked" on public.service_promotion_requests;
create policy "service_promotion_requests_update_blocked"
  on public.service_promotion_requests for update
  using (false);

drop policy if exists "service_promotion_requests_delete_blocked" on public.service_promotion_requests;
create policy "service_promotion_requests_delete_blocked"
  on public.service_promotion_requests for delete
  using (false);

-- Service requests sent by buyers to providers.
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid,             -- auth.users.id (nullable for guest flows later)
  provider_user_id uuid not null, -- auth.users.id
  category text not null,
  subcategory text not null,
  title text not null default '',
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_requests_provider_idx
  on public.service_requests (provider_user_id, status, created_at desc);

drop trigger if exists service_requests_set_updated_at on public.service_requests;
create trigger service_requests_set_updated_at
  before update on public.service_requests
  for each row execute function public.set_updated_at();

alter table public.service_requests enable row level security;

drop policy if exists "service_requests_select_provider" on public.service_requests;
create policy "service_requests_select_provider"
  on public.service_requests for select
  using (auth.uid() = provider_user_id);

-- Browser writes blocked for now; requests are created through server API.
drop policy if exists "service_requests_insert_blocked" on public.service_requests;
create policy "service_requests_insert_blocked"
  on public.service_requests for insert
  with check (false);

drop policy if exists "service_requests_update_blocked" on public.service_requests;
create policy "service_requests_update_blocked"
  on public.service_requests for update
  using (false);

drop policy if exists "service_requests_delete_blocked" on public.service_requests;
create policy "service_requests_delete_blocked"
  on public.service_requests for delete
  using (false);


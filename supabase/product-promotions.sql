-- Product promotion requests (vendors request featured placement; admin approves)
create table if not exists public.product_promotion_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('featured')),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text not null default '',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_promotion_requests_vendor_idx
  on public.product_promotion_requests (vendor_user_id, status, created_at desc);

create index if not exists product_promotion_requests_product_idx
  on public.product_promotion_requests (product_id, status, created_at desc);

drop trigger if exists product_promotion_requests_set_updated_at on public.product_promotion_requests;
create trigger product_promotion_requests_set_updated_at
  before update on public.product_promotion_requests
  for each row execute function public.set_updated_at();

alter table public.product_promotion_requests enable row level security;

drop policy if exists "product_promotion_requests_select_owner" on public.product_promotion_requests;
create policy "product_promotion_requests_select_owner"
  on public.product_promotion_requests for select
  using (auth.uid() = vendor_user_id);

drop policy if exists "product_promotion_requests_insert_owner" on public.product_promotion_requests;
create policy "product_promotion_requests_insert_owner"
  on public.product_promotion_requests for insert
  with check (auth.uid() = vendor_user_id);

drop policy if exists "product_promotion_requests_update_blocked" on public.product_promotion_requests;
create policy "product_promotion_requests_update_blocked"
  on public.product_promotion_requests for update
  using (false);

drop policy if exists "product_promotion_requests_delete_blocked" on public.product_promotion_requests;
create policy "product_promotion_requests_delete_blocked"
  on public.product_promotion_requests for delete
  using (false);

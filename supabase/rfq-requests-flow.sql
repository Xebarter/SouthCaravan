-- RFQ parent requests + per-vendor quote fan-out
-- Run after buyer-02-crud-core / setup quotes tables exist.

-- Parent RFQ (one row per buyer submission; multiple vendors receive scoped quotes)
create table if not exists public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  title text not null default '',
  notes text not null default '',
  status text not null default 'open' check (status in ('open', 'cancelled')),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfq_requests_buyer_idx on public.rfq_requests (buyer_id, created_at desc);

drop trigger if exists rfq_requests_set_updated_at on public.rfq_requests;
create trigger rfq_requests_set_updated_at
  before update on public.rfq_requests
  for each row execute function public.set_updated_at();

alter table public.rfq_requests enable row level security;
drop policy if exists "rfq_requests_select_blocked" on public.rfq_requests;
create policy "rfq_requests_select_blocked" on public.rfq_requests for select using (false);
drop policy if exists "rfq_requests_insert_blocked" on public.rfq_requests;
create policy "rfq_requests_insert_blocked" on public.rfq_requests for insert with check (false);
drop policy if exists "rfq_requests_update_blocked" on public.rfq_requests;
create policy "rfq_requests_update_blocked" on public.rfq_requests for update using (false);
drop policy if exists "rfq_requests_delete_blocked" on public.rfq_requests;
create policy "rfq_requests_delete_blocked" on public.rfq_requests for delete using (false);

create table if not exists public.rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfq_requests(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1,
  buyer_target_unit_price numeric(12, 2),
  line_notes text not null default ''
);

create index if not exists rfq_items_rfq_idx on public.rfq_items (rfq_id);

alter table public.rfq_items enable row level security;
drop policy if exists "rfq_items_select_blocked" on public.rfq_items;
create policy "rfq_items_select_blocked" on public.rfq_items for select using (false);
drop policy if exists "rfq_items_insert_blocked" on public.rfq_items;
create policy "rfq_items_insert_blocked" on public.rfq_items for insert with check (false);
drop policy if exists "rfq_items_update_blocked" on public.rfq_items;
create policy "rfq_items_update_blocked" on public.rfq_items for update using (false);
drop policy if exists "rfq_items_delete_blocked" on public.rfq_items;
create policy "rfq_items_delete_blocked" on public.rfq_items for delete using (false);

-- Quotes: link to RFQ, vendor reply metadata, extended status for buyer decision
alter table public.quotes add column if not exists rfq_request_id uuid references public.rfq_requests(id) on delete cascade;
alter table public.quotes add column if not exists vendor_message text not null default '';
alter table public.quotes add column if not exists responded_at timestamptz;

create index if not exists quotes_rfq_idx on public.quotes (rfq_request_id);

-- Widen status: awaiting_buyer = vendor submitted formal pricing
alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes
  add constraint quotes_status_check
  check (status in ('pending', 'awaiting_buyer', 'accepted', 'rejected', 'expired'));

-- ============================================================
-- SouthCaravan — Buyer dashboard CRUD core (orders/quotes/messages/wishlist/support/addresses)
-- Run this in Supabase SQL Editor after:
--   - `schema.sql`
--   - `auth-01-customers.sql`
--   - `buyer-01-dashboard-tables.sql`
-- ============================================================

create extension if not exists pgcrypto;

-- `schema.sql` defines `public.set_updated_at()` already, but keep this re-runnable.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Addresses
-- ============================================================

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null, -- auth.users.id
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
create trigger customer_addresses_set_updated_at
  before update on public.customer_addresses
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

-- ============================================================
-- Support tickets
-- ============================================================

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
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
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

-- ============================================================
-- Wishlist
-- ============================================================

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

-- ============================================================
-- Conversations + messages (buyer <-> vendor user)
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  vendor_user_id uuid not null, -- auth.users.id for vendor account
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_id, vendor_user_id)
);

create index if not exists conversations_buyer_idx on public.conversations (buyer_id, updated_at desc);
create index if not exists conversations_vendor_idx on public.conversations (vendor_user_id, updated_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
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

-- ============================================================
-- Quotes (request/response) + items
-- ============================================================

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
create trigger quotes_set_updated_at
  before update on public.quotes
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

-- ============================================================
-- Orders + items
-- ============================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null,
  vendor_user_id uuid not null,
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
create trigger orders_set_updated_at
  before update on public.orders
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


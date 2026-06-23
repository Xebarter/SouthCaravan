-- ============================================================
-- SouthCaravan — Multi-currency platform
-- Run in Supabase SQL Editor after core schema exists.
-- ============================================================

-- Singleton platform currency configuration (one row, id = 'default').
create table if not exists public.platform_currency_config (
  id text primary key default 'default',
  default_currency text not null default 'USD',
  rate_provider text not null default 'open.er-api.com',
  refresh_interval_minutes int not null default 60,
  enabled_currencies text[] not null default array[
    'USD','EUR','GBP','KES','UGX','TZS','RWF','ZAR','NGN','GHS','INR','CNY','JPY','AUD','CAD'
  ],
  show_usd_reference boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.platform_currency_config (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists platform_currency_config_set_updated_at on public.platform_currency_config;
create trigger platform_currency_config_set_updated_at
  before update on public.platform_currency_config
  for each row execute function public.set_updated_at();

alter table public.platform_currency_config enable row level security;
drop policy if exists "platform_currency_config_select_blocked" on public.platform_currency_config;
create policy "platform_currency_config_select_blocked"
  on public.platform_currency_config for select using (false);
drop policy if exists "platform_currency_config_write_blocked" on public.platform_currency_config;
create policy "platform_currency_config_write_blocked"
  on public.platform_currency_config for all using (false);

-- Exchange rates (USD base). manual_override = admin-set rate.
create table if not exists public.currency_exchange_rates (
  currency_code text primary key,
  rate_from_usd numeric(18, 8) not null,
  manual_override boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists currency_exchange_rates_set_updated_at on public.currency_exchange_rates;
create trigger currency_exchange_rates_set_updated_at
  before update on public.currency_exchange_rates
  for each row execute function public.set_updated_at();

alter table public.currency_exchange_rates enable row level security;
drop policy if exists "currency_exchange_rates_select_blocked" on public.currency_exchange_rates;
create policy "currency_exchange_rates_select_blocked"
  on public.currency_exchange_rates for select using (false);
drop policy if exists "currency_exchange_rates_write_blocked" on public.currency_exchange_rates;
create policy "currency_exchange_rates_write_blocked"
  on public.currency_exchange_rates for all using (false);

-- Product base currency (preserve original listing currency).
alter table public.products add column if not exists currency text not null default 'USD';

-- Vendor / service provider dashboard + pricing currencies.
alter table public.vendors add column if not exists dashboard_currency text not null default 'AUTO';
alter table public.vendors add column if not exists pricing_currency text not null default 'USD';

-- Order currency snapshot (immutable after checkout).
alter table public.orders add column if not exists original_currency text not null default 'USD';
alter table public.orders add column if not exists original_amount numeric(14, 4) not null default 0;
alter table public.orders add column if not exists display_currency text not null default 'USD';
alter table public.orders add column if not exists display_amount numeric(14, 4) not null default 0;
alter table public.orders add column if not exists exchange_rate numeric(18, 8) not null default 1;

alter table public.order_items add column if not exists unit_currency text not null default 'USD';
alter table public.order_items add column if not exists original_unit_price numeric(14, 4) not null default 0;
alter table public.order_items add column if not exists original_subtotal numeric(14, 4) not null default 0;

comment on column public.orders.original_currency is 'Currency charged at checkout (product base currency)';
comment on column public.orders.display_currency is 'Currency shown to buyer at checkout';
comment on column public.orders.exchange_rate is 'Rate: 1 original_currency = exchange_rate display_currency (via USD pivot at checkout time)';

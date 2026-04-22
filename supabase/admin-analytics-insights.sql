-- ============================================================
-- Admin analytics insights (CRUD from /admin/analytics)
-- ============================================================
--
-- Stores human-curated or automated insights that admins can manage.
-- Uses RLS "blocked" policies because writes should happen via service role
-- (Next.js API routes using SUPABASE_SERVICE_ROLE_KEY).
--
-- Safe to re-run (idempotent).

create extension if not exists pgcrypto;

create table if not exists public.admin_analytics_insights (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  severity text not null default 'info' check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  region text not null default 'Global',
  source text not null default 'manual' check (source in ('manual', 'system')),
  metric_key text not null default '',
  metric_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_analytics_insights_status_idx
  on public.admin_analytics_insights (status, severity, created_at desc);

create index if not exists admin_analytics_insights_region_idx
  on public.admin_analytics_insights (region);

drop trigger if exists admin_analytics_insights_set_updated_at on public.admin_analytics_insights;
create trigger admin_analytics_insights_set_updated_at
  before update on public.admin_analytics_insights
  for each row execute function public.set_updated_at();

alter table public.admin_analytics_insights enable row level security;

drop policy if exists "admin_analytics_insights_select_blocked" on public.admin_analytics_insights;
create policy "admin_analytics_insights_select_blocked"
  on public.admin_analytics_insights for select using (false);

drop policy if exists "admin_analytics_insights_insert_blocked" on public.admin_analytics_insights;
create policy "admin_analytics_insights_insert_blocked"
  on public.admin_analytics_insights for insert with check (false);

drop policy if exists "admin_analytics_insights_update_blocked" on public.admin_analytics_insights;
create policy "admin_analytics_insights_update_blocked"
  on public.admin_analytics_insights for update using (false);

drop policy if exists "admin_analytics_insights_delete_blocked" on public.admin_analytics_insights;
create policy "admin_analytics_insights_delete_blocked"
  on public.admin_analytics_insights for delete using (false);


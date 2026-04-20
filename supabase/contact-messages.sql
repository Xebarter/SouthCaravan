-- ============================================================
-- SouthCaravan — Contact Messages System
-- Stores all messages submitted through the /contact page.
-- Run after schema.sql (needs set_updated_at())
-- ============================================================

create table if not exists public.contact_messages (
  id              uuid        primary key default gen_random_uuid(),

  -- Sender info
  name            text        not null,
  email           text        not null,
  phone           text,
  company         text,

  -- Message content
  subject         text        not null default 'general'
                    check (subject in (
                      'general', 'sales', 'support', 'partnership',
                      'billing', 'vendor_inquiry', 'careers', 'other'
                    )),
  message         text        not null,

  -- Admin workflow
  status          text        not null default 'new'
                    check (status in ('new', 'read', 'replied', 'archived', 'spam')),
  priority        text        not null default 'normal'
                    check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_notes     text,
  replied_at      timestamptz,
  replied_by      uuid        references auth.users (id) on delete set null,

  -- Meta / spam defence
  ip_address      text,
  user_agent      text,
  honeypot_filled boolean     not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes
create index if not exists contact_msgs_status_idx    on public.contact_messages (status, created_at desc);
create index if not exists contact_msgs_email_idx     on public.contact_messages (email);
create index if not exists contact_msgs_subject_idx   on public.contact_messages (subject);
create index if not exists contact_msgs_priority_idx  on public.contact_messages (priority) where priority in ('high', 'urgent');

-- Auto-update updated_at
drop trigger if exists contact_messages_set_updated_at on public.contact_messages;
create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function public.set_updated_at();

-- RLS: all writes and reads are service-role only (public can only INSERT via API)
alter table public.contact_messages enable row level security;

drop policy if exists "contact_msgs_blocked_all" on public.contact_messages;
create policy "contact_msgs_blocked_all" on public.contact_messages
  for all using (false) with check (false);

-- Full-text search vector
alter table public.contact_messages
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subject, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(message, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(company, '')), 'D')
  ) stored;

create index if not exists contact_msgs_fts_idx on public.contact_messages using gin(search_vector);

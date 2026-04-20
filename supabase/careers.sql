-- ============================================================
-- SouthCaravan — Careers System
-- Comprehensive job listings, applications, and document uploads.
-- Run after schema.sql (needs auth.users and set_updated_at())
-- ============================================================

-- ─── Storage bucket for career documents ─────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'career-documents',
  'career-documents',
  false,
  10485760,  -- 10 MB per file
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do nothing;

-- Only admins (service role) can read/write career documents
drop policy if exists "career_docs_service_read"   on storage.objects;
create policy "career_docs_service_read" on storage.objects
  for select using (bucket_id = 'career-documents');

drop policy if exists "career_docs_service_insert" on storage.objects;
create policy "career_docs_service_insert" on storage.objects
  for insert with check (bucket_id = 'career-documents');

drop policy if exists "career_docs_service_update" on storage.objects;
create policy "career_docs_service_update" on storage.objects
  for update using (bucket_id = 'career-documents');

drop policy if exists "career_docs_service_delete" on storage.objects;
create policy "career_docs_service_delete" on storage.objects
  for delete using (bucket_id = 'career-documents');

-- ─── Departments ──────────────────────────────────────────────────────────────
create table if not exists public.career_departments (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  icon        text,                           -- e.g. "code", "truck", "users"
  is_active   boolean     not null default true,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists career_departments_slug_idx   on public.career_departments (slug);
create index if not exists career_departments_active_idx on public.career_departments (is_active, sort_order);

drop trigger if exists career_departments_set_updated_at on public.career_departments;
create trigger career_departments_set_updated_at
  before update on public.career_departments
  for each row execute function public.set_updated_at();

alter table public.career_departments enable row level security;

drop policy if exists "career_departments_public_read"   on public.career_departments;
create policy "career_departments_public_read" on public.career_departments
  for select using (is_active = true);

drop policy if exists "career_departments_blocked_write" on public.career_departments;
create policy "career_departments_blocked_write" on public.career_departments
  for all using (false) with check (false);

-- ─── Job listings ─────────────────────────────────────────────────────────────
create table if not exists public.career_jobs (
  id                   uuid        primary key default gen_random_uuid(),
  title                text        not null,
  slug                 text        not null unique,

  -- Classification
  department_id        uuid        references public.career_departments (id) on delete set null,
  location             text        not null default 'Nairobi, Kenya',
  location_type        text        not null default 'onsite'
                         check (location_type in ('remote', 'hybrid', 'onsite')),
  employment_type      text        not null default 'full_time'
                         check (employment_type in ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  experience_level     text        not null default 'mid'
                         check (experience_level in ('entry', 'mid', 'senior', 'lead', 'executive')),

  -- Content
  summary              text,                  -- short 1-2 sentence teaser
  description          text        not null default '',
  responsibilities     text,                  -- HTML or markdown rich content
  requirements         text,                  -- HTML or markdown rich content
  nice_to_have         text,                  -- optional skills
  benefits             text,                  -- HTML or markdown rich content

  -- Compensation
  salary_min           numeric(12, 2),
  salary_max           numeric(12, 2),
  salary_currency      text        not null default 'KES',
  salary_period        text        not null default 'yearly'
                         check (salary_period in ('hourly', 'monthly', 'yearly')),
  show_salary          boolean     not null default false,

  -- Application settings
  application_deadline timestamptz,
  application_email    text,                  -- override default HR email
  application_url      text,                  -- external ATS link (if not using built-in)
  max_applications     integer,               -- null = unlimited

  -- Status & visibility
  status               text        not null default 'draft'
                         check (status in ('draft', 'open', 'paused', 'closed', 'filled')),
  is_featured          boolean     not null default false,
  is_urgent            boolean     not null default false,

  -- Counters (updated via triggers / api)
  application_count    integer     not null default 0,
  view_count           integer     not null default 0,

  -- SEO
  meta_title           text,
  meta_description     text,

  -- Timestamps
  posted_at            timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists career_jobs_slug_idx       on public.career_jobs (slug);
create index if not exists career_jobs_status_idx     on public.career_jobs (status, posted_at desc);
create index if not exists career_jobs_dept_idx       on public.career_jobs (department_id);
create index if not exists career_jobs_featured_idx   on public.career_jobs (is_featured) where is_featured = true;
create index if not exists career_jobs_type_idx       on public.career_jobs (employment_type, experience_level);

drop trigger if exists career_jobs_set_updated_at on public.career_jobs;
create trigger career_jobs_set_updated_at
  before update on public.career_jobs
  for each row execute function public.set_updated_at();

alter table public.career_jobs enable row level security;

-- Public can read open/paused jobs
drop policy if exists "career_jobs_public_read"   on public.career_jobs;
create policy "career_jobs_public_read" on public.career_jobs
  for select using (status in ('open', 'paused'));

-- All writes blocked at DB level (service role bypasses RLS)
drop policy if exists "career_jobs_blocked_write" on public.career_jobs;
create policy "career_jobs_blocked_write" on public.career_jobs
  for all using (false) with check (false);

-- ─── Job applications ─────────────────────────────────────────────────────────
create table if not exists public.career_applications (
  id                      uuid        primary key default gen_random_uuid(),
  job_id                  uuid        not null references public.career_jobs (id) on delete cascade,

  -- Applicant details
  full_name               text        not null,
  email                   text        not null,
  phone                   text,
  nationality             text,
  location                text,        -- where applicant is based

  -- Professional profile
  linkedin_url            text,
  portfolio_url           text,
  github_url              text,
  years_experience        smallint,
  current_company         text,
  current_title           text,
  expected_salary         text,        -- free text e.g. "KES 150k–200k/month"
  start_date_availability text,        -- free text e.g. "Immediately" / "2 weeks notice"
  willing_to_relocate     boolean,
  requires_sponsorship    boolean,

  -- Application content
  cover_letter            text,
  answers                 jsonb        not null default '{}', -- custom question answers

  -- Source tracking
  referral_source         text,        -- "LinkedIn", "Job board", "Employee referral", etc.
  referral_name           text,        -- name of referrer if applicable

  -- Admin workflow
  status                  text        not null default 'pending'
                            check (status in (
                              'pending', 'reviewing', 'shortlisted',
                              'interview_scheduled', 'interviewed',
                              'offer_extended', 'offer_accepted', 'offer_declined',
                              'rejected', 'withdrawn'
                            )),
  internal_rating         smallint    check (internal_rating between 1 and 5),
  internal_notes          text,
  rejection_reason        text,
  reviewed_at             timestamptz,
  reviewed_by             uuid        references auth.users (id) on delete set null,

  -- Consent & compliance
  gdpr_consent            boolean     not null default false,
  data_retention_date     date,        -- when to purge PII (auto-set to 2 years after application)

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists career_apps_job_idx      on public.career_applications (job_id, created_at desc);
create index if not exists career_apps_email_idx    on public.career_applications (email);
create index if not exists career_apps_status_idx   on public.career_applications (status, created_at desc);

drop trigger if exists career_applications_set_updated_at on public.career_applications;
create trigger career_applications_set_updated_at
  before update on public.career_applications
  for each row execute function public.set_updated_at();

alter table public.career_applications enable row level security;

-- Applicants cannot read each other's applications (only service role can)
drop policy if exists "career_apps_blocked_all"   on public.career_applications;
create policy "career_apps_blocked_all" on public.career_applications
  for all using (false) with check (false);

-- ─── Application documents ────────────────────────────────────────────────────
create table if not exists public.career_application_documents (
  id             uuid        primary key default gen_random_uuid(),
  application_id uuid        not null references public.career_applications (id) on delete cascade,
  document_type  text        not null default 'resume'
                   check (document_type in ('resume', 'cover_letter', 'portfolio', 'certificate', 'transcript', 'id_document', 'other')),
  label          text,                    -- human-readable description e.g. "CV (PDF)"
  file_name      text        not null,    -- original filename
  storage_path   text        not null,    -- path inside the storage bucket
  file_url       text,                    -- public or signed URL (set after upload)
  file_size      integer     not null default 0,   -- bytes
  mime_type      text,
  created_at     timestamptz not null default now()
);

create index if not exists career_docs_app_idx on public.career_application_documents (application_id);

alter table public.career_application_documents enable row level security;

drop policy if exists "career_docs_blocked_all"   on public.career_application_documents;
create policy "career_docs_blocked_all" on public.career_application_documents
  for all using (false) with check (false);

-- ─── Trigger: increment/decrement application_count on career_jobs ─────────────
create or replace function public.career_jobs_sync_application_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.career_jobs
    set application_count = application_count + 1
    where id = NEW.job_id;
  elsif TG_OP = 'DELETE' then
    update public.career_jobs
    set application_count = greatest(0, application_count - 1)
    where id = OLD.job_id;
  end if;
  return null;
end;
$$;

drop trigger if exists career_apps_count_trigger on public.career_applications;
create trigger career_apps_count_trigger
  after insert or delete on public.career_applications
  for each row execute function public.career_jobs_sync_application_count();

-- ─── Trigger: auto-set data_retention_date (GDPR, 2 years) ───────────────────
create or replace function public.career_apps_set_retention()
returns trigger language plpgsql as $$
begin
  if NEW.data_retention_date is null then
    NEW.data_retention_date := (now() + interval '2 years')::date;
  end if;
  return NEW;
end;
$$;

drop trigger if exists career_apps_retention_trigger on public.career_applications;
create trigger career_apps_retention_trigger
  before insert on public.career_applications
  for each row execute function public.career_apps_set_retention();

-- ─── Trigger: set posted_at when job goes to "open" ──────────────────────────
create or replace function public.career_jobs_set_posted_at()
returns trigger language plpgsql as $$
begin
  if NEW.status = 'open' and (OLD.status is null or OLD.status <> 'open') then
    if NEW.posted_at is null then
      NEW.posted_at := now();
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists career_jobs_posted_at_trigger on public.career_jobs;
create trigger career_jobs_posted_at_trigger
  before insert or update on public.career_jobs
  for each row execute function public.career_jobs_set_posted_at();

-- ─── Helper: duplicate-application guard (same email + job) ──────────────────
create unique index if not exists career_apps_unique_email_job
  on public.career_applications (job_id, lower(email));

-- ─── Full-text search vector on jobs ─────────────────────────────────────────
alter table public.career_jobs
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(location, '')), 'D')
  ) stored;

create index if not exists career_jobs_fts_idx on public.career_jobs using gin(search_vector);

-- ─── Default departments seed data ───────────────────────────────────────────
insert into public.career_departments (name, slug, description, icon, sort_order) values
  ('Engineering',        'engineering',        'Software development, infrastructure, and data.',   'code',           1),
  ('Product',            'product',            'Product management, design, and UX research.',      'layers',         2),
  ('Operations',         'operations',         'Logistics, supply chain, and fulfillment.',         'truck',          3),
  ('Sales & Marketing',  'sales-marketing',    'Growth, partnerships, and brand strategy.',         'trending-up',    4),
  ('Customer Success',   'customer-success',   'Support, onboarding, and account management.',      'headphones',     5),
  ('Finance',            'finance',            'Accounting, FP&A, and legal.',                      'bar-chart-2',    6),
  ('People & Culture',   'people-culture',     'HR, recruiting, and employee experience.',          'users',          7),
  ('Vendor Relations',   'vendor-relations',   'Vendor onboarding, partnerships, and compliance.',  'handshake',      8)
on conflict (slug) do nothing;

-- ─── View: career_jobs_with_department (convenience) ──────────────────────────
create or replace view public.career_jobs_public as
  select
    j.id,
    j.title,
    j.slug,
    j.location,
    j.location_type,
    j.employment_type,
    j.experience_level,
    j.summary,
    j.description,
    j.responsibilities,
    j.requirements,
    j.nice_to_have,
    j.benefits,
    j.salary_min,
    j.salary_max,
    j.salary_currency,
    j.salary_period,
    j.show_salary,
    j.application_deadline,
    j.application_url,
    j.status,
    j.is_featured,
    j.is_urgent,
    j.application_count,
    j.view_count,
    j.posted_at,
    j.created_at,
    j.updated_at,
    -- department
    d.id   as department_id,
    d.name as department_name,
    d.slug as department_slug,
    d.icon as department_icon
  from public.career_jobs j
  left join public.career_departments d on d.id = j.department_id
  where j.status in ('open', 'paused');

-- ─── RPC: increment job view count ───────────────────────────────────────────
create or replace function public.career_job_increment_view(p_job_id uuid)
returns void language sql security definer as $$
  update public.career_jobs
  set view_count = view_count + 1
  where id = p_job_id and status = 'open';
$$;

grant execute on function public.career_job_increment_view(uuid) to anon, authenticated;

-- ─── RPC: check for duplicate application (email + job) ───────────────────────
create or replace function public.career_check_duplicate(p_job_id uuid, p_email text)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.career_applications
    where job_id = p_job_id
      and lower(email) = lower(p_email)
  );
$$;

grant execute on function public.career_check_duplicate(uuid, text) to anon, authenticated;

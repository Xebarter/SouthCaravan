-- ============================================================
-- SouthCaravan — Blog System
-- Comprehensive blog management with categories, tags,
-- comments, reactions, SEO fields, and full-text search.
-- Run after schema.sql (needs auth.users and set_updated_at())
-- ============================================================

-- ─── Storage bucket for blog images ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "blog_images_public_read" on storage.objects;
create policy "blog_images_public_read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog_images_service_write" on storage.objects;
create policy "blog_images_service_write" on storage.objects
  for insert with check (bucket_id = 'blog-images');

drop policy if exists "blog_images_service_update" on storage.objects;
create policy "blog_images_service_update" on storage.objects
  for update using (bucket_id = 'blog-images');

drop policy if exists "blog_images_service_delete" on storage.objects;
create policy "blog_images_service_delete" on storage.objects
  for delete using (bucket_id = 'blog-images');

-- ─── Blog categories ─────────────────────────────────────────────────────────
create table if not exists public.blog_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  color        text not null default '#6366f1',
  post_count   integer not null default 0,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_categories_slug_idx on public.blog_categories (slug);
create index if not exists blog_categories_active_idx on public.blog_categories (is_active, sort_order);

drop trigger if exists blog_categories_set_updated_at on public.blog_categories;
create trigger blog_categories_set_updated_at
  before update on public.blog_categories
  for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;

drop policy if exists "blog_categories_public_read" on public.blog_categories;
create policy "blog_categories_public_read" on public.blog_categories
  for select using (is_active = true);

drop policy if exists "blog_categories_blocked_write" on public.blog_categories;
create policy "blog_categories_blocked_write" on public.blog_categories
  for all using (false) with check (false);

-- ─── Blog posts ──────────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content          text not null default '',
  cover_image      text,
  cover_image_alt  text,
  status           text not null default 'draft'
                     check (status in ('draft', 'published', 'archived', 'scheduled')),

  -- Authorship
  author_id        uuid references auth.users (id) on delete set null,
  author_name      text not null default 'SouthCaravan Team',
  author_avatar    text,

  -- Taxonomy
  category_id      uuid references public.blog_categories (id) on delete set null,

  -- SEO
  meta_title       text,
  meta_description text,
  canonical_url    text,

  -- Engagement
  view_count       integer not null default 0,
  like_count       integer not null default 0,
  comment_count    integer not null default 0,
  share_count      integer not null default 0,

  -- Publishing
  featured         boolean not null default false,
  allow_comments   boolean not null default true,
  read_time_mins   integer,                          -- auto-computed or manual
  published_at     timestamptz,
  scheduled_for    timestamptz,

  -- Full-text search
  search_vector    tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(author_name, '')), 'D')
  ) stored,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx        on public.blog_posts (slug);
create index if not exists blog_posts_status_idx      on public.blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx    on public.blog_posts (category_id, status);
create index if not exists blog_posts_featured_idx    on public.blog_posts (featured, status, published_at desc);
create index if not exists blog_posts_author_idx      on public.blog_posts (author_id);
create index if not exists blog_posts_search_idx      on public.blog_posts using gin (search_vector);
create index if not exists blog_posts_published_at_idx on public.blog_posts (published_at desc)
  where status = 'published';

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_public_read" on public.blog_posts;
create policy "blog_posts_public_read" on public.blog_posts
  for select using (status = 'published');

drop policy if exists "blog_posts_blocked_write" on public.blog_posts;
create policy "blog_posts_blocked_write" on public.blog_posts
  for all using (false) with check (false);

-- ─── Blog tags ───────────────────────────────────────────────────────────────
create table if not exists public.blog_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  post_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists blog_tags_slug_idx on public.blog_tags (slug);
create index if not exists blog_tags_count_idx on public.blog_tags (post_count desc);

alter table public.blog_tags enable row level security;

drop policy if exists "blog_tags_public_read" on public.blog_tags;
create policy "blog_tags_public_read" on public.blog_tags
  for select using (true);

drop policy if exists "blog_tags_blocked_write" on public.blog_tags;
create policy "blog_tags_blocked_write" on public.blog_tags
  for all using (false) with check (false);

-- ─── Post ↔ tag junction ─────────────────────────────────────────────────────
create table if not exists public.blog_post_tags (
  post_id    uuid not null references public.blog_posts (id) on delete cascade,
  tag_id     uuid not null references public.blog_tags  (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index if not exists blog_post_tags_tag_idx on public.blog_post_tags (tag_id);

alter table public.blog_post_tags enable row level security;

drop policy if exists "blog_post_tags_public_read" on public.blog_post_tags;
create policy "blog_post_tags_public_read" on public.blog_post_tags
  for select using (true);

drop policy if exists "blog_post_tags_blocked_write" on public.blog_post_tags;
create policy "blog_post_tags_blocked_write" on public.blog_post_tags
  for all using (false) with check (false);

-- ─── Blog comments ───────────────────────────────────────────────────────────
create table if not exists public.blog_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.blog_posts (id) on delete cascade,
  parent_id    uuid references public.blog_comments (id) on delete cascade,

  -- Author (guest or authenticated)
  author_id    uuid references auth.users (id) on delete set null,
  author_name  text not null,
  author_email text,
  author_avatar text,

  content      text not null check (char_length(content) between 2 and 2000),
  status       text not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected', 'spam')),
  like_count   integer not null default 0,
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_comments_post_idx    on public.blog_comments (post_id, status, created_at);
create index if not exists blog_comments_parent_idx  on public.blog_comments (parent_id);
create index if not exists blog_comments_author_idx  on public.blog_comments (author_id);
create index if not exists blog_comments_pending_idx on public.blog_comments (status, created_at desc)
  where status = 'pending';

drop trigger if exists blog_comments_set_updated_at on public.blog_comments;
create trigger blog_comments_set_updated_at
  before update on public.blog_comments
  for each row execute function public.set_updated_at();

alter table public.blog_comments enable row level security;

-- Readers can see approved comments; writes go through API only
drop policy if exists "blog_comments_public_read" on public.blog_comments;
create policy "blog_comments_public_read" on public.blog_comments
  for select using (status = 'approved');

drop policy if exists "blog_comments_blocked_write" on public.blog_comments;
create policy "blog_comments_blocked_write" on public.blog_comments
  for all using (false) with check (false);

-- ─── Post view tracking (deduplicated by session/IP) ─────────────────────────
create table if not exists public.blog_post_views (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.blog_posts (id) on delete cascade,
  session_id   text,
  ip_address   inet,
  country_code text,
  referrer     text,
  user_agent   text,
  viewed_at    timestamptz not null default now()
);

create index if not exists blog_post_views_post_idx    on public.blog_post_views (post_id, viewed_at desc);
create index if not exists blog_post_views_session_idx on public.blog_post_views (post_id, session_id)
  where session_id is not null;

alter table public.blog_post_views enable row level security;

drop policy if exists "blog_post_views_blocked" on public.blog_post_views;
create policy "blog_post_views_blocked" on public.blog_post_views
  for all using (false) with check (false);

-- ─── Reactions (likes on posts) ──────────────────────────────────────────────
create table if not exists public.blog_post_reactions (
  post_id    uuid not null references public.blog_posts (id) on delete cascade,
  session_id text not null,
  reaction   text not null default 'like' check (reaction in ('like', 'love', 'insightful')),
  created_at timestamptz not null default now(),
  primary key (post_id, session_id)
);

create index if not exists blog_reactions_post_idx on public.blog_post_reactions (post_id, reaction);

alter table public.blog_post_reactions enable row level security;

drop policy if exists "blog_reactions_blocked" on public.blog_post_reactions;
create policy "blog_reactions_blocked" on public.blog_post_reactions
  for all using (false) with check (false);

-- ─── Newsletter subscribers ───────────────────────────────────────────────────
create table if not exists public.blog_subscribers (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique,
  name         text,
  status       text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  confirmed    boolean not null default false,
  confirm_token text unique,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  updated_at   timestamptz not null default now()
);

create index if not exists blog_subscribers_email_idx  on public.blog_subscribers (email);
create index if not exists blog_subscribers_status_idx on public.blog_subscribers (status);

drop trigger if exists blog_subscribers_set_updated_at on public.blog_subscribers;
create trigger blog_subscribers_set_updated_at
  before update on public.blog_subscribers
  for each row execute function public.set_updated_at();

alter table public.blog_subscribers enable row level security;

drop policy if exists "blog_subscribers_blocked" on public.blog_subscribers;
create policy "blog_subscribers_blocked" on public.blog_subscribers
  for all using (false) with check (false);

-- ─── Helper: auto-update post category count ─────────────────────────────────
create or replace function public.refresh_blog_category_post_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.category_id is distinct from new.category_id) then
    if old.category_id is not null then
      update public.blog_categories
      set post_count = (
        select count(*) from public.blog_posts
        where category_id = old.category_id and status = 'published'
      )
      where id = old.category_id;
    end if;
  end if;

  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.category_id is distinct from new.category_id) then
    if new.category_id is not null then
      update public.blog_categories
      set post_count = (
        select count(*) from public.blog_posts
        where category_id = new.category_id and status = 'published'
      )
      where id = new.category_id;
    end if;
  end if;

  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.category_id is not null then
      update public.blog_categories
      set post_count = (
        select count(*) from public.blog_posts
        where category_id = new.category_id and status = 'published'
      )
      where id = new.category_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists blog_posts_refresh_category_count on public.blog_posts;
create trigger blog_posts_refresh_category_count
  after insert or update or delete on public.blog_posts
  for each row execute function public.refresh_blog_category_post_count();

-- ─── Helper: auto-update tag post count ──────────────────────────────────────
create or replace function public.refresh_blog_tag_post_count()
returns trigger language plpgsql security definer as $$
declare
  affected_tag_id uuid;
begin
  affected_tag_id := coalesce(new.tag_id, old.tag_id);
  update public.blog_tags
  set post_count = (
    select count(*) from public.blog_post_tags pt
    join public.blog_posts p on p.id = pt.post_id
    where pt.tag_id = affected_tag_id and p.status = 'published'
  )
  where id = affected_tag_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists blog_post_tags_refresh_count on public.blog_post_tags;
create trigger blog_post_tags_refresh_count
  after insert or delete on public.blog_post_tags
  for each row execute function public.refresh_blog_tag_post_count();

-- ─── Helper: auto-update post comment count ──────────────────────────────────
create or replace function public.refresh_blog_post_comment_count()
returns trigger language plpgsql security definer as $$
declare
  affected_post_id uuid;
begin
  affected_post_id := coalesce(new.post_id, old.post_id);
  update public.blog_posts
  set comment_count = (
    select count(*) from public.blog_comments
    where post_id = affected_post_id and status = 'approved'
  )
  where id = affected_post_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists blog_comments_refresh_post_count on public.blog_comments;
create trigger blog_comments_refresh_post_count
  after insert or update or delete on public.blog_comments
  for each row execute function public.refresh_blog_post_comment_count();

-- ─── RPC: increment view count (deduplicated by session) ─────────────────────
create or replace function public.blog_record_view(
  p_post_id   uuid,
  p_session_id text default null,
  p_ip         inet  default null,
  p_referrer   text  default null,
  p_country    text  default null
)
returns void language plpgsql security definer as $$
begin
  -- Skip if this session already viewed this post in the last 24 h
  if p_session_id is not null and exists (
    select 1 from public.blog_post_views
    where post_id = p_post_id
      and session_id = p_session_id
      and viewed_at > now() - interval '24 hours'
  ) then
    return;
  end if;

  insert into public.blog_post_views (post_id, session_id, ip_address, referrer, country_code)
  values (p_post_id, p_session_id, p_ip, p_referrer, p_country);

  update public.blog_posts set view_count = view_count + 1 where id = p_post_id;
end;
$$;

-- ─── RPC: toggle reaction ─────────────────────────────────────────────────────
create or replace function public.blog_toggle_reaction(
  p_post_id    uuid,
  p_session_id text,
  p_reaction   text default 'like'
)
returns json language plpgsql security definer as $$
declare
  existing_reaction text;
  new_like_count    integer;
begin
  select reaction into existing_reaction
  from public.blog_post_reactions
  where post_id = p_post_id and session_id = p_session_id;

  if existing_reaction is not null then
    delete from public.blog_post_reactions
    where post_id = p_post_id and session_id = p_session_id;
    update public.blog_posts set like_count = greatest(0, like_count - 1) where id = p_post_id;
    select like_count into new_like_count from public.blog_posts where id = p_post_id;
    return json_build_object('reacted', false, 'like_count', new_like_count);
  else
    insert into public.blog_post_reactions (post_id, session_id, reaction)
    values (p_post_id, p_session_id, p_reaction)
    on conflict (post_id, session_id) do update set reaction = excluded.reaction;
    update public.blog_posts set like_count = like_count + 1 where id = p_post_id;
    select like_count into new_like_count from public.blog_posts where id = p_post_id;
    return json_build_object('reacted', true, 'like_count', new_like_count);
  end if;
end;
$$;

-- ─── Seed default categories ─────────────────────────────────────────────────
insert into public.blog_categories (name, slug, description, color, sort_order) values
  ('Industry Insights',   'industry-insights',   'Trends and analysis from the B2B procurement industry', '#6366f1', 1),
  ('Platform Updates',    'platform-updates',    'Latest features, improvements and product news',          '#10b981', 2),
  ('Supplier Stories',    'supplier-stories',    'Success stories from vendors on the SouthCaravan network','#f59e0b', 3),
  ('Procurement Tips',    'procurement-tips',    'Best practices and actionable advice for buyers',          '#3b82f6', 4),
  ('Market Intelligence', 'market-intelligence', 'African trade data, market reports and economic updates',  '#ef4444', 5),
  ('Company News',        'company-news',        'Announcements and updates from the SouthCaravan team',    '#8b5cf6', 6)
on conflict (slug) do nothing;

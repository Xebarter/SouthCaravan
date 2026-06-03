import { cookies, headers } from 'next/headers'

import { supabaseAdmin } from '@/lib/supabase-admin'
import type { BlogPost } from '@/lib/types'

const POST_SELECT = `
  *,
  category:blog_categories(id, name, slug, color, description),
  tags:blog_post_tags(tag:blog_tags(id, name, slug))
`

const RELATED_SELECT =
  'id, title, slug, excerpt, cover_image, cover_image_alt, author_name, published_at, read_time_mins, category:blog_categories(name, slug, color)'

export type BlogPostSeo = {
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  cover_image_alt: string | null
  published_at: string | null
  updated_at: string | null
  author_name: string | null
}

function normalizeBlogPost(post: Record<string, unknown>): BlogPost {
  return {
    ...post,
    tags: ((post.tags as { tag: unknown }[] | undefined) ?? []).map((t) => t.tag),
  } as BlogPost
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostSeo | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select('title, slug, excerpt, cover_image, cover_image_alt, published_at, updated_at, author_name')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !data) return null
  return data as BlogPostSeo
}

export async function getPublishedBlogPostFullBySlug(slug: string): Promise<BlogPost | null> {
  const decoded = decodeURIComponent(slug).trim()
  if (!decoded) return null

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .select(POST_SELECT)
    .eq('slug', decoded)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !post) return null
  return normalizeBlogPost(post as Record<string, unknown>)
}

/** Any status — for admin preview only. */
export async function getBlogPostFullBySlug(slug: string): Promise<BlogPost | null> {
  const decoded = decodeURIComponent(slug).trim()
  if (!decoded) return null

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .select(POST_SELECT)
    .eq('slug', decoded)
    .maybeSingle()

  if (error || !post) return null
  return normalizeBlogPost(post as Record<string, unknown>)
}

export async function getRelatedBlogPosts(
  excludeId: string,
  options?: { categoryId?: string | null; publishedOnly?: boolean; limit?: number },
): Promise<BlogPost[]> {
  const limit = options?.limit ?? 6
  const publishedOnly = options?.publishedOnly ?? true

  let query = supabaseAdmin
    .from('blog_posts')
    .select(RELATED_SELECT)
    .neq('id', excludeId)
    .order(publishedOnly ? 'published_at' : 'updated_at', { ascending: false })
    .limit(limit)

  if (publishedOnly) query = query.eq('status', 'published')
  if (options?.categoryId) query = query.eq('category_id', options.categoryId)

  const { data } = await query
  return (data ?? []) as BlogPost[]
}

export function recordBlogPostView(
  postId: string,
  opts: { sessionId?: string | null; ip?: string | null; referrer?: string | null },
) {
  supabaseAdmin
    .rpc('blog_record_view', {
      p_post_id: postId,
      p_session_id: opts.sessionId ?? null,
      p_ip: opts.ip ?? null,
      p_referrer: opts.referrer ?? null,
    })
    .catch(() => {})
}

/** Read request context and record a view (server components / route handlers). */
export async function recordBlogPostViewFromRequest(postId: string) {
  const cookieStore = await cookies()
  const hdrs = await headers()
  recordBlogPostView(postId, {
    sessionId: cookieStore.get('sc_session')?.value ?? null,
    ip: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    referrer: hdrs.get('referer') ?? null,
  })
}

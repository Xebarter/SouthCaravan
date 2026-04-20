import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug, color, description),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const normalized = {
    ...post,
    tags: (post.tags ?? []).map((t: { tag: unknown }) => t.tag),
  };

  // Record the view (best-effort; don't block response)
  const sessionId = req.cookies.get('sc_session')?.value ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  supabaseAdmin.rpc('blog_record_view', {
    p_post_id: post.id,
    p_session_id: sessionId,
    p_ip: ip,
    p_referrer: req.headers.get('referer') ?? null,
  }).catch(() => {});

  // Fetch related posts (same category, excluding current)
  const relatedQuery = supabaseAdmin
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image, author_name, published_at, read_time_mins, category:blog_categories(name, slug, color)')
    .eq('status', 'published')
    .neq('id', post.id)
    .order('published_at', { ascending: false })
    .limit(3);

  if (post.category_id) relatedQuery.eq('category_id', post.category_id);

  const { data: related } = await relatedQuery;

  return NextResponse.json({ post: normalized, related: related ?? [] });
}

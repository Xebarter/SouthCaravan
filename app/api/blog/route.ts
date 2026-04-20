import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get('category');
  const tagSlug = searchParams.get('tag');
  const search = searchParams.get('search')?.trim();
  const featured = searchParams.get('featured');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') ?? '9', 10)));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('blog_posts')
    .select(`
      id, title, slug, excerpt, cover_image, cover_image_alt,
      author_name, author_avatar, published_at, read_time_mins,
      view_count, like_count, comment_count, featured,
      category:blog_categories(id, name, slug, color),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (featured === 'true') query = query.eq('featured', true);
  if (search) query = query.textSearch('search_vector', search, { type: 'websearch' });

  if (categorySlug) {
    const { data: cat } = await supabaseAdmin
      .from('blog_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    console.error('[api/blog GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filteredPosts = (posts ?? []).map((p) => ({
    ...p,
    tags: (p.tags ?? []).map((t: { tag: unknown }) => t.tag),
  }));

  // Tag filter applied in memory (Supabase join filtering is limited)
  if (tagSlug) {
    filteredPosts = filteredPosts.filter((p) =>
      (p.tags as Array<{ slug: string }>).some((t) => t.slug === tagSlug),
    );
  }

  return NextResponse.json({
    posts: filteredPosts,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}

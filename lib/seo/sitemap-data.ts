import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getSitemapProductIds(limit = 500): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data ?? []).map((row) => String(row.id)).filter(Boolean)
  } catch {
    return []
  }
}

export async function getSitemapBlogSlugs(limit = 200): Promise<{ slug: string; updated_at?: string }[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) return []
    return (data ?? [])
      .filter((row) => row.slug)
      .map((row) => ({
        slug: String(row.slug),
        updated_at: (row.updated_at ?? row.published_at) as string | undefined,
      }))
  } catch {
    return []
  }
}

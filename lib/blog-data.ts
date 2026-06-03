import { supabaseAdmin } from '@/lib/supabase-admin'

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

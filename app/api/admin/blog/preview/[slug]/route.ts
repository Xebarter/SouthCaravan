import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-require'
import { getBlogPostFullBySlug, getRelatedBlogPosts } from '@/lib/blog-data'

/** GET /api/admin/blog/preview/[slug] — draft/published post for admin preview (requires admin session). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { slug } = await params
  const post = await getBlogPostFullBySlug(slug)
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const related = await getRelatedBlogPosts(post.id, {
    categoryId: post.category_id,
    publishedOnly: false,
  })

  return NextResponse.json({
    post,
    related,
    preview: true,
  })
}

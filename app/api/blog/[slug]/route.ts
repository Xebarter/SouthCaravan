import { NextRequest, NextResponse } from 'next/server';

import {
  getPublishedBlogPostFullBySlug,
  getRelatedBlogPosts,
  recordBlogPostView,
} from '@/lib/blog-data';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const post = await getPublishedBlogPostFullBySlug(slug);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const sessionId = req.cookies.get('sc_session')?.value ?? null;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  recordBlogPostView(post.id, {
    sessionId,
    ip,
    referrer: req.headers.get('referer') ?? null,
  });

  const related = await getRelatedBlogPosts(post.id, {
    categoryId: post.category_id,
    publishedOnly: true,
  });

  return NextResponse.json({ post, related });
}

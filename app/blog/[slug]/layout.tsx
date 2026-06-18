import type { ReactNode } from 'react'

import { getPublishedBlogPostBySlug } from '@/lib/blog-data'
import { createPageMetadata } from '@/lib/seo/metadata'

type Props = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)

  if (!post) {
    return createPageMetadata({
      title: 'Article not found',
      description: 'The requested blog post could not be found.',
      path: `/blog/${slug}`,
      noIndex: true,
    })
  }

  return createPageMetadata({
    title: post.title,
    description: post.excerpt ?? `Read ${post.title} on the South Caravan trade insights blog.`,
    path: `/blog/${post.slug}`,
    ogType: 'article',
    publishedTime: post.published_at ?? undefined,
    modifiedTime: post.updated_at ?? undefined,
    authors: post.author_name ? [post.author_name] : undefined,
  })
}

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return children
}

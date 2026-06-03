import type { MetadataRoute } from 'next'

import { getSitemapBlogSlugs, getSitemapProductIds } from '@/lib/seo/sitemap-data'
import { SITE_URL } from '@/lib/seo/site'

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/categories', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/public/services/browse', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/features', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.75, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.85, changeFrequency: 'daily' },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/help', priority: 0.65, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/careers', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/security', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/compliance', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/status', priority: 0.4, changeFrequency: 'weekly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const [productIds, blogPosts] = await Promise.all([getSitemapProductIds(), getSitemapBlogSlugs()])

  const productEntries: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${SITE_URL}/product/${id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : now,
    changeFrequency: 'weekly',
    priority: 0.65,
  }))

  return [...staticEntries, ...productEntries, ...blogEntries]
}

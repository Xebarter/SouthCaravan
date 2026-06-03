import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/buyer',
          '/buyer/',
          '/vendor/orders',
          '/vendor/products',
          '/vendor/quotes',
          '/vendor/messages',
          '/vendor/analytics',
          '/vendor/settings',
          '/services/dashboard',
          '/services/requests',
          '/services/offerings',
          '/services/messages',
          '/services/analytics',
          '/services/settings',
          '/dashboard',
          '/auth',
          '/auth/',
          '/login',
          '/signup',
          '/checkout',
          '/cart',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

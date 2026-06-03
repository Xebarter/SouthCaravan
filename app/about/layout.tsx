import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'About South Caravan — Connecting Buyers & Suppliers',
  description:
    'Learn how South Caravan connects buyers and suppliers worldwide — wholesale catalog, RFQs, and verified trade from Uganda and Africa to global markets.',
  path: '/about',
  keywords: [
    ...KEYWORD_CATEGORIES.brand,
    ...KEYWORD_CATEGORIES.africa,
    ...KEYWORD_CATEGORIES.trust,
  ],
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}

import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'About South Caravan — Africa B2B Trade Platform',
  description:
    'Learn how South Caravan connects verified suppliers and buyers across Uganda, East Africa, and global markets through RFQs, wholesale catalog, and trusted B2B trade.',
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

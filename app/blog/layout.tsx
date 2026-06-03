import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'Trade Insights & B2B Resources Blog',
  description:
    'Expert guides on African trade, import-export, procurement, supplier verification, and growing your wholesale business on South Caravan.',
  path: '/blog',
  keywords: [
    ...KEYWORD_CATEGORIES.longTail,
    ...KEYWORD_CATEGORIES.importExport,
    ...KEYWORD_CATEGORIES.technology,
  ],
})

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children
}

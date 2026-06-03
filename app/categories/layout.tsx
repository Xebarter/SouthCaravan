import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'Browse Categories — Wholesale Products & Services',
  description:
    'Explore B2B product and service categories: agriculture, manufacturing, textiles, construction, electronics, and more from African suppliers.',
  path: '/categories',
  keywords: [...KEYWORD_CATEGORIES.industries, ...KEYWORD_CATEGORIES.products],
})

export default function CategoriesLayout({ children }: { children: ReactNode }) {
  return children
}

import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'Product Catalog — Wholesale B2B Marketplace',
  description:
    'Browse wholesale products from verified African suppliers. Source agriculture, manufacturing, textiles, and industrial goods for B2B procurement on South Caravan.',
  path: '/catalog',
  keywords: [
    ...KEYWORD_CATEGORIES.products,
    ...KEYWORD_CATEGORIES.suppliers,
    ...KEYWORD_CATEGORIES.b2b,
  ],
})

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return children
}

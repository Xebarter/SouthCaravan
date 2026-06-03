import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords'

export const metadata = createPageMetadata({
  title: 'FAQ — South Caravan B2B Marketplace',
  description:
    'Frequently asked questions about buying, selling, RFQs, vendor verification, payments, and using the South Caravan B2B marketplace in Uganda and Africa.',
  path: '/faq',
  keywords: [...KEYWORD_CATEGORIES.b2b, ...KEYWORD_CATEGORIES.trust, ...KEYWORD_CATEGORIES.longTail],
})

export default function FaqLayout({ children }: { children: ReactNode }) {
  return children
}

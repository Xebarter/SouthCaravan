import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Careers at South Caravan',
  description: 'Join South Caravan and help build Africa’s leading B2B marketplace for wholesale trade, suppliers, and digital commerce.',
  path: '/careers',
})

export default function CareersLayout({ children }: { children: ReactNode }) {
  return children
}

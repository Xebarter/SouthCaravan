import type { ReactNode } from 'react'

import { createPageMetadata } from '@/lib/seo/metadata'

export const metadata = createPageMetadata({
  title: 'Contact South Caravan — B2B Support & Partnerships',
  description:
    'Contact the South Caravan team for buyer support, vendor onboarding, partnerships, and trade inquiries. Based in Kampala, serving Africa and global B2B markets.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}

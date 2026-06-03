import type { ReactNode } from 'react'

import { createNoIndexMetadata } from '@/lib/seo/metadata'

export const metadata = createNoIndexMetadata('Shopping cart')

export default function CartLayout({ children }: { children: ReactNode }) {
  return children
}

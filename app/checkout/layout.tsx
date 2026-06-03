import type { ReactNode } from 'react'

import { createNoIndexMetadata } from '@/lib/seo/metadata'

export const metadata = createNoIndexMetadata('Checkout')

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children
}

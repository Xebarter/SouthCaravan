import type React from 'react'
import { AppShell } from '@/components/app-shell'
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu'

export async function AppShellWithMenu({ children }: { children: React.ReactNode }) {
  const menuSections = await getMarketplaceMenuSections()
  return <AppShell menuSections={menuSections}>{children}</AppShell>
}


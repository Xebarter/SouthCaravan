import { NextResponse } from 'next/server'
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu'

export type AddItemsNode = { title: string; children?: AddItemsNode[] }

export async function GET() {
  const sections = await getMarketplaceMenuSections()

  const items: AddItemsNode[] = (sections ?? []).map((section) => ({
    title: section.title,
    children: (section.items ?? []).map((title) => ({ title })),
  }))

  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}


import type { LucideIcon } from 'lucide-react'
import { BriefcaseBusiness, Store } from 'lucide-react'

import type { GrantablePortal } from '@/lib/portal-session'

export type SellPortal = 'vendor' | 'services'

export function isSellPortal(portal: GrantablePortal): portal is SellPortal {
  return portal === 'vendor' || portal === 'services'
}

export type SellPortalPrompt = {
  title: string
  /** Screen-reader only */
  hint: string
  icon: LucideIcon
  accent: string
}

const PROMPTS: Record<SellPortal, SellPortalPrompt> = {
  vendor: {
    title: 'Sell as a vendor?',
    hint: 'Open the SouthCaravan vendor workspace.',
    icon: Store,
    accent: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  },
  services: {
    title: 'Offer services?',
    hint: 'Open the SouthCaravan services workspace.',
    icon: BriefcaseBusiness,
    accent: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  },
}

export function getSellPortalPrompt(portal: SellPortal): SellPortalPrompt {
  return PROMPTS[portal]
}

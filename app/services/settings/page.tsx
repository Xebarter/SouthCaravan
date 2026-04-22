'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useAuth } from '@/lib/auth-context'

export default function ServicesSettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Empty className="border border-border/60 bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Settings />
          </EmptyMedia>
          <EmptyTitle>Settings</EmptyTitle>
          <EmptyDescription>
            Manage your public profile, contact details, and notification preferences. This screen is wired into the
            Services Console shell; next we can connect it to `vendor_profiles` (shared table) with services-safe APIs.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/services/offerings">Manage offerings</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}


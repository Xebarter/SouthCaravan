'use client'

import Link from 'next/link'
import { BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useAuth } from '@/lib/auth-context'

export default function ServicesAnalyticsPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Empty className="border border-border/60 bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BarChart3 />
          </EmptyMedia>
          <EmptyTitle>Analytics</EmptyTitle>
          <EmptyDescription>
            Track response time, request volume, and conversion once the services request flow is fully connected.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" asChild>
            <Link href="/services/dashboard">Back to dashboard</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}


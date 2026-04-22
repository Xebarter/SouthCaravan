'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useAuth } from '@/lib/auth-context'

export default function ServicesMessagesPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <Empty className="border border-border/60 bg-card/40">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquare />
          </EmptyMedia>
          <EmptyTitle>Messages</EmptyTitle>
          <EmptyDescription>
            This inbox is ready for the services workflow. Next we can connect it to the existing buyer/vendor messaging
            tables so service providers can chat with buyers.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/services/requests">Go to requests</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}


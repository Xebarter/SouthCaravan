'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Inbox, Loader2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

type Offering = { id: string; is_active: boolean }
type RequestItem = { id: string; status: string }

export default function ServicesDashboardPage() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [offersRes, reqRes] = await Promise.all([
          fetch('/api/services/offerings', { cache: 'no-store' }),
          fetch('/api/services/requests?status=all', { cache: 'no-store' }),
        ])

        const offersJson = await offersRes.json().catch(() => ({}))
        const reqJson = await reqRes.json().catch(() => ({}))

        if (!offersRes.ok) throw new Error(offersJson?.error ?? 'Failed to load offerings')
        if (!reqRes.ok) throw new Error(reqJson?.error ?? 'Failed to load requests')

        if (!cancelled) {
          setOfferings(Array.isArray(offersJson?.offerings) ? offersJson.offerings : [])
          setRequests(Array.isArray(reqJson?.requests) ? reqJson.requests : [])
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])

  const activeOfferings = useMemo(
    () => offerings.filter((o) => Boolean(o.is_active)).length,
    [offerings],
  )
  const openRequests = useMemo(
    () => requests.filter((r) => String(r.status || '').toLowerCase() === 'open').length,
    [requests],
  )

  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your service offerings and respond to incoming requests
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-28 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [
                {
                  label: 'Active offerings',
                  value: activeOfferings,
                  icon: BriefcaseBusiness,
                  color: 'bg-primary',
                },
                {
                  label: 'Total offerings',
                  value: offerings.length,
                  icon: Sparkles,
                  color: 'bg-violet-500',
                },
                {
                  label: 'Open requests',
                  value: openRequests,
                  icon: Inbox,
                  color: 'bg-amber-500',
                },
                {
                  label: 'All requests',
                  value: requests.length,
                  icon: Inbox,
                  color: 'bg-emerald-500',
                },
              ] as const
            ).map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-border/60">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground truncate">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardContent className="py-6 space-y-3">
                <p className="font-semibold">Next steps</p>
                <p className="text-sm text-muted-foreground">
                  Add your offerings so buyers can send you targeted requests.
                </p>
                <Button asChild>
                  <Link href="/services/offerings" className="gap-2">
                    Manage offerings <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="py-6 space-y-3">
                <p className="font-semibold">Requests inbox</p>
                <p className="text-sm text-muted-foreground">
                  View inbound service requests, triage them, and follow up.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/services/requests" className="gap-2">
                    View requests <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}


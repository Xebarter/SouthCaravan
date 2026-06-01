'use client'

import { useEffect, useMemo, useState, type ElementType } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  Inbox,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

type Offering = {
  id: string
  title?: string | null
  category?: string | null
  is_active: boolean
  created_at?: string
}

type ServiceRequest = {
  id: string
  title?: string | null
  category?: string | null
  subcategory?: string | null
  description?: string | null
  status: string
  created_at: string
}

const STATUS_META: Record<string, { label: string; badgeCn: string }> = {
  open: {
    label: 'Open',
    badgeCn: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
  },
  in_progress: {
    label: 'In progress',
    badgeCn: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-400',
  },
  closed: {
    label: 'Closed',
    badgeCn: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400',
  },
}

function formatRequestDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string
  value: number | string
  hint: string
  icon: ElementType
  loading?: boolean
}) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 shadow-sm backdrop-blur">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-16 rounded-lg" />
        ) : (
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export default function ServicesDashboardPage() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)

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
          setNeedsSetup(Boolean(offersJson?.needsSetup || reqJson?.needsSetup))
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard')
        }
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
  const inProgressRequests = useMemo(
    () => requests.filter((r) => String(r.status || '').toLowerCase() === 'in_progress').length,
    [requests],
  )
  const recentRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ).slice(0, 6),
    [requests],
  )

  const displayName = user?.name ?? user?.company ?? 'there'
  const setupSteps = useMemo(
    () => [
      { done: offerings.length > 0, label: 'Publish at least one service offering' },
      { done: activeOfferings > 0, label: 'Activate an offering for buyers to discover' },
      { done: requests.length > 0, label: 'Receive your first buyer request' },
    ],
    [offerings.length, activeOfferings, requests.length],
  )
  const setupComplete = setupSteps.every((s) => s.done)

  if (!user) return null

  return (
    <div className="flex-1 bg-linear-to-b from-background via-background to-muted/30">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              Service provider workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back, {displayName}. Track requests and keep your offerings up to date.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" className="rounded-2xl" asChild>
              <Link href="/services/requests">
                <Inbox className="h-4 w-4" />
                Requests
                {!loading && openRequests > 0 ? (
                  <Badge variant="secondary" className="ml-2 rounded-full">
                    {openRequests > 99 ? '99+' : openRequests}
                  </Badge>
                ) : null}
              </Link>
            </Button>
            <Button className="rounded-2xl" asChild>
              <Link href="/services/offerings">
                <BriefcaseBusiness className="h-4 w-4" />
                Manage offerings
              </Link>
            </Button>
          </div>
        </div>

        {needsSetup ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Services tables are not set up yet. Run the SQL migration in{' '}
            <code className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs">supabase/services.sql</code>{' '}
            to enable offerings and requests.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Active offerings"
            value={activeOfferings}
            hint="Visible to buyers in the marketplace"
            icon={Sparkles}
            loading={loading}
          />
          <KpiCard
            label="Total offerings"
            value={offerings.length}
            hint="Draft and published services"
            icon={BriefcaseBusiness}
            loading={loading}
          />
          <KpiCard
            label="Open requests"
            value={openRequests}
            hint="Awaiting your response"
            icon={Inbox}
            loading={loading}
          />
          <KpiCard
            label="In progress"
            value={inProgressRequests}
            hint="Requests you are working on"
            icon={MessageSquare}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Recent requests */}
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/60 shadow-sm backdrop-blur xl:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Inbox className="h-4 w-4 text-primary" />
                    Recent requests
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Latest inbound service requests from buyers
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                  <Link href="/services/requests">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-3 pb-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
                  ))}
                </div>
              ) : recentRequests.length === 0 ? (
                <Empty className="border border-dashed border-border/70 bg-muted/20 py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox />
                    </EmptyMedia>
                    <EmptyTitle>No requests yet</EmptyTitle>
                    <EmptyDescription>
                      When buyers reach out for your services, they will appear here for quick follow-up.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button className="rounded-2xl" asChild>
                      <Link href="/services/offerings">Publish an offering</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <ul className="divide-y divide-border/60">
                  {recentRequests.map((r) => {
                    const statusKey = String(r.status || '').toLowerCase()
                    const meta = STATUS_META[statusKey] ?? STATUS_META.open
                    return (
                      <li key={r.id}>
                        <Link
                          href="/services/requests"
                          className="flex gap-4 px-1 py-4 transition-colors hover:bg-muted/30 -mx-1 rounded-xl"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">
                              {r.title?.trim() || 'Service request'}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {[r.category, r.subcategory].filter(Boolean).join(' · ') || 'General'}
                            </p>
                            {r.description ? (
                              <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
                                {r.description}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                                meta.badgeCn,
                              )}
                            >
                              {meta.label}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatRequestDate(r.created_at)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-border/70 bg-card/70 shadow-sm backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Getting started</CardTitle>
                <CardDescription>
                  {setupComplete
                    ? 'Your workspace is ready for buyers.'
                    : 'Complete these steps to start receiving requests.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {setupSteps.map((step) => (
                  <div key={step.label} className="flex items-start gap-3 text-sm">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    )}
                    <span
                      className={cn(
                        step.done ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
                {!setupComplete ? (
                  <Button className="mt-2 w-full rounded-2xl" asChild>
                    <Link href="/services/offerings">
                      Add offering
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-primary/15 bg-linear-to-br from-primary/8 via-card/80 to-card/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                <Button variant="secondary" className="w-full justify-between rounded-xl" asChild>
                  <Link href="/services/offerings">
                    Manage offerings
                    <ArrowRight className="h-4 w-4 opacity-60" />
                  </Link>
                </Button>
                <Button variant="secondary" className="w-full justify-between rounded-xl" asChild>
                  <Link href="/services/messages">
                    Open messages
                    <ArrowRight className="h-4 w-4 opacity-60" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between rounded-xl" asChild>
                  <Link href="/services/settings">
                    Workspace settings
                    <ArrowRight className="h-4 w-4 opacity-60" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground sr-only">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading dashboard
          </div>
        ) : null}
      </div>
    </div>
  )
}

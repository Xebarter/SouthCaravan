'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

type ServiceRequest = {
  id: string
  category: string
  subcategory: string
  title: string
  description: string
  status: string
  created_at: string
}

const TABS = ['all', 'open', 'in_progress', 'closed'] as const
type Tab = (typeof TABS)[number]

const STATUS_META: Record<string, { label: string; badgeCn: string }> = {
  open: { label: 'Open', badgeCn: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' },
  in_progress: { label: 'In progress', badgeCn: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400' },
  closed: { label: 'Closed', badgeCn: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' },
}

export default function ServicesRequestsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('all')
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
        const res = await fetch(`/api/services/requests?status=${encodeURIComponent(activeTab)}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load requests')
        if (!cancelled) {
          setRequests(Array.isArray(json?.requests) ? json.requests : [])
          setNeedsSetup(Boolean(json?.needsSetup))
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load requests')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, activeTab])

  const counts = useMemo(() => {
    const by: Record<Tab, number> = { all: requests.length, open: 0, in_progress: 0, closed: 0 }
    for (const r of requests) {
      const k = String(r.status || '').toLowerCase() as Tab
      if (k === 'open' || k === 'in_progress' || k === 'closed') by[k] += 1
    }
    return by
  }, [requests])

  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Incoming service requests from buyers
        </p>
      </div>

      {needsSetup ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Services tables are not set up yet. Run the SQL migration in `supabase/services.sql` to enable
          requests.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="capitalize">{tab === 'all' ? 'All' : STATUS_META[tab]?.label ?? tab}</span>
            {counts[tab] > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                  activeTab === tab ? 'bg-white/25' : 'bg-border',
                )}
              >
                {counts[tab]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-secondary p-5 mb-5">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold">No requests yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Requests will appear here once buyers start reaching out for your services.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {requests.map((r) => {
            const k = String(r.status || '').toLowerCase()
            const meta = STATUS_META[k] ?? STATUS_META.open
            return (
              <Card key={r.id} className="border-border/60">
                <CardContent className="py-5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{r.title || 'Service request'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.category} · {r.subcategory}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0',
                        meta?.badgeCn,
                      )}
                    >
                      {meta?.label}
                    </span>
                  </div>
                  {r.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}


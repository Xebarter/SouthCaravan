'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles, UserRound, BriefcaseBusiness } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ProviderRow = {
  user_id: string
  email: string
  name: string
  company_name: string
  created_at: string
  offerings_count: number
  open_requests: number
  featured_count: number
  ads_count: number
}

export default function AdminServiceProvidersPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/services/providers', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to load providers')
      setProviders(Array.isArray(json?.providers) ? json.providers : [])
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load providers')
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const stats = useMemo(() => {
    const total = providers.length
    const totalOfferings = providers.reduce((n, p) => n + Number(p.offerings_count ?? 0), 0)
    const openRequests = providers.reduce((n, p) => n + Number(p.open_requests ?? 0), 0)
    const featured = providers.reduce((n, p) => n + Number(p.featured_count ?? 0), 0)
    return { total, totalOfferings, openRequests, featured }
  }, [providers])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Service Providers</h1>
            <Badge variant="secondary" className="text-xs">
              Services Portal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage service provider accounts and monitor catalogue activity.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Providers</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.totalOfferings}</p>
            <p className="text-xs text-muted-foreground">Offerings</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-600">{stats.openRequests}</p>
            <p className="text-xs text-muted-foreground">Open requests</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-primary">{stats.featured}</p>
            <p className="text-xs text-muted-foreground">Featured listings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Accounts with the `services` portal role</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading providers…
            </div>
          ) : providers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No service providers found.</p>
          ) : (
            <div className="space-y-3">
              {providers.map((p) => {
                const label = p.company_name || p.name || p.email
                return (
                  <div
                    key={p.user_id}
                    className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors gap-3"
                  >
                    <div className="flex gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <UserRound className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold truncate">{label}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {p.email}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          User: <span className="font-mono">{p.user_id}</span>
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className={cn('inline-flex items-center gap-1')}>
                            <BriefcaseBusiness className="h-4 w-4" /> Offerings:{' '}
                            <span className="font-medium text-foreground">{p.offerings_count}</span>
                          </span>
                          <span className={cn('inline-flex items-center gap-1')}>
                            <Sparkles className="h-4 w-4" /> Featured:{' '}
                            <span className="font-medium text-foreground">{p.featured_count}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            Ads: <span className="font-medium text-foreground">{p.ads_count}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            Open requests:{' '}
                            <span className="font-medium text-foreground">{p.open_requests}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


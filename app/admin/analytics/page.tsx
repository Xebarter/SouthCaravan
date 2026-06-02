'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Globe2,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Money } from '@/components/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

type OverviewPayload = {
  totals: {
    totalGMV: number
    vendorCount: number
    userCount: number
    featuredCount: number
    pendingVendorCount: number
  }
}

type InsightSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'
type InsightStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'
type InsightSource = 'manual' | 'system'

type InsightRow = {
  id: string
  title: string
  summary: string
  severity: InsightSeverity
  status: InsightStatus
  region: string
  source: InsightSource
  metric_key: string
  metric_value: number | null
  created_at: string
  updated_at: string
}

type InsightDraft = {
  title: string
  summary: string
  severity: InsightSeverity
  status: InsightStatus
  region: string
  source: InsightSource
  metricKey: string
  metricValue: string
}

const DEFAULT_DRAFT: InsightDraft = {
  title: '',
  summary: '',
  severity: 'info',
  status: 'open',
  region: 'Global',
  source: 'manual',
  metricKey: '',
  metricValue: '',
}

const SEVERITY_ORDER: InsightSeverity[] = ['critical', 'high', 'medium', 'low', 'info']

const SEVERITY_COLORS: Record<InsightSeverity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#94a3b8',
}

const STATUS_COLORS: Record<InsightStatus, string> = {
  open: '#ef4444',
  investigating: '#f59e0b',
  resolved: '#10b981',
  dismissed: '#94a3b8',
}

const SEVERITY_WEIGHT: Record<InsightSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
}

function severityBadge(sev: InsightSeverity) {
  if (sev === 'critical' || sev === 'high') return 'destructive'
  if (sev === 'medium') return 'default'
  if (sev === 'low') return 'outline'
  return 'secondary'
}

function statusBadge(status: InsightStatus) {
  if (status === 'resolved') return 'default'
  if (status === 'dismissed') return 'outline'
  if (status === 'investigating') return 'secondary'
  return 'destructive'
}

function fmtDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  loading,
}: {
  title: string
  value: React.ReactNode
  sub: string
  icon: React.ElementType
  iconBg: string
  loading?: boolean
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-3">
        {loading ? (
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconBg)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-none text-muted-foreground">{title}</p>
              <p className="mt-1 text-lg font-bold leading-none tracking-tight tabular-nums">{value}</p>
              <p className="mt-1 truncate text-[10px] leading-tight text-muted-foreground">{sub}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl text-xs">
      {label ? <p className="font-semibold mb-1.5 text-foreground capitalize">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="capitalize">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights'>('dashboard')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewPayload | null>(null)

  const [insightsLoading, setInsightsLoading] = useState(true)
  const [insights, setInsights] = useState<InsightRow[]>([])
  const [insightsStatus, setInsightsStatus] = useState<'all' | InsightStatus>('all')
  const [insightsSeverity, setInsightsSeverity] = useState<'all' | InsightSeverity>('all')
  const [query, setQuery] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createDraft, setCreateDraft] = useState<InsightDraft>(DEFAULT_DRAFT)

  const [editOpen, setEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<InsightDraft>(DEFAULT_DRAFT)

  const totals = overview?.totals

  const filteredInsights = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return insights
    return insights.filter((row) => {
      const haystack = `${row.title} ${row.summary} ${row.region} ${row.metric_key}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [insights, query])

  const insightStats = useMemo(() => {
    const bySeverity: Record<InsightSeverity, number> = { info: 0, low: 0, medium: 0, high: 0, critical: 0 }
    const byStatus: Record<InsightStatus, number> = { open: 0, investigating: 0, resolved: 0, dismissed: 0 }
    for (const row of insights) {
      bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1
    }
    return { bySeverity, byStatus, total: insights.length }
  }, [insights])

  const severityChartData = useMemo(
    () =>
      SEVERITY_ORDER.map((sev) => ({
        name: sev,
        count: insightStats.bySeverity[sev] ?? 0,
        fill: SEVERITY_COLORS[sev],
      })),
    [insightStats.bySeverity],
  )

  const statusChartData = useMemo(
    () =>
      (['open', 'investigating', 'resolved', 'dismissed'] as InsightStatus[]).map((status) => ({
        name: status,
        value: insightStats.byStatus[status] ?? 0,
        fill: STATUS_COLORS[status],
      })),
    [insightStats.byStatus],
  )

  const recentInsights = useMemo(() => {
    return [...insights]
      .filter((r) => r.status === 'open' || r.status === 'investigating')
      .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
      .slice(0, 5)
  }, [insights])

  const openSignalCount = (insightStats.byStatus.open ?? 0) + (insightStats.byStatus.investigating ?? 0)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/overview')
      const payload = (await response.json()) as OverviewPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load overview')
      setOverview(payload)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load overview')
      setOverview(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInsights = useCallback(async () => {
    setInsightsLoading(true)
    try {
      const qs = new URLSearchParams({
        limit: '250',
        status: insightsStatus,
        severity: insightsSeverity,
      })
      const response = await fetch(`/api/admin/analytics-insights?${qs.toString()}`)
      const payload = (await response.json()) as { insights?: InsightRow[]; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load insights')
      setInsights(payload.insights ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load insights')
      setInsights([])
    } finally {
      setInsightsLoading(false)
    }
  }, [insightsSeverity, insightsStatus])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  function openEdit(row: InsightRow) {
    setEditId(row.id)
    setEditDraft({
      title: row.title ?? '',
      summary: row.summary ?? '',
      severity: row.severity ?? 'info',
      status: row.status ?? 'open',
      region: row.region ?? 'Global',
      source: row.source ?? 'manual',
      metricKey: row.metric_key ?? '',
      metricValue: row.metric_value === null || row.metric_value === undefined ? '' : String(row.metric_value),
    })
    setEditOpen(true)
  }

  async function createInsight() {
    if (!createDraft.title.trim()) {
      toast.error('Title is required')
      return
    }
    setCreateSaving(true)
    try {
      const response = await fetch('/api/admin/analytics-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createDraft),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to create insight')
      toast.success('Insight created')
      setCreateOpen(false)
      setCreateDraft(DEFAULT_DRAFT)
      await fetchInsights()
      setActiveTab('insights')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create insight')
    } finally {
      setCreateSaving(false)
    }
  }

  async function saveEdit() {
    if (!editId) return
    if (!editDraft.title.trim()) {
      toast.error('Title is required')
      return
    }
    setEditSaving(true)
    try {
      const response = await fetch('/api/admin/analytics-insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...editDraft }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to update insight')
      toast.success('Insight updated')
      setEditOpen(false)
      setEditId(null)
      await fetchInsights()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update insight')
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteInsight(id: string) {
    try {
      const response = await fetch(`/api/admin/analytics-insights?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to delete insight')
      toast.success('Insight deleted')
      await fetchInsights()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete insight')
    }
  }

  const isRefreshing = loading || insightsLoading

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/25">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Admin console</p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <BarChart3 className="h-5 w-5" />
              </span>
              Analytics & intelligence
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Platform health at a glance, plus a managed queue of operational signals for your team.
            </p>
            {!insightsLoading && insightStats.total > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">
                  {insightStats.total} total insights
                </Badge>
                {openSignalCount > 0 ? (
                  <Badge variant="destructive" className="font-normal">
                    {openSignalCount} need attention
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    Queue clear
                  </Badge>
                )}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                fetchOverview()
                fetchInsights()
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button size="sm" className="rounded-xl" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New insight
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/admin">
                Overview
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dashboard' | 'insights')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-10 w-full sm:w-auto rounded-lg border border-border bg-muted/40 p-1">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:shadow-sm">
              <TrendingUp className="h-3.5 w-3.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2 data-[state=active]:shadow-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              Insights
              <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1.5 text-[10px]">
                {insightStats.total}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              title="Total GMV"
              value={<Money amountUSD={totals?.totalGMV ?? 0} notation="compact" />}
              sub="All-time gross merchandise value"
              icon={TrendingUp}
              iconBg="bg-emerald-500"
              loading={loading}
            />
            <StatCard
              title="Vendors"
              value={totals?.vendorCount ?? 0}
              sub="Registered suppliers"
              icon={Store}
              iconBg="bg-primary"
              loading={loading}
            />
            <StatCard
              title="Users"
              value={totals?.userCount ?? 0}
              sub="Buyer accounts"
              icon={Users}
              iconBg="bg-violet-500"
              loading={loading}
            />
            <StatCard
              title="Featured products"
              value={totals?.featuredCount ?? 0}
              sub="Merchandising coverage"
              icon={Sparkles}
              iconBg="bg-amber-500"
              loading={loading}
            />
            <StatCard
              title="Pending approvals"
              value={totals?.pendingVendorCount ?? 0}
              sub="Suppliers awaiting verification"
              icon={ShieldAlert}
              iconBg="bg-rose-500"
              loading={loading}
            />
          </div>

          {/* Insight status summary */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['open', 'investigating', 'resolved', 'dismissed'] as InsightStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setInsightsStatus(status)
                  setActiveTab('insights')
                }}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <p className="text-[11px] font-medium capitalize text-muted-foreground">{status}</p>
                <p className="text-base font-bold tabular-nums leading-none" style={{ color: STATUS_COLORS[status] }}>
                  {insightsLoading ? '—' : insightStats.byStatus[status]}
                </p>
              </button>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <Card className="xl:col-span-7 border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Signal distribution</CardTitle>
                    <CardDescription className="text-xs mt-0.5">Operational insights by severity level</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] shrink-0">
                    {insightStats.total} signals
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {insightsLoading ? (
                  <Skeleton className="h-[220px] w-full rounded-lg" />
                ) : insightStats.total === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    title="No signals yet"
                    description="Create your first insight to start tracking operational intelligence."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={severityChartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={72}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => String(v).toUpperCase()}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {severityChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-5 border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Queue status</CardTitle>
                <CardDescription className="text-xs">Insight lifecycle breakdown</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {insightsLoading ? (
                  <Skeleton className="h-[220px] w-full rounded-lg" />
                ) : insightStats.total === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Nothing in queue"
                    description="All clear — add insights as operational events arise."
                  />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={statusChartData.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {statusChartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-2">
                      {statusChartData.map((entry) => (
                        <div key={entry.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: entry.fill }} />
                            <span className="capitalize text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="font-semibold tabular-nums">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent + actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-7 border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Priority signals</CardTitle>
                    <CardDescription className="text-xs">Open and in-progress items, highest severity first</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab('insights')}>
                    View all
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : recentInsights.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="No active signals"
                    description="Open or investigating insights will appear here for quick triage."
                  />
                ) : (
                  recentInsights.map((row) => (
                    <div
                      key={row.id}
                      className="group flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: SEVERITY_COLORS[row.severity] }}
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium leading-snug">{row.title}</p>
                          <Badge variant={severityBadge(row.severity) as 'default'} className="text-[10px] uppercase">
                            {row.severity}
                          </Badge>
                        </div>
                        {row.summary ? (
                          <p className="text-xs text-muted-foreground line-clamp-1">{row.summary}</p>
                        ) : null}
                        <p className="text-[11px] text-muted-foreground">
                          {row.region} · Updated {fmtDate(row.updated_at)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 opacity-80 group-hover:opacity-100" onClick={() => openEdit(row)}>
                        Triage
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-5 border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recommended actions</CardTitle>
                <CardDescription className="text-xs">Keep the marketplace healthy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Review open signals</p>
                    <p className="text-xs text-muted-foreground">
                      {openSignalCount > 0
                        ? `${openSignalCount} item${openSignalCount === 1 ? '' : 's'} awaiting triage or investigation.`
                        : 'No open items — great work keeping the queue clear.'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 p-4 flex items-start gap-3">
                  <Activity className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Vendor onboarding</p>
                    <p className="text-xs text-muted-foreground">
                      {(totals?.pendingVendorCount ?? 0) > 0
                        ? `${totals?.pendingVendorCount} supplier${totals?.pendingVendorCount === 1 ? '' : 's'} waiting for verification.`
                        : 'No vendors pending approval right now.'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 p-4 flex items-start gap-3">
                  <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Supply & merchandising</p>
                    <p className="text-xs text-muted-foreground">
                      {totals?.featuredCount ?? 0} featured listings across {totals?.vendorCount ?? 0} vendors.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-2">
                  <Button variant="outline" className="w-full justify-between" onClick={() => setActiveTab('insights')}>
                    Open insights queue
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  {(totals?.pendingVendorCount ?? 0) > 0 ? (
                    <Button variant="outline" className="w-full justify-between" asChild>
                      <Link href="/admin/vendors">
                        Review pending vendors
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-4 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Insights queue</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Create, update, and resolve operational signals. Persisted via Supabase.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="shrink-0 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add insight
                </Button>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search title, region, summary..."
                    className="pl-9 bg-background"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={insightsStatus} onValueChange={(v) => setInsightsStatus(v as 'all' | InsightStatus)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={insightsSeverity} onValueChange={(v) => setInsightsSeverity(v as 'all' | InsightSeverity)}>
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchInsights} disabled={insightsLoading} className="w-full sm:w-auto">
                    {insightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reload
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/20 py-16 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading insights…
                </div>
              ) : filteredInsights.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No insights match"
                  description="Try adjusting filters or create a new insight to log a signal."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="font-semibold">Title</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Severity</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Region</TableHead>
                        <TableHead className="font-semibold hidden lg:table-cell">Metric</TableHead>
                        <TableHead className="font-semibold hidden sm:table-cell">Updated</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInsights.map((row) => (
                        <TableRow key={row.id} className="group">
                          <TableCell className="whitespace-normal max-w-[280px]">
                            <div className="flex items-start gap-2">
                              <span
                                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                                style={{ background: SEVERITY_COLORS[row.severity] }}
                              />
                              <div className="space-y-1 min-w-0">
                                <p className="font-medium leading-snug">{row.title}</p>
                                {row.summary ? (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{row.summary}</p>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge(row.status) as 'default'} className="capitalize">
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={severityBadge(row.severity) as 'default'} className="uppercase text-[10px]">
                              {row.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{row.region}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {row.metric_key ? (
                              <span className="text-xs font-mono">
                                <span className="font-medium text-foreground">{row.metric_key}</span>
                                {row.metric_value !== null ? (
                                  <span className="text-muted-foreground"> = {row.metric_value}</span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground whitespace-nowrap">
                            {fmtDate(row.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete insight?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete <strong>{row.title}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteInsight(row.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create insight</DialogTitle>
            <DialogDescription>Log a signal for your team to action (triage, investigate, resolve).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                value={createDraft.title}
                onChange={(e) => setCreateDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Buyer churn risk rising in Europe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-summary">Summary</Label>
              <Textarea
                id="create-summary"
                value={createDraft.summary}
                onChange={(e) => setCreateDraft((p) => ({ ...p, summary: e.target.value }))}
                placeholder="Add context, hypothesis, recommended action..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={createDraft.severity} onValueChange={(v) => setCreateDraft((p) => ({ ...p, severity: v as InsightSeverity }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={createDraft.status} onValueChange={(v) => setCreateDraft((p) => ({ ...p, status: v as InsightStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-region">Region</Label>
                <Input
                  id="create-region"
                  value={createDraft.region}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, region: e.target.value }))}
                  placeholder="Global / Africa / Europe / ..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={createDraft.source} onValueChange={(v) => setCreateDraft((p) => ({ ...p, source: v as InsightSource }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="create-metricKey">Metric key (optional)</Label>
                <Input
                  id="create-metricKey"
                  value={createDraft.metricKey}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, metricKey: e.target.value }))}
                  placeholder="e.g. churn_risk_pct"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-metricValue">Metric value (optional)</Label>
                <Input
                  id="create-metricValue"
                  value={createDraft.metricValue}
                  onChange={(e) => setCreateDraft((p) => ({ ...p, metricValue: e.target.value }))}
                  placeholder="e.g. 2.3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createSaving}>
              Cancel
            </Button>
            <Button onClick={createInsight} disabled={createSaving}>
              {createSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit insight</DialogTitle>
            <DialogDescription>Update status as you triage and resolve.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={editDraft.title} onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea id="edit-summary" value={editDraft.summary} onChange={(e) => setEditDraft((p) => ({ ...p, summary: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={editDraft.severity} onValueChange={(v) => setEditDraft((p) => ({ ...p, severity: v as InsightSeverity }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editDraft.status} onValueChange={(v) => setEditDraft((p) => ({ ...p, status: v as InsightStatus }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-region">Region</Label>
                <Input id="edit-region" value={editDraft.region} onChange={(e) => setEditDraft((p) => ({ ...p, region: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={editDraft.source} onValueChange={(v) => setEditDraft((p) => ({ ...p, source: v as InsightSource }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-metricKey">Metric key</Label>
                <Input id="edit-metricKey" value={editDraft.metricKey} onChange={(e) => setEditDraft((p) => ({ ...p, metricKey: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-metricValue">Metric value</Label>
                <Input id="edit-metricValue" value={editDraft.metricValue} onChange={(e) => setEditDraft((p) => ({ ...p, metricValue: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </main>
  )
}

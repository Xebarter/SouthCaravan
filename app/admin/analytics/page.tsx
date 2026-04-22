'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Globe2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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

function severityBadge(sev: InsightSeverity) {
  if (sev === 'critical') return 'destructive'
  if (sev === 'high') return 'destructive'
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

  const maxSeverityCount = Math.max(
    1,
    insightStats.bySeverity.info,
    insightStats.bySeverity.low,
    insightStats.bySeverity.medium,
    insightStats.bySeverity.high,
    insightStats.bySeverity.critical,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin console</p>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Real-time platform health plus a managed queue of operational insights.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { fetchOverview(); fetchInsights() }} disabled={loading || insightsLoading}>
            {(loading || insightsLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New insight
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">
              Overview
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights">
            Insights
            <Badge variant="secondary" className="ml-2">
              {insightStats.total}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4 space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Total GMV</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">
                  <Money amountUSD={totals?.totalGMV ?? 0} notation="compact" />
                </p>
                <p className="text-xs text-muted-foreground mt-1">All-time platform gross merchandise value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Vendors</p>
                  <Globe2 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{totals?.vendorCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Registered suppliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Users</p>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{totals?.userCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Buyer accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Featured products</p>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{totals?.featuredCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Merchandising coverage</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Pending approvals</p>
                  <ShieldAlert className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{totals?.pendingVendorCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Suppliers awaiting verification</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid xl:grid-cols-12 gap-5">
            <Card className="xl:col-span-7">
              <CardHeader>
                <CardTitle>Signal distribution</CardTitle>
                <CardDescription>Operational insights by severity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['critical', 'high', 'medium', 'low', 'info'] as InsightSeverity[]).map((sev) => {
                  const count = insightStats.bySeverity[sev] ?? 0
                  const w = Math.max(2, Math.round((count / maxSeverityCount) * 100))
                  return (
                    <div key={sev} className="flex items-center gap-3">
                      <Badge variant={severityBadge(sev) as any} className="w-[90px] justify-center">
                        {sev.toUpperCase()}
                      </Badge>
                      <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
                        <div className="h-2 bg-primary/70" style={{ width: `${w}%` }} />
                      </div>
                      <p className="w-10 text-right text-sm font-medium">{count}</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader>
                <CardTitle>Next actions</CardTitle>
                <CardDescription>Keep the marketplace healthy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md border border-border p-3 flex items-start gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-medium">Review open signals</p>
                    <p className="text-muted-foreground">
                      Triage items marked <strong>open</strong> and move to <strong>investigating</strong>.
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3 flex items-start gap-2">
                  <Activity className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-1">
                    <p className="font-medium">Track vendor onboarding</p>
                    <p className="text-muted-foreground">Approve queued vendors to unlock supply growth.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('insights')}>
                  Open insights queue
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Insights queue</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search title, region, summary..."
                      className="pl-9 w-[260px]"
                    />
                  </div>
                  <Select value={insightsStatus} onValueChange={(v) => setInsightsStatus(v as any)}>
                    <SelectTrigger className="w-[165px]">
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
                  <Select value={insightsSeverity} onValueChange={(v) => setInsightsSeverity(v as any)}>
                    <SelectTrigger className="w-[165px]">
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
                  <Button variant="outline" onClick={fetchInsights} disabled={insightsLoading}>
                    {insightsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Reload
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Create, update, and resolve insights. Changes are persisted to Supabase via service-role API routes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading insights...
                </div>
              ) : filteredInsights.length === 0 ? (
                <div className="rounded-md border border-border bg-secondary/30 p-6 text-sm text-muted-foreground">
                  No insights match your filters.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInsights.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-normal">
                          <div className="space-y-1">
                            <p className="font-medium leading-snug">{row.title}</p>
                            {row.summary ? (
                              <p className="text-xs text-muted-foreground line-clamp-2">{row.summary}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge(row.status) as any}>{row.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={severityBadge(row.severity) as any}>{row.severity}</Badge>
                        </TableCell>
                        <TableCell>{row.region}</TableCell>
                        <TableCell>
                          {row.metric_key ? (
                            <span className="text-xs">
                              <span className="font-medium">{row.metric_key}</span>
                              {row.metric_value !== null ? `: ${row.metric_value}` : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(row.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
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
                <Select value={createDraft.severity} onValueChange={(v) => setCreateDraft((p) => ({ ...p, severity: v as any }))}>
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
                <Select value={createDraft.status} onValueChange={(v) => setCreateDraft((p) => ({ ...p, status: v as any }))}>
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
                <Select value={createDraft.source} onValueChange={(v) => setCreateDraft((p) => ({ ...p, source: v as any }))}>
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
              <Input
                id="edit-title"
                value={editDraft.title}
                onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                value={editDraft.summary}
                onChange={(e) => setEditDraft((p) => ({ ...p, summary: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={editDraft.severity} onValueChange={(v) => setEditDraft((p) => ({ ...p, severity: v as any }))}>
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
                <Select value={editDraft.status} onValueChange={(v) => setEditDraft((p) => ({ ...p, status: v as any }))}>
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
                <Input
                  id="edit-region"
                  value={editDraft.region}
                  onChange={(e) => setEditDraft((p) => ({ ...p, region: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select value={editDraft.source} onValueChange={(v) => setEditDraft((p) => ({ ...p, source: v as any }))}>
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
                <Input
                  id="edit-metricKey"
                  value={editDraft.metricKey}
                  onChange={(e) => setEditDraft((p) => ({ ...p, metricKey: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-metricValue">Metric value</Label>
                <Input
                  id="edit-metricValue"
                  value={editDraft.metricValue}
                  onChange={(e) => setEditDraft((p) => ({ ...p, metricValue: e.target.value }))}
                />
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
  )
}

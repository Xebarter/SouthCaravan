'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Megaphone, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { serviceCatalogKey } from '@/lib/services-taxonomy'
import {
  ServicesOfferingCatalog,
  type AddOfferingPayload,
} from '@/components/services/services-offering-catalog'
import { OfferingImagesEditor } from '@/components/services/offering-images-editor'

type Offering = {
  id: string
  category: string
  subcategory: string
  title: string
  description: string
  pricing_type: string
  rate: number
  currency: string
  is_active: boolean
  is_featured?: boolean
  is_ad?: boolean
  images?: string[] | null
  created_at: string
}

type PromotionRequest = {
  id: string
  offering_id: string
  kind: 'featured' | 'ad'
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string
  created_at: string
}

export default function ServicesOfferingsPage() {
  const { user } = useAuth()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)
  const [promotionNeedsSetup, setPromotionNeedsSetup] = useState(false)
  const [promotionRequests, setPromotionRequests] = useState<PromotionRequest[]>([])
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoOffering, setPromoOffering] = useState<Offering | null>(null)
  const [promoKind, setPromoKind] = useState<'featured' | 'ad'>('featured')
  const [promoMessage, setPromoMessage] = useState('')
  const [promoSubmitting, setPromoSubmitting] = useState(false)

  const listedKeys = useMemo(() => {
    const s = new Set<string>()
    for (const o of offerings) {
      s.add(serviceCatalogKey(o.category, o.subcategory))
    }
    return s
  }, [offerings])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [offersRes, promosRes] = await Promise.all([
        fetch('/api/services/offerings', { cache: 'no-store' }),
        fetch('/api/services/promotions', { cache: 'no-store' }),
      ])

      const offersJson = await offersRes.json().catch(() => ({}))
      const promosJson = await promosRes.json().catch(() => ({}))

      if (!offersRes.ok) throw new Error(offersJson?.error ?? 'Failed to load offerings')
      if (!promosRes.ok) throw new Error(promosJson?.error ?? 'Failed to load promotions')

      setOfferings(Array.isArray(offersJson?.offerings) ? offersJson.offerings : [])
      setNeedsSetup(Boolean(offersJson?.needsSetup))
      setPromotionRequests(Array.isArray(promosJson?.requests) ? promosJson.requests : [])
      setPromotionNeedsSetup(Boolean(promosJson?.needsSetup))
    } catch (e: any) {
      setError(e?.message || 'Failed to load offerings')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  async function postOffering(payload: AddOfferingPayload) {
    const res = await fetch('/api/services/offerings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error ?? 'Failed to create offering')
  }

  const handleAddBatch = async (rows: AddOfferingPayload[]) => {
    setError('')
    for (const row of rows) {
      await postOffering(row)
    }
    await load()
  }

  async function toggleActive(offering: Offering, next: boolean) {
    setError('')
    setOfferings((prev) => prev.map((o) => (o.id === offering.id ? { ...o, is_active: next } : o)))
    try {
      const res = await fetch(`/api/services/offerings/${encodeURIComponent(offering.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to update offering')
    } catch (e: any) {
      setError(e?.message || 'Failed to update offering')
      setOfferings((prev) =>
        prev.map((o) => (o.id === offering.id ? { ...o, is_active: offering.is_active } : o)),
      )
    }
  }

  async function deleteOffering(offeringId: string) {
    setError('')
    const prev = offerings
    setOfferings((o) => o.filter((x) => x.id !== offeringId))
    try {
      const res = await fetch(`/api/services/offerings/${encodeURIComponent(offeringId)}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to delete offering')
    } catch (e: any) {
      setError(e?.message || 'Failed to delete offering')
      setOfferings(prev)
    }
  }

  if (!user) return null

  const requestByOfferingAndKind = useMemo(() => {
    const m = new Map<string, PromotionRequest>()
    for (const r of promotionRequests) {
      const key = `${r.offering_id}:${r.kind}`
      if (!m.has(key)) m.set(key, r)
    }
    return m
  }, [promotionRequests])

  function openPromotionDialog(offering: Offering, kind: 'featured' | 'ad') {
    setPromoOffering(offering)
    setPromoKind(kind)
    setPromoMessage('')
    setPromoOpen(true)
  }

  async function submitPromotion() {
    if (!promoOffering) return
    setPromoSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/services/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offeringId: promoOffering.id,
          kind: promoKind,
          message: promoMessage,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to submit request')
      await load()
      setPromoOpen(false)
      setPromoOffering(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to submit request')
    } finally {
      setPromoSubmitting(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Your service catalogue</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Choose from SouthCaravan’s standard service list so buyers can find you quickly. List many services at
          once, then tune pricing and details anytime.
        </p>
      </div>

      {needsSetup ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Enable the services database to save listings: run the SQL in{' '}
          <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">supabase/services.sql</code> in your
          Supabase project.
        </div>
      ) : null}

      {promotionNeedsSetup ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Promotion requests (Featured / Ads) are not enabled yet. After you run{' '}
          <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">supabase/services.sql</code>, you’ll be
          able to request Featured or Ad placement for any listing.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <ServicesOfferingCatalog
        listedKeys={listedKeys}
        needsSetup={needsSetup}
        disabled={loading}
        onAddBatch={handleAddBatch}
      />

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Live listings</h2>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${offerings.length} on your public profile`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground rounded-xl border border-border/60 border-dashed">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your listings…</span>
          </div>
        ) : offerings.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-14 text-center">
            <p className="text-sm font-semibold">No live listings yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Use the catalogue above to add your first services. They’ll appear here instantly after you confirm
              pricing.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {offerings.map((o) => (
              <Card key={o.id} className="border-border/60 shadow-sm">
                <CardContent className="py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground leading-snug">{o.title}</p>
                      <Badge variant="secondary" className="text-[10px] font-medium">
                        {o.category}
                      </Badge>
                      {o.is_featured ? (
                        <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20">
                          Featured
                        </Badge>
                      ) : null}
                      {o.is_ad ? (
                        <Badge className="text-[10px] bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
                          Ad
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{o.subcategory}</p>
                    {o.description ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{o.description}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground pt-1 tabular-nums">
                      <span className="font-medium text-foreground">
                        {o.pricing_type === 'hourly' ? 'Hourly' : 'Fixed'}
                      </span>
                      {' · '}
                      {o.currency} {Number(o.rate ?? 0).toLocaleString()}
                    </p>
                    <OfferingImagesEditor
                      offeringId={o.id}
                      images={o.images ?? undefined}
                      disabled={loading}
                      needsSetup={needsSetup}
                      onUpdated={() => void load()}
                      onError={(message) => setError(message)}
                    />
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end sm:shrink-0 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const featuredReq = requestByOfferingAndKind.get(`${o.id}:featured`)
                        const adReq = requestByOfferingAndKind.get(`${o.id}:ad`)

                        const pendingFeatured = featuredReq?.status === 'pending'
                        const pendingAd = adReq?.status === 'pending'

                        return (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={needsSetup || promotionNeedsSetup || pendingFeatured}
                              onClick={() => openPromotionDialog(o, 'featured')}
                            >
                              <Sparkles className="h-4 w-4" />
                              {pendingFeatured ? 'Featured requested' : 'Request featured'}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={needsSetup || promotionNeedsSetup || pendingAd}
                              onClick={() => openPromotionDialog(o, 'ad')}
                            >
                              <Megaphone className="h-4 w-4" />
                              {pendingAd ? 'Ad requested' : 'Request ad'}
                            </Button>
                          </div>
                        )
                      })()}
                    </div>
                    <div className={cn('flex items-center gap-2')}>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Visible</span>
                      <Switch
                        checked={Boolean(o.is_active)}
                        onCheckedChange={(v) => void toggleActive(o, v)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => void deleteOffering(o.id)}
                      aria-label="Remove listing"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!promoSubmitting}>
          <DialogHeader>
            <DialogTitle>
              Request {promoKind === 'featured' ? 'Featured' : 'Ad'} placement
            </DialogTitle>
            <DialogDescription>
              Your request goes to the Admin dashboard for review. You can include a short note to help the team
              prioritize.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
            <p className="font-medium text-foreground truncate">{promoOffering?.title ?? ''}</p>
            <p className="text-xs text-muted-foreground truncate">{promoOffering?.category ?? ''}</p>
          </div>

          <div className="space-y-2">
            <Textarea
              value={promoMessage}
              onChange={(e) => setPromoMessage(e.target.value)}
              placeholder="Optional note. Example: “We can deliver nationwide within 48h” or “Running a Q2 promo”."
              disabled={promoSubmitting}
              className="min-h-24 resize-y"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: Keep it short—admins will see this alongside performance and catalogue fit.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoOpen(false)} disabled={promoSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void submitPromotion()} disabled={promoSubmitting || !promoOffering}>
              {promoSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

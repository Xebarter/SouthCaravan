'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Search, Sparkles } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DEFAULT_SERVICES_TAXONOMY,
  filterTaxonomy,
  serviceCatalogKey,
  type ServiceTaxonomySection,
} from '@/lib/services-taxonomy'
import { cn } from '@/lib/utils'

type CatalogPick = { category: string; item: string }

export type AddOfferingPayload = {
  category: string
  subcategory: string
  title: string
  description: string
  pricing_type: 'fixed' | 'hourly'
  rate: number
  currency: string
  is_active: boolean
}

type Props = {
  listedKeys: Set<string>
  disabled?: boolean
  needsSetup?: boolean
  onAddBatch: (rows: AddOfferingPayload[]) => Promise<void>
}

function togglePick(
  prev: Map<string, CatalogPick>,
  category: string,
  item: string,
  listedKeys: Set<string>,
): Map<string, CatalogPick> {
  const key = serviceCatalogKey(category, item)
  if (listedKeys.has(key)) return prev
  const next = new Map(prev)
  if (next.has(key)) next.delete(key)
  else next.set(key, { category, item })
  return next
}

export function ServicesOfferingCatalog({
  listedKeys,
  disabled,
  needsSetup,
  onAddBatch,
}: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(
    DEFAULT_SERVICES_TAXONOMY[0]?.title ?? '',
  )
  const [picked, setPicked] = useState<Map<string, CatalogPick>>(() => new Map())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly'>('fixed')
  const [rate, setRate] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const filteredSections = useMemo(
    () => filterTaxonomy(DEFAULT_SERVICES_TAXONOMY, search),
    [search],
  )

  const visibleSections: ServiceTaxonomySection[] = useMemo(() => {
    if (search.trim()) return filteredSections
    const one = DEFAULT_SERVICES_TAXONOMY.find((s) => s.title === activeCategory)
    return one ? [one] : DEFAULT_SERVICES_TAXONOMY
  }, [search, filteredSections, activeCategory])

  const categoryCounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    const map = new Map<string, number>()
    for (const s of DEFAULT_SERVICES_TAXONOMY) {
      const items =
        q.length === 0
          ? s.items
          : s.items.filter(
              (item) =>
                item.toLowerCase().includes(q) || s.title.toLowerCase().includes(q),
            )
      map.set(s.title, items.length)
    }
    return map
  }, [search])

  const pickedList = useMemo(() => [...picked.values()], [picked])

  async function handleConfirmAdd() {
    setError('')
    const rateNum = rate.trim() === '' ? 0 : Number(rate)
    if (Number.isNaN(rateNum) || rateNum < 0) {
      setError('Enter a valid rate (0 is allowed for “contact for quote”).')
      return
    }
    if (pickedList.length === 0) return

    const rows: AddOfferingPayload[] = pickedList.map((p) => ({
      category: p.category,
      subcategory: p.item,
      title: p.item,
      description: description.trim(),
      pricing_type: pricingType,
      rate: rateNum,
      currency: currency.trim() || 'USD',
      is_active: true,
    }))

    setSubmitting(true)
    try {
      await onAddBatch(rows)
      setPicked(new Map())
      setDialogOpen(false)
      setDescription('')
      setRate('')
    } catch (e: any) {
      setError(e?.message || 'Could not add services.')
    } finally {
      setSubmitting(false)
    }
  }

  const pickerDisabled = Boolean(disabled || needsSetup)

  return (
    <>
      <Card className="border-border/60 overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/60 bg-linear-to-br from-primary/6 via-background to-background pb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                Pick from the marketplace catalogue
              </CardTitle>
              <CardDescription className="text-sm max-w-2xl">
                Tap the services you provide — you can add many at once, then set one price style for the batch.
                Everything stays aligned with buyer search and RFQ filters.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0 font-medium">
              {DEFAULT_SERVICES_TAXONOMY.length} categories ·{' '}
              {DEFAULT_SERVICES_TAXONOMY.reduce((n, s) => n + s.items.length, 0)} services
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-[minmax(0,240px)_1fr] xl:grid-cols-[minmax(0,260px)_1fr]">
            {/* Category rail */}
            <div className="border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20">
              <div className="p-3 lg:p-4 space-y-2">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Categories
                </Label>
                <ScrollArea className="h-[220px] lg:h-[min(28rem,52vh)] pr-3">
                  <div className="space-y-1">
                    {DEFAULT_SERVICES_TAXONOMY.map((s) => {
                      const count = categoryCounts.get(s.title) ?? 0
                      const isActive = !search.trim() && activeCategory === s.title
                      return (
                        <button
                          key={s.title}
                          type="button"
                          disabled={pickerDisabled || count === 0}
                          onClick={() => {
                            setActiveCategory(s.title)
                            setSearch('')
                          }}
                          className={cn(
                            'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                            'hover:bg-background disabled:opacity-40 disabled:pointer-events-none',
                            isActive
                              ? 'bg-background shadow-sm ring-1 ring-border font-medium'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span className="line-clamp-2">{s.title}</span>
                          <span className="mt-0.5 block text-[11px] tabular-nums text-muted-foreground">
                            {count} services
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Service grid */}
            <div className="flex flex-col min-h-[320px] lg:min-h-[min(28rem,52vh)]">
              <div className="p-3 sm:p-4 border-b border-border/60 space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search all services… e.g. payroll, HVAC, customs"
                    className="pl-9 h-10 rounded-lg bg-background"
                    disabled={pickerDisabled}
                    aria-label="Search services"
                  />
                </div>
                {search.trim() ? (
                  <p className="text-xs text-muted-foreground">
                    Showing matches across every category. Clear the search to browse one category at a time.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Browsing <span className="font-medium text-foreground">{activeCategory}</span>.
                    Use search to jump anywhere instantly.
                  </p>
                )}
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 sm:p-4 space-y-6">
                  {visibleSections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                      No services match “{search.trim()}”. Try a shorter keyword.
                    </p>
                  ) : (
                    visibleSections.map((section) => (
                      <div key={section.title} className="space-y-3">
                        {search.trim() ? (
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {section.title}
                            </h3>
                            <Badge variant="outline" className="text-[10px] tabular-nums">
                              {section.items.length}
                            </Badge>
                          </div>
                        ) : null}
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {section.items.map((item) => {
                            const key = serviceCatalogKey(section.title, item)
                            const listed = listedKeys.has(key)
                            const selected = picked.has(key)
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={pickerDisabled || listed}
                                onClick={() =>
                                  setPicked((prev) =>
                                    togglePick(prev, section.title, item, listedKeys),
                                  )
                                }
                                className={cn(
                                  'group relative flex min-h-13 items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all',
                                  'hover:border-primary/40 hover:bg-primary/3',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                                  selected &&
                                    'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/25',
                                  listed &&
                                    'opacity-60 cursor-not-allowed hover:bg-transparent hover:border-border',
                                )}
                              >
                                <span
                                  className={cn(
                                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                                    selected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-border bg-background text-transparent group-hover:border-primary/30',
                                  )}
                                  aria-hidden
                                >
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="min-w-0 flex-1 leading-snug">{item}</span>
                                {listed ? (
                                  <Badge
                                    variant="secondary"
                                    className="absolute right-2 top-2 text-[10px] font-semibold"
                                  >
                                    Live
                                  </Badge>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                        {search.trim() ? <Separator className="opacity-60" /> : null}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Selection bar */}
              <div className="border-t border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {pickedList.length === 0
                      ? 'No services selected'
                      : `${pickedList.length} selected`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {pickedList.length === 0
                      ? 'Tap services above to build your list in seconds.'
                      : 'Set pricing once — we’ll create a listing for each selected service.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pickerDisabled || pickedList.length === 0}
                    onClick={() => setPicked(new Map())}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pickerDisabled || pickedList.length === 0}
                    onClick={() => {
                      setError('')
                      setDialogOpen(true)
                    }}
                    className="gap-1.5"
                  >
                    Set price &amp; add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={!submitting}>
          <DialogHeader>
            <DialogTitle>Add {pickedList.length} service{pickedList.length === 1 ? '' : 's'}</DialogTitle>
            <DialogDescription>
              Same pricing applies to each selected listing. You can edit individual listings afterward.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <ScrollArea className="max-h-40 rounded-md border border-border/60">
            <ul className="p-2 text-sm space-y-1">
              {pickedList.map((p) => (
                <li
                  key={serviceCatalogKey(p.category, p.item)}
                  className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted/50"
                >
                  <span className="text-foreground font-medium">{p.item}</span>
                  <span className="text-xs block truncate">{p.category}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Pricing</Label>
              <Select
                value={pricingType}
                onValueChange={(v) => setPricingType(v as 'fixed' | 'hourly')}
                disabled={submitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed project / package</SelectItem>
                  <SelectItem value="hourly">Hourly rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>
                {pricingType === 'hourly' ? 'Rate per hour' : 'Starting from (optional)'}
              </Label>
              <Input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                inputMode="decimal"
                placeholder={pricingType === 'hourly' ? 'e.g. 45' : 'e.g. 500 or 0 for quote'}
                disabled={submitting}
              />
              <p className="text-[11px] text-muted-foreground">
                Use 0 if you prefer buyers to request a quote.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Note for buyers (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Typical turnaround, what you need to start, regions you cover…"
                disabled={submitting}
                className="min-h-[88px] resize-y"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleConfirmAdd()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                `Add ${pickedList.length} listing${pickedList.length === 1 ? '' : 's'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

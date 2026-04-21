'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import {
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Store,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Money } from '@/components/money';
import {
  clearRfqDraft,
  loadRfqDraft,
  type RfqDraftLine,
  saveRfqDraft,
  setDraftLine,
  upsertDraftLine,
} from '@/lib/rfq-draft';

type CatalogHit = {
  id: string;
  name: string;
  price: number;
  minimum_order: number;
  unit: string;
  images: string[] | null;
  vendor_id: string;
  in_stock: boolean;
};

type ApiRfq = {
  id: string;
  buyer_id: string;
  title: string;
  notes: string;
  status: string;
  valid_until: string | null;
  created_at: string;
  quotes_summary: {
    total: number;
    pending_vendor: number;
    awaiting_buyer: number;
    accepted: number;
  };
};

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function BuyerQuotesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rfqs, setRfqs] = useState<ApiRfq[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [draftLines, setDraftLines] = useState<RfqDraftLine[]>([]);

  const [searchQ, setSearchQ] = useState('');
  const debouncedQ = useDebounced(searchQ, 320);
  const [searchHits, setSearchHits] = useState<CatalogHit[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);

  const refreshRfqs = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    setLoadingList(true);
    try {
      const res = await fetch('/api/buyer/rfqs', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) return;
      setRfqs(Array.isArray(json?.rfqs) ? json.rfqs : []);
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshRfqs();
  }, [refreshRfqs]);

  useEffect(() => {
    setDraftLines(loadRfqDraft());
  }, [createOpen]);

  const consumeUrlPrefill = useCallback(async () => {
    const add = searchParams.get('add')?.trim() ?? '';
    const qtyRaw = searchParams.get('qty') ?? '1';
    if (!add || !user || user.role !== 'buyer') return;

    const qty = Math.max(1, Math.floor(Number(qtyRaw) || 1));
    try {
      const res = await fetch(`/api/buyer/product-for-rfq?id=${encodeURIComponent(add)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      const exact = json?.product as CatalogHit | undefined;
      if (exact) {
        const min = Math.max(1, Number(exact.minimum_order) || 1);
        const line: RfqDraftLine = {
          productId: exact.id,
          name: exact.name,
          quantity: Math.max(min, qty),
          targetUnitPrice: null,
          image: exact.images?.[0],
          unit: exact.unit,
          minimumOrder: min,
          listPrice: Number(exact.price) || 0,
        };
        setDraftLine(line);
        setDraftLines(loadRfqDraft());
        setCreateOpen(true);
      }
    } finally {
      router.replace('/buyer/quotes', { scroll: false });
    }
  }, [searchParams, user, router]);

  useEffect(() => {
    void consumeUrlPrefill();
  }, [consumeUrlPrefill]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (debouncedQ.trim().length < 2) {
        setSearchHits([]);
        return;
      }
      setSearchBusy(true);
      try {
        const res = await fetch(
          `/api/buyer/catalog-search?q=${encodeURIComponent(debouncedQ.trim())}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok) {
          setSearchHits(Array.isArray(json?.products) ? json.products : []);
        }
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  const persistDraft = (next: RfqDraftLine[]) => {
    setDraftLines(next);
    saveRfqDraft(next);
  };

  const stats = useMemo(() => {
    const total = rfqs.length;
    const needVendor = rfqs.reduce((s, r) => s + (r.quotes_summary?.pending_vendor ?? 0), 0);
    const needYou = rfqs.reduce((s, r) => s + (r.quotes_summary?.awaiting_buyer ?? 0), 0);
    const accepted = rfqs.reduce((s, r) => s + (r.quotes_summary?.accepted ?? 0), 0);
    return { total, needVendor, needYou, accepted };
  }, [rfqs]);

  async function handleSubmitRfq() {
    setCreateError(null);
    if (draftLines.length === 0) {
      setCreateError('Add at least one product from the catalog.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim() || undefined,
        notes: notes.trim(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        items: draftLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          targetUnitPrice: l.targetUnitPrice,
          lineNotes: '',
        })),
      };
      const res = await fetch('/api/buyer/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateError(json?.error || 'Could not send RFQ.');
        return;
      }
      clearRfqDraft();
      setDraftLines([]);
      setTitle('');
      setNotes('');
      setValidUntil('');
      setSearchQ('');
      setSearchHits([]);
      setCreateOpen(false);
      await refreshRfqs();
    } finally {
      setSubmitting(false);
    }
  }

  function addHitToDraft(hit: CatalogHit) {
    const min = Math.max(1, Number(hit.minimum_order) || 1);
    const line: RfqDraftLine = {
      productId: hit.id,
      name: hit.name,
      quantity: min,
      targetUnitPrice: null,
      image: hit.images?.[0],
      unit: hit.unit,
      minimumOrder: min,
      listPrice: Number(hit.price) || 0,
    };
    persistDraft(upsertDraftLine(line));
    setSearchQ('');
    setSearchHits([]);
  }

  if (!user || user.role !== 'buyer') {
    return (
      <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/30">
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
          Sign in as a buyer to manage RFQs.
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Marketplace RFQs</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Quote requests</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Select products from the catalog—only vendors who actually list those SKUs receive your request. Each vendor
              gets their own quote to fill in, so pricing stays scoped to what they sell.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                New RFQ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Create RFQ
                </DialogTitle>
                <DialogDescription>
                  Search products, set quantities, and optionally add a target price. We route each line to the correct vendor
                  automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="rfq-title">Title (optional)</Label>
                  <Input
                    id="rfq-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Q2 packaging restock"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rfq-notes">Notes to vendors</Label>
                  <Textarea
                    id="rfq-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery window, specs, incoterms…"
                    className="rounded-xl min-h-[88px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rfq-valid">Responses needed by (optional)</Label>
                  <Input
                    id="rfq-valid"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="rounded-xl max-w-[240px]"
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60">
                  <div className="p-4 border-b border-border/70">
                    <Label className="text-sm font-medium">Add catalog products</Label>
                    <p className="text-xs text-muted-foreground mt-1">Type at least two letters to search active vendor listings.</p>
                    <div className="relative mt-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Search by product name…"
                        className="rounded-xl pl-9"
                      />
                      {searchBusy ? (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                    {searchHits.length > 0 ? (
                      <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-border/60 bg-background divide-y divide-border/50">
                        {searchHits.map((hit) => (
                          <li key={hit.id}>
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-accent/50 transition-colors"
                              onClick={() => addHitToDraft(hit)}
                            >
                              <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                                {hit.images?.[0] ? (
                                  <Image src={hit.images[0]} alt="" fill className="object-cover" sizes="44px" />
                                ) : (
                                  <Store className="w-5 h-5 m-auto text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{hit.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  <Money amount={Number(hit.price)} /> · MOQ {hit.minimum_order} {hit.unit}
                                  {!hit.in_stock ? ' · low availability' : ''}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 shrink-0 text-primary" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="p-4 space-y-3">
                    {draftLines.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">Your RFQ basket is empty.</p>
                    ) : (
                      draftLines.map((line, idx) => (
                        <div
                          key={line.productId}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-xl border border-border/60 p-3 bg-background/60"
                        >
                          <div className="sm:col-span-6 flex gap-3 min-w-0">
                            <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                              {line.image ? (
                                <Image src={line.image} alt="" fill className="object-cover" sizes="56px" />
                              ) : (
                                <Store className="w-6 h-6 m-auto text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug line-clamp-2">{line.name}</p>
                              {line.listPrice != null ? (
                                <p className="text-xs text-muted-foreground mt-1">
                                  List <Money amount={line.listPrice} /> / {line.unit ?? 'unit'}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="sm:col-span-3">
                            <Label className="text-xs text-muted-foreground">Qty ({line.unit ?? 'units'})</Label>
                            <Input
                              inputMode="numeric"
                              className="rounded-xl mt-1"
                              value={String(line.quantity)}
                              onChange={(e) => {
                                const n = Math.max(line.minimumOrder ?? 1, Math.floor(Number(e.target.value) || 1));
                                const next = draftLines.map((l, i) => (i === idx ? { ...l, quantity: n } : l));
                                persistDraft(next);
                              }}
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <Label className="text-xs text-muted-foreground">Target / unit (optional)</Label>
                            <Input
                              inputMode="decimal"
                              className="rounded-xl mt-1"
                              value={line.targetUnitPrice == null ? '' : String(line.targetUnitPrice)}
                              onChange={(e) => {
                                const raw = e.target.value.trim();
                                const next = draftLines.map((l, i) =>
                                  i === idx
                                    ? {
                                        ...l,
                                        targetUnitPrice: raw === '' ? null : Number(raw),
                                      }
                                    : l,
                                );
                                persistDraft(next);
                              }}
                              placeholder="List price used if empty"
                            />
                          </div>
                          <div className="sm:col-span-12 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => persistDraft(draftLines.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setCreateOpen(false)}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    className="rounded-2xl gap-2"
                    disabled={submitting || draftLines.length === 0}
                    onClick={() => void handleSubmitRfq()}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send to vendors
                      </>
                    )}
                  </Button>
                </div>

                {createError ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {createError}
                  </div>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'RFQs', value: stats.total, icon: ClipboardList },
            { label: 'Awaiting vendor', value: stats.needVendor, icon: Clock },
            { label: 'Ready for you', value: stats.needYou, icon: UserCheck },
            { label: 'Accepted offers', value: stats.accepted, icon: Sparkles },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium tracking-wide">
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{loadingList ? '—' : s.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Your RFQs
            </CardTitle>
            <CardDescription>Track every vendor response in one place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingList ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">Loading…</div>
            ) : rfqs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 text-center space-y-3">
                <p className="text-sm text-muted-foreground">You have not posted an RFQ yet.</p>
                <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Start an RFQ
                </Button>
              </div>
            ) : (
              rfqs.map((r) => {
                const created = new Date(r.created_at);
                const sum = r.quotes_summary;
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-border/60 bg-card/50 p-4 hover:bg-accent/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="font-medium truncate">{r.title || `RFQ #${formatShortId(r.id)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {created.toLocaleDateString()} · {sum.total} vendor{sum.total === 1 ? '' : 's'} notified
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {sum.pending_vendor > 0 ? (
                            <Badge variant="outline" className="rounded-full border-amber-500/30 text-amber-700 dark:text-amber-400">
                              <Clock className="w-3 h-3 mr-1" />
                              {sum.pending_vendor} pending vendor
                            </Badge>
                          ) : null}
                          {sum.awaiting_buyer > 0 ? (
                            <Badge variant="outline" className="rounded-full border-sky-500/30 text-sky-700 dark:text-sky-400">
                              <UserCheck className="w-3 h-3 mr-1" />
                              {sum.awaiting_buyer} need your decision
                            </Badge>
                          ) : null}
                          {sum.accepted > 0 ? (
                            <Badge variant="outline" className="rounded-full border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                              {sum.accepted} accepted
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/buyer/rfqs/${r.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            Open workspace
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

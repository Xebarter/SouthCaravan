'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Building2, CheckCircle2, Clock, Loader2, Send, Store, Tag } from 'lucide-react';

type LineState = { id: string; product_id: string | null; quantity: number; unit_price: number; subtotal: number };

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function statusMeta(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return { label: 'Needs action', className: 'border-amber-500/40 text-amber-700 dark:text-amber-400' };
  if (s === 'awaiting_buyer') return { label: 'Sent to buyer', className: 'border-sky-500/40 text-sky-700 dark:text-sky-400' };
  if (s === 'accepted') return { label: 'Accepted', className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400' };
  if (s === 'rejected') return { label: 'Declined', className: 'border-red-500/40 text-red-600 dark:text-red-400' };
  return { label: String(status || '—'), className: 'border-border text-muted-foreground' };
}

export default function AdminQuoteEditorPage() {
  const routeParams = useParams();
  const quoteId = typeof routeParams?.id === 'string' ? routeParams.id : '';
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<any | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [vendorMessage, setVendorMessage] = useState('');
  const [productsById, setProductsById] = useState<Record<string, any>>({});
  const [rfq, setRfq] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || user.role !== 'admin' || !quoteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${encodeURIComponent(quoteId)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setQuote(null);
        setError(json?.error || 'Could not load quote');
        return;
      }
      setQuote(json.quote);
      setLines(
        (Array.isArray(json.items) ? json.items : []).map((it: any) => ({
          id: String(it.id),
          product_id: it.product_id ? String(it.product_id) : null,
          quantity: Number(it.quantity ?? 1),
          unit_price: Number(it.unit_price ?? 0),
          subtotal: Number(it.subtotal ?? 0),
        })),
      );
      setVendorMessage(String(json.quote?.vendor_message ?? ''));
      const map: Record<string, any> = {};
      for (const p of Array.isArray(json.products) ? json.products : []) {
        if (p?.id) map[String(p.id)] = p;
      }
      setProductsById(map);
      setRfq(json.rfq ?? null);
    } finally {
      setLoading(false);
    }
  }, [quoteId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPreview = useMemo(() => {
    return lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  }, [lines]);

  const editable = quote && String(quote.status) === 'pending';
  const meta = statusMeta(quote?.status);

  async function save(submit: boolean) {
    if (!quote || !quoteId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/quotes/${encodeURIComponent(quoteId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorMessage,
          submit,
          lineItems: lines.map((l) => ({ id: l.id, unitPrice: l.unit_price })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || 'Save failed');
        return;
      }
      await load();
      if (submit) {
        router.push('/admin/quotes');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== 'admin') {
    return <div className="px-4 py-12 text-center text-muted-foreground text-sm">Admin sign-in required.</div>;
  }

  if (!quoteId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Invalid quote link.</p>
        <Link href="/admin/quotes">
          <Button variant="outline" className="rounded-xl">
            Back
          </Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">{error || 'Quote not found.'}</p>
        <Link href="/admin/quotes">
          <Button variant="outline" className="rounded-xl">
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All platform RFQs
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Quote response</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Review buyer requirements, adjust pricing, and send your quote.
            </p>
          </div>
          <Badge variant="outline" className={`rounded-full capitalize h-fit ${meta.className}`}>
            {meta.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          List prices are pre-filled from the catalog. Update pricing for this RFQ, then send it to the buyer.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          {rfq ? (
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  {rfq.title || 'Buyer RFQ'}
                </CardTitle>
                {rfq.notes ? <CardDescription className="whitespace-pre-wrap">{rfq.notes}</CardDescription> : null}
              </CardHeader>
              {Array.isArray(rfq.items) && rfq.items.length > 0 ? (
                <CardContent className="pt-0 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-sm">Buyer line notes</p>
                  {rfq.items.map((it: any) => (
                    <p key={it.id}>
                      SKU {String(it.product_id).slice(0, 8)}… qty {it.quantity}
                      {it.buyer_target_unit_price != null ? (
                        <>
                          {' '}
                          · target <Money amount={Number(it.buyer_target_unit_price)} />
                        </>
                      ) : null}
                      {it.line_notes ? ` — ${it.line_notes}` : ''}
                    </p>
                  ))}
                </CardContent>
              ) : null}
            </Card>
          ) : null}

          <Card className="rounded-2xl border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Line items</CardTitle>
              <CardDescription>Quantity is fixed from the buyer request — adjust your offer price.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lines.map((line) => {
                const p = line.product_id ? productsById[line.product_id] : null;
                return (
                  <div key={line.id} className="rounded-xl border border-border/60 p-3 space-y-3 bg-card/40">
                    <div className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                        {p?.images?.[0] ? (
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="56px" />
                        ) : (
                          <Store className="w-6 h-6 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{p?.name ?? 'Product'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Qty {line.quantity} {p?.unit ? `· ${p.unit}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Your price / unit</Label>
                        <Input
                          className="rounded-xl mt-1"
                          inputMode="decimal"
                          disabled={!editable}
                          value={String(line.unit_price)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const n = Number(raw);
                            const unitPrice = Number.isFinite(n) ? n : 0;
                            const next = lines.map((l) =>
                              l.id === line.id
                                ? {
                                    ...l,
                                    unit_price: unitPrice,
                                    subtotal: l.quantity * unitPrice,
                                  }
                                : l,
                            );
                            setLines(next);
                          }}
                        />
                      </div>
                      <div className="flex items-end">
                        <p className="text-sm pb-2 text-muted-foreground">
                          Line total{' '}
                          <span className="font-semibold text-foreground">
                            <Money amount={line.quantity * line.unit_price} />
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label htmlFor="vm">Message to buyer (optional)</Label>
                <Textarea
                  id="vm"
                  className="rounded-xl min-h-[100px]"
                  disabled={!editable}
                  value={vendorMessage}
                  onChange={(e) => setVendorMessage(e.target.value)}
                  placeholder="Lead time, incoterms, MOQ exceptions…"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <Card className="rounded-2xl border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quote summary</CardTitle>
              <CardDescription>What the buyer will see</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Quote ID
                  </span>
                  <span className="font-medium">#{formatShortId(String(quote.id || quoteId))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Created
                  </span>
                  <span className="font-medium">{quote?.created_at ? new Date(quote.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Buyer</span>
                  <span className="font-medium">{formatShortId(String(quote?.buyer_id || ''))}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">Quote total</p>
                <p className="text-2xl font-semibold mt-1">
                  <Money amount={totalPreview} />
                </p>
              </div>

              {editable ? (
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={saving}
                    onClick={() => void save(false)}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save draft'}
                  </Button>
                  <Button type="button" className="rounded-xl gap-2" disabled={saving} onClick={() => void save(true)}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send quote to buyer
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                  {quote.status === 'awaiting_buyer'
                    ? 'This quote is with the buyer. Status updates when they decide.'
                    : 'This quote is closed.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

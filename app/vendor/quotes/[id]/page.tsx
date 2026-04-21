'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Building2, CheckCircle2, Loader2, Send, Store } from 'lucide-react';

type LineState = { id: string; product_id: string | null; quantity: number; unit_price: number; subtotal: number };

export default function VendorQuoteEditorPage({ params }: { params: { id: string } }) {
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
    if (!user || user.role !== 'vendor') return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/quotes/${encodeURIComponent(params.id)}`, { cache: 'no-store' });
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
  }, [params.id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPreview = useMemo(() => {
    return lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  }, [lines]);

  const editable = quote && String(quote.status) === 'pending';

  async function save(submit: boolean) {
    if (!quote) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/quotes/${encodeURIComponent(params.id)}`, {
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
        router.push('/vendor/quotes');
      }
    } finally {
      setSaving(false);
    }
  }

  if (!user || user.role !== 'vendor') {
    return <div className="px-4 py-12 text-center text-muted-foreground text-sm">Vendor sign-in required.</div>;
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
        <Link href="/vendor/quotes">
          <Button variant="outline" className="rounded-xl">
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/vendor/quotes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All requests
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Respond to buyer</h1>
        <p className="text-sm text-muted-foreground mt-2">
          List prices are pre-filled from the catalog. Update anything that should change for this order.
        </p>
      </div>

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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Line items</CardTitle>
            <CardDescription>Quantity is fixed from the buyer request — adjust your offer price.</CardDescription>
          </div>
          <Badge variant="outline" className="rounded-full capitalize">
            {String(quote.status).replace(/_/g, ' ')}
          </Badge>
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
                        const n = Number(e.target.value);
                        const next = lines.map((l) =>
                          l.id === line.id
                            ? {
                                ...l,
                                unit_price: Number.isFinite(n) ? n : 0,
                                subtotal: l.quantity * (Number.isFinite(n) ? n : 0),
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

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <p className="text-lg font-semibold">
              Quote total <Money amount={totalPreview} />
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vm">Message to buyer (optional)</Label>
            <Textarea
              id="vm"
              className="rounded-xl min-h-[88px]"
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

          {editable ? (
            <div className="flex flex-wrap gap-2 justify-end">
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
                ? 'This quote is with the buyer. You will see status updates here when they decide.'
                : 'This quote is closed.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

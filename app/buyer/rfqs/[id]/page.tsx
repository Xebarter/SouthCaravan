'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';

type ProductRow = {
  id: string;
  name: string;
  images?: string[] | null;
};

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function statusBadge(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending')
    return { label: 'Vendor preparing', className: 'border-amber-500/40 text-amber-700 dark:text-amber-400', icon: Clock };
  if (s === 'awaiting_buyer')
    return { label: 'Ready — your decision', className: 'border-sky-500/40 text-sky-700 dark:text-sky-400', icon: CheckCircle2 };
  if (s === 'accepted')
    return { label: 'Accepted', className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 };
  if (s === 'rejected')
    return { label: 'Declined', className: 'border-red-500/40 text-red-600 dark:text-red-400', icon: XCircle };
  return { label: status, className: 'border-border text-muted-foreground', icon: Clock };
}

export default function BuyerRfqWorkspacePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== 'buyer') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/buyer/rfqs/${encodeURIComponent(params.id)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setData(null);
        return;
      }
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [params.id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const productsById = useMemo(() => {
    const map: Record<string, ProductRow> = {};
    const rows = Array.isArray(data?.products) ? data.products : [];
    for (const p of rows) {
      if (p?.id) map[String(p.id)] = p;
    }
    return map;
  }, [data]);

  async function respondQuote(quoteId: string, status: 'accepted' | 'rejected') {
    setBusyId(quoteId);
    try {
      const res = await fetch(`/api/buyer/quotes/${encodeURIComponent(quoteId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  }

  async function cancelRfq() {
    if (!confirm('Cancel this RFQ and remove all related vendor quotes?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/buyer/rfqs/${encodeURIComponent(params.id)}`, { method: 'DELETE' });
      if (res.ok) router.push('/buyer/quotes');
    } finally {
      setCancelling(false);
    }
  }

  if (!user || user.role !== 'buyer') {
    return (
      <div className="container max-w-3xl px-4 py-16 text-center text-muted-foreground">Buyer sign-in required.</div>
    );
  }

  if (loading) {
    return (
      <div className="container max-w-5xl px-4 py-16 flex justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data?.rfq) {
    return (
      <div className="container max-w-3xl px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">RFQ not found.</p>
        <Link href="/buyer/quotes">
          <Button variant="outline" className="rounded-xl">
            Back to quotes
          </Button>
        </Link>
      </div>
    );
  }

  const rfq = data.rfq;
  const rfqItems = Array.isArray(data.rfq_items) ? data.rfq_items : [];
  const quotes = Array.isArray(data.quotes) ? data.quotes : [];
  const hasAccepted = quotes.some((q: any) => q.status === 'accepted');

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <Link
              href="/buyer/quotes"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All RFQs
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
              {rfq.title || `RFQ #${formatShortId(rfq.id)}`}
            </h1>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(rfq.created_at).toLocaleDateString()}
              </span>
              {rfq.valid_until ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Respond by {new Date(rfq.valid_until).toLocaleDateString()}
                </span>
              ) : null}
            </div>
            {rfq.notes ? <p className="text-sm text-foreground/90 max-w-3xl whitespace-pre-wrap">{rfq.notes}</p> : null}
          </div>
          {!hasAccepted ? (
            <Button
              variant="outline"
              className="rounded-xl text-destructive border-destructive/30 shrink-0"
              disabled={cancelling}
              onClick={() => void cancelRfq()}
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Cancel RFQ
            </Button>
          ) : null}
        </div>

        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">What you requested</CardTitle>
            <CardDescription>Every line was matched to the vendor who lists that product.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rfqItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items.</p>
            ) : (
              rfqItems.map((it: any) => {
                const p = it.product_id ? productsById[String(it.product_id)] : null;
                return (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 p-3 bg-card/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                        {p?.images?.[0] ? (
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <Building2 className="w-5 h-5 m-auto text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p?.name ?? formatShortId(it.product_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {it.quantity}
                          {it.buyer_target_unit_price != null ? (
                            <>
                              {' '}
                              · Target <Money amount={Number(it.buyer_target_unit_price)} /> / unit
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Vendor responses</h2>
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendor quotes yet.</p>
          ) : (
            quotes.map((q: any) => {
              const meta = statusBadge(q.status);
              const Icon = meta.icon;
              const v = q.vendor ?? {};
              const displayName = v.company_name?.trim() || v.name?.trim() || `Vendor ${formatShortId(q.vendor_user_id)}`;
              const items = Array.isArray(q.items) ? q.items : [];
              return (
                <Card key={q.id} className="rounded-2xl border-border/70 overflow-hidden">
                  <CardHeader className="pb-2 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          {displayName}
                        </CardTitle>
                        <CardDescription className="mt-1">Quote #{formatShortId(q.id)}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`rounded-full w-fit gap-1.5 ${meta.className}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </Badge>
                    </div>
                    {q.vendor_message ? (
                      <p className="text-sm bg-muted/40 rounded-xl px-3 py-2 border border-border/50 whitespace-pre-wrap">
                        {q.vendor_message}
                      </p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {items.map((it: any) => {
                        const p = it.product_id ? productsById[String(it.product_id)] : null;
                        return (
                          <div
                            key={it.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 text-sm border-b border-border/40 pb-2 last:border-0"
                          >
                            <span className="min-w-0 truncate">{p?.name ?? 'Item'}</span>
                            <span className="text-muted-foreground shrink-0">
                              {it.quantity} × <Money amount={Number(it.unit_price ?? 0)} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-lg font-semibold">
                        Total <Money amount={Number(q.total_amount ?? 0)} />
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {q.status === 'awaiting_buyer' ? (
                          <>
                            <Button
                              size="sm"
                              className="rounded-xl"
                              disabled={busyId === q.id}
                              onClick={() => void respondQuote(q.id, 'accepted')}
                            >
                              {busyId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              disabled={busyId === q.id}
                              onClick={() => void respondQuote(q.id, 'rejected')}
                            >
                              Decline
                            </Button>
                          </>
                        ) : null}
                        <Link href={`/buyer/quotes/${q.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            Full detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

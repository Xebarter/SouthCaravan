'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { CheckCircle, ClipboardList, Clock, Plus, Trash2, XCircle } from 'lucide-react';

type ApiQuoteRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | string;
  total_amount: number | string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

type RfqItemDraft = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

function formatCurrencyUGX(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(safe);
}

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function statusMeta(status: string) {
  const normalized = String(status || '').toLowerCase();
  switch (normalized) {
    case 'pending':
      return {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        icon: CheckCircle,
        className: 'bg-green-500/10 text-green-400 border-green-500/20',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-400 border-red-500/20',
      };
    case 'expired':
      return {
        label: 'Expired',
        icon: XCircle,
        className: 'bg-muted/40 text-muted-foreground border-border/60',
      };
    default:
      return {
        label: status || '—',
        icon: ClipboardList,
        className: 'bg-muted/40 text-muted-foreground border-border/60',
      };
  }
}

export default function BuyerQuotesPage() {
  const { user } = useAuth();
  const buyerId = user?.id ?? 'user-1';

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'expired'>('all');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<ApiQuoteRow[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vendorUserId, setVendorUserId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [items, setItems] = useState<RfqItemDraft[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);
  const [createError, setCreateError] = useState<string | null>(null);

  async function refresh(nextStatus?: typeof statusFilter) {
    if (!user) return;
    setLoading(true);
    try {
      const effective = nextStatus ?? statusFilter;
      const res = await fetch(`/api/buyer/quotes?status=${encodeURIComponent(effective)}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) return;
      const rows = Array.isArray(json?.quotes) ? (json.quotes as ApiQuoteRow[]) : [];
      setQuotes(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, user]);

  const filtered = useMemo(() => quotes.filter((q) => q.buyer_id === buyerId), [quotes, buyerId]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((q) => String(q.status) === 'pending').length;
    const accepted = filtered.filter((q) => String(q.status) === 'accepted').length;
    const rejected = filtered.filter((q) => String(q.status) === 'rejected').length;
    return { total, pending, accepted, rejected };
  }, [filtered]);

  const normalizedItems = useMemo(() => {
    return items
      .map((it) => ({
        productId: it.productId.trim(),
        quantity: Number(it.quantity ?? 1),
        unitPrice: Number(it.unitPrice ?? 0),
      }))
      .filter((it) => Number.isFinite(it.quantity) && it.quantity > 0);
  }, [items]);

  const estimatedTotal = useMemo(() => {
    return normalizedItems.reduce((sum, it) => sum + it.quantity * (Number.isFinite(it.unitPrice) ? it.unitPrice : 0), 0);
  }, [normalizedItems]);

  async function handleCreate() {
    setCreateError(null);
    const v = vendorUserId.trim();
    if (!v) {
      setCreateError('Vendor ID is required.');
      return;
    }
    if (normalizedItems.length === 0) {
      setCreateError('Add at least one item.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vendorUserId: v,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        items: normalizedItems.map((it) => ({
          productId: it.productId || null,
          quantity: it.quantity,
          unitPrice: Number.isFinite(it.unitPrice) ? it.unitPrice : 0,
          subtotal: it.quantity * (Number.isFinite(it.unitPrice) ? it.unitPrice : 0),
        })),
      };

      const res = await fetch('/api/buyer/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setCreateError(json?.error || 'Failed to create RFQ.');
        return;
      }

      setCreateOpen(false);
      setVendorUserId('');
      setValidUntil('');
      setItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!id) return;
    await fetch(`/api/buyer/quotes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refresh();
  }

  async function handleRespond(id: string, next: 'accepted' | 'rejected') {
    if (!id) return;
    await fetch(`/api/buyer/quotes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await refresh();
  }

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Requests for quotation</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Quotes</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Request quotes from vendors, track responses, and convert accepted quotes into orders.
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <Plus className="w-4 h-4 mr-2" />
                New RFQ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create RFQ</DialogTitle>
                <DialogDescription>
                  This will create a pending quote request (RFQ) for a vendor. You can leave product IDs blank if you’re requesting a custom item.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendorUserId">Vendor user ID</Label>
                  <Input
                    id="vendorUserId"
                    value={vendorUserId}
                    onChange={(e) => setVendorUserId(e.target.value)}
                    placeholder="uuid (vendor auth user id)"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid until (optional)</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/60">
                  <div className="p-4 border-b border-border/70 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Items</p>
                      <p className="text-xs text-muted-foreground">Quantity and optional target price help vendors respond faster.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: 0 }])}
                    >
                      Add item
                    </Button>
                  </div>

                  <div className="p-4 space-y-3">
                    {items.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-6">
                          <Label className="text-xs text-muted-foreground">Product ID (optional)</Label>
                          <Input
                            value={it.productId}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, productId: v } : p)));
                            }}
                            placeholder="product uuid or leave blank"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label className="text-xs text-muted-foreground">Qty</Label>
                          <Input
                            inputMode="numeric"
                            value={String(it.quantity)}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: n } : p)));
                            }}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label className="text-xs text-muted-foreground">Target price (UGX)</Label>
                          <Input
                            inputMode="numeric"
                            value={String(it.unitPrice)}
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, unitPrice: n } : p)));
                            }}
                          />
                        </div>
                        <div className="md:col-span-12 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Subtotal: {formatCurrencyUGX((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                          </p>
                          {items.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Estimated total: <span className="font-medium text-foreground">{formatCurrencyUGX(estimatedTotal)}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" className="rounded-2xl" disabled={submitting} onClick={handleCreate}>
                      {submitting ? 'Creating…' : 'Create RFQ'}
                    </Button>
                  </div>
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
            { label: 'Total', value: stats.total },
            { label: 'Pending', value: stats.pending },
            { label: 'Accepted', value: stats.accepted },
            { label: 'Rejected', value: stats.rejected },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '—' : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'accepted', 'rejected', 'expired'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-4 py-2 rounded-2xl text-sm font-medium transition-colors border',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary/30'
                  : 'bg-card/60 text-foreground/90 border-border/60 hover:bg-accent/50',
              )}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              All quotes
            </CardTitle>
            <CardDescription>Your quote requests and their latest status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 text-center">
                <p className="text-sm text-muted-foreground">No quotes yet.</p>
                <p className="text-xs text-muted-foreground mt-2">Create your first quote request to get pricing from a vendor.</p>
              </div>
            ) : (
              filtered.map((q) => {
                const meta = statusMeta(q.status);
                const Icon = meta.icon;
                const total = Number(q.total_amount ?? 0);
                const created = new Date(q.created_at);
                return (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-border/60 bg-card/50 p-4 hover:bg-accent/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          Quote <span className="font-mono text-muted-foreground">#{formatShortId(q.id)}</span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground truncate">
                          Vendor <span className="font-mono">{formatShortId(q.vendor_user_id)}</span> • {created.toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between md:justify-end">
                        <div className="flex flex-col items-start md:items-end">
                          <Badge variant="outline" className={cn('rounded-full border px-3 py-1 gap-2', meta.className)}>
                            <Icon className="w-4 h-4" />
                            {meta.label}
                          </Badge>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrencyUGX(total)}</p>
                        </div>

                        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                          {String(q.status) === 'pending' ? (
                            <>
                              <Button size="sm" className="rounded-xl" onClick={() => void handleRespond(q.id, 'accepted')}>
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void handleRespond(q.id, 'rejected')}>
                                Decline
                              </Button>
                            </>
                          ) : null}

                          <Link href={`/buyer/quotes/${q.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              View
                            </Button>
                          </Link>

                          {String(q.status) === 'pending' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-destructive hover:text-destructive"
                              onClick={() => void handleDelete(q.id)}
                              aria-label="Delete RFQ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : null}
                        </div>
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

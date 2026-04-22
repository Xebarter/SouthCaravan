'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Money } from '@/components/money';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [payload, setPayload] = useState<any | null>(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load order');
      setPayload(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load order');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const order = payload?.order ?? null;
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const productsById = payload?.productsById ?? {};

  const total = useMemo(() => {
    return items.reduce((s: number, it: any) => s + Number(it.subtotal ?? 0), 0);
  }, [items]);

  async function updateStatus(next: OrderStatus) {
    if (!orderId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to update order');
      toast.success('Order updated');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update order');
    } finally {
      setSaving(false);
    }
  }

  async function deleteOrder() {
    if (!orderId) return;
    const ok = confirm('Delete this order? This cannot be undone.');
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to delete order');
      toast.success('Order deleted');
      router.push('/admin/orders');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  }

  if (!orderId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Invalid order link.</p>
        <Link href="/admin/orders">
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

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/admin/orders">
          <Button variant="outline" className="rounded-xl">
            Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All orders
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Order #{String(order.id).slice(-6)}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(order.status)} onValueChange={(v) => void updateStatus(v as OrderStatus)}>
            <SelectTrigger className="w-[180px] bg-secondary" disabled={saving}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={() => void deleteOrder()} disabled={deleting}>
            {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>{items.length} line item(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((it: any) => {
                const p = it.product_id ? productsById[String(it.product_id)] : null;
                return (
                  <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                      {p?.images?.[0] ? <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium line-clamp-1">{p?.name ?? 'Product'}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {it.quantity} · Unit <Money amountUSD={Number(it.unit_price ?? 0)} />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        <Money amountUSD={Number(it.subtotal ?? 0)} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Order totals & parties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="capitalize">
                  {String(order.status).replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Buyer</span>
                <span className="font-medium">{payload?.buyer?.name || payload?.buyer?.email || order.buyer_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium">
                  {payload?.vendor?.company_name || payload?.vendor?.name || payload?.vendor?.email || order.vendor_user_id || '—'}
                </span>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold mt-1">
                  <Money amountUSD={Number(order.total_amount ?? total)} />
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


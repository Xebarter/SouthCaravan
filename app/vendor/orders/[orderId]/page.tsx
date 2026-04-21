'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  PackageX,
  StickyNote,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_META: Record<
  OrderStatus,
  { label: string; cn: string; icon: React.ElementType }
> = {
  pending:   { label: 'Pending',   cn: 'bg-amber-500/10 text-amber-600 border-amber-500/20',     icon: Clock },
  confirmed: { label: 'Confirmed', cn: 'bg-primary/10 text-primary border-primary/20',         icon: CheckCircle2 },
  shipped:   { label: 'Shipped',   cn: 'bg-violet-500/10 text-violet-600 border-violet-500/20',   icon: Truck },
  delivered: { label: 'Delivered', cn: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: PackageCheck },
  cancelled: { label: 'Cancelled', cn: 'bg-red-500/10 text-red-500 border-red-500/20',            icon: PackageX },
};

const STEPS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

type VendorOrderDetail = {
  id: string;
  buyerId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  notes: string;
  estimatedDelivery: string | null;
  createdAt: string;
  buyer: { id: string; email: string; name: string | null; phone: string | null } | null;
  items: {
    id: string;
    productId: string;
    productName: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    createdAt: string;
  }[];
};

export default function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { user } = useAuth();

  const [order, setOrder] = useState<VendorOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/vendor/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load order');
        if (!cancelled) setOrder(json?.order ?? null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, orderId]);

  const buyerLabel = useMemo(() => {
    if (!order) return '';
    return order.buyer?.name || order.buyer?.email?.split('@')?.[0] || 'Buyer';
  }, [order]);

  const handleSetStatus = async (next: OrderStatus) => {
    if (!order) return;
    setUpdating(next);
    setError('');
    try {
      const res = await fetch(`/api/vendor/orders/${encodeURIComponent(order.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to update order');
      setOrder((prev) => (prev ? { ...prev, status: next } : prev));
    } catch (e: any) {
      setError(e?.message || 'Failed to update order');
    } finally {
      setUpdating(null);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-28 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading order…</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-md border-border/60">
          <CardHeader>
            <CardTitle>Order not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || "This order doesn't exist or doesn't belong to your account."}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/vendor/orders">Back to orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = order.status as OrderStatus;
  const meta = STATUS_META[status];
  const StatusIcon = meta.icon;
  const currentStep = STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back + page header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link href="/vendor/orders">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All orders
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-medium text-foreground">
                {buyerLabel}
              </span>
              {' · '}
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
              meta.cn,
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Progress stepper */}
      {!isCancelled && (
        <Card className="border-border/60">
          <CardContent className="py-7 px-6">
            <div className="flex items-start">
              {STEPS.map((step, i) => {
                const done = currentStep >= i;
                const active = currentStep === i;
                const StepIcon = STATUS_META[step].icon;
                return (
                  <div key={step} className="flex flex-1 flex-col items-center gap-2 relative">
                    {/* Connector line */}
                    {i > 0 && (
                      <div
                        className={cn(
                          'absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2',
                          currentStep >= i ? 'bg-primary' : 'bg-border',
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground',
                      )}
                    >
                      <StepIcon className="h-3.5 w-3.5" />
                    </div>
                    <span
                      className={cn(
                        'hidden sm:block text-xs font-medium capitalize',
                        done ? 'text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Line items — wider */}
        <Card className="md:col-span-3 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((line, idx) => {
              return (
                <div
                  key={`${line.productId}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight truncate">
                      {line.productName ?? line.productId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {line.quantity.toLocaleString()} ×{' '}
                      <Money amountUSD={line.unitPrice} /> / unit
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    <Money amountUSD={line.subtotal} />
                  </span>
                </div>
              );
            })}

            <Separator />
            <div className="flex items-center justify-between px-1 text-sm">
              <span className="font-medium text-muted-foreground">Order total</span>
              <span className="font-bold text-base">
                <Money amountUSD={order.totalAmount} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: shipping, notes, actions */}
        <div className="md:col-span-2 space-y-4">
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {order.shippingAddress ? (
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  Shipping address
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {order.shippingAddress}
                </p>
                {order.estimatedDelivery && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
                    Est. delivery:{' '}
                    {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {order.notes ? (
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground shrink-0" />
                  Buyer notes
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{order.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Action buttons */}
          {!isCancelled && status !== 'delivered' && (
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Actions
                </p>
                {status === 'pending' && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={Boolean(updating)}
                    onClick={() => handleSetStatus('confirmed')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {updating === 'confirmed' ? 'Updating…' : 'Confirm Order'}
                  </Button>
                )}
                {status === 'confirmed' && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={Boolean(updating)}
                    onClick={() => handleSetStatus('shipped')}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {updating === 'shipped' ? 'Updating…' : 'Mark as Shipped'}
                  </Button>
                )}
                {status === 'shipped' && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={Boolean(updating)}
                    onClick={() => handleSetStatus('delivered')}
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {updating === 'delivered' ? 'Updating…' : 'Mark Delivered'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  disabled={Boolean(updating)}
                  onClick={() => handleSetStatus('cancelled')}
                >
                  <PackageX className="h-4 w-4 mr-2" />
                  {updating === 'cancelled' ? 'Updating…' : 'Cancel Order'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

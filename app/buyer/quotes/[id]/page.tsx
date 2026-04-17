'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { Download, Printer } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { OrderItem } from '@/lib/types';

export default function BuyerQuoteDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const buyerId = user?.id ?? 'user-1';

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<any | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productsById, setProductsById] = useState<Record<string, any>>({});
  const vendorId = quote?.vendorId ?? '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/buyer/quotes/${encodeURIComponent(params.id)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;
        const row = json?.quote ?? null;
        const rows = Array.isArray(json?.items) ? json.items : [];
        const products = Array.isArray(json?.products) ? json.products : [];
        setQuote(
          row
            ? {
                id: row.id,
                vendorId: row.vendor_user_id,
                buyerId: row.buyer_id,
                totalAmount: Number(row.total_amount ?? 0),
                validUntil: row.valid_until ? new Date(row.valid_until) : new Date(),
                status: row.status,
                createdAt: new Date(row.created_at),
              }
            : null,
        );
        setItems(
          rows.map((it: any) => ({
            productId: it.product_id,
            quantity: Number(it.quantity ?? 1),
            unitPrice: Number(it.unit_price ?? 0),
            subtotal: Number(it.subtotal ?? 0),
          })),
        );
        const map: Record<string, any> = {};
        for (const p of products) {
          if (p?.id) map[String(p.id)] = p;
        }
        setProductsById(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, user]);

  if (!quote && loading) {
    return (
      <div className="space-y-8 pb-12">
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-8 pb-12">
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">Quote not found.</CardContent>
        </Card>
      </div>
    );
  }

  const quotePillMap: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const canRespond = quote.status === 'pending';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quote #{quote.id.slice(-6)}</h1>
          <p className="text-muted-foreground mt-2">
            From {vendorId ? `Vendor ${vendorId.slice(-6)}` : 'Vendor'} • Valid until {quote.validUntil.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quote Summary</span>
                <Badge className={quotePillMap[quote.status]}>
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-primary">
                  <Money amountUSD={quote.totalAmount} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{quote.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{items.length}</span>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">Line Items</p>
                <div className="space-y-3">
                  {items.map((line) => {
                    const product = line.productId ? productsById[String(line.productId)] : null;
                    return (
                      <div key={`${quote.id}-${line.productId}`} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/50">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {product?.name ?? (line.productId ? String(line.productId) : 'Custom item')}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Qty: {line.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            <Money amountUSD={line.subtotal} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Money amountUSD={line.unitPrice} /> each
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{vendorId ? `Vendor ${vendorId.slice(-6)}` : 'Vendor'}</p>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm">
                  <span className="font-medium text-foreground">Status: </span>
                  {quote.status}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-foreground">Valid: </span>
                  {quote.validUntil.toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canRespond ? (
                <>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      const res = await fetch(`/api/buyer/quotes/${quote.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'accepted' }),
                      });
                      if (res.ok) {
                        setQuote({ ...quote, status: 'accepted' });
                      }
                    }}
                  >
                    Accept Quote
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      const res = await fetch(`/api/buyer/quotes/${quote.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'rejected' }),
                      });
                      if (res.ok) {
                        setQuote({ ...quote, status: 'rejected' });
                      }
                    }}
                  >
                    Decline
                  </Button>
                </>
              ) : quote.status === 'accepted' ? (
                <Link href="/buyer/orders">
                  <Button size="sm" className="w-full">
                    Convert to Order
                  </Button>
                </Link>
              ) : (
                <div className="text-sm text-muted-foreground">
                  This quote can no longer be modified. You can view it or message the vendor.
                </div>
              )}

              <Link href="/buyer/messages">
                <Button variant="outline" size="sm" className="w-full">
                  Message Vendor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


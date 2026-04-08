'use client';

import Link from 'next/link';
import { use } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { getBuyerLabel, getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';
import { mockOrders, mockProducts } from '@/lib/mock-data';

export default function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { user } = useAuth();

  const vendor = getVendorProfileForConsole(user);
  const order = mockOrders.find((o) => o.id === orderId);

  if (!vendor || !order || order.vendorId !== vendor.id) {
    return (
      <div className="mx-auto max-w-lg w-full space-y-4">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Order not found</CardTitle>
            <CardDescription>
              This order is missing or does not belong to your vendor account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/vendor/orders">Back to orders</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/vendor/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              All orders
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Order {order.id}</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{getBuyerLabel(order.buyerId)}</span>
            {' · '}
            Placed {order.createdAt.toLocaleString()}
          </p>
        </div>
        <Badge className="capitalize text-sm px-3 py-1 w-fit">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Amounts and shipping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold tabular-nums">
                <Money amountUSD={order.totalAmount} />
              </span>
            </div>
            {order.estimatedDelivery && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. delivery</span>
                <span>{order.estimatedDelivery.toLocaleDateString()}</span>
              </div>
            )}
            {order.shippingAddress && (
              <div>
                <p className="text-muted-foreground mb-1">Ship to</p>
                <p className="text-foreground">{order.shippingAddress}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-muted-foreground mb-1">Buyer notes</p>
                <p className="text-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Products on this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((line, idx) => {
              const product = mockProducts.find((p) => p.id === line.productId);
              return (
                <div
                  key={`${line.productId}-${idx}`}
                  className="flex gap-3 rounded-lg border border-border/50 p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{product?.name ?? line.productId}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {line.quantity.toLocaleString()} · <Money amountUSD={line.unitPrice} /> unit
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0">
                    <Money amountUSD={line.subtotal} />
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

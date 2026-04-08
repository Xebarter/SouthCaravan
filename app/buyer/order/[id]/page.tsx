'use client';

import { useAuth } from '@/lib/auth-context';
import { mockOrders, mockProducts, mockVendors } from '@/lib/mock-data';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { Download, MessageCircle, Printer } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const buyerId = user?.id ?? 'user-1';

  const order = mockOrders.find((o) => o.id === params.id && o.buyerId === buyerId) ?? null;
  const vendor = order ? mockVendors.find((v) => v.id === order.vendorId) ?? null : null;

  if (!order) {
    return (
      <div className="space-y-8 pb-12">
        <Breadcrumbs
          items={[
            { label: 'Orders', href: '/buyer/orders' },
            { label: `Order #${params.id.slice(-6)}` },
          ]}
        />
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderId = order.id;
  const statusColorMap: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    shipped: 'bg-primary/10 text-primary',
    delivered: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };
  const statusColor = statusColorMap[order.status] ?? 'bg-primary/10 text-primary';

  const orderDate = order.createdAt;
  const deliveredDate = order.estimatedDelivery ?? order.updatedAt;

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs
        items={[
          { label: 'Orders', href: '/buyer/orders' },
          { label: `Order #${orderId.slice(-6)}` },
        ]}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order #{orderId.slice(-6)}</h1>
          <p className="text-muted-foreground mt-2">
            Ordered on {orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
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
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={statusColor}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {order.status === 'delivered' ? `Delivered on ${deliveredDate.toLocaleDateString()}` : `Last updated ${order.updatedAt.toLocaleDateString()}`}
                </p>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {(() => {
                  // For the timeline visuals, map order status to a coarse progression.
                  const rank: Record<string, number> = {
                    pending: 0,
                    confirmed: 1,
                    shipped: 2,
                    delivered: 3,
                    cancelled: 0,
                  };
                  const currentRank = rank[order.status] ?? 0;

                  const timeline = [
                    { label: 'Order Placed', stepRank: 0, date: order.createdAt },
                    { label: 'Payment Confirmed', stepRank: 1, date: order.updatedAt },
                    { label: 'Processing', stepRank: 1, date: order.updatedAt },
                    { label: 'Shipped', stepRank: 2, date: order.updatedAt },
                    { label: 'In Transit', stepRank: 2, date: order.updatedAt },
                    { label: 'Delivered', stepRank: 3, date: order.estimatedDelivery ?? deliveredDate },
                  ];

                  return timeline.map((step, idx) => {
                    const completed = currentRank >= step.stepRank;
                    return (
                      <div key={`${step.label}-${idx}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${completed ? 'bg-primary' : 'bg-border'}`} />
                          {idx < 5 && (
                            <div className={`w-0.5 h-12 ${completed ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-semibold text-foreground">{step.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {completed ? step.date.toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((line) => {
                const product = mockProducts.find((p) => p.id === line.productId);
                const lineTotal = line.subtotal;
                return (
                  <div key={line.productId} className="flex gap-4 p-4 bg-secondary rounded-lg">
                    <div className="w-20 h-20 bg-background rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">Image</span>
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{product?.name ?? line.productId}</h4>
                      <p className="text-sm text-muted-foreground truncate">{vendor?.companyName || 'Unknown Vendor'}</p>
                      <p className="text-sm text-muted-foreground">Qty: {line.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        <Money amountUSD={lineTotal} />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Money amountUSD={line.unitPrice} /> each
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="font-semibold text-foreground">{order.shippingAddress.split(',')[0] ?? 'Shipping'}</p>
              <p className="mt-2">{order.shippingAddress}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Total */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <Money amountUSD={order.totalAmount} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  <Money amountUSD={0} />
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-3 mt-3">
                <span className="text-muted-foreground">Tax</span>
                <span>
                  <Money amountUSD={0} />
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  <Money amountUSD={order.totalAmount} />
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline" size="sm" onClick={() => window.location.assign('/buyer/wishlist')}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Vendor
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                Report Issue
              </Button>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {order.status === 'shipped' || order.status === 'delivered' ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tracking number:{' '}
                    <span className="font-mono text-foreground">{`TRK-${order.id.slice(-6).toUpperCase()}`}</span>
                  </p>
                  <Button className="w-full" variant="outline" size="sm">
                    Track Shipment
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Tracking will be available after the order ships.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  MessageSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import {
  getBuyerLabel,
  getVendorBusinessSnapshot,
  getVendorConsoleUserId,
} from '@/lib/vendor-dashboard-data';
import { stripHtmlForPreview } from '@/lib/strip-html';

const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function VendorOverviewPage() {
  const { user } = useAuth();

  const snapshot = useMemo(
    () => getVendorBusinessSnapshot(getVendorConsoleUserId(user)),
    [user],
  );

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-lg w-full">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No vendor profile</AlertTitle>
          <AlertDescription>
            This account is not linked to a vendor profile in the demo dataset.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    vendor,
    orders,
    products,
    totalRevenue,
    pendingOrders,
    lowStockCount,
    uniqueBuyers,
    pendingQuotes,
    unreadMessages,
    recentOrders,
    topProducts,
    orderStatusCounts,
    monthlyRevenue,
  } = snapshot;

  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const alerts: { key: string; title: string; body: string; href?: string }[] = [];
  if (pendingOrders > 0) {
    alerts.push({
      key: 'pending',
      title: 'Orders need attention',
      body: `${pendingOrders} order${pendingOrders === 1 ? '' : 's'} awaiting confirmation or fulfillment.`,
      href: '/vendor/orders',
    });
  }
  if (lowStockCount > 0) {
    alerts.push({
      key: 'stock',
      title: 'Listings out of stock',
      body: `${lowStockCount} product${lowStockCount === 1 ? '' : 's'} marked out of stock — update availability or restock.`,
      href: '/vendor/products',
    });
  }
  if (pendingQuotes > 0) {
    alerts.push({
      key: 'quotes',
      title: 'Open quote requests',
      body: `${pendingQuotes} pending quote${pendingQuotes === 1 ? '' : 's'} from buyers.`,
    });
  }

  return (
    <div className="mx-auto max-w-7xl w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Snapshot of revenue, fulfillment, and buyer activity for{' '}
            <span className="text-foreground font-medium">{vendor.companyName}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/vendor/products">
              <Package className="w-4 h-4 mr-2" />
              Manage products
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/vendor/${vendor.id}`}>
              View storefront
            </Link>
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-3">
          {alerts.map((a) => (
            <Alert key={a.key} variant="default" className="border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-950 dark:text-amber-100">{a.title}</AlertTitle>
              <AlertDescription className="text-amber-950/80 dark:text-amber-100/90">
                {a.body}
                {a.href && (
                  <Link
                    href={a.href}
                    className="ml-1 inline-flex items-center font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatMoney(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time from your orders</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{orders.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingOrders > 0 ? (
                <span className="text-amber-700 dark:text-amber-400">{pendingOrders} pending</span>
              ) : (
                'None pending'
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalog</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockCount > 0 ? (
                <span className="text-destructive">{lowStockCount} out of stock</span>
              ) : (
                'All in stock'
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buyers &amp; comms</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold tabular-nums">{uniqueBuyers}</span>
              <span className="text-muted-foreground text-sm">unique</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              {unreadMessages > 0 ? (
                <Link href="/vendor/messages" className="text-primary font-medium hover:underline">
                  {unreadMessages} unread message{unreadMessages === 1 ? '' : 's'}
                </Link>
              ) : (
                <span>No unread messages</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Revenue by month</CardTitle>
              <CardDescription>Order totals grouped by calendar month</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Avg order value</p>
              <p className="text-lg font-semibold tabular-nums flex items-center justify-end gap-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                {formatMoney(avgOrderValue)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vendorRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(v: number) => {
                      if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                      return `$${v}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-foreground)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    fill="url(#vendorRevFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Order pipeline</CardTitle>
            <CardDescription>Count by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = orderStatusCounts[status] ?? 0;
              const total = orders.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-muted-foreground">{status}</span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Newest buyer orders for your catalog</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendor/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{getBuyerLabel(order.buyerId)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.createdAt.toLocaleDateString()} · {order.items.length} line
                        {order.items.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="capitalize">
                        {order.status}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(order.totalAmount)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/vendor/orders/${order.id}`} aria-label="Order details">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top products by revenue</CardTitle>
              <CardDescription>Based on line totals across all orders</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/vendor/products">Catalog</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topProducts.every((t) => t.revenue === 0) ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Revenue will appear here once orders include your SKUs.
              </p>
            ) : (
              <ul className="space-y-3">
                {topProducts.map(({ product, revenue }) => (
                  <li
                    key={product.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stripHtmlForPreview(product.description)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {formatMoney(revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Shortcuts</CardTitle>
          <CardDescription>Jump to the workflows you use most</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/vendor/orders">Fulfill orders</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/vendor/messages">Buyer messages</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/vendor/analytics">Performance</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/vendor/settings">Business settings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

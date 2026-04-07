'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingCart,
  Package,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Eye,
  Download,
  Bell,
  Clock,
  Clock3,
  Truck,
  CheckCircle2,
  ShoppingBag,
  Wallet,
  Activity,
  Users,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import {
  mockConversations,
  mockMessages,
  mockOrders,
  mockQuotes,
  mockUsers,
  mockVendors,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function BuyerDashboard({ buyerId }: { buyerId: string }) {
  const buyerOrders = mockOrders.filter((o) => o.buyerId === buyerId);
  const buyerQuotes = mockQuotes.filter((q) => q.buyerId === buyerId);
  const buyerProfile = mockUsers.find((u) => u.id === buyerId) ?? null;

  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    try {
      setBuyerName(localStorage.getItem('currentBuyerName'));
      setBuyerEmail(localStorage.getItem('currentBuyerEmail'));
    } catch {
      setBuyerName(null);
      setBuyerEmail(null);
    } finally {
      setIsClientReady(true);
    }
  }, []);

  const buyerOrdersForDashboard =
    buyerEmail && buyerProfile?.email && buyerProfile.email !== buyerEmail ? [] : buyerOrders;

  const dashboardTotalOrders = buyerOrdersForDashboard.length;
  const dashboardTotalSpent = buyerOrdersForDashboard.reduce((sum, order) => sum + order.totalAmount, 0);
  const dashboardPendingCount = buyerOrdersForDashboard.filter((o) => ['pending', 'confirmed'].includes(o.status)).length; // pending + processing
  const dashboardInTransitCount = buyerOrdersForDashboard.filter((o) => o.status === 'shipped').length;
  const dashboardDeliveredCount = buyerOrdersForDashboard.filter((o) => o.status === 'delivered').length;

  const dashboardRecentOrders = [...buyerOrdersForDashboard]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const formatUGX = (amount: number) => `UGX ${Math.round(amount).toLocaleString('en-US')}`;

  const getDashboardOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          Icon: Clock3,
        };
      case 'confirmed':
        return {
          label: 'Processing',
          className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          Icon: Clock3,
        };
      case 'shipped':
        return {
          label: 'In Transit',
          className: 'bg-primary/10 text-primary border-primary/20',
          Icon: Truck,
        };
      case 'delivered':
        return {
          label: 'Delivered',
          className: 'bg-green-500/10 text-green-400 border-green-500/20',
          Icon: CheckCircle2,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          className: 'bg-red-500/10 text-red-400 border-red-500/20',
          Icon: ShoppingBag,
        };
      default:
        return {
          label: status,
          className: 'bg-primary/10 text-primary border-primary/20',
          Icon: Clock3,
        };
    }
  };

  const totalSpent = buyerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeOrders = buyerOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const pendingQuotes = buyerQuotes.filter((q) => q.status === 'pending');
  const unreadMessages = mockMessages.filter((m) => m.recipientId === buyerId && !m.read).length;

  const recentOrders = [...buyerOrders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  const recentQuotes = [...buyerQuotes]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const vendorSpendMap = buyerOrders.reduce((acc, o) => {
    acc[o.vendorId] = (acc[o.vendorId] ?? 0) + o.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const topVendors = Object.entries(vendorSpendMap)
    .map(([vendorId, spend]) => ({
      vendorId,
      spend,
      vendor: mockVendors.find((v) => v.id === vendorId),
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 4);

  const statusPills: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shipped: 'bg-primary/10 text-primary border-primary/20',
    delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const quotePills: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const expiringQuotes = pendingQuotes
    .filter((q) => {
      const msUntilExpiry = q.validUntil.getTime() - Date.now();
      return msUntilExpiry >= 0 && msUntilExpiry <= 1000 * 60 * 60 * 24 * 3;
    })
    .sort((a, b) => a.validUntil.getTime() - b.validUntil.getTime())
    .slice(0, 4);

  const buyerConversations = mockConversations.filter((c) => c.participants.includes(buyerId));
  const conversationRows = buyerConversations
    .map((conv) => {
      const otherParticipantId = conv.participants.find((p) => p !== buyerId);
      const otherUser = mockUsers.find((u) => u.id === otherParticipantId);
      const otherVendor = otherParticipantId
        ? mockVendors.find((v) => v.userId === otherParticipantId)
        : null;

      const messages = mockMessages
        .filter((m) => m.conversationId === conv.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const lastMessage = messages[0] ?? null;
      return {
        conv,
        otherLabel: otherVendor?.companyName || otherUser?.name || 'Unknown',
        lastMessage,
      };
    })
    .sort((a, b) => (b.lastMessage?.createdAt?.getTime() ?? b.conv.updatedAt.getTime()) - (a.lastMessage?.createdAt?.getTime() ?? a.conv.updatedAt.getTime()));

  const recentActivity = [
    ...recentOrders.map((order) => ({
      kind: 'order' as const,
      createdAt: order.updatedAt,
      title: `Order ${order.status}`,
      subtitle: `${mockVendors.find((v) => v.id === order.vendorId)?.companyName || 'Unknown Vendor'}`,
      href: `/buyer/orders/${order.id}`,
    })),
    ...recentQuotes.map((quote) => ({
      kind: 'quote' as const,
      createdAt: quote.createdAt,
      title: `Quote ${quote.status}`,
      subtitle: `${mockVendors.find((v) => v.id === quote.vendorId)?.companyName || 'Unknown Vendor'}`,
      href: `/buyer/quotes/${quote.id}`,
    })),
    ...mockMessages
      .filter((m) => m.senderId === buyerId || m.recipientId === buyerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6)
      .map((msg) => {
        const senderVendor = mockVendors.find((v) => v.userId === msg.senderId);
        return {
          kind: 'message' as const,
          createdAt: msg.createdAt,
          title: senderVendor ? `Message from ${senderVendor.companyName}` : 'New message',
          subtitle: msg.content,
          href: '/buyer/messages',
        };
      }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);

  function orderStatusStepLabel(status: string) {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Payment Confirmed';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  const monthlySpendData = (() => {
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (key: string) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
    };

    const totals = new Map<string, number>();
    for (const o of buyerOrders) {
      const key = monthKey(o.createdAt);
      totals.set(key, (totals.get(key) ?? 0) + o.totalAmount);
    }

    const sortedKeys = [...totals.keys()].sort();
    const lastSixKeys = sortedKeys.slice(-6);

    if (lastSixKeys.length === 0) return [{ month: '—', spending: 0 }];

    return lastSixKeys.map((key) => ({
      month: monthLabel(key),
      spending: Math.round(totals.get(key) ?? 0),
    }));
  })();

  const orderStatusData = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => ({
    status: s,
    count: buyerOrders.filter((o) => o.status === s).length,
  })).filter((row) => row.count > 0);

  if (!isClientReady) {
    return (
      <main className="flex-1 overflow-auto bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <p className="text-muted-foreground">Loading buyer dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top welcome card */}
        <div className="mb-8">
          <div className="rounded-2xl border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-muted-foreground">Buyer Workspace</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight truncate">Welcome back, {buyerName ?? 'Buyer'}</h1>
                <p className="text-sm text-muted-foreground mt-1">Tracking purchases, deliveries, and saved items</p>
              </div>

              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-border/70 bg-card/60 text-foreground"
              >
                {buyerEmail ?? 'No active buyer email'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Statistics row */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <CardContent className="p-0 space-y-1">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{dashboardTotalOrders}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <CardContent className="p-0 space-y-1">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">{formatUGX(dashboardTotalSpent)}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <CardContent className="p-0 space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{dashboardPendingCount}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <CardContent className="p-0 space-y-1">
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{dashboardInTransitCount}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 p-5 shadow-sm">
              <CardContent className="p-0 space-y-1">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{dashboardDeliveredCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders panel */}
          <Card className="rounded-2xl border-border/70 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Most recent first</p>
              </div>
            </div>

            {dashboardRecentOrders.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center text-muted-foreground">
                No orders found for this buyer session
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardRecentOrders.map((order) => {
                  const itemCount = order.items.length;
                  const statusBadge = getDashboardOrderStatusBadge(order.status);
                  const Icon = statusBadge.Icon;

                  return (
                    <Link
                      key={order.id}
                      href={`/buyer/orders/${order.id}`}
                      className="block rounded-lg border border-border/50 p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">Order #{order.id}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.createdAt.toLocaleDateString()} • {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full px-3 py-1 border',
                              statusBadge.className
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {statusBadge.label}
                          </Badge>

                          <Badge
                            variant="outline"
                            className="rounded-full px-3 py-1 border-border/50 bg-muted/20"
                          >
                            <Wallet className="w-4 h-4" />
                            {formatUGX(order.totalAmount)}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="activity" className="hidden space-y-4">
          <TabsList>
            <TabsTrigger value="activity">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="border-border/50 xl:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Recent Activity
                      </CardTitle>
                      <CardDescription>Your latest order, quote, and message updates</CardDescription>
                    </div>
                    <Link href="/buyer/orders">
                      <Button variant="outline" size="sm">View Orders</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((item, idx) => (
                        <Link
                          key={`${item.kind}-${idx}-${item.createdAt.toISOString()}`}
                          href={item.href}
                          className="block p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.title}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.subtitle}</p>
                            </div>
                            <p className="text-xs text-muted-foreground shrink-0">
                              {item.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground">No activity yet.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div>
                    <CardTitle>Alerts</CardTitle>
                    <CardDescription>What needs attention today</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      <p className="font-medium">Unread messages</p>
                    </div>
                    <p className="text-2xl font-bold mt-2">{unreadMessages}</p>
                    <Link href="/buyer/messages">
                      <Button className="mt-3 w-full" size="sm" variant="outline">
                        Open Messages
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="font-medium">Expiring quotes</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pending quotes valid within the next 3 days
                    </p>
                    {expiringQuotes.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {expiringQuotes.map((q) => {
                          const vendor = mockVendors.find((v) => v.id === q.vendorId);
                          const daysLeft = Math.ceil((q.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          return (
                            <Link
                              key={q.id}
                              href={`/buyer/quotes/${q.id}`}
                              className="block p-3 border border-border/50 rounded-lg hover:bg-secondary/60 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium line-clamp-1">{vendor?.companyName || 'Unknown Vendor'}</p>
                                <Badge className={quotePills[q.status]}>
                                  {daysLeft}d
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Valid until {q.validUntil.toLocaleDateString()}</p>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-3">No quotes expiring soon.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Your latest purchase orders</CardDescription>
                  </div>
                  <Link href="/buyer/orders">
                    <Button variant="outline" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const vendor = mockVendors.find(v => v.id === order.vendorId);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span>{vendor?.companyName || 'Unknown Vendor'}</span>
                            <Badge className={statusPills[order.status]}>
                              {orderStatusStepLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''} • ${order.totalAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ordered: {order.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/buyer/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quote Requests</CardTitle>
                    <CardDescription>Pending and recent quotes from vendors</CardDescription>
                  </div>
                  <Link href="/buyer/quotes">
                    <Button variant="outline" size="sm">Manage Quotes</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentQuotes.map((quote) => {
                    const vendor = mockVendors.find(v => v.id === quote.vendorId);
                    return (
                      <div key={quote.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <span>{vendor?.companyName || 'Unknown Vendor'}</span>
                            <Badge className={quotePills[quote.status]}>
                              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${quote.totalAmount.toLocaleString()} • Valid until: {quote.validUntil.toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/buyer/quotes/${quote.id}`}>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendor Messages</CardTitle>
                    <CardDescription>
                      {unreadMessages > 0 ? `${unreadMessages} unread message(s) awaiting your review` : 'No unread messages'}
                    </CardDescription>
                  </div>
                  <Link href="/buyer/messages">
                    <Button variant="outline" size="sm">Open Inbox</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {conversationRows.length > 0 ? (
                  <div className="space-y-3">
                    {conversationRows.slice(0, 5).map((row) => (
                      <Link
                        key={row.conv.id}
                        href="/buyer/messages"
                        className="block p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{row.otherLabel}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {row.lastMessage?.content ?? 'No messages yet'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground shrink-0">
                            {(row.lastMessage?.createdAt ?? row.conv.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">No conversations yet.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendor Directory</CardTitle>
                    <CardDescription>Browse and manage your vendors</CardDescription>
                  </div>
                  <Link href="/catalog">
                    <Button variant="outline" size="sm">Browse Catalog</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topVendors.length > 0 ? (
                    topVendors.map(({ vendor }) => {
                      if (!vendor) return null;
                      return (
                        <div key={vendor.id} className="p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium">{vendor.companyName}</h3>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={i < Math.floor(vendor.rating) ? 'text-primary' : 'text-muted'}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
                              </div>
                            </div>
                            {vendor.verified && (
                              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Verified</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{vendor.description}</p>
                          <Link href={`/vendor/${vendor.id}`}>
                            <Button variant="ghost" size="sm" className="mt-3 w-full">
                              View Products <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      );
                    })
                  ) : (
                    <div className="md:col-span-2">
                      <div className="py-10 text-center text-muted-foreground">
                        No vendors yet. Browse the catalog to start sourcing.
                      </div>
                      <Link href="/catalog" className="block text-center">
                        <Button className="mt-2">Browse Catalog</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div>
                    <CardTitle>Spend Trend</CardTitle>
                    <CardDescription>Monthly spend based on your orders</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlySpendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                      <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-card)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-foreground)',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="spending" name="Spending" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div>
                    <CardTitle>Order Status</CardTitle>
                    <CardDescription>Counts of your orders by current status</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={orderStatusData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="status" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                        <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-foreground)',
                          }}
                        />
                        <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="py-10 text-center text-muted-foreground">No orders yet.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Top Vendors
                    </CardTitle>
                    <CardDescription>Based on total order spend</CardDescription>
                  </div>
                  <Link href="/catalog">
                    <Button variant="outline" size="sm">Browse More</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {topVendors.length > 0 ? (
                  <div className="space-y-3">
                    {topVendors.map(({ vendor, spend }) => {
                      if (!vendor) return null;
                      return (
                        <div key={vendor.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{vendor.companyName}</p>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{vendor.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total spend</p>
                            <p className="font-bold text-primary">${spend.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center text-muted-foreground">No vendor analytics yet.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Manage your business details</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(buyerProfile?.name?.charAt(0) ?? 'B').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{buyerProfile?.company ?? buyerProfile?.name ?? 'Buyer'}</p>
                      <p className="text-sm text-muted-foreground truncate">{buyerProfile?.name ?? '—'}</p>
                      <p className="text-sm text-muted-foreground truncate">{buyerProfile?.email ?? '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Buyer ID</p>
                      <p className="font-mono text-sm">{buyerId.slice(-8)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                      <p className="text-xs text-muted-foreground">Member Since</p>
                      <p className="font-medium text-sm">
                        {buyerProfile?.createdAt ? buyerProfile.createdAt.toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Link href="/buyer/profile">
                      <Button variant="outline" size="sm">
                        View full profile
                      </Button>
                    </Link>
                    <Link href="/catalog">
                      <Button size="sm">Browse suppliers</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle>Buyer Preferences</CardTitle>
                    <CardDescription>What your dashboard uses by default</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm font-medium">Primary notifications</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Order updates, vendor messages, and weekly summaries.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm font-medium">Quote focus</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Highlights pending quotes and expiring items.
                    </p>
                  </div>
                  <Link href="/buyer/settings">
                    <Button variant="outline" className="w-full">
                      Manage account settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Control what alerts you see</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Order Updates', enabled: true },
                    { label: 'New Products', enabled: true },
                    { label: 'Vendor Messages', enabled: true },
                    { label: 'Promotional Offers', enabled: false },
                    { label: 'Newsletter', enabled: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 bg-secondary/40 rounded-lg border border-border/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                      <Badge
                        variant={item.enabled ? 'default' : 'secondary'}
                        className={cn(
                          'rounded-full px-3 py-1',
                          item.enabled ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        )}
                      >
                        {item.enabled ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/buyer/settings">
                    <Button className="w-full" variant="outline">
                      Edit notification settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle>Account & Security</CardTitle>
                    <CardDescription>Manage your access and safety</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-sm text-muted-foreground mt-1">Last changed 45 days ago</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="font-medium text-sm">Two-factor authentication</p>
                    <p className="text-sm text-muted-foreground mt-1">Not currently enabled</p>
                  </div>
                  <Link href="/buyer/settings">
                    <Button className="w-full">Open settings</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

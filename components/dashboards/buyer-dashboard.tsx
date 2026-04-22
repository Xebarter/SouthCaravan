'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MessageSquare,
  Eye,
  FileText,
  Heart,
  MapPin,
  ShoppingCart,
  ArrowRight,
  Clock3,
  Wallet,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ApiOrderRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string;
  status: string;
  total_amount: number | string | null;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string | null;
};

type ApiQuoteRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string;
  status: string;
  total_amount: number | string | null;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
};

type ApiConversationRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string;
  updated_at: string;
  created_at: string;
};

type ApiMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

type BuyerProfileResponse = {
  customer: { id: string; email: string; name: string; phone: string | null } | null;
  profile: { company_name?: string | null } | null;
};

function formatCurrencyUGX(amount: number) {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(safe);
}

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function statusMeta(kind: 'order' | 'quote', status: string) {
  const normalized = String(status || '').toLowerCase();
  if (kind === 'order') {
    switch (normalized) {
      case 'pending':
        return { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
      case 'confirmed':
        return { label: 'Processing', className: 'bg-primary/10 text-primary border-primary/20' };
      case 'shipped':
        return { label: 'In transit', className: 'bg-primary/10 text-primary border-primary/20' };
      case 'delivered':
        return { label: 'Delivered', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'cancelled':
        return { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
      default:
        return { label: status || '—', className: 'bg-muted/30 text-muted-foreground border-border/50' };
    }
  }

  switch (normalized) {
    case 'pending':
      return { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    case 'accepted':
      return { label: 'Accepted', className: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'rejected':
      return { label: 'Rejected', className: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'expired':
      return { label: 'Expired', className: 'bg-muted/30 text-muted-foreground border-border/50' };
    default:
      return { label: status || '—', className: 'bg-muted/30 text-muted-foreground border-border/50' };
  }
}

export function BuyerDashboard({ buyerId }: { buyerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ApiOrderRow[]>([]);
  const [quotes, setQuotes] = useState<ApiQuoteRow[]>([]);
  const [conversations, setConversations] = useState<ApiConversationRow[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [conversationPreview, setConversationPreview] = useState<Record<string, { unread: number; last?: ApiMessageRow }>>({});
  const [catalogQuery, setCatalogQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const [profileRes, ordersRes, quotesRes, convRes] = await Promise.allSettled([
          fetch('/api/buyer/profile', { method: 'GET' }),
          fetch('/api/buyer/orders?status=all', { method: 'GET' }),
          fetch('/api/buyer/quotes?status=all', { method: 'GET' }),
          fetch('/api/buyer/conversations', { method: 'GET' }),
        ]);

        if (cancelled) return;

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const json = (await profileRes.value.json().catch(() => null)) as BuyerProfileResponse | null;
          // still fetch profile so API stays warm / validated; dashboard currently doesn't render name/company
          void json;
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          const json = await ordersRes.value.json().catch(() => null);
          const rows = Array.isArray(json?.orders) ? (json.orders as ApiOrderRow[]) : [];
          setOrders(rows);
        }

        if (quotesRes.status === 'fulfilled' && quotesRes.value.ok) {
          const json = await quotesRes.value.json().catch(() => null);
          const rows = Array.isArray(json?.quotes) ? (json.quotes as ApiQuoteRow[]) : [];
          setQuotes(rows);
        }

        if (convRes.status === 'fulfilled' && convRes.value.ok) {
          const json = await convRes.value.json().catch(() => null);
          const rows = Array.isArray(json?.conversations) ? (json.conversations as ApiConversationRow[]) : [];
          setConversations(rows);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function computeUnread() {
      if (conversations.length === 0) {
        setUnreadMessages(0);
        setConversationPreview({});
        return;
      }

      // Best-effort unread count: for the most recent few conversations, count unread messages where recipient is buyer.
      // This keeps the dashboard light while still being useful.
      const top = conversations.slice(0, 5);
      const results = await Promise.allSettled(
        top.map(async (c) => {
          const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(c.id)}`, { method: 'GET' });
          if (!res.ok) return 0;
          const json = await res.json().catch(() => null);
          const messages = Array.isArray(json?.messages) ? (json.messages as ApiMessageRow[]) : [];
          const unread = messages.filter((m) => m.recipient_id === buyerId && !m.read).length;
          const last = messages.length > 0 ? messages[messages.length - 1] : undefined;
          return { id: c.id, unread, last };
        }),
      );

      if (cancelled) return;
      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<{ id: string; unread: number; last?: ApiMessageRow }> => r.status === 'fulfilled')
        .map((r) => r.value);

      const count = fulfilled.reduce((sum, r) => sum + r.unread, 0);
      setUnreadMessages(count);
      const next: Record<string, { unread: number; last?: ApiMessageRow }> = {};
      for (const r of fulfilled) next[r.id] = { unread: r.unread, last: r.last };
      setConversationPreview(next);
    }

    computeUnread();
    return () => {
      cancelled = true;
    };
  }, [buyerId, conversations]);

  const normalizedOrders = useMemo(() => {
    return orders
      .filter((o) => o.buyer_id === buyerId)
      .map((o) => ({
        ...o,
        total: Number(o.total_amount ?? 0),
        createdAt: new Date(o.created_at),
        updatedAt: new Date(o.updated_at),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [buyerId, orders]);

  const normalizedQuotes = useMemo(() => {
    return quotes
      .filter((q) => q.buyer_id === buyerId)
      .map((q) => ({
        ...q,
        total: Number(q.total_amount ?? 0),
        createdAt: new Date(q.created_at),
        validUntil: q.valid_until ? new Date(q.valid_until) : null,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [buyerId, quotes]);

  const stats = useMemo(() => {
    const totalSpent = normalizedOrders.reduce((sum, o) => sum + (Number.isFinite(o.total) ? o.total : 0), 0);
    const activeOrders = normalizedOrders.filter((o) => !['delivered', 'cancelled'].includes(String(o.status))).length;
    const pendingQuotes = normalizedQuotes.filter((q) => String(q.status) === 'pending').length;
    return { totalSpent, activeOrders, pendingQuotes };
  }, [normalizedOrders, normalizedQuotes]);

  const recentOrders = normalizedOrders.slice(0, 6);
  const recentQuotes = normalizedQuotes.slice(0, 5);

  const expiringQuotes = useMemo(() => {
    const now = Date.now();
    return normalizedQuotes
      .filter((q) => String(q.status) === 'pending' && q.validUntil)
      .map((q) => ({ ...q, msLeft: (q.validUntil as Date).getTime() - now }))
      .filter((q) => q.msLeft >= 0 && q.msLeft <= 1000 * 60 * 60 * 24 * 5)
      .sort((a, b) => a.msLeft - b.msLeft)
      .slice(0, 4);
  }, [normalizedQuotes]);

  return (
    <div className="flex-1 bg-linear-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Buyer workspace</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Track orders, review quotes, and keep conversations moving.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => router.push('/buyer/messages')}
            >
              <MessageSquare className="w-4 h-4" />
              Inbox
              {unreadMessages > 0 ? (
                <Badge variant="secondary" className="ml-2 rounded-full">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Badge>
              ) : null}
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              onClick={() => router.push('/catalog')}
            >
              <Sparkles className="w-4 h-4" />
              Browse catalog
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Find products faster</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Search the catalog by product, category, or vendor.
                </p>
              </div>

              <div className="w-full lg:max-w-xl">
                <InputGroup className="rounded-2xl bg-secondary">
                  <InputGroupAddon align="inline-start" className="text-muted-foreground">
                    <InputGroupText>
                      <Search className="w-4 h-4" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    placeholder="Search the catalog…"
                    aria-label="Search catalog"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const q = catalogQuery.trim();
                        router.push(q ? `/catalog?query=${encodeURIComponent(q)}` : '/catalog');
                      }
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        const q = catalogQuery.trim();
                        router.push(q ? `/catalog?query=${encodeURIComponent(q)}` : '/catalog');
                      }}
                    >
                      Search
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Total spend</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                {loading ? '—' : formatCurrencyUGX(stats.totalSpent)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">All-time across orders</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Active orders</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <ShoppingCart className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{loading ? '—' : stats.activeOrders}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pending, processing, or in transit</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Pending quotes</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{loading ? '—' : stats.pendingQuotes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting vendor response</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Unread messages</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <MessageSquare className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{loading ? '—' : unreadMessages}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across recent threads</p>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent orders */}
          <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur shadow-sm xl:col-span-2 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Recent orders
                  </CardTitle>
                  <CardDescription>Latest purchase orders and their current status</CardDescription>
                </div>
                <Link href="/buyer/orders">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loading ? (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
                  Loading orders…
                </div>
              ) : recentOrders.length === 0 ? (
                <Empty className="border-border/60 bg-muted/15 rounded-2xl">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ShoppingCart className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>No orders yet</EmptyTitle>
                    <EmptyDescription>
                      When you place an order, it’ll show up here with real-time status updates.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Link href="/catalog" className="w-full">
                        <Button className="w-full rounded-2xl">Browse catalog</Button>
                      </Link>
                      <Link href="/buyer/quotes" className="w-full">
                        <Button variant="outline" className="w-full rounded-2xl">
                          Request a quote
                        </Button>
                      </Link>
                    </div>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((o) => {
                        const meta = statusMeta('order', o.status);
                        return (
                          <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(`/buyer/orders/${o.id}`)}>
                            <TableCell className="min-w-0">
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  #{formatShortId(o.id)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {o.createdAt.toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              {formatShortId(o.vendor_user_id)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn('rounded-full border px-3 py-1 gap-1.5', meta.className)}>
                                <Clock3 className="w-3.5 h-3.5" />
                                {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">
                              {formatCurrencyUGX(o.total)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quotes */}
            <Card className="rounded-2xl border-border/70 overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Quotes
                    </CardTitle>
                    <CardDescription>Pending, expiring soon, and recent activity</CardDescription>
                  </div>
                  <Link href="/buyer/quotes">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      View all
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {loading ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Loading quotes…
                  </div>
                ) : recentQuotes.length === 0 ? (
                  <Empty className="border-border/60 bg-muted/15 rounded-2xl">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <FileText className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>No quotes yet</EmptyTitle>
                      <EmptyDescription>
                        Request a quote to compare vendors before placing an order.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Link href="/buyer/quotes" className="w-full">
                        <Button variant="outline" className="w-full rounded-2xl">
                          Request a quote
                        </Button>
                      </Link>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <div className="space-y-2">
                    {(expiringQuotes.length > 0 ? expiringQuotes : recentQuotes.slice(0, 3)).map((q) => {
                      const meta = statusMeta('quote', q.status);
                      const daysLeft =
                        q.validUntil ? Math.max(0, Math.ceil((q.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
                      const subtitle =
                        expiringQuotes.length > 0 && q.validUntil
                          ? `${daysLeft}d left • Vendor ${formatShortId(q.vendor_user_id)}`
                          : `${q.createdAt.toLocaleDateString()} • Vendor ${formatShortId(q.vendor_user_id)}`;

                      return (
                        <Link
                          key={q.id}
                          href={`/buyer/quotes/${q.id}`}
                          className="block rounded-2xl border border-border/60 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                Quote <span className="font-mono text-muted-foreground">#{formatShortId(q.id)}</span>
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                {subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className={cn('rounded-full border px-3 py-1', meta.className)}>
                                {meta.label}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="pb-3">
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Common tasks, one click away</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Link href="/buyer/orders" className="block">
                  <Button variant="outline" className="w-full justify-between rounded-2xl">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Track orders
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/buyer/wishlist" className="block">
                  <Button variant="outline" className="w-full justify-between rounded-2xl">
                    <span className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Review wishlist
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/buyer/addresses" className="block">
                  <Button variant="outline" className="w-full justify-between rounded-2xl">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Manage addresses
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Conversations */}
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Messages
                    </CardTitle>
                    <CardDescription>Recent vendor threads and notifications</CardDescription>
                  </div>
                  <Link href="/buyer/messages">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Open inbox
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Loading conversations…
                  </div>
                ) : conversations.length === 0 ? (
                  <Empty className="border-border/60 bg-muted/15 rounded-2xl">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageSquare className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>No conversations yet</EmptyTitle>
                      <EmptyDescription>
                        Messages appear when you contact a vendor from a quote or order.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map((c) => (
                      <Link
                        key={c.id}
                        href="/buyer/messages"
                        className="block rounded-2xl border border-border/60 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              Vendor <span className="font-mono text-muted-foreground">{formatShortId(c.vendor_user_id)}</span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground truncate">
                              {conversationPreview[c.id]?.last?.content
                                ? conversationPreview[c.id]?.last?.content
                                : `Updated ${new Date(c.updated_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {conversationPreview[c.id]?.unread ? (
                              <Badge className="rounded-full">
                                {conversationPreview[c.id]?.unread > 99 ? '99+' : conversationPreview[c.id]?.unread}
                              </Badge>
                            ) : null}
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

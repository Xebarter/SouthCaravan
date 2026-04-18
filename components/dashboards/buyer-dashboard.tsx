'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        return { label: 'Processing', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
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
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<ApiOrderRow[]>([]);
  const [quotes, setQuotes] = useState<ApiQuoteRow[]>([]);
  const [conversations, setConversations] = useState<ApiConversationRow[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [conversationPreview, setConversationPreview] = useState<Record<string, { unread: number; last?: ApiMessageRow }>>({});

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
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Total spend</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {loading ? '—' : formatCurrencyUGX(stats.totalSpent)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">All-time across orders</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Active orders</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <ShoppingCart className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '—' : stats.activeOrders}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pending, processing, or in transit</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Pending quotes</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <FileText className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '—' : stats.pendingQuotes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting vendor response</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/70 backdrop-blur shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Unread messages</p>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <MessageSquare className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{loading ? '—' : unreadMessages}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across recent conversations</p>
            </CardContent>
          </Card>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent orders */}
          <Card className="rounded-2xl border-border/70 bg-card/60 backdrop-blur shadow-sm xl:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Recent orders
                  </CardTitle>
                  <CardDescription>Latest purchase orders and status</CardDescription>
                </div>
                <Link href="/buyer/orders">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    View all
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
                  Loading orders…
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-10 text-center">
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                  <Link href="/catalog">
                    <Button className="mt-4 rounded-2xl">Browse catalog</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((o) => {
                    const meta = statusMeta('order', o.status);
                    return (
                      <Link
                        key={o.id}
                        href={`/buyer/orders/${o.id}`}
                        className="block rounded-2xl border border-border/60 bg-card/50 p-4 hover:bg-accent/40 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              Order <span className="font-mono text-muted-foreground">#{formatShortId(o.id)}</span>
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground truncate">
                              Vendor <span className="font-mono">{formatShortId(o.vendor_user_id)}</span> • {o.createdAt.toLocaleDateString()}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={cn('rounded-full border px-3 py-1', meta.className)}>
                              <Clock3 className="w-4 h-4" />
                              {meta.label}
                            </Badge>
                            <p className="text-sm font-semibold text-foreground">{formatCurrencyUGX(o.total)}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quotes attention */}
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Quotes to review
                </CardTitle>
                <CardDescription>Pending and expiring soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Loading quotes…
                  </div>
                ) : expiringQuotes.length > 0 ? (
                  <div className="space-y-2">
                    {expiringQuotes.map((q) => {
                      const meta = statusMeta('quote', q.status);
                      const daysLeft = q.validUntil ? Math.max(0, Math.ceil((q.validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
                      return (
                        <Link
                          key={q.id}
                          href={`/buyer/quotes/${q.id}`}
                          className="block rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                Quote <span className="font-mono text-muted-foreground">#{formatShortId(q.id)}</span>
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">
                                Vendor <span className="font-mono">{formatShortId(q.vendor_user_id)}</span>
                                {daysLeft !== null ? ` • ${daysLeft}d left` : ''}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn('rounded-full border px-3 py-1', meta.className)}>
                              {meta.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : recentQuotes.length > 0 ? (
                  <div className="space-y-2">
                    {recentQuotes.slice(0, 3).map((q) => {
                      const meta = statusMeta('quote', q.status);
                      return (
                        <Link
                          key={q.id}
                          href={`/buyer/quotes/${q.id}`}
                          className="block rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                Quote <span className="font-mono text-muted-foreground">#{formatShortId(q.id)}</span>
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground truncate">{q.createdAt.toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline" className={cn('rounded-full border px-3 py-1', meta.className)}>
                              {meta.label}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center">
                    <p className="text-sm text-muted-foreground">No quotes yet.</p>
                    <Link href="/buyer/quotes">
                      <Button variant="outline" size="sm" className="mt-3 rounded-xl">
                        Request a quote
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card className="rounded-2xl border-border/70">
              <CardHeader className="pb-3">
                <CardTitle>Quick actions</CardTitle>
                <CardDescription>Jump to common tasks</CardDescription>
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
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Loading conversations…
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-6 text-center">
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Send a message from an order or vendor page.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map((c) => (
                      <Link
                        key={c.id}
                        href="/buyer/messages"
                        className="block rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
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
                              <Badge className="rounded-full">{conversationPreview[c.id]?.unread > 99 ? '99+' : conversationPreview[c.id]?.unread}</Badge>
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
    </main>
  );
}

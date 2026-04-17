'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { AlertCircle, CheckCircle, Clock, XCircle, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function parseQuote(row: any) {
  return {
    id: row.id,
    vendorId: row.vendor_user_id,
    buyerId: row.buyer_id,
    items: [],
    totalAmount: Number(row.total_amount ?? 0),
    validUntil: row.valid_until ? new Date(row.valid_until) : new Date(),
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export default function BuyerQuotesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const buyerId = user?.id ?? 'user-1';
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/buyer/quotes?status=${encodeURIComponent(statusFilter)}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || cancelled) return;
        const rows = Array.isArray(json?.quotes) ? json.quotes : [];
        setQuotes(rows.map(parseQuote));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, user]);

  const filteredQuotes = useMemo(() => quotes.filter((q) => q.buyerId === buyerId), [quotes, buyerId]);

  const stats = {
    total: filteredQuotes.length,
    pending: filteredQuotes.filter(q => q.status === 'pending').length,
    accepted: filteredQuotes.filter(q => q.status === 'accepted').length,
    rejected: filteredQuotes.filter(q => q.status === 'rejected').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    accepted: 'bg-green-500/10 text-green-400',
    rejected: 'bg-red-500/10 text-red-400',
    expired: 'bg-gray-500/10 text-gray-400',
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>
            <p className="text-muted-foreground mt-2">Manage custom quotes from vendors</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Quote
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Quotes</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground mt-1">Accepted</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">Rejected</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'pending', 'accepted', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">Loading quotes…</CardContent>
            </Card>
          ) : filteredQuotes.length > 0 ? (
            filteredQuotes.map(quote => {
              const daysUntilExpiry = Math.ceil((quote.validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = daysUntilExpiry < 0;

              return (
                <Card key={quote.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Quote Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{`Vendor ${quote.vendorId.slice(-6)}`}</h3>
                          <Badge className={statusColors[quote.status]}>
                            <span className="mr-1">{getStatusIcon(quote.status)}</span>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                          {isExpired && (
                            <Badge variant="outline">Expired</Badge>
                          )}
                        </div>

                        {/* Quote Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Quote ID</p>
                            <p className="font-mono text-foreground">{quote.id.slice(-6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p className="font-medium">—</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-bold text-primary">
                              <Money amountUSD={quote.totalAmount} />
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Valid Until</p>
                            <p className={`font-medium ${isExpired ? 'text-red-400' : 'text-foreground'}`}>
                              {quote.validUntil.toLocaleDateString()}
                              {!isExpired && daysUntilExpiry <= 3 && (
                                <span className="text-xs text-yellow-400 block">{daysUntilExpiry} days left</span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Item Preview */}
                        <div className="mt-3 p-2 bg-secondary/50 rounded text-sm space-y-1 max-h-24 overflow-y-auto">
                          <p className="text-xs text-muted-foreground">Open quote details to view items.</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 md:flex-col md:gap-3">
                        {quote.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 md:flex-none md:w-24"
                              onClick={async () => {
                                await fetch(`/api/buyer/quotes/${quote.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'accepted' }),
                                });
                                const res = await fetch(`/api/buyer/quotes?status=${encodeURIComponent(statusFilter)}`);
                                const json = await res.json().catch(() => null);
                                const rows = Array.isArray(json?.quotes) ? json.quotes : [];
                                setQuotes(rows.map(parseQuote));
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 md:flex-none md:w-24"
                              onClick={async () => {
                                await fetch(`/api/buyer/quotes/${quote.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected' }),
                                });
                                const res = await fetch(`/api/buyer/quotes?status=${encodeURIComponent(statusFilter)}`);
                                const json = await res.json().catch(() => null);
                                const rows = Array.isArray(json?.quotes) ? json.quotes : [];
                                setQuotes(rows.map(parseQuote));
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {quote.status === 'accepted' && (
                          <Link href={`/buyer/quotes/${quote.id}`} className="flex-1 md:flex-none">
                            <Button size="sm" className="w-full md:w-auto">
                              Convert to Order
                            </Button>
                          </Link>
                        )}
                        <Link href={`/buyer/quotes/${quote.id}`} className="flex-1 md:flex-none">
                          <Button variant="outline" size="sm" className="w-full md:w-auto">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No quotes found.</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Your First Quote
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

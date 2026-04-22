'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, ClipboardList, Loader2, Search, SlidersHorizontal } from 'lucide-react';

type QuoteRow = {
  id: string;
  buyer_id: string;
  rfq_request_id: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  responded_at: string | null;
  rfq: { title: string; notes: string } | null;
};

function formatShortId(id: string) {
  if (!id) return '—';
  return id.length <= 8 ? id : id.slice(-8);
}

function statusMeta(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending') return { label: 'Action needed', className: 'border-amber-500/40 text-amber-700 dark:text-amber-400' };
  if (s === 'awaiting_buyer') return { label: 'Sent to buyer', className: 'border-sky-500/40 text-sky-700 dark:text-sky-400' };
  if (s === 'accepted') return { label: 'Accepted', className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400' };
  if (s === 'rejected') return { label: 'Declined', className: 'border-red-500/40 text-red-600 dark:text-red-400' };
  return { label: status, className: 'border-border text-muted-foreground' };
}

export default function AdminPlatformQuotesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<'needs_action' | 'sent' | 'closed' | 'all'>('needs_action');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || user.role !== 'admin') return;
      setLoading(true);
      setSetupError(null);
      try {
        const res = await fetch('/api/admin/quotes', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok) {
          setQuotes(Array.isArray(json?.quotes) ? json.quotes : []);
          if (typeof json?.setup_error === 'string' && json.setup_error) {
            setSetupError(json.setup_error);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground text-sm">Admin sign-in required.</div>
    );
  }

  const counts = quotes.reduce(
    (acc, q) => {
      const s = String(q.status || '').toLowerCase();
      acc.all += 1;
      if (s === 'pending') acc.needs_action += 1;
      else if (s === 'awaiting_buyer') acc.sent += 1;
      else acc.closed += 1;
      return acc;
    },
    { needs_action: 0, sent: 0, closed: 0, all: 0 },
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredQuotes = quotes.filter((q) => {
    const s = String(q.status || '').toLowerCase();
    const inStatus =
      activeStatus === 'all'
        ? true
        : activeStatus === 'needs_action'
          ? s === 'pending'
          : activeStatus === 'sent'
            ? s === 'awaiting_buyer'
            : s !== 'pending' && s !== 'awaiting_buyer';

    if (!inStatus) return false;
    if (!normalizedQuery) return true;

    const title = q.rfq?.title?.trim() || '';
    const haystack = `${title} ${q.id} ${q.buyer_id}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Platform listings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">RFQs on admin products</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Buyers can request quotes on catalog SKUs you created (no vendor owner). Those requests land here so you can price
          and respond like any other supplier.
        </p>
      </div>

      {setupError ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {setupError}
        </div>
      ) : null}

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Quotes inbox
              </CardTitle>
              <CardDescription>Track and respond to new RFQ requests</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full">
                {counts.needs_action} need action
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {counts.sent} sent
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {counts.closed} closed
              </Badge>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as any)} className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="needs_action" className="flex-1 sm:flex-none">
                  Needs action
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex-1 sm:flex-none">
                  Sent
                </TabsTrigger>
                <TabsTrigger value="closed" className="flex-1 sm:flex-none">
                  Closed
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 sm:flex-none">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, buyer, or ID…"
                className="pl-9 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No quotes found</p>
              <p className="text-sm text-muted-foreground">
                Try switching tabs or clearing your search.
              </p>
              {quotes.length === 0 ? (
                <p className="text-xs text-muted-foreground">You’ll see new platform RFQs here as buyers request them.</p>
              ) : null}
              {query ? (
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            filteredQuotes.map((q) => {
              const meta = statusMeta(q.status);
              const title = q.rfq?.title?.trim() || `Quote #${formatShortId(q.id)}`;
              return (
                <div
                  key={q.id}
                  className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/60 bg-card/50 p-4 hover:bg-card transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()} · Buyer {formatShortId(q.buyer_id)} · Quote{' '}
                      {formatShortId(q.id)}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="outline" className={`rounded-full ${meta.className}`}>
                        {meta.label}
                      </Badge>
                      <span className="text-sm font-semibold">
                        <Money amount={Number(q.total_amount ?? 0)} />
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/quotes/${q.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 shrink-0 group-hover:bg-accent">
                      Open quote
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

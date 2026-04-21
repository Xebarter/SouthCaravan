'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, ClipboardList, Loader2 } from 'lucide-react';

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
  if (s === 'accepted') return { label: 'Won', className: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400' };
  if (s === 'rejected') return { label: 'Declined', className: 'border-red-500/40 text-red-600 dark:text-red-400' };
  return { label: status, className: 'border-border text-muted-foreground' };
}

export default function VendorQuotesListPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || user.role !== 'vendor') return;
      setLoading(true);
      try {
        const res = await fetch('/api/vendor/quotes', { cache: 'no-store' });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok) {
          setQuotes(Array.isArray(json?.quotes) ? json.quotes : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'vendor') {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground text-sm">Vendor sign-in required.</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Buyer requests</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Quote requests</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          You only see RFQs that include products from your catalog. Open a request, adjust line pricing if needed, and send
          your quote in one click.
        </p>
      </div>

      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            Inbox
          </CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No quote requests yet.</p>
          ) : (
            quotes.map((q) => {
              const meta = statusMeta(q.status);
              const title = q.rfq?.title?.trim() || `Quote #${formatShortId(q.id)}`;
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/60 bg-card/50 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString()} · Buyer {formatShortId(q.buyer_id)}
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
                  <Link href={`/vendor/quotes/${q.id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1 shrink-0">
                      Open
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

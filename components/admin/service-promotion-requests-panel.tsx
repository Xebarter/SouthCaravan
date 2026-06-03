'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Sparkles, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type PromotionRequest = {
  id: string;
  kind: 'featured' | 'ad';
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  admin_note: string;
  offering_id: string;
  provider_user_id: string;
  created_at: string;
  offering: {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    currency: string;
    rate: number;
  } | null;
  provider: {
    id: string;
    email: string;
    company_name: string;
    name: string;
  } | null;
};

const STATUS_META: Record<string, { label: string; badgeCn: string }> = {
  pending: {
    label: 'Pending',
    badgeCn: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  },
  approved: {
    label: 'Approved',
    badgeCn: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
  },
  rejected: { label: 'Rejected', badgeCn: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export function ServicePromotionRequestsPanel() {
  const [items, setItems] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services/promotions', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to load requests');
      const list = Array.isArray(json?.requests) ? (json.requests as PromotionRequest[]) : [];
      setItems(list);
      setNotes((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (next[r.id] == null) next[r.id] = r.admin_note ?? '';
        }
        return next;
      });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load promotion requests');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === 'pending').length;
    const approved = items.filter((i) => i.status === 'approved').length;
    const rejected = items.filter((i) => i.status === 'rejected').length;
    return { total: items.length, pending, approved, rejected };
  }, [items]);

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/services/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: decision, adminNote: notes[id] ?? '' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to update');
      toast.success(decision === 'approved' ? 'Approved' : 'Rejected');
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Review provider requests to mark a service offering as Featured or include it in service ads.
        </p>
        <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-3">
            <p className="text-xl font-bold tabular-nums">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total requests</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-3">
            <p className="text-xl font-bold tabular-nums text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-3">
            <p className="text-xl font-bold tabular-nums text-emerald-600">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="py-3">
            <p className="text-xl font-bold tabular-nums text-red-500">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base">Service promotion requests</CardTitle>
          <CardDescription>Newest first · Featured and ad placements</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading requests…
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No promotion requests yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((r) => {
                const meta = STATUS_META[r.status] ?? STATUS_META.pending;
                const kindLabel = r.kind === 'ad' ? 'Ad' : 'Featured';
                const KindIcon = r.kind === 'ad' ? Megaphone : Sparkles;
                const providerLabel =
                  r.provider?.company_name || r.provider?.name || r.provider?.email || r.provider_user_id;

                return (
                  <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="gap-1.5">
                          <KindIcon className="h-3.5 w-3.5" />
                          {kindLabel}
                        </Badge>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            meta.badgeCn,
                          )}
                        >
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold break-words">
                        {r.offering?.title ?? 'Service offering'}
                      </p>
                      <p className="text-xs text-muted-foreground break-words">
                        {providerLabel}
                        {r.offering?.category ? ` · ${r.offering.category}` : ''}
                        {r.offering?.subcategory ? ` · ${r.offering.subcategory}` : ''}
                      </p>
                      {r.message ? (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-words">
                          {r.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <Textarea
                        value={notes[r.id] ?? ''}
                        onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="Admin note (optional)"
                        className="min-h-16 rounded-xl"
                        disabled={savingId === r.id || r.status !== 'pending'}
                      />
                      {r.admin_note && r.status !== 'pending' ? (
                        <p className="text-xs text-muted-foreground">Admin note saved.</p>
                      ) : null}
                    </div>

                    {r.status === 'pending' ? (
                      <div className="flex flex-wrap gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 rounded-lg"
                          disabled={savingId === r.id}
                          onClick={() => void decide(r.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-lg"
                          disabled={savingId === r.id}
                          onClick={() => void decide(r.id, 'approved')}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

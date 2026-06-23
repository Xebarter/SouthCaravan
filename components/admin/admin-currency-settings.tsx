'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CURRENCIES, formatCurrencyOption } from '@/lib/currencies';
import { useCurrencyOptional } from '@/components/currency/currency-provider';

type ManualRate = {
  currency_code: string;
  rate_from_usd: number;
  manual_override: boolean;
};

export function AdminCurrencySettings() {
  const ctx = useCurrencyOptional();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [refreshMinutes, setRefreshMinutes] = useState(60);
  const [showUsdReference, setShowUsdReference] = useState(true);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [manualRates, setManualRates] = useState<ManualRate[]>([]);
  const [overrideCode, setOverrideCode] = useState('KES');
  const [overrideRate, setOverrideRate] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/currency', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      const cfg = data.config;
      setDefaultCurrency(cfg.default_currency ?? 'USD');
      setRefreshMinutes(cfg.refresh_interval_minutes ?? 60);
      setShowUsdReference(Boolean(cfg.show_usd_reference));
      setEnabled(Array.isArray(cfg.enabled_currencies) ? cfg.enabled_currencies : []);
      setManualRates(data.manualRates ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load currency settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveConfig() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCurrency,
          refreshIntervalMinutes: refreshMinutes,
          showUsdReference,
          enabledCurrencies: enabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      toast.success('Currency settings saved');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveOverride() {
    const rate = Number(overrideRate);
    if (!overrideCode || !Number.isFinite(rate) || rate <= 0) {
      toast.error('Enter a valid rate');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/currency', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualRate: { currencyCode: overrideCode, rateFromUsd: rate } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(`Manual rate set for ${overrideCode}`);
      setOverrideRate('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  function toggleCurrency(code: string, on: boolean) {
    setEnabled((prev) => {
      const set = new Set(prev);
      if (on) set.add(code);
      else set.delete(code);
      return [...set];
    });
  }

  if (loading) {
    return (
      <div className="py-16 flex justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading currency settings…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Global Currency Management</CardTitle>
          <CardDescription>
            Platform default, supported currencies, exchange rate refresh, and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform default currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{formatCurrencyOption(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rate refresh interval (minutes)</Label>
              <Input
                type="number"
                min={15}
                value={refreshMinutes}
                onChange={(e) => setRefreshMinutes(Number(e.target.value) || 60)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={showUsdReference} onCheckedChange={setShowUsdReference} />
            <Label className="font-normal">Show USD reference alongside converted prices</Label>
          </div>

          <div className="space-y-2">
            <Label>Enabled currencies ({enabled.length})</Label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
              {CURRENCIES.map((c) => {
                const on = enabled.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleCurrency(c.code, !on)}
                    className="focus:outline-none"
                  >
                    <Badge variant={on ? 'default' : 'outline'}>{c.code}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => void saveConfig()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save settings
            </Button>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Manual exchange rate overrides</CardTitle>
          <CardDescription>
            Override live rates for specific currencies. Rates are USD-based (1 USD = X units).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select value={overrideCode} onValueChange={setOverrideCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-64">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Rate from USD"
              value={overrideRate}
              onChange={(e) => setOverrideRate(e.target.value)}
            />
            <Button onClick={() => void saveOverride()} disabled={saving}>Set override</Button>
          </div>

          {manualRates.length > 0 ? (
            <div className="space-y-2">
              {manualRates.map((r) => (
                <div key={r.currency_code} className="flex justify-between text-sm border rounded-md px-3 py-2">
                  <span className="font-medium">{r.currency_code}</span>
                  <span className="tabular-nums">{Number(r.rate_from_usd).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No manual overrides. Live rates from open.er-api.com are used.</p>
          )}

          {ctx ? (
            <p className="text-xs text-muted-foreground">
              Preview: displaying as {ctx.displayCurrency} (source: {ctx.displaySource.replace(/_/g, ' ')})
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

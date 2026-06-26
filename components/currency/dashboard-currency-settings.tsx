'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES, formatCurrencyOption } from '@/lib/currencies';
import { useCurrencyOptional } from '@/components/currency/currency-provider';

type Props = {
  apiBase: '/api/vendor/currency' | '/api/services/currency';
  title?: string;
  description?: string;
};

export function DashboardCurrencySettings({
  title = 'Currency preferences',
  description = 'Choose how prices, earnings, and reports are displayed in your dashboard.',
}: Props) {
  const ctx = useCurrencyOptional();
  const [saving, setSaving] = useState(false);
  const [dashboardCurrency, setDashboardCurrency] = useState('AUTO');
  const [pricingCurrency, setPricingCurrency] = useState('USD');

  useEffect(() => {
    if (!ctx) return;
    setDashboardCurrency(ctx.preference || 'AUTO');
    if (ctx.pricingCurrency) setPricingCurrency(ctx.pricingCurrency);
  }, [ctx?.preference, ctx?.pricingCurrency]);

  const currencyOptions = CURRENCIES.filter(
    (c) => !ctx?.enabledCurrencies.length || ctx.enabledCurrencies.some((e) => e.code === c.code),
  );

  async function save() {
    if (!ctx) return;
    setSaving(true);
    try {
      await ctx.updateDashboardCurrencySettings({ dashboardCurrency, pricingCurrency });
      toast.success('Currency preferences saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!ctx?.dashboardSettingsReady) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Dashboard display currency</Label>
            <Select value={dashboardCurrency} onValueChange={setDashboardCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Auto-detect (recommended)</SelectItem>
                {currencyOptions.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{formatCurrencyOption(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used for revenue, analytics, and reports in this dashboard. Also shown in the header currency selector.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Base pricing currency</Label>
            <Select value={pricingCurrency} onValueChange={setPricingCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencyOptions.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{formatCurrencyOption(c)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default currency for new listings. Existing completed orders keep their original currency.
            </p>
          </div>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save currency preferences
        </Button>
      </CardContent>
    </Card>
  );
}

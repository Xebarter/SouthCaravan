import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-require';
import { invalidatePlatformCurrencyConfigCache, getPlatformCurrencyConfig } from '@/lib/currency/config';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeCurrencyCode } from '@/lib/currency/types';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const config = await getPlatformCurrencyConfig();

  const { data: rates, error: ratesErr } = await supabaseAdmin
    .from('currency_exchange_rates')
    .select('currency_code, rate_from_usd, manual_override, updated_at')
    .order('currency_code');

  if (ratesErr && !String(ratesErr.message).includes('does not exist')) {
    return NextResponse.json({ error: ratesErr.message }, { status: 500 });
  }

  return NextResponse.json({ config, manualRates: rates ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.defaultCurrency === 'string') {
    patch.default_currency = normalizeCurrencyCode(body.defaultCurrency);
  }
  if (typeof body.rateProvider === 'string') patch.rate_provider = body.rateProvider.trim();
  if (typeof body.refreshIntervalMinutes === 'number') {
    patch.refresh_interval_minutes = Math.max(15, Math.floor(body.refreshIntervalMinutes));
  }
  if (Array.isArray(body.enabledCurrencies)) {
    patch.enabled_currencies = body.enabledCurrencies
      .map((c: string) => normalizeCurrencyCode(c))
      .filter(Boolean);
  }
  if (typeof body.showUsdReference === 'boolean') patch.show_usd_reference = body.showUsdReference;

  if (Object.keys(patch).length > 0) {
    const { error } = await supabaseAdmin
      .from('platform_currency_config')
      .update(patch)
      .eq('id', 'default');

    if (error) {
      if (String(error.message).includes('does not exist')) {
        return NextResponse.json(
          { error: 'Run supabase/currency-platform.sql migration first.' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.manualRate && typeof body.manualRate === 'object') {
    const code = normalizeCurrencyCode(body.manualRate.currencyCode);
    const rate = Number(body.manualRate.rateFromUsd);
    if (code && Number.isFinite(rate) && rate > 0) {
      const { error: rateErr } = await supabaseAdmin.from('currency_exchange_rates').upsert(
        {
          currency_code: code,
          rate_from_usd: rate,
          manual_override: true,
        },
        { onConflict: 'currency_code' },
      );
      if (rateErr) return NextResponse.json({ error: rateErr.message }, { status: 500 });
    }
  }

  if (typeof body.removeManualRate === 'string') {
    const code = normalizeCurrencyCode(body.removeManualRate);
    await supabaseAdmin.from('currency_exchange_rates').delete().eq('currency_code', code);
  }

  invalidatePlatformCurrencyConfigCache();
  const config = await getPlatformCurrencyConfig();
  return NextResponse.json({ config });
}

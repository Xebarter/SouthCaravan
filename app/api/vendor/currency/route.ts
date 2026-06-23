import { NextRequest, NextResponse } from 'next/server';
import { getAuthedVendor } from '@/lib/api/vendor-auth';
import { getPlatformCurrencyConfig, isCurrencyEnabled } from '@/lib/currency/config';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeCurrencyCode } from '@/lib/currency/types';

export async function GET() {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('dashboard_currency, pricing_currency')
    .eq('id', auth.vendorId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config = await getPlatformCurrencyConfig();

  return NextResponse.json({
    dashboardCurrency: data?.dashboard_currency ?? 'AUTO',
    pricingCurrency: data?.pricing_currency ?? config.default_currency,
    enabledCurrencies: config.enabled_currencies,
    defaultCurrency: config.default_currency,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const config = await getPlatformCurrencyConfig();
  const patch: Record<string, string> = {};

  if (typeof body.dashboardCurrency === 'string') {
    const v = body.dashboardCurrency.trim().toUpperCase();
    if (v !== 'AUTO' && !isCurrencyEnabled(v, config)) {
      return NextResponse.json({ error: 'Currency is not enabled platform-wide' }, { status: 422 });
    }
    patch.dashboard_currency = v || 'AUTO';
  }

  if (typeof body.pricingCurrency === 'string') {
    const v = normalizeCurrencyCode(body.pricingCurrency);
    if (!isCurrencyEnabled(v, config)) {
      return NextResponse.json({ error: 'Currency is not enabled platform-wide' }, { status: 422 });
    }
    patch.pricing_currency = v;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update(patch)
    .eq('id', auth.vendorId)
    .select('dashboard_currency, pricing_currency')
    .single();

  if (error) {
    if (String(error.message).includes('dashboard_currency')) {
      return NextResponse.json(
        { error: 'Run supabase/currency-platform.sql migration first.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    dashboardCurrency: data.dashboard_currency,
    pricingCurrency: data.pricing_currency,
  });
}

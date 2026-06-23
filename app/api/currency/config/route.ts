import { NextRequest, NextResponse } from 'next/server';
import { getPlatformCurrencyConfig } from '@/lib/currency/config';
import { getExchangeRates } from '@/lib/currency/rates';
import { CURRENCIES } from '@/lib/currencies';

export async function GET() {
  const [config, rates] = await Promise.all([
    getPlatformCurrencyConfig(),
    getExchangeRates('USD'),
  ]);

  const enabled = new Set(config.enabled_currencies.map((c) => c.toUpperCase()));
  const currencies = CURRENCIES.filter((c) => enabled.has(c.code));

  return NextResponse.json({
    config: {
      defaultCurrency: config.default_currency,
      rateProvider: config.rate_provider,
      refreshIntervalMinutes: config.refresh_interval_minutes,
      enabledCurrencies: config.enabled_currencies,
      showUsdReference: config.show_usd_reference,
    },
    rates: {
      base: rates.base,
      source: rates.source,
      updatedAt: rates.updatedAt,
      // Only send enabled currencies to reduce payload
      values: Object.fromEntries(
        config.enabled_currencies
          .map((code) => [code, rates.rates[code] ?? null])
          .filter(([, v]) => typeof v === 'number'),
      ),
    },
    currencies,
  });
}

export async function POST(req: NextRequest) {
  let body: { amount?: number; from?: string; to?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  const from = String(body.from ?? 'USD').toUpperCase();
  const to = String(body.to ?? 'USD').toUpperCase();

  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: 'amount must be a number' }, { status: 400 });
  }

  const { convertCurrencyAmount } = await import('@/lib/currency/rates');
  const result = await convertCurrencyAmount(amount, from, to);

  return NextResponse.json({
    amount,
    from,
    to,
    converted: result.amount,
    rate: result.rate,
  });
}

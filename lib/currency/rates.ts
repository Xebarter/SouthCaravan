import { getCached } from '@/lib/memory-cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeCurrencyCode } from '@/lib/currency/types';
import { getPlatformCurrencyConfig } from '@/lib/currency/config';

/** Static fallback rates (USD base) when upstream + DB unavailable. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  KES: 129,
  UGX: 3700,
  TZS: 2550,
  RWF: 1280,
  ZAR: 18.5,
  NGN: 1550,
  GHS: 14.5,
  INR: 83.12,
  CNY: 7.24,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.88,
  AED: 3.67,
  SAR: 3.75,
};

type RatesPayload = {
  base: string;
  rates: Record<string, number>;
  source: 'live' | 'db_override' | 'fallback';
  updatedAt: number | null;
};

async function fetchLiveRatesFromProvider(base: string): Promise<Record<string, number> | null> {
  const upperBase = normalizeCurrencyCode(base);
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(upperBase)}`, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number>; time_last_update_unix?: number };
    if (!data?.rates || typeof data.rates !== 'object') return null;
    const rates: Record<string, number> = { [upperBase]: 1 };
    for (const [code, rate] of Object.entries(data.rates)) {
      if (typeof rate === 'number' && rate > 0) rates[normalizeCurrencyCode(code)] = rate;
    }
    return rates;
  } catch {
    return null;
  }
}

async function loadManualOverrides(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin
    .from('currency_exchange_rates')
    .select('currency_code, rate_from_usd, manual_override')
    .eq('manual_override', true);

  if (error) {
    const msg = String(error.message ?? '').toLowerCase();
    if (msg.includes('does not exist')) return {};
    console.error('[loadManualOverrides]', error.message);
    return {};
  }

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const code = normalizeCurrencyCode(row.currency_code);
    const rate = Number(row.rate_from_usd);
    if (rate > 0) out[code] = rate;
  }
  return out;
}

export async function getExchangeRates(base = 'USD'): Promise<RatesPayload> {
  const upperBase = normalizeCurrencyCode(base);
  const config = await getPlatformCurrencyConfig();
  const cacheTtl = Math.max(60, config.refresh_interval_minutes * 60) * 1000;
  const cacheKey = `fx-rates-v2:${upperBase}`;

  return getCached(cacheKey, cacheTtl, async () => {
    const live = await fetchLiveRatesFromProvider(upperBase);
    const overrides = await loadManualOverrides();

    if (live) {
      const merged = { ...live, ...overrides, [upperBase]: 1 };
      return {
        base: upperBase,
        rates: merged,
        source: Object.keys(overrides).length > 0 ? 'db_override' as const : 'live' as const,
        updatedAt: Date.now(),
      };
    }

  if (Object.keys(overrides).length > 0) {
      return { base: upperBase, rates: { ...FALLBACK_RATES, ...overrides, [upperBase]: 1 }, source: 'db_override', updatedAt: Date.now() };
    }

    return { base: upperBase, rates: { ...FALLBACK_RATES, [upperBase]: 1 }, source: 'fallback', updatedAt: null };
  });
}

export function convertWithRates(
  amount: number,
  fromCode: string,
  toCode: string,
  rates: Record<string, number>,
  base = 'USD',
): number {
  const from = normalizeCurrencyCode(fromCode);
  const to = normalizeCurrencyCode(toCode);
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;

  const upperBase = normalizeCurrencyCode(base);
  const rateFrom = from === upperBase ? 1 : rates[from];
  const rateTo = to === upperBase ? 1 : rates[to];

  if (typeof rateFrom !== 'number' || typeof rateTo !== 'number' || rateFrom <= 0 || rateTo <= 0) {
    return amount;
  }

  const amountInBase = from === upperBase ? amount : amount / rateFrom;
  return to === upperBase ? amountInBase : amountInBase * rateTo;
}

export async function convertCurrencyAmount(
  amount: number,
  fromCode: string,
  toCode: string,
): Promise<{ amount: number; rate: number }> {
  const from = normalizeCurrencyCode(fromCode);
  const to = normalizeCurrencyCode(toCode);
  if (from === to) return { amount, rate: 1 };

  const { rates } = await getExchangeRates('USD');
  const converted = convertWithRates(amount, from, to, rates, 'USD');
  const oneUnit = convertWithRates(1, from, to, rates, 'USD');
  return { amount: converted, rate: oneUnit };
}

export async function buildCurrencySnapshot(
  originalAmount: number,
  originalCurrency: string,
  displayCurrency: string,
): Promise<import('@/lib/currency/types').CurrencySnapshot> {
  const original = normalizeCurrencyCode(originalCurrency);
  const display = normalizeCurrencyCode(displayCurrency);
  const { amount, rate } = await convertCurrencyAmount(originalAmount, original, display);
  return {
    originalAmount,
    originalCurrency: original,
    displayAmount: amount,
    displayCurrency: display,
    exchangeRate: rate,
  };
}

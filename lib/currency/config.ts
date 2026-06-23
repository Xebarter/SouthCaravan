import { getCached, clearAllCached } from '@/lib/memory-cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { PlatformCurrencyConfig } from '@/lib/currency/types';
import { normalizeCurrencyCode } from '@/lib/currency/types';

const CONFIG_CACHE_KEY = 'platform-currency-config-v1';
const CONFIG_CACHE_TTL = 60_000;

const DEFAULT_CONFIG: PlatformCurrencyConfig = {
  id: 'default',
  default_currency: 'USD',
  rate_provider: 'open.er-api.com',
  refresh_interval_minutes: 60,
  enabled_currencies: [
    'USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'ZAR', 'NGN', 'GHS', 'INR', 'CNY', 'JPY', 'AUD', 'CAD',
  ],
  show_usd_reference: true,
};

export async function getPlatformCurrencyConfig(): Promise<PlatformCurrencyConfig> {
  return getCached(CONFIG_CACHE_KEY, CONFIG_CACHE_TTL, async () => {
    const { data, error } = await supabaseAdmin
      .from('platform_currency_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      const msg = String(error?.message ?? '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('platform_currency_config')) {
        return DEFAULT_CONFIG;
      }
      console.error('[getPlatformCurrencyConfig]', error?.message);
      return DEFAULT_CONFIG;
    }

    return {
      id: String(data.id),
      default_currency: normalizeCurrencyCode(data.default_currency, 'USD'),
      rate_provider: String(data.rate_provider ?? 'open.er-api.com'),
      refresh_interval_minutes: Number(data.refresh_interval_minutes) || 60,
      enabled_currencies: Array.isArray(data.enabled_currencies)
        ? data.enabled_currencies.map((c: string) => normalizeCurrencyCode(c)).filter(Boolean)
        : DEFAULT_CONFIG.enabled_currencies,
      show_usd_reference: Boolean(data.show_usd_reference ?? true),
      updated_at: data.updated_at,
    };
  });
}

export function invalidatePlatformCurrencyConfigCache() {
  clearAllCached();
}

export function isCurrencyEnabled(code: string, config: PlatformCurrencyConfig): boolean {
  const c = normalizeCurrencyCode(code);
  return config.enabled_currencies.includes(c);
}

export async function getDefaultPlatformCurrency(): Promise<string> {
  const config = await getPlatformCurrencyConfig();
  return config.default_currency;
}

export type CurrencyPortal = 'storefront' | 'buyer' | 'vendor' | 'services' | 'admin';

export type PlatformCurrencyConfig = {
  id: string;
  default_currency: string;
  rate_provider: string;
  refresh_interval_minutes: number;
  enabled_currencies: string[];
  show_usd_reference: boolean;
  updated_at?: string;
};

export type CurrencyRateRow = {
  currency_code: string;
  rate_from_usd: number;
  manual_override: boolean;
  updated_at?: string;
};

export type CurrencySnapshot = {
  originalAmount: number;
  originalCurrency: string;
  displayAmount: number;
  displayCurrency: string;
  exchangeRate: number;
};

export type ResolvedDisplayCurrency = {
  code: string;
  source:
    | 'user_preference'
    | 'dashboard_setting'
    | 'geo_detected'
    | 'locale_detected'
    | 'platform_default'
    | 'usd_fallback';
};

export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND']);

export function normalizeCurrencyCode(code: string | null | undefined, fallback = 'USD'): string {
  const c = String(code ?? '').trim().toUpperCase();
  return c.length === 3 ? c : fallback;
}

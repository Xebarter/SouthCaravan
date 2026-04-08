export type CurrencyCode = string;

// Best-effort mapping from region (ISO 3166-1 alpha-2) to currency code (ISO 4217).
// This is intentionally small and safe: unknown regions fall back to USD.
const REGION_TO_CURRENCY: Record<string, CurrencyCode> = {
  // Americas
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  BR: 'BRL',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  PE: 'PEN',

  // Europe
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  CY: 'EUR',
  MT: 'EUR',
  LU: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
  EE: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  HR: 'EUR',
  RO: 'RON',
  BG: 'BGN',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  IS: 'ISK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  TR: 'TRY',
  UA: 'UAH',
  RU: 'RUB',

  // Africa
  ZA: 'ZAR',
  NG: 'NGN',
  GH: 'GHS',
  KE: 'KES',
  UG: 'UGX',
  TZ: 'TZS',
  EG: 'EGP',
  MA: 'MAD',
  DZ: 'DZD',
  TN: 'TND',
  ET: 'ETB',
  RW: 'RWF',

  // Middle East
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  JO: 'JOD',
  LB: 'LBP',
  IQ: 'IQD',

  // Asia-Pacific
  IN: 'INR',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  TW: 'TWD',
  HK: 'HKD',
  SG: 'SGD',
  MY: 'MYR',
  TH: 'THB',
  PH: 'PHP',
  ID: 'IDR',
  VN: 'VND',
  AU: 'AUD',
  NZ: 'NZD',
};

function safeExtractRegionFromLocale(locale: string): string | null {
  // Examples:
  // - en-US -> US
  // - fr-FR -> FR
  // - en-GB -> GB
  // - zh-Hant-HK -> HK (best effort)
  const parts = locale.split('-').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    if (part.length === 2 && /^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return null;
}

export function detectUserCurrencyCode(
  locale: string | undefined,
  fallback: CurrencyCode = 'USD',
): CurrencyCode {
  if (!locale) return fallback;

  // Prefer Intl.Locale when available to get region more reliably.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IntlAny: any = Intl as any;
    if (typeof IntlAny?.Locale === 'function') {
      const loc = new IntlAny.Locale(locale);
      const region = typeof loc?.region === 'string' ? loc.region.toUpperCase() : null;
      if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
    }
  } catch {
    // Ignore and fall back to string parsing.
  }

  const region = safeExtractRegionFromLocale(locale);
  if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
  return fallback;
}


import { ZERO_DECIMAL_CURRENCIES, THREE_DECIMAL_CURRENCIES, normalizeCurrencyCode } from '@/lib/currency/types';

export function getCurrencyFractionDigits(code: string): number {
  const c = normalizeCurrencyCode(code);
  if (ZERO_DECIMAL_CURRENCIES.has(c)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(c)) return 3;
  return 2;
}

export function formatMoneyAmount(
  amount: number,
  currency: string,
  locale?: string,
  notation: 'standard' | 'compact' = 'standard',
): string {
  const code = normalizeCurrencyCode(currency);
  const loc = locale || 'en-US';
  const digits = getCurrencyFractionDigits(code);

  try {
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency: code,
      notation,
      compactDisplay: notation === 'compact' ? 'short' : undefined,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString(loc, { maximumFractionDigits: digits })}`;
  }
}

/** Compact display for selectors: "UGX - Ugandan Shilling" */
export function formatCurrencyLabel(code: string, name?: string): string {
  const c = normalizeCurrencyCode(code);
  return name ? `${c} — ${name}` : c;
}

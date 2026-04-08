'use client';

import { useMemo } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

type MoneyProps = {
  /** Amount in base currency. Prefer `amount` + `baseCurrency`. */
  amountUSD?: number;
  amount?: number;
  baseCurrency?: string;
  className?: string;
  showUsdInBrackets?: boolean;
  notation?: 'standard' | 'compact';
};

function formatCurrencySafe(
  value: number,
  currency: string,
  locale: string | undefined,
  notation: 'standard' | 'compact',
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation,
      compactDisplay: notation === 'compact' ? 'short' : undefined,
      maximumFractionDigits: notation === 'compact' ? 1 : 2,
    }).format(value);
  } catch {
    // If a currency code is invalid in the runtime, fall back gracefully.
    return value.toLocaleString(locale ?? 'en-US', { maximumFractionDigits: 2 });
  }
}

export function Money({
  amountUSD,
  amount,
  baseCurrency = 'USD',
  className,
  showUsdInBrackets = true,
  notation = 'standard',
}: MoneyProps) {
  const { selectedCurrency, convertCurrency } = useCurrency('AUTO');
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

  const normalizedBase = baseCurrency.toUpperCase();
  const normalizedAmount =
    typeof amount === 'number' && Number.isFinite(amount) ? amount : (amountUSD ?? 0);

  const localAmount = useMemo(() => {
    if (!Number.isFinite(normalizedAmount)) return 0;
    if (selectedCurrency === normalizedBase) return normalizedAmount;
    return convertCurrency(normalizedAmount, normalizedBase, selectedCurrency);
  }, [normalizedAmount, normalizedBase, convertCurrency, selectedCurrency]);

  const localFormatted = useMemo(
    () => formatCurrencySafe(localAmount, selectedCurrency, locale, notation),
    [localAmount, selectedCurrency, locale, notation],
  );
  const usdAmount = useMemo(
    () => convertCurrency(normalizedAmount, normalizedBase, 'USD'),
    [normalizedAmount, normalizedBase, convertCurrency],
  );
  const usdFormatted = useMemo(() => formatCurrencySafe(usdAmount, 'USD', locale, notation), [usdAmount, locale, notation]);

  return (
    <span className={cn('inline-flex items-baseline gap-1 tabular-nums', className)}>
      <span>{localFormatted}</span>
      {showUsdInBrackets && selectedCurrency !== 'USD' && (
        <span className="text-[0.78em] font-normal text-muted-foreground/70">({usdFormatted})</span>
      )}
    </span>
  );
}


'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Important: this component is server-rendered (even as a Client Component).
  // To avoid hydration mismatches, keep the first render deterministic and only
  // switch to user/auto locale-currency after mount.
  const locale = hasMounted ? navigator.language : 'en-US';

  const normalizedBase = baseCurrency.toUpperCase();
  const displayCurrency = hasMounted ? selectedCurrency : normalizedBase;
  const normalizedAmount =
    typeof amount === 'number' && Number.isFinite(amount) ? amount : (amountUSD ?? 0);

  const localAmount = useMemo(() => {
    if (!Number.isFinite(normalizedAmount)) return 0;
    if (displayCurrency === normalizedBase) return normalizedAmount;
    return convertCurrency(normalizedAmount, normalizedBase, displayCurrency);
  }, [normalizedAmount, normalizedBase, convertCurrency, displayCurrency]);

  const localFormatted = useMemo(
    () => formatCurrencySafe(localAmount, displayCurrency, locale, notation),
    [localAmount, displayCurrency, locale, notation],
  );
  const usdAmount = useMemo(
    () => convertCurrency(normalizedAmount, normalizedBase, 'USD'),
    [normalizedAmount, normalizedBase, convertCurrency],
  );
  const usdFormatted = useMemo(
    () => formatCurrencySafe(usdAmount, 'USD', locale, notation),
    [usdAmount, locale, notation],
  );

  return (
    <span
      className={cn(
        // Mobile-first: stack to avoid cramped inline prices.
        // Desktop+: show inline to reduce vertical noise in dense tables.
        'inline-flex flex-col items-start gap-0.5 leading-tight tabular-nums sm:flex-row sm:items-baseline sm:gap-1.5',
        className,
      )}
    >
      <span className="font-semibold tracking-tight text-foreground">{localFormatted}</span>
      {hasMounted && showUsdInBrackets && selectedCurrency !== 'USD' && (
        <span className="text-[0.78em] font-medium text-muted-foreground/70 sm:font-normal">
          <span className="sr-only">USD </span>({usdFormatted})
        </span>
      )}
    </span>
  );
}


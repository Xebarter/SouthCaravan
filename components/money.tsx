'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrency } from '@/hooks/use-currency';
import { formatMoneyAmount } from '@/lib/currency/format';
import { cn } from '@/lib/utils';

type MoneyProps = {
  amountUSD?: number;
  amount?: number;
  baseCurrency?: string;
  className?: string;
  notation?: 'standard' | 'compact';
};

export function Money({
  amountUSD,
  amount,
  baseCurrency = 'USD',
  className,
  notation = 'standard',
}: MoneyProps) {
  const { selectedCurrency, convertCurrency } = useCurrency('AUTO');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    () => formatMoneyAmount(localAmount, displayCurrency, locale, notation),
    [localAmount, displayCurrency, locale, notation],
  );

  return (
    <span
      className={cn(
        'inline-flex items-baseline leading-tight tabular-nums',
        className,
      )}
    >
      <span className="font-semibold tracking-tight text-foreground">{localFormatted}</span>
    </span>
  );
}

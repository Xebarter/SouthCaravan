import { useCallback, useEffect, useMemo, useState } from 'react';
import { CURRENCIES, Currency, getCurrencyByCode } from '@/lib/currencies';
import { detectUserCurrencyCode } from '@/lib/currency-detection';
import { getSavedCurrencyPreference, saveCurrencyPreference } from '@/lib/currency-preference';
import { useCurrencyOptional } from '@/components/currency/currency-provider';
import { useFxRates } from '@/hooks/use-fx-rates';

/** @deprecated Prefer useCurrencyContext from CurrencyProvider. This hook bridges legacy callers. */
export const useCurrency = (initialCurrency: string = 'AUTO') => {
  const ctx = useCurrencyOptional();

  const [preference, setPreference] = useState(() => {
    if (initialCurrency && initialCurrency !== 'AUTO') return initialCurrency;
    return getSavedCurrencyPreference('AUTO');
  });

  const [geoCurrency, setGeoCurrency] = useState<string | null>(null);
  const fx = useFxRates('USD');

  useEffect(() => {
    if (ctx) return;
    if (preference !== 'AUTO') return;
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch('/api/geo/currency', { signal: controller.signal });
        const data = (await res.json()) as { currency?: string | null };
        if (data?.currency) setGeoCurrency(String(data.currency).toUpperCase());
      } catch { /* ignore */ }
    })();
    return () => controller.abort();
  }, [preference, ctx]);

  const effectiveCurrencyCode = useMemo(() => {
    if (ctx) return ctx.displayCurrency;
    if (preference !== 'AUTO') return preference;
    return (
      geoCurrency ||
      detectUserCurrencyCode(typeof navigator !== 'undefined' ? navigator.language : undefined, 'USD')
    );
  }, [ctx, preference, geoCurrency]);

  const currency = getCurrencyByCode(effectiveCurrencyCode);

  const convertCurrency = useCallback(
    (amount: number, fromCode: string, toCode: string) => {
      if (ctx) return ctx.convert(amount, fromCode, toCode);
      const from = (fromCode || 'USD').toUpperCase();
      const to = (toCode || 'USD').toUpperCase();
      if (!Number.isFinite(amount) || from === to) return amount;

      const liveRates = fx?.ok && fx.rates ? fx.rates : null;
      if (liveRates) {
        const rateFrom = from === 'USD' ? 1 : liveRates[from];
        const rateTo = to === 'USD' ? 1 : liveRates[to];
        if (typeof rateFrom === 'number' && typeof rateTo === 'number' && rateFrom > 0) {
          const amountUSD = from === 'USD' ? amount : amount / rateFrom;
          return to === 'USD' ? amountUSD : amountUSD * rateTo;
        }
      }

      const exchangeRates: Record<string, number> = {
        USD: 1, EUR: 0.92, GBP: 0.79, KES: 129, UGX: 3700, TZS: 2550, RWF: 1280,
      };
      const fromRate = exchangeRates[from] || 1;
      const toRate = exchangeRates[to] || 1;
      const amountUSD = from === 'USD' ? amount : amount / fromRate;
      return to === 'USD' ? amountUSD : amountUSD * toRate;
    },
    [ctx, fx],
  );

  const formatPrice = useCallback(
    (amount: number, includeSymbol = true) => {
      if (ctx) return ctx.format(amount);
      const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (includeSymbol && currency) return `${currency.symbol}${formatted}`;
      return formatted;
    },
    [ctx, currency],
  );

  const setSelectedCurrency = useCallback(
    (next: string) => {
      if (ctx) {
        ctx.setPreference(next);
        return;
      }
      setPreference(next);
      saveCurrencyPreference(next);
    },
    [ctx],
  );

  return {
    selectedCurrency: effectiveCurrencyCode,
    currencyPreference: ctx?.preference ?? preference,
    setSelectedCurrency,
    currency,
    formatPrice,
    convertCurrency,
    allCurrencies: ctx?.enabledCurrencies ?? CURRENCIES,
  };
};

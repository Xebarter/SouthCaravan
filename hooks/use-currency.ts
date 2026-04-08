import { useEffect, useMemo, useState, useCallback } from 'react';
import { CURRENCIES, Currency, getCurrencyByCode } from '@/lib/currencies';
import { detectUserCurrencyCode } from '@/lib/currency-detection';
import { getSavedCurrencyPreference, saveCurrencyPreference, type CurrencyPreference } from '@/lib/currency-preference';
import { useFxRates } from '@/hooks/use-fx-rates';

export const useCurrency = (initialCurrency: string = 'AUTO') => {
  const [preference, setPreference] = useState<CurrencyPreference>(() => {
    // If caller passed explicit currency, respect it.
    if (initialCurrency && initialCurrency !== 'AUTO') return initialCurrency;
    return getSavedCurrencyPreference('AUTO');
  });

  const [geoCurrency, setGeoCurrency] = useState<string | null>(null);

  useEffect(() => {
    if (preference !== 'AUTO') return;
    if (typeof window === 'undefined') return;

    const cacheKey = 'southcaravan_geo_currency_cache_v1';
    const now = Date.now();
    const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

    try {
      const cachedRaw = window.sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { currency?: string; savedAt?: number };
        if (cached?.currency && typeof cached.savedAt === 'number' && now - cached.savedAt < MAX_AGE_MS) {
          setGeoCurrency(String(cached.currency).toUpperCase());
          return;
        }
      }
    } catch {
      // ignore cache errors
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const res = await fetch('/api/geo/currency', { signal: controller.signal });
        const data = (await res.json()) as { currency?: string | null };
        const currency = typeof data?.currency === 'string' ? data.currency.toUpperCase() : null;
        if (currency) {
          setGeoCurrency(currency);
          try {
            window.sessionStorage.setItem(cacheKey, JSON.stringify({ currency, savedAt: now }));
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore; fall back to locale
      }
    })();

    return () => controller.abort();
  }, [preference]);

  const effectiveCurrencyCode = useMemo(() => {
    if (preference !== 'AUTO') return preference;
    return (
      geoCurrency ||
      detectUserCurrencyCode(typeof navigator !== 'undefined' ? navigator.language : undefined, 'USD')
    );
  }, [preference, geoCurrency]);

  const currency = getCurrencyByCode(effectiveCurrencyCode);
  const fx = useFxRates('USD');

  const formatPrice = useCallback((amount: number, includeSymbol = true) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (includeSymbol && currency) {
      return `${currency.symbol}${formatted}`;
    }
    return formatted;
  }, [currency]);

  const convertCurrency = useCallback((amount: number, fromCode: string, toCode: string) => {
    const from = (fromCode || 'USD').toUpperCase();
    const to = (toCode || 'USD').toUpperCase();
    if (!Number.isFinite(amount)) return 0;
    if (from === to) return amount;

    // Prefer live rates (base USD).
    const liveRates = fx?.ok && fx.rates ? fx.rates : null;
    if (liveRates) {
      // With USD base, convert via USD pivot:
      // amount(from) -> USD -> to
      const rateFrom = from === 'USD' ? 1 : liveRates[from];
      const rateTo = to === 'USD' ? 1 : liveRates[to];
      if (typeof rateFrom === 'number' && typeof rateTo === 'number' && rateFrom > 0) {
        const amountUSD = from === 'USD' ? amount : amount / rateFrom;
        return to === 'USD' ? amountUSD : amountUSD * rateTo;
      }
    }

    // Fallback: small placeholder table so UI still works offline/dev.
    const exchangeRates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      AUD: 1.53,
      CAD: 1.36,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.12,
      BRL: 4.97,
    };

    const fromRate = exchangeRates[from] || 1;
    const toRate = exchangeRates[to] || 1;
    const amountUSD = from === 'USD' ? amount : amount / fromRate;
    return to === 'USD' ? amountUSD : amountUSD * toRate;
  }, [fx]);

  return {
    selectedCurrency: effectiveCurrencyCode, // what the app is currently using
    currencyPreference: preference, // 'AUTO' or explicit ISO code
    setSelectedCurrency: (next: string) => {
      setPreference(next);
      saveCurrencyPreference(next);
    },
    currency,
    formatPrice,
    convertCurrency,
    allCurrencies: CURRENCIES,
  };
};

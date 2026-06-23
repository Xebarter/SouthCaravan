'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { CURRENCIES, type Currency } from '@/lib/currencies';
import { detectUserCurrencyCode } from '@/lib/currency-detection';
import { formatMoneyAmount } from '@/lib/currency/format';
import { getSavedCurrencyPreference, saveCurrencyPreference } from '@/lib/currency-preference';
import { getDashboardConsoleKind } from '@/lib/dashboard-console-path';
import { useAuth } from '@/lib/auth-context';
import type { CurrencyPortal } from '@/lib/currency/types';

type PlatformConfig = {
  defaultCurrency: string;
  enabledCurrencies: string[];
  showUsdReference: boolean;
};

type CurrencyContextValue = {
  preference: string;
  displayCurrency: string;
  displaySource: string;
  platformConfig: PlatformConfig | null;
  rates: Record<string, number>;
  ratesLoading: boolean;
  setPreference: (code: string) => void;
  convert: (amount: number, from: string, to?: string) => number;
  format: (amount: number, currency?: string) => string;
  enabledCurrencies: Currency[];
  showUsdReference: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function portalFromPath(pathname: string): CurrencyPortal {
  const kind = getDashboardConsoleKind(pathname);
  if (kind === 'buyer') return 'buyer';
  if (kind === 'vendor') return 'vendor';
  if (kind === 'services') return 'services';
  if (kind === 'admin') return 'admin';
  return 'storefront';
}

function convertClient(amount: number, from: string, to: string, rates: Record<string, number>, base = 'USD') {
  const f = (from || 'USD').toUpperCase();
  const t = (to || 'USD').toUpperCase();
  if (!Number.isFinite(amount) || f === t) return amount;
  const rateFrom = f === base ? 1 : rates[f];
  const rateTo = t === base ? 1 : rates[t];
  if (typeof rateFrom !== 'number' || typeof rateTo !== 'number' || rateFrom <= 0 || rateTo <= 0) return amount;
  const inBase = f === base ? amount : amount / rateFrom;
  return t === base ? inBase : inBase * rateTo;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const portal = portalFromPath(pathname);

  const [preference, setPreferenceState] = useState('AUTO');
  const [hasMounted, setHasMounted] = useState(false);
  const [geoCurrency, setGeoCurrency] = useState<string | null>(null);
  const [dashboardCurrency, setDashboardCurrency] = useState<string | null>(null);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [ratesLoading, setRatesLoading] = useState(true);
  const { displayCurrency, displaySource } = useMemo(() => {
    const enabled = new Set((platformConfig?.enabledCurrencies ?? ['USD']).map((c) => c.toUpperCase()));
    const defaultCur = (platformConfig?.defaultCurrency ?? 'USD').toUpperCase();

    const pick = (code: string | null | undefined, source: string) => {
      if (!code) return null;
      const c = code.toUpperCase();
      if (c === 'AUTO') return null;
      if (enabled.has(c)) return { code: c, source };
      return null;
    };

    if (portal === 'vendor' || portal === 'services') {
      const dash = pick(dashboardCurrency, 'dashboard_setting') ?? pick(preference, 'user_preference');
      if (dash) return { displayCurrency: dash.code, displaySource: dash.source };
    } else {
      const userPref = pick(preference, 'user_preference');
      if (userPref) return { displayCurrency: userPref.code, displaySource: userPref.source };
    }

    if (preference === 'AUTO' && hasMounted) {
      const geo = pick(geoCurrency, 'geo_detected');
      if (geo) return { displayCurrency: geo.code, displaySource: geo.source };
      const localeCode = detectUserCurrencyCode(navigator.language, defaultCur);
      const loc = pick(localeCode, 'locale_detected');
      if (loc) return { displayCurrency: loc.code, displaySource: loc.source };
    }

    if (enabled.has(defaultCur)) {
      return { displayCurrency: defaultCur, displaySource: 'platform_default' };
    }
    return { displayCurrency: 'USD', displaySource: 'usd_fallback' };
  }, [preference, geoCurrency, dashboardCurrency, platformConfig, portal, hasMounted]);

  useEffect(() => {
    setPreferenceState(getSavedCurrencyPreference('AUTO'));
    setHasMounted(true);
  }, []);

  const setPreference = useCallback((code: string) => {
    const next = code.trim().toUpperCase() || 'AUTO';
    setPreferenceState(next);
    saveCurrencyPreference(next);

    if (user?.id) {
      if (portal === 'buyer' || portal === 'storefront') {
        void fetch('/api/buyer/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currencyPreference: next }),
        });
      } else if (portal === 'vendor') {
        void fetch('/api/vendor/currency', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboardCurrency: next }),
        });
      } else if (portal === 'services') {
        void fetch('/api/services/currency', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dashboardCurrency: next }),
        });
      }
    }
  }, [user?.id, portal]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/currency/config', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled || !res.ok) return;
        setPlatformConfig({
          defaultCurrency: data.config?.defaultCurrency ?? 'USD',
          enabledCurrencies: data.config?.enabledCurrencies ?? ['USD'],
          showUsdReference: data.config?.showUsdReference ?? true,
        });
        if (data.rates?.values) setRates({ USD: 1, ...data.rates.values });
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (preference !== 'AUTO') return;
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch('/api/geo/currency', { signal: controller.signal });
        const data = await res.json();
        if (data?.currency) setGeoCurrency(String(data.currency).toUpperCase());
      } catch { /* ignore */ }
    })();
    return () => controller.abort();
  }, [preference]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    void (async () => {
      if (portal === 'buyer' || portal === 'storefront') {
        const res = await fetch('/api/buyer/preferences');
        const data = await res.json().catch(() => ({}));
        const pref = data?.prefs?.currency_preference;
        if (!cancelled && typeof pref === 'string' && pref) {
          setPreferenceState(pref.toUpperCase());
          saveCurrencyPreference(pref.toUpperCase());
        }
      } else if (portal === 'vendor') {
        const res = await fetch('/api/vendor/currency');
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.dashboardCurrency) setDashboardCurrency(data.dashboardCurrency);
      } else if (portal === 'services') {
        const res = await fetch('/api/services/currency');
        const data = await res.json().catch(() => ({}));
        if (!cancelled && data?.dashboardCurrency) setDashboardCurrency(data.dashboardCurrency);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id, portal]);


  const enabledCurrencies = useMemo(() => {
    const enabled = new Set((platformConfig?.enabledCurrencies ?? []).map((c) => c.toUpperCase()));
    return CURRENCIES.filter((c) => enabled.has(c.code));
  }, [platformConfig]);

  const convert = useCallback(
    (amount: number, from: string, to?: string) =>
      convertClient(amount, from, to ?? displayCurrency, rates, 'USD'),
    [displayCurrency, rates],
  );

  const format = useCallback(
    (amount: number, currency?: string) =>
      formatMoneyAmount(amount, currency ?? displayCurrency, typeof navigator !== 'undefined' ? navigator.language : 'en-US'),
    [displayCurrency],
  );

  const value = useMemo(
    () => ({
      preference,
      displayCurrency,
      displaySource,
      platformConfig,
      rates,
      ratesLoading,
      setPreference,
      convert,
      format,
      enabledCurrencies,
      showUsdReference: platformConfig?.showUsdReference ?? true,
    }),
    [
      preference, displayCurrency, displaySource, platformConfig, rates, ratesLoading,
      setPreference, convert, format, enabledCurrencies,
    ],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyContext() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrencyContext must be used within CurrencyProvider');
  return ctx;
}

export function useCurrencyOptional() {
  return useContext(CurrencyContext);
}

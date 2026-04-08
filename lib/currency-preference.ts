const STORAGE_KEY = 'southcaravan_currency_preference_v1';

export type CurrencyPreference = string; // 'AUTO' or ISO 4217 code

export function getSavedCurrencyPreference(fallback: CurrencyPreference = 'AUTO'): CurrencyPreference {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && typeof v === 'string' ? v : fallback;
  } catch {
    return fallback;
  }
}

export function saveCurrencyPreference(pref: CurrencyPreference): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore
  }
}


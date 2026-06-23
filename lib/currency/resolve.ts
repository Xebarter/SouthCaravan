import { detectUserCurrencyCode } from '@/lib/currency-detection';
import { getPlatformCurrencyConfig, isCurrencyEnabled } from '@/lib/currency/config';
import type { CurrencyPortal, ResolvedDisplayCurrency } from '@/lib/currency/types';
import { normalizeCurrencyCode } from '@/lib/currency/types';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type ResolveCurrencyInput = {
  portal: CurrencyPortal;
  userId?: string | null;
  userPreference?: string | null;
  dashboardCurrency?: string | null;
  geoCurrency?: string | null;
  locale?: string | null;
};

async function loadBuyerPreference(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('customer_preferences')
    .select('currency_preference')
    .eq('user_id', userId)
    .maybeSingle();
  const pref = data?.currency_preference;
  return typeof pref === 'string' && pref.trim() ? pref.trim().toUpperCase() : null;
}

async function loadVendorCurrencies(userId: string): Promise<{ dashboard: string | null; pricing: string | null }> {
  const { data } = await supabaseAdmin
    .from('vendors')
    .select('dashboard_currency, pricing_currency')
    .eq('id', userId)
    .maybeSingle();
  return {
    dashboard: typeof data?.dashboard_currency === 'string' ? data.dashboard_currency.toUpperCase() : null,
    pricing: typeof data?.pricing_currency === 'string' ? data.pricing_currency.toUpperCase() : null,
  };
}

function resolveFromPreference(
  pref: string | null | undefined,
  config: Awaited<ReturnType<typeof getPlatformCurrencyConfig>>,
  geoCurrency?: string | null,
  locale?: string | null,
): ResolvedDisplayCurrency | null {
  if (!pref || pref === 'AUTO') {
    const geo = geoCurrency ? normalizeCurrencyCode(geoCurrency) : null;
    if (geo && isCurrencyEnabled(geo, config)) {
      return { code: geo, source: 'geo_detected' };
    }
    const localeCode = detectUserCurrencyCode(locale ?? undefined, config.default_currency);
    if (localeCode && isCurrencyEnabled(localeCode, config)) {
      return { code: localeCode, source: 'locale_detected' };
    }
    return null;
  }

  const code = normalizeCurrencyCode(pref);
  if (isCurrencyEnabled(code, config)) {
    return { code, source: 'user_preference' };
  }
  return null;
}

export async function resolveDisplayCurrency(input: ResolveCurrencyInput): Promise<ResolvedDisplayCurrency> {
  const config = await getPlatformCurrencyConfig();

  // 1. Explicit user preference passed in (e.g. from localStorage / context)
  const inline = resolveFromPreference(input.userPreference, config, input.geoCurrency, input.locale);
  if (inline && inline.source === 'user_preference') return inline;

  // 2. Load persisted profile preference for authenticated users
  if (input.userId) {
    if (input.portal === 'buyer' || input.portal === 'storefront') {
      const buyerPref = await loadBuyerPreference(input.userId);
      const resolved = resolveFromPreference(buyerPref, config, input.geoCurrency, input.locale);
      if (resolved) return resolved;
    }

    if (input.portal === 'vendor' || input.portal === 'services') {
      const vendor = await loadVendorCurrencies(input.userId);
      const dashPref = vendor.dashboard ?? input.dashboardCurrency;
      const resolved = resolveFromPreference(dashPref, config, input.geoCurrency, input.locale);
      if (resolved && resolved.source === 'user_preference') return { ...resolved, source: 'dashboard_setting' };
      if (resolved) return { ...resolved, source: 'dashboard_setting' };
    }
  }

  // 3. Dashboard currency from input (vendor/services API)
  const dash = resolveFromPreference(input.dashboardCurrency, config, input.geoCurrency, input.locale);
  if (dash) return { ...dash, source: 'dashboard_setting' };

  // 4. AUTO preference from inline (geo/locale)
  if (inline) return inline;

  // 5. Platform default
  const platformDefault = normalizeCurrencyCode(config.default_currency, 'USD');
  if (isCurrencyEnabled(platformDefault, config)) {
    return { code: platformDefault, source: 'platform_default' };
  }

  return { code: 'USD', source: 'usd_fallback' };
}

export async function resolveVendorPricingCurrency(userId: string): Promise<string> {
  const config = await getPlatformCurrencyConfig();
  const vendor = await loadVendorCurrencies(userId);
  const code = normalizeCurrencyCode(vendor.pricing ?? config.default_currency, config.default_currency);
  return isCurrencyEnabled(code, config) ? code : config.default_currency;
}

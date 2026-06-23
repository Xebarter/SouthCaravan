import { buildCurrencySnapshot } from '@/lib/currency/rates';
import { normalizeCurrencyCode } from '@/lib/currency/types';

export type OrderCurrencyPayload = {
  original_currency: string;
  original_amount: number;
  display_currency: string;
  display_amount: number;
  exchange_rate: number;
  total_amount: number;
};

export async function buildOrderCurrencyFields(
  totalInProductCurrency: number,
  productCurrency: string,
  displayCurrency: string,
): Promise<OrderCurrencyPayload> {
  const original = normalizeCurrencyCode(productCurrency);
  const display = normalizeCurrencyCode(displayCurrency);
  const snapshot = await buildCurrencySnapshot(totalInProductCurrency, original, display);

  return {
    original_currency: snapshot.originalCurrency,
    original_amount: parseFloat(snapshot.originalAmount.toFixed(4)),
    display_currency: snapshot.displayCurrency,
    display_amount: parseFloat(snapshot.displayAmount.toFixed(4)),
    exchange_rate: parseFloat(snapshot.exchangeRate.toFixed(8)),
    total_amount: parseFloat(snapshot.originalAmount.toFixed(2)),
  };
}

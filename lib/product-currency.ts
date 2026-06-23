export function normalizeProductCurrency(value: unknown): string {
  const raw = String(value ?? 'USD').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(raw) ? raw : 'USD';
}

export function mapProductPriceCurrency<T extends Record<string, unknown>>(row: T): T & { price_currency: string } {
  return {
    ...row,
    price_currency: normalizeProductCurrency(row.currency),
  };
}

export function resolveOrderCurrency(items: Array<{ currency?: string | null }>): string {
  const codes = [...new Set(items.map((item) => normalizeProductCurrency(item.currency)))];
  return codes.length === 1 ? codes[0]! : 'USD';
}


export function sumPricedLinesInCurrency(
  lines: PricedLine[],
  convert: (amount: number, from: string, to: string) => number,
  targetCurrency: string,
): number {
  const target = normalizeProductCurrency(targetCurrency);
  return lines.reduce((sum, line) => {
    const amount = line.price * line.quantity;
    if (!Number.isFinite(amount)) return sum;
    const from = normalizeProductCurrency(line.currency);
    return sum + convert(amount, from, target);
  }, 0);
}

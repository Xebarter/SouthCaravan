/**
 * Dual pricing: retail (qty < MOQ) vs bulk (qty >= MOQ).
 * When `retail_price` is null, existing products keep bulk-only behaviour.
 */

export type ProductPricingFields = {
  /** Bulk unit price (existing `products.price`). */
  price: number;
  retail_price?: number | null;
  minimum_order: number;
};

export type PurchaseMode = 'single' | 'bulk';

const MAX_QTY = 999;

export function normalizeRetailPrice(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function normalizeMoq(value: unknown): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function hasDualPricing(fields: ProductPricingFields): boolean {
  const retail = normalizeRetailPrice(fields.retail_price);
  if (retail == null) return false;
  const moq = normalizeMoq(fields.minimum_order);
  return moq > 1 || retail !== Number(fields.price);
}

export function resolveUnitPrice(fields: ProductPricingFields, quantity: number): number {
  const bulk = Number(fields.price) || 0;
  const moq = normalizeMoq(fields.minimum_order);
  const qty = Math.max(1, Math.floor(quantity));
  const retail = normalizeRetailPrice(fields.retail_price);

  if (retail == null) return bulk;
  if (qty >= moq) return bulk;
  return retail;
}

export function getPricingTier(
  fields: ProductPricingFields,
  quantity: number,
): 'retail' | 'bulk' {
  const retail = normalizeRetailPrice(fields.retail_price);
  if (retail == null) return 'bulk';
  return quantity >= normalizeMoq(fields.minimum_order) ? 'bulk' : 'retail';
}

export function getQuantityBounds(
  fields: ProductPricingFields,
  mode: PurchaseMode,
): { min: number; max: number } {
  const moq = normalizeMoq(fields.minimum_order);

  if (!hasDualPricing(fields)) {
    return { min: moq, max: MAX_QTY };
  }

  if (mode === 'single') {
    const maxSingle = Math.max(1, moq - 1);
    return { min: 1, max: maxSingle };
  }

  return { min: moq, max: MAX_QTY };
}

export function clampQuantityForMode(
  fields: ProductPricingFields,
  quantity: number,
  mode: PurchaseMode,
): number {
  const { min, max } = getQuantityBounds(fields, mode);
  const parsed = Math.floor(quantity);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

/** Cart / free-form quantity: allows 1..MOQ-1 (retail) or MOQ+ (bulk). */
export function clampQuantityForCart(fields: ProductPricingFields, quantity: number): number {
  const moq = normalizeMoq(fields.minimum_order);
  const parsed = Math.floor(quantity);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return hasDualPricing(fields) ? 1 : moq;
  }
  if (!hasDualPricing(fields)) {
    return Math.min(MAX_QTY, Math.max(moq, parsed));
  }
  return Math.min(MAX_QTY, Math.max(1, parsed));
}

export function getCartMinQuantity(fields: ProductPricingFields): number {
  return hasDualPricing(fields) ? 1 : normalizeMoq(fields.minimum_order);
}

export function validateDualPricingConfig(
  bulkPrice: number,
  retailPrice: number | null | undefined,
  moq: number,
): string | null {
  const moqInt = normalizeMoq(moq);
  const bulk = Number(bulkPrice);
  if (!Number.isFinite(bulk) || bulk < 0) return 'Bulk price must be 0 or more';

  const retail = normalizeRetailPrice(retailPrice);
  if (retail == null) return null;

  if (moqInt < 2 && retail !== bulk) {
    return 'Set MOQ to at least 2 when retail and bulk prices differ';
  }

  return null;
}

export function pricingFieldsFromProduct(product: {
  price?: unknown;
  retail_price?: unknown;
  minimum_order?: unknown;
}): ProductPricingFields {
  return {
    price: Number(product.price) || 0,
    retail_price: normalizeRetailPrice(product.retail_price),
    minimum_order: normalizeMoq(product.minimum_order),
  };
}

export function parseRetailPriceFromForm(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function applyPricingToCartLine<
  T extends {
    price: number;
    quantity: number;
    minQty?: number;
    bulkPrice?: number;
    retailPrice?: number | null;
    minimumOrder?: number;
  },
>(line: T): T {
  if (line.bulkPrice == null && line.minimumOrder == null) {
    return line;
  }

  const fields: ProductPricingFields = {
    price: line.bulkPrice ?? line.price,
    retail_price: line.retailPrice ?? null,
    minimum_order: line.minimumOrder ?? line.minQty ?? 1,
  };

  const quantity = clampQuantityForCart(fields, line.quantity);
  const price = resolveUnitPrice(fields, quantity);
  const minQty = getCartMinQuantity(fields);

  return {
    ...line,
    quantity,
    price,
    bulkPrice: fields.price,
    retailPrice: normalizeRetailPrice(fields.retail_price),
    minimumOrder: fields.minimum_order,
    minQty,
  };
}

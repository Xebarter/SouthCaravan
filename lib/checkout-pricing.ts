import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  pricingFieldsFromProduct,
  resolveUnitPrice,
  validateDualPricingConfig,
} from '@/lib/product-pricing';
import { normalizeProductCurrency } from '@/lib/product-currency';
import type { CheckoutLineItem } from '@/lib/checkout-session';

const PRICE_TOLERANCE = 0.02;

/**
 * Re-resolves unit prices from the database so checkout cannot be tampered with.
 */
export async function normalizeCheckoutItemsFromCatalog(
  items: CheckoutLineItem[],
): Promise<{ items: CheckoutLineItem[] } | { error: string; status: number }> {
  if (!items.length) {
    return { error: 'Cart is empty', status: 400 };
  }

  const ids = [...new Set(items.map((item) => item.id).filter(Boolean))];
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, retail_price, minimum_order, currency, in_stock')
    .in('id', ids);

  if (error) {
    console.error('[normalizeCheckoutItemsFromCatalog]', error.message);
    return { error: 'Could not verify product prices', status: 500 };
  }

  const byId = new Map((data ?? []).map((row) => [String(row.id), row]));

  const normalized: CheckoutLineItem[] = [];

  for (const item of items) {
    const product = byId.get(item.id);
    if (!product) {
      return { error: `Product not found: ${item.name}`, status: 404 };
    }
    if (!product.in_stock) {
      return { error: `${product.name} is no longer available`, status: 409 };
    }

    const quantity = Math.floor(item.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { error: `Invalid quantity for ${product.name}`, status: 400 };
    }

    const fields = pricingFieldsFromProduct(product);
    const configError = validateDualPricingConfig(fields.price, fields.retail_price, fields.minimum_order);
    if (configError) {
      console.warn('[normalizeCheckoutItemsFromCatalog] invalid pricing config', product.id, configError);
    }

    const unitPrice = resolveUnitPrice(fields, quantity);
    const clientPrice = Number(item.price);
    if (
      Number.isFinite(clientPrice) &&
      Math.abs(clientPrice - unitPrice) > PRICE_TOLERANCE
    ) {
      // Use server price; log mismatch for monitoring
      console.warn(
        '[normalizeCheckoutItemsFromCatalog] price mismatch',
        product.id,
        { client: clientPrice, server: unitPrice, quantity },
      );
    }

    normalized.push({
      ...item,
      name: String(product.name ?? item.name),
      price: unitPrice,
      quantity,
      currency: normalizeProductCurrency(product.currency ?? item.currency),
    });
  }

  return { items: normalized };
}

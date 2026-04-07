/**
 * Short-lived checkout payload (sessionStorage). Populated by Buy Now or cart → checkout.
 * Cleared after a successful order.
 */

export type CheckoutLineItem = {
  id: string;
  name: string;
  vendor: string;
  /** Unit price (same basis as product catalog `price`) */
  price: number;
  quantity: number;
  /** Image URL or short placeholder label */
  image?: string;
};

const STORAGE_KEY = 'southcaravan_checkout_v1';

export type CheckoutSessionPayload = {
  items: CheckoutLineItem[];
  /** Subtotal discount in USD (e.g. from cart promo) */
  discount?: number;
};

export function setCheckoutLineItems(
  items: CheckoutLineItem[],
  options?: { discount?: number },
): void {
  if (typeof window === 'undefined') return;
  try {
    const discount =
      typeof options?.discount === 'number' && options.discount > 0 ? options.discount : undefined;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ items, discount, savedAt: Date.now() }));
  } catch {
    // quota / private mode
  }
}

export function getCheckoutSession(): CheckoutSessionPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items?: CheckoutLineItem[]; discount?: number };
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    const items = parsed.items.filter(
      (row) =>
        row &&
        typeof row.id === 'string' &&
        typeof row.name === 'string' &&
        typeof row.vendor === 'string' &&
        typeof row.price === 'number' &&
        typeof row.quantity === 'number' &&
        row.quantity > 0,
    );
    if (items.length === 0) return null;
    const discount =
      typeof parsed.discount === 'number' && parsed.discount > 0 ? parsed.discount : 0;
    return { items, discount };
  } catch {
    return null;
  }
}

export function clearCheckoutLineItems(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function checkoutTotals(
  items: CheckoutLineItem[],
  discount: number,
): { subtotal: number; shipping: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount > 500 || afterDiscount === 0 ? 0 : 25;
  const tax = (afterDiscount + shipping) * 0.08;
  const total = afterDiscount + shipping + tax;
  return { subtotal, shipping, tax, total };
}

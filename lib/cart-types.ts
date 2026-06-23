import type { AppliedCoupon } from '@/lib/cart-coupons';
import type { CheckoutLineItem } from '@/lib/checkout-session';

export type CartLineItem = CheckoutLineItem & {
  addedAt?: number;
  sku?: string;
  minQty?: number;
  maxQty?: number;
  /** Bulk unit price from catalog (`products.price`). */
  bulkPrice?: number;
  /** Retail unit price when configured; null = bulk only. */
  retailPrice?: number | null;
  /** MOQ threshold for bulk pricing. */
  minimumOrder?: number;
};

export type CartState = {
  items: CartLineItem[];
  saved: CartLineItem[];
  coupon: AppliedCoupon | null;
};

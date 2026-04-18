import type { AppliedCoupon } from '@/lib/cart-coupons';
import type { CheckoutLineItem } from '@/lib/checkout-session';

export type CartLineItem = CheckoutLineItem & {
  addedAt?: number;
  sku?: string;
  minQty?: number;
  maxQty?: number;
};

export type CartState = {
  items: CartLineItem[];
  saved: CartLineItem[];
  coupon: AppliedCoupon | null;
};

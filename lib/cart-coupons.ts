export type AppliedCoupon = {
  code: string;
  /** Fractional rate, e.g. 0.1 for 10%. */
  rate: number;
  /** Human-readable label shown in the summary chip. */
  label: string;
};

/** Registered promo codes (validated on server for buyer carts). */
export const KNOWN_COUPONS: Record<string, AppliedCoupon> = {
  WELCOME10: { code: 'WELCOME10', rate: 0.1, label: '10% off' },
  BULK15: { code: 'BULK15', rate: 0.15, label: '15% off on bulk' },
  SCAVAN5: { code: 'SCAVAN5', rate: 0.05, label: '5% off' },
};

export function resolveCoupon(code: string | null | undefined): AppliedCoupon | null {
  if (!code || typeof code !== 'string') return null;
  const key = code.trim().toUpperCase();
  const c = KNOWN_COUPONS[key];
  return c ?? null;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, Loader2, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { setCheckoutLineItems, type CheckoutLineItem } from '@/lib/checkout-session';
import { addToCart } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';
import {
  clampQuantityForMode,
  getPricingTier,
  getQuantityBounds,
  hasDualPricing,
  pricingFieldsFromProduct,
  resolveUnitPrice,
  type PurchaseMode,
} from '@/lib/product-pricing';

export type ProductPurchaseActionsProps = {
  productId: string;
  name: string;
  bulkPrice: number;
  retailPrice?: number | null;
  minimumOrder: number;
  unit: string;
  inStock: boolean;
  vendorLabel: string;
  vendorUserId?: string;
  imageUrl?: string;
  rfqEnabled?: boolean;
  showMobileStickyBar?: boolean;
};

export function ProductPurchaseActions({
  productId,
  name,
  bulkPrice,
  retailPrice,
  minimumOrder,
  unit,
  inStock,
  vendorLabel,
  vendorUserId,
  imageUrl,
  rfqEnabled = true,
  showMobileStickyBar = true,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const pricing = useMemo(
    () =>
      pricingFieldsFromProduct({
        price: bulkPrice,
        retail_price: retailPrice,
        minimum_order: minimumOrder,
      }),
    [bulkPrice, retailPrice, minimumOrder],
  );

  const dual = hasDualPricing(pricing);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(dual ? 'single' : 'bulk');
  const bounds = getQuantityBounds(pricing, purchaseMode);
  const [quantity, setQuantity] = useState(bounds.min);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuantity((current) => clampQuantityForMode(pricing, current, purchaseMode));
  }, [purchaseMode, pricing]);

  const clampedQty = clampQuantityForMode(pricing, quantity, purchaseMode);
  const unitPrice = resolveUnitPrice(pricing, clampedQty);
  const tier = getPricingTier(pricing, clampedQty);
  const lineTotal = unitPrice * clampedQty;

  const switchMode = (mode: PurchaseMode) => {
    setPurchaseMode(mode);
    const nextBounds = getQuantityBounds(pricing, mode);
    setQuantity(nextBounds.min);
  };

  const buildLine = (): CheckoutLineItem => ({
    id: productId,
    name,
    vendor: vendorLabel,
    price: unitPrice,
    quantity: clampedQty,
    image: imageUrl,
  });

  const buildCartPayload = () => ({
    id: productId,
    name,
    vendor: vendorLabel,
    price: unitPrice,
    quantity: clampedQty,
    image: imageUrl,
    minQty: bounds.min,
    bulkPrice: pricing.price,
    retailPrice: pricing.retail_price,
    minimumOrder: pricing.minimum_order,
  });

  const handleBuyNow = () => {
    if (!inStock || busy) return;
    setBusy(true);
    setCheckoutLineItems([buildLine()]);
    router.push('/checkout');
  };

  const handleRequestQuote = () => {
    if (!inStock || !rfqEnabled || authLoading) return;
    const next = `/buyer/quotes?add=${encodeURIComponent(productId)}&qty=${encodeURIComponent(String(clampedQty))}`;
    if (user) {
      router.push(next);
      return;
    }
    const qs = new URLSearchParams();
    qs.set('role', 'buyer');
    qs.set('next', next);
    router.push(`/login?${qs.toString()}`);
  };

  const handleAddToCart = async () => {
    if (!inStock) return;

    const toastId = toast.custom((id) => (
      <div className="flex w-[360px] items-start gap-3 rounded-xl border border-border bg-popover p-4 shadow-lg">
        {imageUrl ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={imageUrl} alt={name} fill className="object-cover" sizes="64px" />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            <ShoppingCart className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-sm font-semibold text-foreground">Added to cart</span>
          </div>
          <p className="mt-0.5 truncate text-sm text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">
            {clampedQty} {unit} · <Money amountUSD={unitPrice} /> each
          </p>
          <button
            onClick={() => {
              toast.dismiss(id);
              router.push('/cart');
            }}
            className="mt-2.5 w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            View cart →
          </button>
        </div>
        <button
          onClick={() => toast.dismiss(id)}
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ), { duration: 5000 });

    try {
      await addToCart(buildCartPayload());
    } catch (e) {
      toast.dismiss(toastId);
      const msg = e instanceof Error ? e.message : 'Could not add to cart';
      toast.error(msg);
    }
  };

  const handleContactSupplier = () => {
    if (authLoading) return;
    if (!vendorUserId) {
      toast.error('This product does not have a supplier messaging inbox yet.');
      return;
    }

    const qs = new URLSearchParams();
    qs.set('vendorUserId', vendorUserId);
    qs.set('vendorLabel', vendorLabel);
    qs.set('productId', productId);
    qs.set('productName', name);
    const next = `/buyer/messages?${qs.toString()}`;

    if (user) {
      router.push(next);
      return;
    }

    const loginQs = new URLSearchParams();
    loginQs.set('role', 'buyer');
    loginQs.set('next', next);
    router.push(`/login?${loginQs.toString()}`);
  };

  const focusQuantity = () => {
    const el = document.getElementById('order-qty') as HTMLInputElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      el.select?.();
    }
  };

  return (
    <>
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        {dual ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Purchase type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchMode('single')}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  purchaseMode === 'single'
                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">Single purchase</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <Money amountUSD={pricing.retail_price ?? 0} /> / {unit}
                </p>
                <p className="text-[11px] text-slate-500">Below {pricing.minimum_order} {unit}</p>
              </button>
              <button
                type="button"
                onClick={() => switchMode('bulk')}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  purchaseMode === 'bulk'
                    ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">Bulk purchase</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <Money amountUSD={pricing.price} /> / {unit}
                </p>
                <p className="text-[11px] text-slate-500">From {pricing.minimum_order} {unit}</p>
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantity</p>
            <Label htmlFor="order-qty" className="sr-only">
              Order quantity ({unit})
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="order-qty"
                type="number"
                min={bounds.min}
                max={bounds.max}
                step={1}
                value={quantity}
                disabled={!inStock}
                onChange={(e) =>
                  setQuantity(clampQuantityForMode(pricing, parseInt(e.target.value, 10) || bounds.min, purchaseMode))
                }
                className="h-10 max-w-[160px]"
              />
              <span className="text-xs text-slate-500">
                {dual
                  ? purchaseMode === 'single'
                    ? `1–${bounds.max} ${unit}`
                    : `Min ${bounds.min} ${unit}`
                  : `Min ${bounds.min} ${unit}`}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 min-w-[140px]">
            <p className="text-xs text-slate-500">Line total</p>
            <p className="text-sm font-semibold text-slate-900">
              <Money amountUSD={lineTotal} />
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-500">
                <Money amountUSD={unitPrice} /> each
              </span>
              {dual ? (
                <Badge variant={tier === 'bulk' ? 'default' : 'secondary'} className="text-[10px]">
                  {tier === 'bulk' ? 'Bulk rate' : 'Retail rate'}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" className="h-11 rounded-xl" disabled={!inStock || busy} onClick={handleBuyNow}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Redirecting…
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" aria-hidden />
                Buy now
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-slate-300"
            disabled={!inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
            Add to cart
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-slate-300"
            disabled={!inStock || !rfqEnabled || authLoading}
            onClick={handleRequestQuote}
          >
            Request quotation
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-slate-300"
            disabled={authLoading}
            onClick={handleContactSupplier}
          >
            Contact supplier
          </Button>
        </div>

        {!inStock && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            This SKU is not available for immediate purchase. Use quotation or contact the supplier.
          </p>
        )}
      </div>

      {showMobileStickyBar ? (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
          <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={focusQuantity}
              className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left"
              aria-label="Adjust quantity"
            >
              <p className="text-[11px] font-medium text-slate-500">Qty</p>
              <p className="text-sm font-semibold text-slate-900">
                {clampedQty} {unit}
              </p>
            </button>

            <Button type="button" className="h-11 flex-1 rounded-xl" disabled={!inStock || busy} onClick={handleBuyNow}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Redirecting…
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-4 w-4" aria-hidden />
                  Buy now
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-300"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
              Add
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

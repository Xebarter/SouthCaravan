'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Loader2, ShoppingBag, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setCheckoutLineItems, type CheckoutLineItem } from '@/lib/checkout-session';
import { addToCart } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';

export type ProductPurchaseActionsProps = {
  productId: string;
  name: string;
  unitPrice: number;
  minimumOrder: number;
  unit: string;
  inStock: boolean;
  vendorLabel: string;
  /** Supabase auth user id for the vendor that owns this product */
  vendorUserId?: string;
  imageUrl?: string;
  /** False for platform-owned SKUs without a vendor auth id */
  rfqEnabled?: boolean;
  /** Render an always-available bottom CTA bar on mobile. */
  showMobileStickyBar?: boolean;
};

export function ProductPurchaseActions({
  productId,
  name,
  unitPrice,
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
  const [quantity, setQuantity] = useState(Math.max(1, minimumOrder));
  const [busy, setBusy] = useState(false);

  const clampQty = (n: number) => {
    if (!Number.isFinite(n) || n < minimumOrder) return minimumOrder;
    return Math.floor(n);
  };

  const handleBuyNow = () => {
    if (!inStock || busy) return;
    setBusy(true);
    const qty = clampQty(quantity);
    const line: CheckoutLineItem = {
      id: productId,
      name,
      vendor: vendorLabel,
      price: unitPrice,
      quantity: qty,
      image: imageUrl,
    };
    setCheckoutLineItems([line]);
    router.push('/checkout');
  };

  const handleRequestQuote = () => {
    if (!inStock || !rfqEnabled || authLoading) return;
    const qty = clampQty(quantity);
    const next = `/buyer/quotes?add=${encodeURIComponent(productId)}&qty=${encodeURIComponent(String(qty))}`;
    if (user?.role === 'buyer') {
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
    const qty = clampQty(quantity);

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
            {qty} {unit} · {vendorLabel}
          </p>
          <button
            onClick={() => { toast.dismiss(id); router.push('/cart'); }}
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
      await addToCart({
        id: productId,
        name,
        vendor: vendorLabel,
        price: unitPrice,
        quantity: qty,
        image: imageUrl,
        minQty: minimumOrder,
      });
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

    if (user?.role === 'buyer') {
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
                min={minimumOrder}
                step={1}
                value={quantity}
                disabled={!inStock}
                onChange={(e) => setQuantity(clampQty(parseInt(e.target.value, 10) || minimumOrder))}
                className="h-10 max-w-[160px]"
              />
              <span className="text-xs text-slate-500">
                Min {minimumOrder} {unit}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Selected</p>
            <p className="text-sm font-semibold text-slate-900">
              {clampQty(quantity)} {unit}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={!inStock || busy}
            onClick={handleBuyNow}
          >
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
                {clampQty(quantity)} {unit}
              </p>
            </button>

            <Button
              type="button"
              className="h-11 flex-1 rounded-xl"
              disabled={!inStock || busy}
              onClick={handleBuyNow}
            >
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

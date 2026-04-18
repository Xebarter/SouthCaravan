'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Money } from '@/components/money';
import { cn } from '@/lib/utils';
import { useCart, type CartLineItem } from '@/lib/cart-store';
import { setCheckoutLineItems } from '@/lib/checkout-session';

function pluralize(count: number, one: string, other: string) {
  return count === 1 ? one : other;
}

function groupByVendor(items: CartLineItem[]) {
  const map = new Map<string, CartLineItem[]>();
  for (const item of items) {
    const key = item.vendor || 'Supplier';
    const existing = map.get(key);
    if (existing) existing.push(item);
    else map.set(key, [item]);
  }
  return Array.from(map.entries()).map(([vendor, rows]) => ({
    vendor,
    rows,
    subtotal: rows.reduce((sum, r) => sum + r.price * r.quantity, 0),
  }));
}

function isLikelyImageUrl(s: string | undefined): boolean {
  if (!s?.trim()) return false;
  return /^https?:\/\//i.test(s) || s.startsWith('/') || s.startsWith('data:');
}

// ---------- Quantity ----------

function QuantityStepper({
  value,
  min = 1,
  max = 999,
  onChange,
  disabled,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = React.useState<string>(String(value));
  React.useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < min) {
      onChange(min);
      setDraft(String(min));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div
      className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="inline-flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
          }
        }}
        className="h-9 w-12 border-x border-slate-200 bg-transparent text-center text-sm font-medium tabular-nums text-slate-900 outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="inline-flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function LineThumbnail({ image, name }: { image?: string; name: string }) {
  const showImg = isLikelyImageUrl(image);
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  let optimized = false;
  if (showImg && image && supabaseBase) {
    try {
      const host = new URL(image).hostname;
      optimized = host === new URL(supabaseBase).hostname;
    } catch {
      optimized = false;
    }
  }

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100 sm:h-24 sm:w-24">
      {showImg && image ? (
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="96px"
          unoptimized={!optimized}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-2">
          <Package className="h-8 w-8 text-slate-400" aria-hidden />
        </div>
      )}
    </div>
  );
}

function CartLine({
  item,
  onSetQuantity,
  onRemove,
  onSaveForLater,
}: {
  item: CartLineItem;
  onSetQuantity: (n: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
}) {
  const lineTotal = item.price * item.quantity;
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-5">
      <Link href={`/product/${item.id}`} className="row-span-2 sm:row-span-1">
        <LineThumbnail image={item.image} name={item.name} />
      </Link>

      <div className="min-w-0 sm:col-span-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${item.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-primary sm:text-base"
            >
              {item.name}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Store className="h-3.5 w-3.5 shrink-0" />
                {item.vendor}
              </span>
              {item.sku ? (
                <span>
                  SKU <span className="font-mono text-slate-700">{item.sku}</span>
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Unit price{' '}
              <span className="font-medium text-slate-700">
                <Money amountUSD={item.price} showUsdInBrackets={false} />
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:hidden">
          <QuantityStepper
            value={item.quantity}
            min={item.minQty ?? 1}
            max={item.maxQty ?? 999}
            onChange={onSetQuantity}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSaveForLater}
              className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Save for later
            </button>
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              <Money amountUSD={lineTotal} showUsdInBrackets={false} />
            </p>
          </div>
        </div>
      </div>

      <div className="hidden min-w-[200px] flex-col items-end gap-3 sm:flex">
        <QuantityStepper
          value={item.quantity}
          min={item.minQty ?? 1}
          max={item.maxQty ?? 999}
          onChange={onSetQuantity}
        />
        <button
          type="button"
          onClick={onSaveForLater}
          className="text-xs font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          Save for later
        </button>
        <p className="text-sm font-semibold tabular-nums text-slate-900">
          <Money amountUSD={lineTotal} showUsdInBrackets={false} />
        </p>
      </div>
    </div>
  );
}

// ---------- Sections ----------

function EmptyCartView() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm md:p-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <ShoppingBag className="h-7 w-7 text-slate-500" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
        Your cart is empty
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        When you add marketplace items, they will appear here. You can review quantities, consolidate
        by supplier, then continue to checkout.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild className="rounded-md px-6">
          <Link href="/catalog">Browse catalog</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-md border-slate-300 px-6">
          <Link href="/">Back to marketplace</Link>
        </Button>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 h-9 w-64 animate-pulse rounded bg-slate-200" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="h-14 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-80 animate-pulse rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

function SavedForLaterSection({
  items,
  onMove,
  onRemove,
}: {
  items: CartLineItem[];
  onMove: (item: CartLineItem) => void;
  onRemove: (item: CartLineItem) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">Saved for later</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Not included in your current order total ({items.length}{' '}
          {pluralize(items.length, 'item', 'items')}).
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <Link href={`/product/${item.id}`} className="shrink-0">
              <LineThumbnail image={item.image} name={item.name} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.id}`}
                className="text-sm font-semibold text-slate-900 hover:text-primary"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-xs text-slate-500">
                {item.vendor} · Qty {item.quantity} ·{' '}
                <Money amountUSD={item.price} showUsdInBrackets={false} /> each
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-md border-slate-300"
                onClick={() => onMove(item)}
              >
                Move to cart
              </Button>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShippingProgressBar({
  remaining,
  threshold,
}: {
  remaining: number;
  threshold: number;
}) {
  const unlocked = remaining <= 0 && threshold > 0;
  const pct =
    threshold === 0 ? 100 : Math.min(100, Math.round(((threshold - remaining) / threshold) * 100));

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border',
            unlocked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600',
          )}
        >
          <Truck className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          {unlocked ? (
            <p className="text-sm font-medium text-slate-900">Free shipping on this order</p>
          ) : (
            <p className="text-sm text-slate-700">
              Add{' '}
              <span className="font-semibold text-slate-900">
                <Money amountUSD={remaining} showUsdInBrackets={false} />
              </span>{' '}
              more for free shipping (orders over{' '}
              <Money amountUSD={threshold} showUsdInBrackets={false} />
              ).
            </p>
          )}
          {!unlocked ? (
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const { state, derived, hydrated } = cart;

  const [couponDraft, setCouponDraft] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponBusy, setCouponBusy] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);

  React.useEffect(() => {
    if (!state.coupon) setCouponDraft('');
  }, [state.coupon]);

  const grouped = React.useMemo(() => groupByVendor(state.items), [state.items]);

  const handleRemove = (item: CartLineItem) => {
    void cart.remove(item.id);
    toast('Removed from cart', {
      description: item.name,
      action: {
        label: 'Undo',
        onClick: () => void cart.add(item),
      },
    });
  };

  const handleSaveForLater = (item: CartLineItem) => {
    void cart.saveForLater(item.id);
    toast('Saved for later', {
      description: item.name,
      action: {
        label: 'Undo',
        onClick: () => void cart.moveSavedToCart(item.id),
      },
    });
  };

  const handleMoveSaved = (item: CartLineItem) => {
    void cart.moveSavedToCart(item.id);
    toast('Moved to cart', { description: item.name });
  };

  const handleRemoveSaved = (item: CartLineItem) => {
    void cart.removeSaved(item.id);
    toast('Removed from saved', { description: item.name });
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponBusy(true);
    try {
      const result = await cart.applyCoupon(couponDraft);
      if (!result.ok) {
        setCouponError(result.error ?? 'Invalid code');
        return;
      }
      toast.success('Promo code applied');
      setCouponDraft('');
    } finally {
      setCouponBusy(false);
    }
  };

  const handleRemoveCoupon = () => {
    void cart.removeCoupon();
    toast('Promo code removed');
  };

  const handleCheckout = () => {
    if (state.items.length === 0) return;
    setCheckoutLineItems(
      state.items.map((item) => ({
        id: item.id,
        name: item.name,
        vendor: item.vendor,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      { discount: derived.discount },
    );
    router.push('/checkout');
  };

  const shell = (body: React.ReactNode) => (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f3f5f7]">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Breadcrumbs items={[{ label: 'Cart' }]} />
        {body}
      </div>
    </div>
  );

  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (state.items.length === 0) {
    return shell(
      <div className="mt-8 space-y-10">
        <EmptyCartView />
        {state.saved.length > 0 ? (
          <SavedForLaterSection
            items={state.saved}
            onMove={handleMoveSaved}
            onRemove={handleRemoveSaved}
          />
        ) : null}
      </div>,
    );
  }

  return shell(
    <>
      <header className="mt-6 flex flex-col gap-4 border-b border-slate-200/90 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Cart</h1>
          <p className="mt-1 text-sm text-slate-600">
            {derived.itemCount} {pluralize(derived.itemCount, 'unit', 'units')} across{' '}
            {grouped.length} {pluralize(grouped.length, 'supplier', 'suppliers')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-md border-slate-300">
            <Link href="/catalog">Continue shopping</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md text-slate-600 hover:text-red-600"
            onClick={() => setClearOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear cart
          </Button>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <ShippingProgressBar
            remaining={derived.freeShippingRemaining}
            threshold={derived.freeShippingThreshold}
          />

          <div className="space-y-4">
            {grouped.map((group) => (
              <section
                key={group.vendor}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Store className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate text-sm font-semibold text-slate-900">{group.vendor}</span>
                    <span className="text-xs text-slate-500">
                      ({group.rows.length} {pluralize(group.rows.length, 'line', 'lines')})
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-slate-900">
                    Subtotal <Money amountUSD={group.subtotal} showUsdInBrackets={false} />
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.rows.map((item) => (
                    <CartLine
                      key={item.id}
                      item={item}
                      onSetQuantity={(n) => void cart.setQuantity(item.id, n)}
                      onRemove={() => handleRemove(item)}
                      onSaveForLater={() => handleSaveForLater(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {state.saved.length > 0 ? (
            <SavedForLaterSection
              items={state.saved}
              onMove={handleMoveSaved}
              onRemove={handleRemoveSaved}
            />
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card className="rounded-lg border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Subtotal</dt>
                  <dd className="font-medium tabular-nums text-slate-900">
                    <Money amountUSD={derived.subtotal} showUsdInBrackets={false} />
                  </dd>
                </div>
                {state.coupon ? (
                  <div className="flex justify-between gap-4">
                    <dt className="flex items-center gap-1 text-primary">
                      <span>Discount ({state.coupon.code})</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="rounded p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary"
                        aria-label="Remove promo code"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </dt>
                    <dd className="font-medium tabular-nums text-primary">
                      −<Money amountUSD={derived.discount} showUsdInBrackets={false} />
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Shipping</dt>
                  <dd className="text-right">
                    {derived.shipping === 0 ? (
                      <span className="text-sm font-medium text-emerald-700">Free</span>
                    ) : (
                      <span className="font-medium tabular-nums text-slate-900">
                        <Money amountUSD={derived.shipping} showUsdInBrackets={false} />
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-600">Estimated tax (8%)</dt>
                  <dd className="font-medium tabular-nums text-slate-900">
                    <Money amountUSD={derived.tax} showUsdInBrackets={false} />
                  </dd>
                </div>
              </dl>

              <Separator className="bg-slate-200" />

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">Estimated total</span>
                <span className="text-xl font-semibold tabular-nums tracking-tight text-slate-900">
                  <Money amountUSD={derived.total} showUsdInBrackets={false} />
                </span>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50/80 p-3">
                <label htmlFor="promo-code" className="text-xs font-medium text-slate-700">
                  Promo code
                </label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="promo-code"
                    placeholder="Code"
                    value={couponDraft}
                    onChange={(e) => {
                      setCouponDraft(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    disabled={couponBusy}
                    className="h-9 rounded-md uppercase"
                    aria-invalid={Boolean(couponError)}
                    aria-describedby={couponError ? 'promo-error' : undefined}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 shrink-0 rounded-md"
                    onClick={handleApplyCoupon}
                    disabled={couponBusy || !couponDraft.trim()}
                  >
                    {couponBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
                {couponError ? (
                  <p
                    id="promo-error"
                    className="mt-2 flex items-center gap-1 text-xs text-red-600"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {couponError}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Try <span className="font-medium text-slate-700">WELCOME10</span> for 10% off
                    eligible subtotals.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 pt-0">
              <Button
                size="lg"
                className="h-11 w-full rounded-md text-sm font-semibold"
                onClick={handleCheckout}
              >
                <Lock className="mr-2 h-4 w-4" />
                Proceed to checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-center text-[11px] text-slate-500">
                Checkout is encrypted. You can still adjust quantities before payment.
              </p>
            </CardFooter>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900">
              <Money amountUSD={derived.total} showUsdInBrackets={false} />
            </p>
          </div>
          <Button size="lg" className="h-11 shrink-0 rounded-md px-5" onClick={handleCheckout}>
            Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              All items in your cart will be removed. Saved items stay in &quot;Saved for later&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void cart.clear().then(() => toast('Cart cleared'));
              }}
              className="rounded-md bg-red-600 text-white hover:bg-red-600/90"
            >
              Clear cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-20 lg:hidden" aria-hidden />
    </>,
  );
}

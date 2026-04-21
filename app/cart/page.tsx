'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Loader2,
  Lock,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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

// ─── Quantity Stepper ────────────────────────────────────────────────────────

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
  React.useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = (raw: string) => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < min) { onChange(min); setDraft(String(min)); return; }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div
      className="inline-flex h-8 items-center rounded-md border border-border bg-background shadow-xs"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit((e.target as HTMLInputElement).value); }
        }}
        className="h-8 w-11 border-x border-border bg-transparent text-center text-sm font-semibold tabular-nums text-foreground outline-none"
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Product Thumbnail ───────────────────────────────────────────────────────

function LineThumbnail({ image, name }: { image?: string; name: string }) {
  const showImg = isLikelyImageUrl(image);
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  let optimized = false;
  if (showImg && image && supabaseBase) {
    try {
      optimized = new URL(image).hostname === new URL(supabaseBase).hostname;
    } catch { optimized = false; }
  }

  return (
    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:h-24 sm:w-24">
      {showImg && image ? (
        <Image src={image} alt={name} fill className="object-cover" sizes="96px" unoptimized={!optimized} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        </div>
      )}
    </div>
  );
}

// ─── Cart Line ───────────────────────────────────────────────────────────────

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
    <div className="group relative px-5 py-5">
      <div className="flex gap-4 sm:gap-5">
        {/* Thumbnail */}
        <Link href={`/product/${item.id}`} className="shrink-0">
          <LineThumbnail image={item.image} name={item.name} />
        </Link>

        {/* Info + controls */}
        <div className="min-w-0 flex-1">
          {/* Top row: name + remove */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/product/${item.id}`}
                className="line-clamp-2 text-[15px] font-semibold leading-snug text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="h-3 w-3 shrink-0" />
                  {item.vendor}
                </span>
                {item.sku && (
                  <span className="text-xs text-muted-foreground">
                    SKU <span className="font-mono text-foreground/70">{item.sku}</span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/8 hover:text-destructive"
              aria-label={`Remove ${item.name}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Unit price */}
          <p className="mt-2.5 text-xs text-muted-foreground">
            <Money amountUSD={item.price} showUsdInBrackets={false} /> per unit
          </p>

          {/* Bottom row: stepper + save + line total */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <QuantityStepper
                value={item.quantity}
                min={item.minQty ?? 1}
                max={item.maxQty ?? 999}
                onChange={onSetQuantity}
              />
              <button
                type="button"
                onClick={onSaveForLater}
                className="text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Save for later
              </button>
            </div>
            <p className="text-[15px] font-semibold tabular-nums text-foreground">
              <Money amountUSD={lineTotal} showUsdInBrackets={false} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shipping Progress ───────────────────────────────────────────────────────

function ShippingProgressBar({ remaining, threshold }: { remaining: number; threshold: number }) {
  const unlocked = remaining <= 0 && threshold > 0;
  const pct = threshold === 0 ? 100 : Math.min(100, Math.round(((threshold - remaining) / threshold) * 100));

  if (unlocked) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3.5 rounded-lg border px-4 py-3.5',
        unlocked
          ? 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-800/50 dark:bg-emerald-950/30'
          : 'border-border bg-card',
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
          unlocked
            ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
            : 'border-border bg-muted text-muted-foreground',
        )}
      >
        {unlocked ? <Check className="h-4 w-4 stroke-[2.5]" aria-hidden /> : <Truck className="h-4 w-4" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        {!unlocked && (
          <p className="text-sm text-foreground">
            Add{' '}
            <span className="font-semibold">
              <Money amountUSD={remaining} showUsdInBrackets={false} />
            </span>{' '}
            more to qualify for free shipping
          </p>
        )}
        {!unlocked && (
          <div
            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Saved for Later ─────────────────────────────────────────────────────────

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
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">Saved for later</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {items.length} {pluralize(items.length, 'item', 'items')} — not included in your order total
        </p>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 px-5 py-4">
            <Link href={`/product/${item.id}`} className="shrink-0">
              <div className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted">
                {isLikelyImageUrl(item.image) && item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.id}`}
                className="line-clamp-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.vendor} · Qty {item.quantity} · <Money amountUSD={item.price} showUsdInBrackets={false} /> each
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => onMove(item)}
              >
                Move to cart
              </Button>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/8 hover:text-destructive"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Empty Cart ───────────────────────────────────────────────────────────────

function EmptyCartView() {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-8 py-16 text-center shadow-xs md:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
        <ShoppingCart className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        Your cart is empty
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Add products from the marketplace and they will appear here. You can review
        quantities and consolidate by supplier before checkout.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="min-w-[160px]">
          <Link href="/catalog">
            Browse catalog
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-w-[160px]">
          <Link href="/">Marketplace home</Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-8 h-8 w-52 animate-pulse rounded bg-muted" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-44 animate-pulse rounded-lg bg-muted" />
          <div className="h-44 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
      action: { label: 'Undo', onClick: () => void cart.add(item) },
    });
  };

  const handleSaveForLater = (item: CartLineItem) => {
    void cart.saveForLater(item.id);
    toast('Saved for later', {
      description: item.name,
      action: { label: 'Undo', onClick: () => void cart.moveSavedToCart(item.id) },
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
      if (!result.ok) { setCouponError(result.error ?? 'Invalid code'); return; }
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
    <div className="min-h-[calc(100vh-8rem)] bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {body}
      </div>
    </div>
  );

  if (!hydrated) return <CartSkeleton />;

  if (state.items.length === 0) {
    return shell(
      <div className="mt-8 space-y-8">
        <EmptyCartView />
        {state.saved.length > 0 && (
          <SavedForLaterSection items={state.saved} onMove={handleMoveSaved} onRemove={handleRemoveSaved} />
        )}
      </div>,
    );
  }

  return shell(
    <>
      {/* ── Page header ──────────────────────────────────────────── */}
      <header className="mt-6 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {derived.itemCount} {pluralize(derived.itemCount, 'unit', 'units')} across{' '}
            {grouped.length} {pluralize(grouped.length, 'supplier', 'suppliers')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/catalog">Continue shopping</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setClearOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear cart
          </Button>
        </div>
      </header>

      {/* ── Main grid ────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">

        {/* ── Left column ────────────────────────────────────────── */}
        <div className="space-y-5">
          <ShippingProgressBar
            remaining={derived.freeShippingRemaining}
            threshold={derived.freeShippingThreshold}
          />

          {/* Vendor groups */}
          <div className="space-y-4">
            {grouped.map((group) => (
              <section
                key={group.vendor}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
              >
                {/* Vendor header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="truncate text-sm font-semibold text-foreground">
                      {group.vendor}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {group.rows.length} {pluralize(group.rows.length, 'line', 'lines')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Subtotal </span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      <Money amountUSD={group.subtotal} showUsdInBrackets={false} />
                    </span>
                  </div>
                </div>

                {/* Line items */}
                <div className="divide-y divide-border/60">
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

          {/* Saved for later */}
          {state.saved.length > 0 && (
            <SavedForLaterSection
              items={state.saved}
              onMove={handleMoveSaved}
              onRemove={handleRemoveSaved}
            />
          )}
        </div>

        {/* ── Summary sidebar ──────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">

            {/* Header */}
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Order Summary</h2>
            </div>

            {/* Totals */}
            <div className="px-5 py-4">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Subtotal ({derived.itemCount} {pluralize(derived.itemCount, 'unit', 'units')})
                  </dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    <Money amountUSD={derived.subtotal} showUsdInBrackets={false} />
                  </dd>
                </div>

                {state.coupon && (
                  <div className="flex justify-between gap-4">
                    <dt className="flex items-center gap-1 text-primary">
                      <Tag className="h-3 w-3 shrink-0" />
                      <span>{state.coupon.code}</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="ml-0.5 rounded p-0.5 text-primary/60 hover:bg-primary/10 hover:text-primary"
                        aria-label="Remove promo code"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </dt>
                    <dd className="font-medium tabular-nums text-primary">
                      −<Money amountUSD={derived.discount} showUsdInBrackets={false} />
                    </dd>
                  </div>
                )}

                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>
                    {derived.shipping === 0 ? (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Free</span>
                    ) : (
                      <span className="font-medium tabular-nums text-foreground">
                        <Money amountUSD={derived.shipping} showUsdInBrackets={false} />
                      </span>
                    )}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Estimated tax (8%)</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    <Money amountUSD={derived.tax} showUsdInBrackets={false} />
                  </dd>
                </div>
              </dl>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm font-semibold text-foreground">Estimated total</span>
                <span className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  <Money amountUSD={derived.total} showUsdInBrackets={false} />
                </span>
              </div>
            </div>

            {/* Promo code */}
            <div className="border-t border-border px-5 py-4">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Promo code
              </p>
              <div className="flex gap-2">
                <Input
                  id="promo-code"
                  placeholder="Enter code"
                  value={couponDraft}
                  onChange={(e) => {
                    setCouponDraft(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); }
                  }}
                  disabled={couponBusy}
                  className="h-9 font-mono text-sm uppercase tracking-widest"
                  aria-invalid={Boolean(couponError)}
                  aria-describedby={couponError ? 'promo-error' : 'promo-hint'}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 shrink-0 px-4"
                  onClick={handleApplyCoupon}
                  disabled={couponBusy || !couponDraft.trim()}
                >
                  {couponBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </Button>
              </div>
              {couponError ? (
                <p id="promo-error" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {couponError}
                </p>
              ) : (
                <p id="promo-hint" className="mt-2 text-[11px] text-muted-foreground">
                  Try <span className="font-semibold text-foreground">WELCOME10</span> for 10% off eligible orders
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="border-t border-border px-5 pb-5 pt-4">
              <Button
                size="lg"
                className="h-11 w-full text-sm font-semibold"
                onClick={handleCheckout}
              >
                <Lock className="mr-2 h-4 w-4" />
                Proceed to checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" />
                Secure checkout · You can adjust quantities before payment
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile sticky bar ────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.10)] backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="text-lg font-bold tabular-nums text-foreground">
              <Money amountUSD={derived.total} showUsdInBrackets={false} />
            </p>
          </div>
          <Button size="lg" className="h-11 shrink-0 px-6 font-semibold" onClick={handleCheckout}>
            Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Clear cart dialog ────────────────────────────────────── */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear cart?</AlertDialogTitle>
            <AlertDialogDescription>
              All items in your cart will be removed. Items in &ldquo;Saved for later&rdquo; will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void cart.clear().then(() => toast('Cart cleared')); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

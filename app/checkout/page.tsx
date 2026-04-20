'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  checkoutTotals,
  getCheckoutSession,
  type CheckoutLineItem,
} from '@/lib/checkout-session';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Money } from '@/components/money';

const CHECKOUT_STEP_ORDER = ['shipping', 'payment'] as const;

const CHECKOUT_STEP_LABELS: Record<(typeof CHECKOUT_STEP_ORDER)[number], string> = {
  shipping: 'Shipping',
  payment: 'Payment',
};

function CheckoutProgressStrip({ step }: { step: (typeof CHECKOUT_STEP_ORDER)[number] }) {
  const stepIndex = CHECKOUT_STEP_ORDER.indexOf(step);

  return (
    <div
      className="w-full rounded-xl border border-border/60 bg-card/80 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5"
      role="group"
      aria-label={`Checkout progress, step ${stepIndex + 1} of ${CHECKOUT_STEP_ORDER.length}: ${CHECKOUT_STEP_LABELS[step]}`}
    >
      <div className="flex gap-1.5 sm:gap-2" aria-hidden>
        {CHECKOUT_STEP_ORDER.map((_, i) => {
          const filled = i <= stepIndex;
          const current = i === stepIndex;
          return (
            <div
              key={i}
              className={cn(
                'relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
                current && filled
                  ? 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                  : 'ring-1 ring-border/50',
              )}
            >
              <div
                className={cn(
                  'h-full rounded-full transition-[width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                  filled
                    ? 'w-full bg-linear-to-r from-primary via-primary to-primary/88 shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                    : 'w-0 opacity-0',
                )}
              />
            </div>
          );
        })}
      </div>

      <div
        className="mt-3.5 grid grid-cols-2 gap-1 text-[11px] font-medium leading-tight tracking-tight sm:gap-3 sm:text-[13px]"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={CHECKOUT_STEP_ORDER.length}
        aria-label={`Step ${stepIndex + 1} of ${CHECKOUT_STEP_ORDER.length}`}
      >
        {CHECKOUT_STEP_ORDER.map((key, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          const label = CHECKOUT_STEP_LABELS[key];

          return (
            <div
              key={key}
              className={cn(
                'flex min-w-0 items-center justify-center gap-1 text-center transition-colors duration-300',
                current && 'font-semibold text-foreground',
                done && !current && 'text-primary',
                !done && !current && 'text-muted-foreground',
              )}
            >
              {done ? (
                <span className="inline-flex max-w-full items-center justify-center gap-1">
                  <Check className="size-3 shrink-0 stroke-[2.5]" aria-hidden />
                  <span className="truncate">{label}</span>
                </span>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [lineItems, setLineItems] = useState<CheckoutLineItem[]>([]);
  const [sessionDiscount, setSessionDiscount] = useState(0);

  useEffect(() => {
    const session = getCheckoutSession();
    setLineItems(session?.items ?? []);
    setSessionDiscount(session?.discount ?? 0);
    setHydrated(true);
  }, []);

  const { subtotal, shipping, tax, total } = useMemo(
    () => checkoutTotals(lineItems, sessionDiscount),
    [lineItems, sessionDiscount],
  );

  const itemCount = useMemo(() => lineItems.reduce((n, i) => n + i.quantity, 0), [lineItems]);

  const [shippingData, setShippingData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingData.address || !shippingData.city || !shippingData.zipCode || !shippingData.email) {
      setError('Please fill in email and all required shipping fields');
      return;
    }
    setError('');
    setStep('payment');
  };

  const handlePayWithDpo = async () => {
    setLoading(true);
    setError('');

    const shippingAddress = [
      shippingData.address,
      shippingData.city,
      shippingData.state,
      shippingData.zipCode,
      shippingData.country,
    ]
      .filter(Boolean)
      .join(', ');

    try {
      const res = await fetch('/api/payments/dpo/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lineItems,
          discount: sessionDiscount > 0 ? sessionDiscount : undefined,
          shippingAddress,
          customerFirstName: shippingData.firstName || undefined,
          customerLastName: shippingData.lastName || undefined,
          customerEmail: shippingData.email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to initiate payment. Please try again.');
        setLoading(false);
        return;
      }

      // Redirect to DPO's hosted payment page
      window.location.href = data.checkoutUrl;
    } catch {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const pageShell = (children: ReactNode) => (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30 md:min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">{children}</div>
    </div>
  );

  if (!hydrated) {
    return pageShell(
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm font-medium">Loading checkout…</p>
      </div>,
    );
  }

  if (lineItems.length === 0) {
    return pageShell(
      <div className="space-y-8">
        <Card className="mx-auto max-w-lg border-border/80 shadow-sm">
          <CardHeader className="text-center sm:text-left">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted sm:mx-0">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">No items to check out</CardTitle>
            <CardDescription className="text-base">
              Your checkout session is empty. Add products from the marketplace or open checkout from
              your cart.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">Browse marketplace</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/cart">View cart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>,
    );
  }

  return pageShell(
    <div className="space-y-8 lg:space-y-10">
      <CheckoutProgressStrip step={step} />

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 lg:items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* ── Shipping step ── */}
          {step === 'shipping' && (
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Shipping address</CardTitle>
                    <CardDescription>Where should we deliver this order?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleShippingSubmit} className="space-y-5">
                  {error && (
                    <div
                      role="alert"
                      className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        value={shippingData.firstName}
                        onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        value={shippingData.lastName}
                        onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={shippingData.email}
                      onChange={(e) => setShippingData({ ...shippingData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Street address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      required
                      autoComplete="street-address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        required
                        autoComplete="address-level2"
                        value={shippingData.city}
                        onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State / region</Label>
                      <Input
                        id="state"
                        autoComplete="address-level1"
                        value={shippingData.state}
                        onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">
                        ZIP / postal code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        required
                        autoComplete="postal-code"
                        value={shippingData.zipCode}
                        onChange={(e) => setShippingData({ ...shippingData, zipCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        autoComplete="country-name"
                        value={shippingData.country}
                        onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" asChild className="sm:mr-auto">
                      <Link href="/cart" className="inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to cart
                      </Link>
                    </Button>
                    <Button type="submit" size="lg" className="w-full sm:w-auto min-w-[200px]">
                      Continue to payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Payment step (DPO) ── */}
          {step === 'payment' && (
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Secure payment</CardTitle>
                    <CardDescription>
                      You will be redirected to DPO Pay to complete your payment.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Shipping summary */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Truck className="h-4 w-4 text-primary" />
                      Ship to
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                      onClick={() => { setError(''); setStep('shipping'); }}
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-3 font-medium text-foreground">
                    {[shippingData.firstName, shippingData.lastName].filter(Boolean).join(' ') || '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">{shippingData.email}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {shippingData.address}
                    <br />
                    {shippingData.city}
                    {shippingData.state ? `, ${shippingData.state}` : ''} {shippingData.zipCode}
                    {shippingData.country ? <><br />{shippingData.country}</> : null}
                  </p>
                </div>

                {/* Order totals */}
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-medium tabular-nums">
                      <Money amountUSD={subtotal} />
                    </dd>
                  </div>
                  {sessionDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <dt>Discount</dt>
                      <dd className="font-medium tabular-nums">
                        −<Money amountUSD={sessionDiscount} />
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Shipping {shipping === 0 ? '(free)' : ''}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      <Money amountUSD={shipping} />
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Estimated tax</dt>
                    <dd className="font-medium tabular-nums">
                      <Money amountUSD={tax} />
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                    <dt>Total due</dt>
                    <dd className="text-primary tabular-nums">
                      <Money amountUSD={total} />
                    </dd>
                  </div>
                </dl>

                {/* DPO trust badge */}
                <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Your payment is processed securely by{' '}
                    <span className="font-medium text-foreground">DPO Pay by Network</span>. Card
                    details are never shared with SouthCaravan.
                  </span>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setError(''); setStep('shipping'); }}
                    disabled={loading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Edit shipping
                  </Button>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[220px]"
                    onClick={handlePayWithDpo}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirecting to DPO…
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay with DPO
                        <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-60" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Order summary sidebar ── */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <Card className="border-border/80 shadow-md lg:sticky lg:top-24">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">Order summary</CardTitle>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <ul className="space-y-4 max-h-[min(420px,50vh)] overflow-y-auto pr-1 -mr-1">
                {lineItems.map((item) => (
                  <li key={`${item.id}-${item.quantity}`} className="flex gap-3 text-sm">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                      {item.image?.startsWith('http') ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-1 text-center">
                          {item.image ? (
                            <span className="line-clamp-2 text-[10px] text-muted-foreground">
                              {item.image}
                            </span>
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground/50" />
                          )}
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-foreground line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.vendor}</p>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        {item.quantity} × <Money amountUSD={item.price} />
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      <Money amountUSD={item.price * item.quantity} />
                    </span>
                  </li>
                ))}
              </ul>

              <Separator />

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">
                    <Money amountUSD={subtotal} />
                  </dd>
                </div>
                {sessionDiscount > 0 && (
                  <div className="flex justify-between text-primary">
                    <dt>Discount</dt>
                    <dd className="tabular-nums">
                      −<Money amountUSD={sessionDiscount} />
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="tabular-nums">
                    <Money amountUSD={shipping} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular-nums">
                    <Money amountUSD={tax} />
                  </dd>
                </div>
              </dl>
              <div className="flex justify-between border-t border-border pt-4 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary tabular-nums">
                  <Money amountUSD={total} />
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>,
  );
}

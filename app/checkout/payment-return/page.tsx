'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2, ShoppingBag, XCircle } from 'lucide-react';
import { clearCheckoutLineItems } from '@/lib/checkout-session';

type VerifyState =
  | { phase: 'verifying' }
  | { phase: 'paid'; orderId: string; customerName?: string }
  | { phase: 'failed'; reason: string }
  | { phase: 'error'; message: string };

export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerifyState>({ phase: 'verifying' });

  useEffect(() => {
    // DPO returns: TransID (or TransactionToken), CCDapproval, PnrID, CompanyRef
    const transToken =
      searchParams.get('TransID') ??
      searchParams.get('TransactionToken') ??
      searchParams.get('token') ??
      '';

    if (!transToken) {
      setState({ phase: 'error', message: 'Missing transaction token in redirect URL.' });
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/payments/dpo/verify?token=${encodeURIComponent(transToken)}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setState({ phase: 'error', message: data.error ?? 'Verification request failed.' });
          return;
        }

        if (data.paid) {
          clearCheckoutLineItems();
          setState({ phase: 'paid', orderId: data.orderId, customerName: data.customerName });
          setTimeout(() => router.push('/buyer/orders'), 5000);
        } else {
          setState({
            phase: 'failed',
            reason: data.resultExplanation ?? 'Payment was not completed.',
          });
        }
      } catch {
        setState({ phase: 'error', message: 'Could not reach the server. Please try again.' });
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/30 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border/80 shadow-md">
        <CardContent className="pt-10 pb-8">
          {state.phase === 'verifying' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <p className="text-lg font-semibold text-foreground">Confirming your payment…</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Please wait while we verify your transaction with DPO Pay.
                </p>
              </div>
            </div>
          )}

          {state.phase === 'paid' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-9 w-9 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Payment confirmed!
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {state.customerName
                    ? `Thank you, ${state.customerName}. Your`
                    : 'Your'}{' '}
                  order has been placed and confirmed.
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  Order&nbsp;#{state.orderId.slice(-8).toUpperCase()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Redirecting you to your orders in a moment…
              </p>
              <Button className="w-full" asChild>
                <Link href="/buyer/orders">Go to orders now</Link>
              </Button>
            </div>
          )}

          {state.phase === 'failed' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-9 w-9 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Payment not completed
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{state.reason}</p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button variant="default" className="w-full" asChild>
                  <Link href="/checkout">Try again</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/cart">Back to cart</Link>
                </Button>
              </div>
            </div>
          )}

          {state.phase === 'error' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-9 w-9 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {state.message}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/buyer/orders">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Check my orders
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/">Back to marketplace</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

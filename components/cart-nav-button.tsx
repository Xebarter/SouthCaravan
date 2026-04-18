'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-store';
import { cn } from '@/lib/utils';

export function CartNavButton({
  className,
  mobile = false,
}: {
  className?: string;
  mobile?: boolean;
}) {
  const { derived, hydrated } = useCart();
  const lines = derived.distinctCount;
  const label =
    lines > 0 ? `Shopping cart, ${lines} ${lines === 1 ? 'line' : 'lines'}` : 'Shopping cart';

  return (
    <Button variant="ghost" size="icon" asChild className={cn('relative shrink-0', className)}>
      <Link href="/cart" aria-label={label}>
        <ShoppingCart className={mobile ? 'h-5 w-5' : 'h-5 w-5'} />
        {hydrated && lines > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
            {lines > 99 ? '99+' : lines}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}

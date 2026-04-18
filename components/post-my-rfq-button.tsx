'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

const RFQ_DESTINATION = '/buyer/quotes';

function buyerSignInHref() {
  const qs = new URLSearchParams();
  qs.set('role', 'buyer');
  qs.set('next', RFQ_DESTINATION);
  return `/login?${qs.toString()}`;
}

export function resolvePostMyRfqPath(user: User | null | undefined) {
  if (user?.role === 'buyer') return RFQ_DESTINATION;
  return buyerSignInHref();
}

export function PostMyRfqButton({
  className,
  children,
  showArrow = false,
  ...props
}: React.ComponentProps<typeof Button> & { showArrow?: boolean }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleClick = () => {
    if (isLoading) return;
    router.push(resolvePostMyRfqPath(user));
  };

  return (
    <Button
      type="button"
      className={cn(className)}
      disabled={Boolean(isLoading) || Boolean(props.disabled)}
      aria-busy={isLoading}
      onClick={handleClick}
      {...props}
    >
      {children ?? (
        <>
          Post My RFQ
          {showArrow ? <ArrowRight className="w-4 h-4 ml-2" /> : null}
        </>
      )}
    </Button>
  );
}

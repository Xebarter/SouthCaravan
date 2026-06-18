'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMobileNavigation } from '@/components/navigation/mobile-navigation-provider';
import { cn } from '@/lib/utils';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  fallbackHref: string;
  href?: string;
};

/**
 * In-app back control: uses browser history on mobile when possible, with a
 * sensible fallback route when the stack is empty (e.g. deep link / PWA entry).
 */
export function BackLink({ fallbackHref, href, className, children, onClick, ...rest }: Props) {
  const { goBack } = useMobileNavigation();

  return (
    <Link
      href={href ?? fallbackHref}
      className={cn('inline-flex items-center gap-2 text-sm', className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        goBack(fallbackHref);
      }}
      {...rest}
    >
      {children ?? (
        <>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </>
      )}
    </Link>
  );
}

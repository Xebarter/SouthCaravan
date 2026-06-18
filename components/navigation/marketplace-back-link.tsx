'use client';

import { ArrowLeft } from 'lucide-react';
import { BackLink } from '@/components/navigation/back-link';
import { cn } from '@/lib/utils';

export function MarketplaceBackLink({ className }: { className?: string }) {
  return (
    <BackLink
      fallbackHref="/"
      className={cn('text-slate-600 hover:text-slate-900', className)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back to marketplace
    </BackLink>
  );
}

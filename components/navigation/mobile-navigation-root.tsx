'use client';

import { Suspense, type ReactNode } from 'react';
import { MobileNavigationProvider } from '@/components/navigation/mobile-navigation-provider';

function MobileNavigationProviderWithSearchParams({ children }: { children: ReactNode }) {
  return <MobileNavigationProvider>{children}</MobileNavigationProvider>;
}

export function MobileNavigationRoot({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <MobileNavigationProviderWithSearchParams>{children}</MobileNavigationProviderWithSearchParams>
    </Suspense>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MainNav } from '@/components/main-nav';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MarketplaceActionStrip, shouldShowMarketplaceActionStrip } from '@/components/marketplace/marketplace-action-strip';
import { DashboardNavProvider } from '@/components/dashboard-nav-context';
import { AuthProvider } from '@/lib/auth-context';
import { CurrencyProvider } from '@/components/currency/currency-provider';
import { MobileNavigationRoot } from '@/components/navigation/mobile-navigation-root';
import { isAnyDashboardConsolePath } from '@/lib/dashboard-console-path';
import { Toaster } from '@/components/ui/sonner';
import {
  DEFAULT_MARKETPLACE_TAXONOMY,
  type DefaultMarketplaceSection,
} from '@/lib/default-marketplace-taxonomy';

const publicRoutePrefixes = [
  '/',
  '/auth',
  '/login',
  '/signup',
  '/product',
  '/supplier',
  '/public',
  '/categories',
  '/featured',
  '/cart',
  '/checkout',
  '/features',
  '/about',
  '/careers',
  '/contact',
  '/resources',
  '/blog',
  '/faq',
  '/help',
  '/security',
  '/privacy',
  '/terms',
  '/cookies',
  '/compliance',
  '/status',
];

function isPublicRoute(pathname: string) {
  return publicRoutePrefixes.some((route) => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/** Sign-in entry routes: no footer so the form fits in the viewport below the header. */
function isAuthEntryPath(pathname: string) {
  return (
    pathname === '/auth' ||
    pathname.startsWith('/auth/') ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/')
  );
}

export function AppShell({
  children,
  menuSections = DEFAULT_MARKETPLACE_TAXONOMY,
}: {
  children: React.ReactNode;
  menuSections?: DefaultMarketplaceSection[];
}) {
  const pathname = usePathname();
  const publicPage = useMemo(() => isPublicRoute(pathname), [pathname]);
  const dashboardConsolePage = useMemo(() => isAnyDashboardConsolePath(pathname), [pathname]);
  const showActionStrip = useMemo(() => shouldShowMarketplaceActionStrip(pathname), [pathname]);
  const stripCategories = useMemo(
    () => menuSections.map((section) => section.title).filter(Boolean),
    [menuSections],
  );

  let shell: ReactNode;

  if (!publicPage) {
    if (dashboardConsolePage) {
      shell = (
        <DashboardNavProvider>
          <Header />
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">{children}</div>
              <Footer />
            </div>
          </div>
          <Toaster richColors closeButton position="top-center" />
        </DashboardNavProvider>
      );
    } else {
      shell = (
        <>
          <MainNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </>
      );
    }
  } else if (isAuthEntryPath(pathname)) {
    shell = (
      <>
        <Header />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <Toaster richColors closeButton position="top-center" />
      </>
    );
  } else {
    shell = (
      <>
        <Header />
        {showActionStrip ? <MarketplaceActionStrip categories={stripCategories} /> : null}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <main className="flex-1 min-w-0">{children}</main>
            <Footer />
          </div>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </>
    );
  }

  return (
    <AuthProvider>
      <CurrencyProvider>
        <MobileNavigationRoot>{shell}</MobileNavigationRoot>
      </CurrencyProvider>
    </AuthProvider>
  );
}

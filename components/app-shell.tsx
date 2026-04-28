'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MainNav } from '@/components/main-nav';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/sonner';
import {
  DEFAULT_MARKETPLACE_TAXONOMY,
  type DefaultMarketplaceSection,
} from '@/lib/default-marketplace-taxonomy';
import { isVendorConsolePath } from '@/lib/vendor-console-path';
import { isServicesConsolePath } from '@/lib/services-console-path';

const publicRoutePrefixes = [
  '/',
  '/auth',
  '/login',
  '/signup',
  '/product',
  '/supplier',
  '/public',
  '/categories',
  '/cart',
  '/checkout',
  '/features',
  '/pricing',
  '/about',
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

export function AppShell({
  children,
  menuSections = DEFAULT_MARKETPLACE_TAXONOMY,
}: {
  children: React.ReactNode;
  menuSections?: DefaultMarketplaceSection[];
}) {
  const pathname = usePathname();
  const publicPage = useMemo(() => isPublicRoute(pathname), [pathname]);
  const adminPage = useMemo(
    () => pathname === '/admin' || pathname.startsWith('/admin/'),
    [pathname],
  );
  const vendorConsolePage = useMemo(() => isVendorConsolePath(pathname), [pathname]);
  const buyerConsolePage = useMemo(() => pathname === '/buyer' || pathname.startsWith('/buyer/'), [pathname]);
  const servicesConsolePage = useMemo(() => isServicesConsolePath(pathname), [pathname]);
  const marketplacePortalConsole = buyerConsolePage || servicesConsolePage;

  if (!publicPage) {
    if (vendorConsolePage) {
      return (
        <main data-vendor-console className="flex-1 min-h-screen">
          {children}
        </main>
      );
    }

    if (marketplacePortalConsole) {
      return (
        <>
          <Header />
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="flex-1 min-w-0 min-h-0 flex flex-col">{children}</div>
              <Footer />
            </div>
          </div>
          <Toaster richColors closeButton position="top-center" />
        </>
      );
    }

    if (adminPage) {
      return <main className="flex-1 min-h-screen">{children}</main>;
    }

    return (
      <>
        <MainNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
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

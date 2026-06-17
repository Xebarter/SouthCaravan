'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  ExternalLink,
  FileText,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  ShoppingBag,
} from 'lucide-react';

import {
  DashboardConsoleChrome,
  type SidebarNavItem,
} from '@/components/dashboard/dashboard-workspace-sidebar';
import { useAuth } from '@/lib/auth-context';
import { PORTAL_DESTINATIONS } from '@/lib/portal-session';
import {
  resolveVendorSidebarDisplayName,
  VENDOR_COMPANY_NAME_UPDATED_EVENT,
} from '@/lib/vendor-display-name';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/vendor/quotes', label: 'Quotes', icon: FileText },
  { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
];

export function VendorConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(() =>
    resolveVendorSidebarDisplayName(undefined, user),
  );
  const vendorEmail = user?.email?.trim() || '';

  useEffect(() => {
    setDisplayName(resolveVendorSidebarDisplayName(undefined, user));
  }, [user?.id, user?.name, user?.company]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/vendor/profile', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const companyName = json?.profile?.company_name as string | undefined;
        if (!cancelled) {
          setDisplayName(resolveVendorSidebarDisplayName(companyName, user));
        }
      } catch {
        // Keep the auth-based fallback.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user]);

  useEffect(() => {
    const onCompanyNameUpdated = (event: Event) => {
      const companyName = (event as CustomEvent<{ companyName?: string }>).detail?.companyName;
      setDisplayName(resolveVendorSidebarDisplayName(companyName, user));
    };

    window.addEventListener(VENDOR_COMPANY_NAME_UPDATED_EVENT, onCompanyNameUpdated);
    return () => window.removeEventListener(VENDOR_COMPANY_NAME_UPDATED_EVENT, onCompanyNameUpdated);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <DashboardConsoleChrome
      portal="vendor"
      sheetTitle="Vendor workspace menu"
      displayName={displayName}
      displayEmail={vendorEmail || undefined}
      pathname={pathname}
      navItems={NAV_ITEMS}
      footerActions={[
        {
          label: 'Buyer workspace',
          icon: ShoppingBag,
          href: PORTAL_DESTINATIONS.buyer,
        },
        {
          label: 'Storefront',
          icon: ExternalLink,
          href: '/',
        },
      ]}
      onSignOut={handleLogout}
    >
      {children}
    </DashboardConsoleChrome>
  );
}

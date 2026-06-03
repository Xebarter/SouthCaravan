'use client';

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

  const companyName = user?.company?.trim() || user?.name?.trim() || 'Vendor';
  const storefrontHref = user?.id ? `/vendor/${user.id}` : '/';
  const vendorName = user?.name?.trim() || companyName;
  const vendorEmail = user?.email?.trim() || '';

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <DashboardConsoleChrome
      portal="vendor"
      sheetTitle="Vendor workspace menu"
      displayName={vendorName}
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
          href: storefrontHref,
          external: true,
        },
      ]}
      onSignOut={handleLogout}
    >
      {children}
    </DashboardConsoleChrome>
  );
}

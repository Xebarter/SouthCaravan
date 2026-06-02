'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  Briefcase,
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  NotebookPen,
  Package,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

import {
  DashboardConsoleChrome,
  type SidebarNavItem,
} from '@/components/dashboard/dashboard-workspace-sidebar';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/vendors', label: 'Vendor Approvals', icon: ShieldCheck },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/quotes', label: 'RFQ Quotes', icon: FileText },
  { href: '/admin/adds', label: 'Adds', icon: Megaphone },
  { href: '/admin/services', label: 'Services', icon: Boxes },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/blog', label: 'Blog', icon: NotebookPen },
  { href: '/admin/careers', label: 'Careers', icon: Briefcase },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Admin';
  const displayEmail = user?.email?.trim() || undefined;

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <DashboardConsoleChrome
      portal="admin"
      sheetTitle="Admin workspace menu"
      displayName={displayName}
      displayEmail={displayEmail}
      pathname={pathname}
      navItems={NAV_ITEMS}
      footerActions={[
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

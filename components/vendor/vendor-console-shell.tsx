'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';
import { cn } from '@/lib/utils';

const vendorNavItems = [
  { href: '/vendor/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/vendor/messages', label: 'Messages', icon: MessageSquare },
  { href: '/vendor/products', label: 'Products', icon: Package },
  { href: '/vendor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/vendor/settings', label: 'Settings', icon: Settings },
  { href: '/vendor/overview', label: 'Overview', icon: LayoutGrid },
];

function VendorSidebar({
  pathname,
  storefrontHref,
  onNavigate,
}: {
  pathname: string;
  storefrontHref: string;
  onNavigate?: () => void;
}) {
  return (
    <aside className="h-full border-r border-border bg-card/40">
      <div className="h-16 border-b border-border px-5 flex items-center">
        <div>
          <p className="text-xs text-muted-foreground">SouthCaravan</p>
          <h2 className="font-semibold">Vendor Hub</h2>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {vendorNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:bg-secondary',
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-border/60">
          <Link
            href={storefrontHref}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              pathname === storefrontHref
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            <Store className="w-4 h-4" />
            Public storefront
            <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-70" aria-hidden />
          </Link>
        </div>
      </nav>
    </aside>
  );
}

export function VendorConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const vendorProfile = getVendorProfileForConsole(user);
  const storefrontHref = vendorProfile ? `/vendor/${vendorProfile.id}` : '/catalog';

  const handleLogout = () => {
    logout();
    router.push('/auth?role=vendor&next=/vendor');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMenuOpen(true)}
            aria-label="Open vendor menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold truncate">
              {vendorProfile?.companyName ?? 'Vendor hub'}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email ?? 'Preview — sign in to personalize'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/">View site</Link>
          </Button>
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:block w-72">
          <VendorSidebar pathname={pathname} storefrontHref={storefrontHref} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-auto">{children}</div>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
            aria-label="Close vendor menu"
          />
          <div className="absolute left-0 top-0 h-full w-[82vw] max-w-sm bg-background shadow-xl">
            <div className="h-16 border-b border-border px-4 flex items-center justify-between">
              <p className="font-semibold">Vendor menu</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close vendor menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <VendorSidebar
              pathname={pathname}
              storefrontHref={storefrontHref}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

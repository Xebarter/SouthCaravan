'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutGrid,
  ShoppingCart,
  FileText,
  MessageSquare,
  User,
  Menu,
  CircleHelp,
  ArrowLeft,
  LogOut,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/buyer', label: 'Dashboard', icon: LayoutGrid },
  { href: '/buyer/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/buyer/services', label: 'Services', icon: FileText },
  { href: '/buyer/wishlist', label: 'Wishlist', icon: MessageSquare },
  { href: '/buyer/addresses', label: 'Addresses', icon: MapPin },
  { href: '/buyer/profile', label: 'Profile', icon: User },
  { href: '/buyer/support', label: 'Support', icon: CircleHelp },
] as const;

export default function BuyerConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // 1) Initial hydrate from localStorage.
    let initialName: string | null = null;
    let initialEmail: string | null = null;
    try {
      initialName = localStorage.getItem('currentBuyerName');
      initialEmail = localStorage.getItem('currentBuyerEmail');
    } catch {
      initialName = null;
      initialEmail = null;
    }

    if (!cancelled) {
      setBuyerName(initialName);
      setBuyerEmail(initialEmail);
    }

    // 2) Also hydrate from Supabase (in case localStorage is stale/missing).
    (async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email ?? null;
        if (cancelled) return;

        if (email) {
          setBuyerEmail(email);
          try {
            localStorage.setItem('currentBuyerEmail', email);
          } catch {}

          // If buyerName wasn’t set yet, derive it from the email prefix.
          if (!initialName) {
            const derivedName = email.split('@')[0] || 'User';
            setBuyerName(derivedName);
            try {
              localStorage.setItem('currentBuyerName', derivedName);
            } catch {}
          }
        }
      } catch {
        // If Supabase isn't available / user isn't authenticated, keep localStorage values.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    // Auth context clears the expected buyer portal keys and signs out via Supabase.
    logout();
    router.replace('/auth?role=buyer&next=/buyer');
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-1 min-h-0 bg-muted/20">
      {/* Mobile backdrop (drawer close) */}
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close buyer menu"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      {/* Sidebar (fixed off-canvas on mobile, static on desktop) */}
      <aside
        className={cn(
          // Keep the sidebar persistent on larger screens (below the sticky MainNav).
          'fixed inset-y-0 left-0 z-40 w-72 max-w-[86vw] p-4 bg-muted/20 md:static md:z-auto md:w-80 md:max-w-none lg:sticky lg:top-16 lg:bottom-auto lg:h-[calc(100dvh-4rem)]',
          'transition-transform duration-200',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="w-full bg-card/80 backdrop-blur border border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Desktop workspace header (hidden on mobile; mobile uses sticky header) */}
          <div className="hidden md:block px-5 py-4 border-b border-border/70">
            <p className="text-xs font-medium text-muted-foreground">Workspace</p>
            <h2 className="mt-1 font-semibold text-foreground">MyGarage Buyer</h2>
            <p className="text-sm text-muted-foreground truncate mt-2">{buyerName ?? '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{buyerEmail ?? '—'}</p>
          </div>

          <nav className="p-2 space-y-1 overflow-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm transition-colors',
                    isActive ? 'bg-primary/95 text-primary-foreground shadow-sm' : 'text-foreground hover:bg-accent/70'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary-foreground/80 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-2 border-t border-border/70 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-2xl px-4 py-2 text-sm text-foreground hover:bg-accent/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Back to Shop</span>
            </Link>

            <Button
              type="button"
              onClick={handleLogout}
              variant="outline"
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-2 text-sm border-border/70 hover:bg-muted/20"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col md:pl-4">
        {/* Mobile sticky header + drawer trigger */}
        <div className="md:hidden sticky top-0 z-50 px-4 py-3 bg-muted/20 backdrop-blur border-b border-border/70">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">MyGarage Buyer</p>
              <p className="text-sm font-semibold text-foreground truncate">{buyerName ?? '—'}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open buyer menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <main className="flex flex-1 overflow-auto min-h-0 flex-col">{children}</main>
      </div>
    </div>
  );
}


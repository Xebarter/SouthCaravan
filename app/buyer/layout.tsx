'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutGrid,
  ShoppingCart,
  FileText,
  MessageSquare,
  Heart,
  ClipboardList,
  Menu,
  User,
  CircleHelp,
  ArrowLeft,
  LogOut,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/buyer', label: 'Dashboard', icon: LayoutGrid },
  { href: '/buyer/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/buyer/quotes', label: 'Quotes', icon: FileText },
  { href: '/buyer/rfqs', label: 'My RFQs', icon: ClipboardList },
  { href: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
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
  const { user, isLoading, logout } = useAuth();

  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const next = pathname || '/buyer';
      router.replace(`/auth?role=buyer&next=${encodeURIComponent(next)}`);
      return;
    }

    if (user.role === 'vendor') router.replace('/vendor');
    if (user.role === 'admin') router.replace('/dashboard');
  }, [isLoading, user, router, pathname]);

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
          } catch { }

          // If buyerName wasn’t set yet, derive it from the email prefix.
          if (!initialName) {
            const derivedName = email.split('@')[0] || 'User';
            setBuyerName(derivedName);
            try {
              localStorage.setItem('currentBuyerName', derivedName);
            } catch { }
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
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-linear-to-b from-background via-background to-muted/30">
      {/* Mobile header + hamburger */}
      <div className="md:hidden sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground truncate">Buyer</p>
            <p className="text-sm font-semibold text-foreground truncate">{buyerName ?? 'Account'}</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="h-full flex flex-col">
                <div className="px-5 py-4 border-b border-border/70 bg-linear-to-b from-card/60 to-transparent">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">Menu</p>
                  <p className="mt-1 text-base font-semibold text-foreground truncate">{buyerName ?? '—'}</p>
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
                        className={cn(
                          'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                            : 'text-foreground/90 hover:bg-accent/60 hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0 transition-transform', isActive ? '' : 'group-hover:scale-[1.04]')} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto p-3 border-t border-border/70 space-y-2">
                  <Link
                    href="/"
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-foreground hover:bg-accent/70 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span className="truncate">Back to Shop</span>
                  </Link>

                  <Button
                    type="button"
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm border-border/70 hover:bg-muted/20"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:block w-72 p-4 bg-muted/20 shrink-0 md:w-80 lg:sticky lg:top-4 lg:bottom-auto lg:h-[calc(100dvh-2rem)]'
        )}
      >
        <div className="w-full bg-card/70 backdrop-blur border border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Desktop workspace header (hidden on mobile; mobile uses sticky header) */}
          <div className="hidden md:block px-5 py-4 border-b border-border/70 bg-linear-to-b from-card/70 to-transparent">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Workspace</p>
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
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                      : 'text-foreground/90 hover:bg-accent/60 hover:text-foreground'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary-foreground/80 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Icon className={cn('w-4 h-4 shrink-0 transition-transform', isActive ? '' : 'group-hover:scale-[1.04]')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto p-2 border-t border-border/70 space-y-2">
            <Link
              href="/"
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
        <main className="flex flex-1 overflow-auto min-h-0 flex-col">{children}</main>
      </div>
    </div>
  );
}


'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  Boxes,
  Briefcase,
  ClipboardList,
  FileText,
  LayoutGrid,
  Megaphone,
  Menu,
  MessageSquare,
  NotebookPen,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/vendors', label: 'Vendor Approvals', icon: ShieldCheck },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/quotes', label: 'RFQ Quotes', icon: FileText },
  { href: '/admin/featured-products', label: 'Featured Products', icon: Sparkles },
  { href: '/admin/adds', label: 'Adds', icon: Megaphone },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/blog', label: 'Blog', icon: NotebookPen },
  { href: '/admin/careers', label: 'Careers', icon: Briefcase },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminSidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    try {
      logout();
      onNavigate?.();
      router.push('/auth');
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="h-full border-r border-border bg-card/40 flex flex-col">
      <div className="h-16 border-b border-border px-5 flex items-center">
        <div>
          <p className="text-xs text-muted-foreground">SouthCaravan</p>
          <h2 className="font-semibold">Admin Console</h2>
        </div>
      </div>
      <nav className="p-3 space-y-1 flex-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== '/admin' && pathname.startsWith(`${item.href}/`));

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
      </nav>
      <div className="p-3 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl"
          onClick={onSignOut}
          disabled={signingOut}
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-16 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Admin Dashboard</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">View Storefront</Link>
        </Button>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:block w-72">
          <AdminSidebar pathname={pathname} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6">{children}</div>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
            aria-label="Close admin menu"
          />
          <div className="absolute left-0 top-0 h-full w-[82vw] max-w-sm bg-background shadow-xl">
            <div className="h-16 border-b border-border px-4 flex items-center justify-between">
              <p className="font-semibold">Admin Menu</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close admin menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AdminSidebar pathname={pathname} onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

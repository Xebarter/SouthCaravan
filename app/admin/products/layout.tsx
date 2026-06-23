'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  {
    href: '/admin/products',
    label: 'All products',
    icon: LayoutGrid,
    match: (path: string) => path === '/admin/products',
  },
  {
    href: '/admin/products/featured',
    label: 'Featured order',
    icon: Star,
    match: (path: string) => path.startsWith('/admin/products/featured'),
  },
] as const;

export default function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav
        className="inline-flex w-full max-w-md gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
        aria-label="Products admin"
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

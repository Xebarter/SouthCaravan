'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin/services', label: 'Listings', icon: BriefcaseBusiness, exact: true },
  { href: '/admin/services/providers', label: 'Providers', icon: UserRound, exact: false },
] as const;

export default function AdminServicesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 border-b border-border/60 pb-0">
        {TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

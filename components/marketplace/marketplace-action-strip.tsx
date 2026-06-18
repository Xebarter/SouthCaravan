'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Search, Sparkles, Star } from 'lucide-react';
import { PostMyRfqButton } from '@/components/post-my-rfq-button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

type Props = {
  categories: string[];
};

function normalizeCategories(categories: string[]) {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const name of categories) {
    const cleaned = name.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(cleaned);
  }
  return items;
}

function actionLinkClass(active: boolean) {
  return cn(
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors sm:text-sm',
    active
      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
      : 'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/60',
  );
}

function categoryPillClass() {
  return cn(
    'inline-flex h-8 max-w-[34ch] shrink-0 items-center truncate rounded-full border border-border/80',
    'bg-muted/30 px-3 text-xs font-medium text-foreground transition-colors',
    'hover:border-primary/25 hover:bg-primary/5 hover:text-primary',
  );
}

export function MarketplaceActionStrip({ categories }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const normalized = useMemo(() => normalizeCategories(categories), [categories]);
  const visible = useMemo(() => normalized.slice(0, 14), [normalized]);
  const remaining = Math.max(0, normalized.length - visible.length);

  const isCategories = pathname === '/categories' || pathname.startsWith('/categories/');
  const isFeatured = pathname === '/featured' || pathname.startsWith('/featured/');
  const isServices = pathname.startsWith('/public/services');

  return (
    <>
      <div
        className={cn(
          'border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85',
          'md:sticky md:top-16 md:z-40',
        )}
      >
        <div className="mx-auto max-w-[1500px] px-4 py-2 md:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto scrollbar-none">
              <Link href="/categories" className={actionLinkClass(isCategories)}>
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                <span>Categories</span>
              </Link>
              <Link href="/featured" className={actionLinkClass(isFeatured)}>
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                <span>Featured</span>
              </Link>
              <Link href="/public/services/browse" className={actionLinkClass(isServices)}>
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                <span className="hidden sm:inline">Services</span>
              </Link>
              <PostMyRfqButton
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold sm:text-sm"
              />
            </div>

            <div className="hidden h-7 w-px shrink-0 bg-border/80 sm:block" aria-hidden />

            <div className="relative min-w-0 flex-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 overflow-x-auto scrollbar-none',
                  'pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none]',
                  '[&::-webkit-scrollbar]:hidden',
                )}
              >
                {visible.map((category) => (
                  <Link
                    key={category}
                    href={`/categories?category=${encodeURIComponent(category)}`}
                    className={categoryPillClass()}
                    title={category}
                  >
                    {category}
                  </Link>
                ))}
                {remaining > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className={cn(categoryPillClass(), 'cursor-pointer')}
                  >
                    +{remaining} more
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className={cn(
                    categoryPillClass(),
                    'cursor-pointer gap-1 text-muted-foreground hover:text-primary',
                  )}
                  aria-label="Search all categories"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">All</span>
                </button>
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search categories…" />
        <CommandList>
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup heading="Shop by category">
            <CommandItem
              onSelect={() => {
                setSearchOpen(false);
                router.push('/categories');
              }}
            >
              All categories
            </CommandItem>
            {normalized.map((category) => (
              <CommandItem
                key={category}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(`/categories?category=${encodeURIComponent(category)}`);
                }}
              >
                {category}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function shouldShowMarketplaceActionStrip(pathname: string) {
  return pathname === '/';
}

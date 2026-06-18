'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export function CategoryQuickNav({
  categories,
  activeCategory,
  compact = false,
  servicesMode = false,
}: {
  categories: string[];
  activeCategory?: string;
  compact?: boolean;
  servicesMode?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => {
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
  }, [categories]);

  const visible = useMemo(() => normalized.slice(0, compact ? 14 : 12), [compact, normalized]);
  const remainingCount = Math.max(0, normalized.length - visible.length);

  const pillClass = (active: boolean) =>
    cn(
      'inline-flex h-7 max-w-[36ch] items-center truncate rounded-full border px-2.5 text-xs font-medium transition-colors',
      active
        ? 'border-primary bg-primary text-primary-foreground'
        : 'border-border bg-background text-foreground hover:bg-muted',
    );

  const categoryHref = (category?: string) => {
    const params = new URLSearchParams();
    if (servicesMode) params.set('type', 'services');
    if (category) params.set('category', category);
    const qs = params.toString();
    return qs ? `/categories?${qs}` : '/categories';
  };

  const pills = (
    <div className="flex flex-wrap gap-1.5">
      <Link href={categoryHref()} className={pillClass(!activeCategory)}>
        All
      </Link>
      {visible.map((category) => (
        <Link
          key={category}
          href={categoryHref(category)}
          className={pillClass(activeCategory === category)}
          title={category}
        >
          {category}
        </Link>
      ))}
      {remainingCount > 0 ? (
        <button type="button" onClick={() => setOpen(true)} className={pillClass(false)}>
          +{remainingCount}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(pillClass(false), 'gap-1')}
        aria-label="Search categories"
      >
        <Search className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <>
      {compact ? pills : (
        <div className="rounded-xl border border-border/70 bg-card p-3 shadow-sm sm:p-4">{pills}</div>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search categories…" />
        <CommandList>
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup heading="Categories">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push(categoryHref());
              }}
            >
              All categories
            </CommandItem>
            {normalized.map((category) => (
              <CommandItem
                key={category}
                onSelect={() => {
                  setOpen(false);
                  router.push(categoryHref(category));
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

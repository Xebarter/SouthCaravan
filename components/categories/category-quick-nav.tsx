'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export function CategoryQuickNav({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory?: string;
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

  const visible = useMemo(() => normalized.slice(0, 12), [normalized]);
  const remainingCount = Math.max(0, normalized.length - visible.length);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Browse by category</p>
        </div>
        <Badge variant="secondary" className="tabular-nums">
          {normalized.length} categories
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/categories"
          className={[
            'inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition',
            !activeCategory
              ? 'border-primary bg-primary/10 font-medium text-primary'
              : 'border-border bg-muted/40 text-foreground hover:bg-muted',
          ].join(' ')}
        >
          All categories
        </Link>

        {visible.map((category) => {
          const isActive = activeCategory === category;
          return (
            <Link
              key={category}
              href={`/categories?category=${encodeURIComponent(category)}`}
              className={[
                'inline-flex max-w-[42ch] items-center truncate rounded-full border px-3 py-1.5 text-sm transition',
                isActive
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-border bg-muted/40 text-foreground hover:bg-muted',
              ].join(' ')}
              title={category}
            >
              <span className="truncate">{category}</span>
            </Link>
          );
        })}

        {remainingCount > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            +{remainingCount} more
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search categories…" />
        <CommandList>
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup heading="Marketplace categories">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                router.push('/categories');
              }}
            >
              All categories
            </CommandItem>
            {normalized.map((category) => (
              <CommandItem
                key={category}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/categories?category=${encodeURIComponent(category)}`);
                }}
              >
                {category}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

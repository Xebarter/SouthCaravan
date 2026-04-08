'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type Props = {
  categories: string[];
};

function normalizeCategoryLabel(label: string) {
  return label.replace(/\s+/g, ' ').trim();
}

export default function PopularCategories({ categories }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const name of categories) {
      const cleaned = normalizeCategoryLabel(name);
      if (!cleaned) continue;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(cleaned);
    }
    return items;
  }, [categories]);

  const visible = useMemo(() => normalized.slice(0, 10), [normalized]);
  const remainingCount = Math.max(0, normalized.length - visible.length);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        {visible.map((category, idx) => (
          <Link
            key={category}
            href={`/categories?category=${encodeURIComponent(category)}`}
            className={[
              'px-3 py-1.5 rounded-full border border-slate-300 bg-slate-50 text-sm text-slate-700 hover:bg-slate-100 transition',
              idx >= 4 ? 'hidden sm:inline-flex' : 'inline-flex',
              idx >= 7 ? 'md:hidden lg:inline-flex' : '',
            ].join(' ')}
            title={category}
          >
            <span className="max-w-[42ch] truncate">{category}</span>
          </Link>
        ))}

        {remainingCount > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 bg-white text-sm text-slate-800 hover:bg-slate-50 transition"
            title="Show all categories"
          >
            <span className="font-medium">+{remainingCount} more</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 bg-white text-sm text-slate-800 hover:bg-slate-50 transition"
          title="Search all categories"
        >
          <span className="font-medium">All</span>
        </button>
      </div>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Marketplace categories"
        description="Search categories and jump directly to products."
        className="sm:max-w-xl"
      >
        <CommandInput placeholder="Search categories..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup heading="Categories">
            {normalized.map((category) => (
              <CommandItem
                key={category}
                value={category}
                onSelect={() => {
                  setOpen(false);
                  router.push(`/categories?category=${encodeURIComponent(category)}`);
                }}
              >
                <Tag className="h-4 w-4 text-slate-500" />
                <span className="truncate">{category}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}


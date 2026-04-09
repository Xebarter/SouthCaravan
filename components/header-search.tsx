'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type SearchProduct = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  subSubcategory: string;
  image: string | null;
  inStock: boolean;
  featured: boolean;
};

type CategorySuggestionType = 'category' | 'subcategory' | 'subSubcategory';

type CategorySuggestion = {
  type: CategorySuggestionType;
  value: string;
  parentCategory: string | null;
  parentSubcategory: string | null;
  label: string;
  context: string | null;
  image: string | null;
};

type SearchResponse = {
  products: SearchProduct[];
  categories: CategorySuggestion[] | string[];
  error?: string;
};

/** Marketplace browse URL for a product's taxonomy (matches `/categories` query params). */
function categoryBrowseHrefForProduct(product: SearchProduct): string {
  const category = (product.category ?? '').trim();
  if (!category) return `/product/${product.id}`;
  const params = new URLSearchParams();
  params.set('category', category);
  const sub = (product.subcategory ?? '').trim();
  if (sub) params.set('subcategory', sub);
  return `/categories?${params.toString()}`;
}

export function HeaderSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, SearchResponse>>(new Map());
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);

  const normalizeCategories = (raw: SearchResponse['categories'] | undefined): CategorySuggestion[] => {
    if (!raw) return [];

    // Backward compatibility: older API returned string[].
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      return (raw as string[])
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .map((v) => ({
          type: 'category' as const,
          value: v,
          parentCategory: null,
          parentSubcategory: null,
          label: v,
          context: null,
          image: null,
        }));
    }

    // Current shape: CategorySuggestion[]
    return (raw as CategorySuggestion[]).filter(
      (s) =>
        !!s &&
        (s.type === 'category' || s.type === 'subcategory' || s.type === 'subSubcategory') &&
        typeof s.value === 'string' &&
        s.value.trim().length > 0 &&
        typeof s.label === 'string' &&
        s.label.trim().length > 0,
    );
  };

  const showDropdown = useMemo(() => open, [open]);
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const safeCategories = useMemo(
    () => normalizeCategories(categories as unknown as SearchResponse['categories']),
    [categories],
  );

  const rankedProducts = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    const score = (p: SearchProduct) => {
      if (!q) {
        return (p.featured ? 20 : 0) + (p.inStock ? 3 : 0);
      }

      const name = (p.name ?? '').toLowerCase();
      const category = (p.category ?? '').toLowerCase();
      const subcategory = (p.subcategory ?? '').toLowerCase();
      const subSubcategory = (p.subSubcategory ?? '').toLowerCase();

      let s = 0;
      if (name === q) s += 140;
      if (name.startsWith(q)) s += 110;
      if (name.includes(q)) s += 70;
      if (category.includes(q)) s += 30;
      if (subcategory.includes(q)) s += 20;
      if (subSubcategory.includes(q)) s += 10;
      if (p.featured) s += 8;
      if (p.inStock) s += 4;
      return s;
    };

    return [...products]
      .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [products, trimmedQuery]);

  useEffect(() => {
    function onOutside(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const cacheKey = trimmed.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProducts(cached.products ?? []);
      setCategories(normalizeCategories(cached.categories as SearchResponse['categories']));
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const payload: SearchResponse = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'Search failed');
        setProducts(payload.products ?? []);
        setCategories(normalizeCategories(payload.categories));

        cacheRef.current.set(cacheKey, {
          products: payload.products ?? [],
          categories: normalizeCategories(payload.categories) as unknown as SearchResponse['categories'],
        });
        if (cacheRef.current.size > 30) {
          const firstKey = cacheRef.current.keys().next().value as string | undefined;
          if (firstKey) cacheRef.current.delete(firstKey);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setProducts([]);
        setCategories([]);
        console.error('[header-search]', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <>
      {/* Backdrop — dims the page when the mobile dropdown is open */}
      {mobile && showDropdown && (
        <div
          className="fixed inset-0 z-[69] bg-black/30 md:hidden"
          aria-hidden
          onMouseDown={() => setOpen(false)}
          onTouchStart={() => setOpen(false)}
        />
      )}

      <div ref={rootRef} className="relative flex-1">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
        <Input
          type="search"
          placeholder={mobile ? 'Search products...' : 'Search products, vendors, categories...'}
          className={mobile ? 'pl-9 bg-secondary h-9' : 'pl-9 bg-secondary'}
          value={query}
          onFocus={() => {
            setOpen(true);
            if (!products.length && !categories.length) {
              setQuery('');
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && query.trim()) {
              router.push(`/catalog?query=${encodeURIComponent(query.trim())}`);
              setOpen(false);
            }
          }}
        />

        {showDropdown && (
          <div
            className={
              mobile
                ? [
                    // Fixed panel that spans the full viewport width, sitting just below the sticky nav (h-14 = 3.5rem).
                    'fixed top-14 left-0 right-0 z-[70]',
                    'bg-background border-t border-border shadow-2xl',
                    // Use dynamic viewport height so the panel respects the on-screen keyboard.
                    'max-h-[calc(100dvh-3.5rem)]',
                    'overflow-y-auto overscroll-contain',
                    // Smooth momentum scrolling on iOS.
                    '[scroll-behavior:smooth] [-webkit-overflow-scrolling:touch]',
                  ].join(' ')
                : 'absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[70] rounded-lg border border-border bg-background shadow-lg p-3 space-y-3'
            }
          >
            {/* Status / header row */}
            <div
              className={
                mobile
                  ? 'flex items-center justify-between px-4 py-3 border-b border-border/60 sticky top-0 bg-background z-10'
                  : 'text-xs text-muted-foreground'
              }
            >
              <span className="text-xs text-muted-foreground">
                {loading
                  ? 'Loading suggestions…'
                  : trimmedQuery
                    ? `Results for "${trimmedQuery}"`
                    : 'Popular products and categories'}
              </span>
              {mobile && (
                <button
                  type="button"
                  aria-label="Close search results"
                  onClick={() => setOpen(false)}
                  className="ml-3 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
                >
                  {/* ✕ icon */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Related categories */}
            {safeCategories.length > 0 && (
              <div className={mobile ? 'px-4 pb-1 space-y-2' : 'space-y-1'}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                  Related Categories
                </p>
                <div className="space-y-2">
                  {safeCategories.map((s, idx) => {
                    const params = new URLSearchParams();
                    if (trimmedQuery) params.set('query', trimmedQuery);
                    if (s.type === 'category') {
                      params.set('category', s.value);
                    } else if (s.type === 'subcategory') {
                      if (s.parentCategory) params.set('category', s.parentCategory);
                      params.set('subcategory', s.value);
                    } else {
                      if (s.parentCategory) params.set('category', s.parentCategory);
                      if (s.parentSubcategory) params.set('subcategory', s.parentSubcategory);
                      params.set('subSubcategory', s.value);
                    }

                    return (
                      <Link
                        key={`${s.type}::${s.value}::${s.parentCategory ?? ''}::${s.parentSubcategory ?? ''}::${idx}`}
                        href={`/catalog?${params.toString()}`}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 rounded-lg border border-border hover:bg-secondary/60 active:bg-secondary transition-colors ${
                          mobile ? 'p-3 min-h-[3.25rem]' : 'p-2'
                        }`}
                      >
                        <div
                          className={`shrink-0 overflow-hidden rounded bg-secondary ${mobile ? 'h-11 w-11' : 'h-10 w-10'}`}
                        >
                          {s.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.image} alt={s.label} className="h-full w-full object-cover" />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-5 line-clamp-1">{s.label}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {s.context ? `in ${s.context}` : 'Category'}
                          </p>
                        </div>

                        <div className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          {s.type === 'subSubcategory'
                            ? 'Subcategory'
                            : s.type === 'subcategory'
                              ? 'Category'
                              : 'Category'}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product matches */}
            <div className={mobile ? 'px-4 pb-4 space-y-2' : 'space-y-1'}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Top matches</p>
              {rankedProducts.length > 0 ? (
                <div className="space-y-2">
                  {rankedProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={categoryBrowseHrefForProduct(product)}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg border border-border hover:bg-secondary/60 active:bg-secondary transition-colors ${
                        mobile ? 'p-3 min-h-[4rem]' : 'p-2'
                      }`}
                    >
                      <div
                        className={`shrink-0 overflow-hidden rounded bg-secondary ${mobile ? 'h-14 w-14' : 'h-14 w-14'}`}
                      >
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.subcategory || product.category}
                          {product.subSubcategory ? ` • ${product.subSubcategory}` : ''}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant={product.inStock ? 'default' : 'outline'} className="text-[10px]">
                            {product.inStock ? 'In Stock' : 'Out'}
                          </Badge>
                          {product.featured ? <Badge className="text-[10px]">Featured</Badge> : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : !loading ? (
                <p className="text-xs text-muted-foreground py-2">No matching products.</p>
              ) : null}
            </div>

            {/* "View all" footer — only on mobile when there's a query */}
            {mobile && trimmedQuery && (
              <div className="sticky bottom-0 bg-background border-t border-border/60 px-4 py-3">
                <Link
                  href={`/catalog?query=${encodeURIComponent(trimmedQuery)}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-3 hover:bg-primary/90 active:bg-primary/80 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  View all results for &ldquo;{trimmedQuery}&rdquo;
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

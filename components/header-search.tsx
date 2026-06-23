'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Search, Sparkles, Tag } from 'lucide-react';
import { useOverlayHistory } from '@/hooks/use-overlay-history';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/money';
import {
  categorySuggestionHref,
  productDetailHref,
  rankSearchItems,
  scoreSearchText,
  searchResultsHref,
  serviceDetailHref,
  type CategorySuggestion,
  type RankedSearchItem,
  type SearchProductResult,
  type SearchServiceResult,
} from '@/lib/site-search-utils';

type SearchResponse = {
  products: SearchProductResult[];
  services?: SearchServiceResult[];
  categories: CategorySuggestion[] | string[];
  serviceCategories?: CategorySuggestion[];
  error?: string;
};

function normalizeCategories(raw: SearchResponse['categories'] | undefined): CategorySuggestion[] {
  if (!raw) return [];

  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
    return (raw as string[])
      .filter((value) => value.trim().length > 0)
      .map((value) => ({
        kind: 'product' as const,
        type: 'category' as const,
        value,
        parentCategory: null,
        parentSubcategory: null,
        label: value,
        context: 'Product category',
        image: null,
      }));
  }

  return (raw as CategorySuggestion[])
    .filter(
      (suggestion) =>
        !!suggestion &&
        (suggestion.type === 'category' ||
          suggestion.type === 'subcategory' ||
          suggestion.type === 'subSubcategory') &&
        typeof suggestion.value === 'string' &&
        suggestion.value.trim().length > 0,
    )
    .map((suggestion) => ({
      ...suggestion,
      kind: suggestion.kind === 'service' ? 'service' : 'product',
      label: suggestion.label || suggestion.value,
      context: suggestion.context ?? null,
      image: suggestion.image ?? null,
    }));
}

function categoryTypeLabel(suggestion: CategorySuggestion) {
  if (suggestion.kind === 'service') {
    return suggestion.type === 'subcategory' ? 'Service type' : 'Service category';
  }
  if (suggestion.type === 'subSubcategory') return 'Product type';
  if (suggestion.type === 'subcategory') return 'Product subcategory';
  return 'Product category';
}

export function HeaderSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<Map<string, SearchResponse>>(new Map());
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchProductResult[]>([]);
  const [services, setServices] = useState<SearchServiceResult[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [mobileDropdownTop, setMobileDropdownTop] = useState<number>(56);

  const showDropdown = useMemo(() => open, [open]);
  const closeDropdown = () => setOpen(false);
  useOverlayHistory(mobile && showDropdown, 'header-search', closeDropdown, mobile);
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const safeCategories = useMemo(() => {
    const merged = normalizeCategories(categories as SearchResponse['categories']);
    return merged.sort((a, b) => {
      const scoreDiff = scoreSearchText(trimmedQuery, b.value) - scoreSearchText(trimmedQuery, a.value);
      if (scoreDiff !== 0) return scoreDiff;
      return a.label.localeCompare(b.label);
    });
  }, [categories, trimmedQuery]);

  const productCategories = useMemo(
    () => safeCategories.filter((item) => item.kind === 'product').slice(0, 6),
    [safeCategories],
  );

  const serviceCategories = useMemo(
    () => safeCategories.filter((item) => item.kind === 'service').slice(0, 6),
    [safeCategories],
  );

  const rankedItems = useMemo(
    () => rankSearchItems(trimmedQuery, products, services, 8),
    [products, services, trimmedQuery],
  );

  const hasResults =
    rankedItems.length > 0 || productCategories.length > 0 || serviceCategories.length > 0;

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
    if (!mobile || !open) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const rect = inputRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMobileDropdownTop(Math.max(0, Math.round(rect.bottom)));
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [mobile, open]);

  useEffect(() => {
    const trimmed = query.trim();
    const cacheKey = trimmed.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProducts(cached.products ?? []);
      setServices(cached.services ?? []);
      setCategories(normalizeCategories(cached.categories));
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

        const legacyServiceCategories = normalizeCategories(payload.serviceCategories);
        const unifiedCategories = [
          ...normalizeCategories(payload.categories),
          ...legacyServiceCategories.filter(
            (legacy) =>
              !normalizeCategories(payload.categories).some(
                (item) =>
                  item.kind === legacy.kind &&
                  item.type === legacy.type &&
                  item.value === legacy.value,
              ),
          ),
        ];

        setProducts(payload.products ?? []);
        setServices(payload.services ?? []);
        setCategories(unifiedCategories);

        cacheRef.current.set(cacheKey, {
          products: payload.products ?? [],
          services: payload.services ?? [],
          categories: unifiedCategories,
        });
        if (cacheRef.current.size > 30) {
          const firstKey = cacheRef.current.keys().next().value as string | undefined;
          if (firstKey) cacheRef.current.delete(firstKey);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setProducts([]);
        setServices([]);
        setCategories([]);
        console.error('[header-search]', error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const goToFullSearch = () => {
    if (!trimmedQuery) return;
    router.push(searchResultsHref(trimmedQuery));
    setOpen(false);
  };

  return (
    <>
      {mobile && showDropdown && (
        <div
          className="fixed inset-0 z-69 bg-black/30 md:hidden"
          aria-hidden
          onMouseDown={() => setOpen(false)}
          onTouchStart={() => setOpen(false)}
        />
      )}

      <div ref={rootRef} className="relative flex-1">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 z-10" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={mobile ? 'Search products & services...' : 'Search products, services, categories...'}
          className={mobile ? 'pl-9 bg-secondary h-9' : 'pl-9 bg-secondary'}
          value={query}
          onFocus={() => {
            setOpen(true);
            if (!hasResults) setQuery('');
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              goToFullSearch();
            }
          }}
        />

        {showDropdown && (
          <div
            className={
              mobile
                ? [
                    'fixed left-0 right-0 z-70',
                    'bg-background border-t border-border shadow-2xl',
                    'max-h-[calc(100dvh-3.5rem)]',
                    'overflow-y-auto overscroll-contain',
                    'scroll-smooth [-webkit-overflow-scrolling:touch]',
                  ].join(' ')
                : 'absolute left-0 right-0 top-[calc(100%+0.4rem)] z-70 rounded-lg border border-border bg-background shadow-lg p-3 space-y-3'
            }
            style={mobile ? { top: `${mobileDropdownTop}px` } : undefined}
          >
            <div
              className={
                mobile
                  ? 'flex items-center justify-between px-4 py-3 border-b border-border/60 sticky top-0 bg-background z-10'
                  : 'text-xs text-muted-foreground'
              }
            >
              <span className="text-xs text-muted-foreground">
                {loading
                  ? 'Searching…'
                  : trimmedQuery
                    ? `Results for "${trimmedQuery}"`
                    : 'Popular listings and categories'}
              </span>
              {mobile && (
                <button
                  type="button"
                  aria-label="Close search results"
                  onClick={() => setOpen(false)}
                  className="ml-3 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary active:bg-secondary/80 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {rankedItems.length > 0 && (
              <div className={mobile ? 'px-4 pb-1 space-y-2' : 'space-y-1'}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                  Listings
                </p>
                <div className="space-y-2">
                  {rankedItems.map((item) => (
                    <SearchItemRow key={`${item.kind}-${item.id}`} item={item} mobile={mobile} onNavigate={closeDropdown} />
                  ))}
                </div>
              </div>
            )}

            {productCategories.length > 0 && (
              <CategorySection
                title="Product categories"
                suggestions={productCategories}
                mobile={mobile}
                onNavigate={closeDropdown}
              />
            )}

            {serviceCategories.length > 0 && (
              <CategorySection
                title="Service categories"
                suggestions={serviceCategories}
                mobile={mobile}
                onNavigate={closeDropdown}
              />
            )}

            {!loading && !hasResults && (
              <p className={`text-xs text-muted-foreground ${mobile ? 'px-4 py-3' : 'py-2'}`}>
                {trimmedQuery ? 'No matching listings or categories.' : 'Start typing to search.'}
              </p>
            )}

            {trimmedQuery && (
              <div
                className={
                  mobile
                    ? 'sticky bottom-0 bg-background border-t border-border/60 px-4 py-3'
                    : 'pt-1'
                }
              >
                <button
                  type="button"
                  onClick={goToFullSearch}
                  className={`flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground text-sm font-medium py-2.5 hover:bg-primary/90 active:bg-primary/80 transition-colors ${
                    mobile ? 'py-3' : ''
                  }`}
                >
                  <Search className="h-4 w-4" />
                  View all results for &ldquo;{trimmedQuery}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function SearchItemRow({
  item,
  mobile,
  onNavigate,
}: {
  item: RankedSearchItem;
  mobile: boolean;
  onNavigate: () => void;
}) {
  const href = item.kind === 'product' ? productDetailHref(item.id) : serviceDetailHref(item.id);
  const title = item.kind === 'product' ? item.name : item.title;
  const subtitle =
    item.kind === 'product'
      ? [item.subcategory || item.category, item.subSubcategory].filter(Boolean).join(' • ')
      : item.subcategory || item.category;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg border border-border hover:bg-secondary/60 active:bg-secondary transition-colors ${
        mobile ? 'p-3 min-h-16' : 'p-2'
      }`}
    >
      <div className={`shrink-0 overflow-hidden rounded bg-secondary ${mobile ? 'h-14 w-14' : 'h-14 w-14'}`}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={title} className="h-full w-full object-cover" />
        ) : item.kind === 'service' ? (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-5 w-5 text-sky-600/70" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground/60" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 line-clamp-1">{title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant={item.kind === 'service' ? 'secondary' : item.inStock ? 'default' : 'outline'} className="text-[10px]">
            {item.kind === 'service' ? 'Service' : item.inStock ? 'In Stock' : 'Out of stock'}
          </Badge>
          <span className="text-[11px] font-medium text-foreground">
            <Money
              amount={item.kind === 'product' ? item.price : item.rate}
              baseCurrency={item.currency}
            />
            {item.kind === 'service' && item.pricingType === 'hourly' ? '/hr' : ''}
          </span>
          {item.featured ? <Badge className="text-[10px]">Featured</Badge> : null}
        </div>
      </div>
    </Link>
  );
}

function CategorySection({
  title,
  suggestions,
  mobile,
  onNavigate,
}: {
  title: string;
  suggestions: CategorySuggestion[];
  mobile: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className={mobile ? 'px-4 pb-1 space-y-2' : 'space-y-1'}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">{title}</p>
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.kind === 'service' ? Sparkles : Tag;
          return (
            <Link
              key={`${suggestion.kind}-${suggestion.type}-${suggestion.value}-${index}`}
              href={categorySuggestionHref(suggestion)}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg border border-border hover:bg-secondary/60 active:bg-secondary transition-colors ${
                mobile ? 'p-3 min-h-13' : 'p-2'
              }`}
            >
              <div
                className={`shrink-0 overflow-hidden rounded bg-secondary ${mobile ? 'h-11 w-11' : 'h-10 w-10'}`}
              >
                {suggestion.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={suggestion.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className={`h-4 w-4 ${suggestion.kind === 'service' ? 'text-sky-600/70' : 'text-muted-foreground/70'}`} />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-5 line-clamp-1">{suggestion.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {suggestion.context ?? categoryTypeLabel(suggestion)}
                </p>
              </div>

              <div className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                Browse
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

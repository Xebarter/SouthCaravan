'use client';

import Link from 'next/link';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FeedSection } from '@/lib/landing-data';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import { productSectionGridClassName } from '@/lib/product-grid-layout';
import { cn } from '@/lib/utils';

function mobilePrefetchMargin() {
  if (typeof window === 'undefined') return '480px 0px';
  return window.matchMedia('(pointer: coarse)').matches ? '320px 0px' : '720px 0px';
}

export function CategoriesBrowseFeed({
  initialSections,
  initialHasMore,
  initialPage = 1,
  perCategory = 12,
}: {
  initialSections: FeedSection[];
  initialHasMore: boolean;
  initialPage?: number;
  perCategory?: number;
}) {
  const [sections, setSections] = useState<FeedSection[]>(initialSections);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);
  const pageRef = useRef(page);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const loadNextPage = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    const nextPage = pageRef.current;
    if (requestedPagesRef.current.has(nextPage)) return;
    requestedPagesRef.current.add(nextPage);

    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/categories/feed?page=${nextPage}&pageSize=4&perCategory=${perCategory}`,
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load more categories');

      const nextSections = (payload.sections ?? []) as FeedSection[];
      startTransition(() => {
        setSections((prev) => {
          const seen = new Set(prev.map((section) => section.category));
          const deduped = nextSections.filter((section) => !seen.has(section.category));
          return [...prev, ...deduped];
        });
        setHasMore(Boolean(payload.hasMore));
        setPage((prev) => prev + 1);
      });
    } catch (err) {
      requestedPagesRef.current.delete(nextPage);
      setError(err instanceof Error ? err.message : 'Could not load more categories');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [perCategory]);

  const loadNextPageRef = useRef(loadNextPage);
  useEffect(() => {
    loadNextPageRef.current = loadNextPage;
  }, [loadNextPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNextPageRef.current();
      },
      { rootMargin: mobilePrefetchMargin() },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [perCategory]);

  const isEmpty = useMemo(() => sections.length === 0 && !loading, [sections.length, loading]);

  return (
    <div className="space-y-3 [overflow-anchor:none]">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.category}
          id={`category-${section.category.replace(/\s+/g, '-').toLowerCase()}`}
          className="scroll-mt-20 overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm [overflow-anchor:none]"
          style={{ contentVisibility: sectionIndex > 1 ? 'auto' : undefined }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
            <h2 className="text-sm font-semibold text-foreground truncate">{section.category}</h2>
            <Link
              href={`/categories?category=${encodeURIComponent(section.category)}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
            >
              All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className={productSectionGridClassName}>
            {section.products.slice(0, perCategory).map((product, index) => (
              <CategoryProductCard
                key={`${product.item_kind ?? 'product'}-${product.id}`}
                product={product}
                priority={sectionIndex === 0 && index < 4}
              />
            ))}
          </div>
        </section>
      ))}

      {error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void loadNextPage()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isEmpty && !error ? (
        <Card className="border-border/70">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No listings yet.
          </CardContent>
        </Card>
      ) : null}

      {!hasMore && sections.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground pb-1">End of list</p>
      ) : null}

      {hasMore ? (
        <div
          className="flex min-h-10 flex-col items-center justify-center py-2 [overflow-anchor:none]"
          aria-live="polite"
          aria-busy={loading}
        >
          <div
            className={cn(
              'flex items-center gap-2 text-muted-foreground transition-opacity duration-200',
              loading ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={!loading}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
          <div ref={sentinelRef} className="h-px w-full" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

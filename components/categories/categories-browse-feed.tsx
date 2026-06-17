'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { FeedSection } from '@/lib/landing-data';
import { CategoryProductCard } from '@/components/categories/category-product-card';

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

  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page;
    if (requestedPagesRef.current.has(nextPage)) return;
    requestedPagesRef.current.add(nextPage);

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/categories/feed?page=${nextPage}&pageSize=4&perCategory=${perCategory}`,
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load more categories');

      const nextSections = (payload.sections ?? []) as FeedSection[];
      setSections((prev) => {
        const seen = new Set(prev.map((section) => section.category));
        const deduped = nextSections.filter((section) => !seen.has(section.category));
        return [...prev, ...deduped];
      });
      setHasMore(Boolean(payload.hasMore));
      setPage((prev) => prev + 1);
    } catch (err) {
      requestedPagesRef.current.delete(nextPage);
      setError(err instanceof Error ? err.message : 'Could not load more categories');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, perCategory]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNextPage();
      },
      { rootMargin: '1200px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const isEmpty = useMemo(() => sections.length === 0 && !loading, [sections.length, loading]);

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <section
          key={section.category}
          id={`category-${section.category.replace(/\s+/g, '-').toLowerCase()}`}
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/25 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </p>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {section.category}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {section.products.length} listing{section.products.length === 1 ? '' : 's'} · Compare, quote, and buy
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
              <Link
                href={`/categories?category=${encodeURIComponent(section.category)}`}
                className="gap-1.5"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-4 xl:grid-cols-4">
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading more categories…</span>
        </div>
      ) : null}

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
          <CardContent className="py-12 text-center text-muted-foreground">
            No category listings are available yet. Check back soon or browse the marketplace home.
          </CardContent>
        </Card>
      ) : null}

      {!hasMore && sections.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground pb-2">
          You&apos;ve seen all marketplace categories.
        </p>
      ) : null}

      <div ref={sentinelRef} className="h-2" aria-hidden />
    </div>
  );
}

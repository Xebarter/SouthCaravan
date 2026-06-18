'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import type { FeedSection } from '@/lib/landing-data';
import { productPageInsetClassName, productSectionGridClassName } from '@/lib/product-grid-layout';

export default function CategoryInfiniteFeed({
  initialSections,
  initialHasMore,
  initialPage = 1,
}: {
  initialSections: FeedSection[];
  initialHasMore: boolean;
  initialPage?: number;
}) {
  const initialSectionCount = initialSections.length;

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
      const response = await fetch(`/api/landing/products?page=${nextPage}&pageSize=3&perCategory=4`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const text = await response.text().catch(() => '');
        throw new Error(
          response.ok
            ? 'Unexpected response from server.'
            : `Failed to load products (HTTP ${response.status}). ${text ? 'Please try again.' : ''}`.trim(),
        );
      }

      let payload: any = null;
      try {
        payload = await response.json();
      } catch {
        throw new Error(`Failed to load products (invalid JSON, HTTP ${response.status}).`);
      }
      if (!response.ok) throw new Error(payload?.error ?? `Failed to load products (HTTP ${response.status}).`);

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
      setError(err instanceof Error ? err.message : 'Could not load more products');
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadNextPage();
        }
      },
      { rootMargin: '1600px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const isEmpty = useMemo(() => sections.length === 0 && !loading, [sections.length, loading]);

  return (
    <section className={productPageInsetClassName + ' pb-6 bg-transparent'}>
      <div className="max-w-[1500px] mx-auto space-y-3">
        {sections.map((section, sectionIndex) => {
          const isInitialSection = sectionIndex < initialSectionCount;
          return (
            <div
              key={section.category}
              className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  <Link
                    href={`/categories?category=${encodeURIComponent(section.category)}`}
                    className="hover:text-primary hover:underline underline-offset-4"
                  >
                    {section.category}
                  </Link>
                </h3>
                <Link
                  href={`/categories?category=${encodeURIComponent(section.category)}`}
                  className="text-xs font-medium text-primary hover:underline shrink-0"
                >
                  All
                </Link>
              </div>
              <div className={productSectionGridClassName}>
                {section.products.slice(0, 4).map((product, index) => (
                  <CategoryProductCard
                    key={`${product.item_kind ?? 'product'}-${product.id}`}
                    product={product}
                    priority={isInitialSection && index < 4}
                    className={index >= 3 ? 'lg:hidden' : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {isEmpty && !error && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-10 text-center text-slate-500">
              No additional category products are available yet.
            </CardContent>
          </Card>
        )}

        {!hasMore && sections.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-1">End of list</p>
        )}

        <div ref={sentinelRef} className="h-2" />
      </div>
    </section>
  );
}

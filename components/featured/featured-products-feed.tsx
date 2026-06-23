'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import type { FeedProduct, LandingProduct } from '@/lib/landing-data';
import { productGridClassName } from '@/lib/product-grid-layout';
import { cn } from '@/lib/utils';

function toFeedProduct(product: LandingProduct): FeedProduct {
  return {
    ...product,
    item_kind: 'product',
    created_at: (product as LandingProduct & { created_at?: string }).created_at,
    price_currency: product.price_currency,
  };
}

export function FeaturedProductsFeed({
  initialProducts,
  initialHasMore,
  initialPage = 1,
  activeCategory = '',
  pageSize = 24,
}: {
  initialProducts: LandingProduct[];
  initialHasMore: boolean;
  initialPage?: number;
  activeCategory?: string;
  pageSize?: number;
}) {
  const [products, setProducts] = useState<LandingProduct[]>(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestedPagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setProducts(initialProducts);
    setHasMore(initialHasMore);
    setPage(initialPage);
    requestedPagesRef.current.clear();
  }, [initialProducts, initialHasMore, initialPage, activeCategory]);

  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;
    if (requestedPagesRef.current.has(page)) return;
    requestedPagesRef.current.add(page);

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (activeCategory) params.set('category', activeCategory);

      const response = await fetch(`/api/featured/products?${params.toString()}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to load more featured products');

      const nextProducts = (payload.products ?? []) as LandingProduct[];
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const deduped = nextProducts.filter((p) => !seen.has(p.id));
        return [...prev, ...deduped];
      });
      setHasMore(Boolean(payload.hasMore));
      setPage((prev) => prev + 1);
    } catch (err) {
      requestedPagesRef.current.delete(page);
      setError(err instanceof Error ? err.message : 'Could not load more products');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, hasMore, loading, page, pageSize]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNextPage();
      },
      { rootMargin: '1000px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const feedProducts = useMemo(() => products.map(toFeedProduct), [products]);
  const isEmpty = products.length === 0 && !loading;

  return (
    <div className="space-y-3">
      {feedProducts.length > 0 ? (
        <div className={productGridClassName}>
          {feedProducts.map((product, index) => (
            <CategoryProductCard key={product.id} product={product} priority={index < 12} />
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading…</span>
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
        <Card className={cn('border-border/70')}>
          <CardContent className="py-10 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">No featured products</p>
            <Button asChild variant="outline" size="sm">
              <a href="/categories">Browse categories</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!hasMore && products.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground pb-1">End of list</p>
      ) : null}

      <div ref={sentinelRef} className="h-2" aria-hidden />
    </div>
  );
}

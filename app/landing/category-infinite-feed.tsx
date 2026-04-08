'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Package, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FeedSection } from '@/lib/landing-data';

function getVendorName(vendorId: string | null) {
  if (!vendorId) return 'SouthCaravan';
  return `Vendor ${vendorId.slice(0, 8)}`;
}

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
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load products');

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
      { rootMargin: '600px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const isEmpty = useMemo(() => sections.length === 0 && !loading, [sections.length, loading]);

  return (
    <section className="px-4 md:px-6 py-6 md:py-8 bg-[#f3f5f7]">
      <div className="max-w-[1500px] mx-auto space-y-5">
        {sections.map((section, sectionIndex) => {
          const isInitialSection = sectionIndex < initialSectionCount;
          return (
            <div key={section.category} className="bg-white border border-slate-200 rounded-xl px-4 md:px-6 py-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Top picks in{' '}
                <Link
                  href={`/categories?category=${encodeURIComponent(section.category)}`}
                  className="text-slate-900 hover:text-sky-700 underline-offset-4 hover:underline"
                >
                  {section.category}
                </Link>
              </h3>
              <Link
                href={`/categories?category=${encodeURIComponent(section.category)}`}
                className="text-sm text-sky-700 hover:text-sky-900 font-medium"
              >
                See more
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {section.products.slice(0, 4).map((product, index) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className={['block', index >= 3 ? 'lg:hidden' : ''].join(' ')}
                >
                  <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow py-0 gap-0 h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="aspect-square w-full overflow-hidden bg-slate-50">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            loading={isInitialSection ? 'eager' : 'lazy'}
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                            <Package className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="p-3 space-y-2 flex-1">
                        <p className="text-sm text-slate-900 line-clamp-2 min-h-10">{product.name}</p>
                        <div className="flex items-baseline justify-between">
                          <p className="text-lg font-bold text-slate-900">${Number(product.price).toFixed(2)}</p>
                          <span className="text-[11px] text-slate-500">{product.minimum_order} {product.unit} min</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{getVendorName(product.vendor_id)}</p>
                      </div>

                      <div className="mt-auto px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{product.is_featured ? 'Spotlight' : 'Verified'}</span>
                        </div>
                        <span className={`text-xs font-medium ${product.in_stock ? 'text-sky-700' : 'text-slate-400'}`}>
                          {product.in_stock ? 'View product' : 'Out of stock'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          );
        })}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading more categories...
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
          <p className="text-center text-sm text-slate-500 pt-2">You have reached the end of category listings.</p>
        )}

        <div ref={sentinelRef} className="h-2" />
      </div>
    </section>
  );
}

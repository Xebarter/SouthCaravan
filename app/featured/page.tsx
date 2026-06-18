import Link from 'next/link';
import { Star } from 'lucide-react';
import { FeaturedProductsFeed } from '@/components/featured/featured-products-feed';
import {
  FEATURED_PAGE_DEFAULT_PAGE_SIZE,
  getFeaturedProductCategories,
  getFeaturedProductsPage,
} from '@/lib/featured-products';
import { createPageMetadata } from '@/lib/seo/metadata';
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords';
import { productPageInsetClassName } from '@/lib/product-grid-layout';
import { cn } from '@/lib/utils';

type FeaturedSearchParams = {
  category?: string | string[];
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export const metadata = createPageMetadata({
  title: 'Featured Products — Spotlight Picks from Verified Suppliers',
  description:
    'Explore South Caravan featured products: admin-approved spotlight listings from verified B2B suppliers. Compare pricing, MOQs, and buy or request quotes with confidence.',
  path: '/featured',
  keywords: [...KEYWORD_CATEGORIES.products, ...KEYWORD_CATEGORIES.b2b, 'featured products', 'spotlight'],
});

export default async function FeaturedProductsPage({
  searchParams,
}: {
  searchParams: Promise<FeaturedSearchParams>;
}) {
  const qp = await searchParams;
  const activeCategory = decodeURIComponent(firstValue(qp.category)).trim();

  const [initialFeed, categories] = await Promise.all([
    getFeaturedProductsPage({
      page: 0,
      pageSize: FEATURED_PAGE_DEFAULT_PAGE_SIZE,
      category: activeCategory || undefined,
    }),
    getFeaturedProductCategories(),
  ]);

  const countLabel = `${initialFeed.products.length}${initialFeed.hasMore ? '+' : ''}`;

  return (
    <section className="min-h-screen bg-background">
      <div className={'mx-auto max-w-[1500px] ' + productPageInsetClassName + ' pt-4 pb-8 md:pt-5 md:pb-10'}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/50 pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <Star className="h-5 w-5 shrink-0 text-amber-500 fill-amber-500" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Featured products</h1>
              <p className="text-xs text-muted-foreground">
                {countLabel} listing{initialFeed.products.length === 1 ? '' : 's'}
                {activeCategory ? ` · ${activeCategory}` : ''}
              </p>
            </div>
          </div>
          <Link href="/categories" className="text-sm font-medium text-primary hover:underline shrink-0">
            All categories
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Link
              href="/featured"
              className={cn(
                'inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-colors',
                !activeCategory
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              )}
            >
              All
            </Link>
            {categories.map((name) => {
              const active = activeCategory === name;
              return (
                <Link
                  key={name}
                  href={`/featured?category=${encodeURIComponent(name)}`}
                  title={name}
                  className={cn(
                    'inline-flex h-7 max-w-[36ch] items-center truncate rounded-full border px-2.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {name}
                </Link>
              );
            })}
          </div>
        ) : null}

        <FeaturedProductsFeed
          initialProducts={initialFeed.products}
          initialHasMore={initialFeed.hasMore}
          initialPage={1}
          activeCategory={activeCategory}
          pageSize={FEATURED_PAGE_DEFAULT_PAGE_SIZE}
        />
      </div>
    </section>
  );
}

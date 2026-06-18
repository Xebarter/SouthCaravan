import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Package, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoriesBrowseFeed } from '@/components/categories/categories-browse-feed';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import { CategoryQuickNav } from '@/components/categories/category-quick-nav';
import {
  CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
  getCategoriesPageFeedSections,
  getMarketplaceCategoryNames,
  getProductsByCategory,
  getServiceOfferingsByCategory,
  mergeFeaturedFeedItems,
  offeringSummaryToFeedProduct,
  type FeedProduct,
} from '@/lib/landing-data';
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu';
import { createCategoryDrillDownMetadata, createPageMetadata } from '@/lib/seo/metadata';
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords';
import { DEFAULT_SERVICES_TAXONOMY } from '@/lib/services-taxonomy';

type CategoryQuery = {
  category?: string | string[];
  subcategory?: string | string[];
  type?: string | string[];
};

const DRILL_DOWN_LIMIT = 48;

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function categoriesQueryLink(opts: { services: boolean; category: string; subcategory?: string }) {
  const p = new URLSearchParams();
  if (opts.services) p.set('type', 'services');
  p.set('category', opts.category);
  if (opts.subcategory) p.set('subcategory', opts.subcategory);
  return `/categories?${p.toString()}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CategoryQuery>;
}): Promise<Metadata> {
  const qp = await searchParams;
  const selectedCategory = decodeURIComponent(firstValue(qp.category)).trim();
  const selectedSubcategory = decodeURIComponent(firstValue(qp.subcategory)).trim();

  if (selectedCategory) {
    const label = selectedSubcategory
      ? `${selectedCategory} — ${selectedSubcategory}`
      : selectedCategory;
    return createCategoryDrillDownMetadata(label);
  }

  return createPageMetadata({
    title: 'Browse Categories — Wholesale Products & Services',
    description:
      'Explore B2B product and service categories: agriculture, manufacturing, textiles, construction, electronics, and more from African suppliers.',
    path: '/categories',
    keywords: [...KEYWORD_CATEGORIES.industries, ...KEYWORD_CATEGORIES.products],
  });
}

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<CategoryQuery>;
}) {
  const qp = await searchParams;
  const selectedCategory = decodeURIComponent(firstValue(qp.category)).trim();

  if (!selectedCategory) {
    const [initialFeed, categoryNames] = await Promise.all([
      getCategoriesPageFeedSections({
        page: 0,
        pageSize: 4,
        perCategory: CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
      }),
      getMarketplaceCategoryNames(),
    ]);

    return (
      <section className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-[1500px] space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-muted/50 via-card to-card p-6 shadow-sm md:p-8">
            <div className="max-w-3xl space-y-3">
              <Badge variant="secondary" className="rounded-full">
                B2B marketplace
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Shop every category
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Browse verified products and services across all marketplace categories. Compare pricing,
                minimum orders, and featured picks — then request a quote or buy with confidence.
              </p>
            </div>
          </div>

          <CategoryQuickNav categories={categoryNames} />

          <CategoriesBrowseFeed
            initialSections={initialFeed.sections}
            initialHasMore={initialFeed.hasMore}
            initialPage={1}
            perCategory={CATEGORIES_PAGE_DEFAULT_PER_CATEGORY}
          />
        </div>
      </section>
    );
  }

  const selectedSubcategory = decodeURIComponent(firstValue(qp.subcategory)).trim();
  const productMenuSections = await getMarketplaceMenuSections();
  let isServices = firstValue(qp.type).toLowerCase() === 'services';

  if (!isServices && selectedCategory) {
    const inProduct = productMenuSections.some((s) => s.title === selectedCategory);
    const inService = DEFAULT_SERVICES_TAXONOMY.some((s) => s.title === selectedCategory);
    if (inService && !inProduct) isServices = true;
  }

  const menuSections = isServices ? DEFAULT_SERVICES_TAXONOMY : productMenuSections;
  const activeSection = menuSections.find((s) => s.title === selectedCategory) ?? menuSections[0];
  const effectiveCategory = selectedCategory || activeSection?.title || '';
  const subcategories = activeSection?.items ?? [];
  const effectiveSubcategory =
    selectedSubcategory && subcategories.includes(selectedSubcategory) ? selectedSubcategory : '';

  const [products, offerings, categoryNames] = await Promise.all([
    isServices
      ? Promise.resolve([])
      : getProductsByCategory({
          category: effectiveCategory || undefined,
          subcategory: effectiveSubcategory || undefined,
          limit: DRILL_DOWN_LIMIT,
        }),
    isServices
      ? getServiceOfferingsByCategory({
          category: effectiveCategory || undefined,
          subcategory: effectiveSubcategory || undefined,
          limit: DRILL_DOWN_LIMIT,
        })
      : Promise.resolve([]),
    getMarketplaceCategoryNames(),
  ]);

  const feedItems: FeedProduct[] = isServices
    ? offerings.map(offeringSummaryToFeedProduct)
    : mergeFeaturedFeedItems(
        products.map((product) => ({ ...product, item_kind: 'product' as const })),
        offerings.map(offeringSummaryToFeedProduct),
        DRILL_DOWN_LIMIT,
      );

  const itemCount = feedItems.length;
  const categoryLabel = isServices ? 'Service category' : 'Marketplace category';

  return (
    <section className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2" asChild>
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4" />
              All categories
            </Link>
          </Button>
          <span aria-hidden>/</span>
          <span className="font-medium text-foreground">{effectiveCategory}</span>
          {effectiveSubcategory ? (
            <>
              <span aria-hidden>/</span>
              <span className="font-medium text-foreground">{effectiveSubcategory}</span>
            </>
          ) : null}
        </div>

        <CategoryQuickNav categories={categoryNames} activeCategory={effectiveCategory} />

        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/25 p-5 md:flex-row md:items-start md:justify-between md:p-6">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {categoryLabel}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {effectiveCategory}
              </h1>
              <p className="text-sm text-muted-foreground">
                {effectiveSubcategory
                  ? `Listings under ${effectiveSubcategory}`
                  : 'All listings in this category — compare, quote, and purchase'}
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm">
              <span className="font-bold tabular-nums text-foreground">{itemCount}</span>
              <span className="text-muted-foreground">
                {' '}
                listing{itemCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {subcategories.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-b border-border/60 px-5 py-4 md:px-6">
              <Badge variant={effectiveSubcategory ? 'outline' : 'default'} className="rounded-full">
                <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>
                  All
                </Link>
              </Badge>
              {subcategories.map((item) => {
                const active = effectiveSubcategory === item;
                return (
                  <Badge key={item} variant={active ? 'default' : 'outline'} className="rounded-full">
                    <Link
                      href={categoriesQueryLink({
                        services: isServices,
                        category: effectiveCategory,
                        subcategory: item,
                      })}
                    >
                      {item}
                    </Link>
                  </Badge>
                );
              })}
            </div>
          ) : null}

          {feedItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-6 lg:grid-cols-4 xl:grid-cols-4">
              {feedItems.map((product, index) => (
                <CategoryProductCard key={`${product.item_kind ?? 'product'}-${product.id}`} product={product} priority={index < 8} />
              ))}
            </div>
          ) : (
            <Card className="m-4 border-dashed sm:m-6">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                {isServices ? (
                  <Sparkles className="h-10 w-10 text-sky-600/50" />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground/40" />
                )}
                <p className="text-muted-foreground">No listings found for this category selection.</p>
                <Button variant="outline" asChild>
                  <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>
                    Reset subcategory
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

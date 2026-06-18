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
  getServiceBrowseCategoryNames,
  getServiceOfferingsByCategory,
  getServicesPageFeedSections,
  mergeFeaturedFeedItems,
  offeringSummaryToFeedProduct,
  type FeedProduct,
} from '@/lib/landing-data';
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu';
import { createCategoryDrillDownMetadata, createPageMetadata } from '@/lib/seo/metadata';
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords';
import { productGridClassName, productPageInsetClassName } from '@/lib/product-grid-layout';
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

  const isServicesBrowse = firstValue(qp.type).toLowerCase() === 'services';

  if (isServicesBrowse) {
    return createPageMetadata({
      title: 'Browse Services — Professional B2B Service Providers',
      description:
        'Explore professional services on South Caravan: consulting, technology, logistics, construction, HR, and more from verified providers.',
      path: '/categories?type=services',
      keywords: [...KEYWORD_CATEGORIES.industries, 'B2B services', 'professional services'],
    });
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
  const isServicesBrowse = firstValue(qp.type).toLowerCase() === 'services';

  if (!selectedCategory) {
    const [initialFeed, categoryNames] = await Promise.all([
      isServicesBrowse
        ? getServicesPageFeedSections({
            page: 0,
            pageSize: 6,
            perCategory: CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
          })
        : getCategoriesPageFeedSections({
            page: 0,
            pageSize: 6,
            perCategory: CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
          }),
      isServicesBrowse ? getServiceBrowseCategoryNames() : getMarketplaceCategoryNames(),
    ]);

    const sectionCount = initialFeed.sections.length;
    const listingCount = initialFeed.sections.reduce((sum, s) => sum + s.products.length, 0);

    return (
      <section className="min-h-screen bg-background">
        <div className={'mx-auto max-w-[1500px] ' + productPageInsetClassName + ' pt-4 pb-8 md:pt-5 md:pb-10'}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {isServicesBrowse ? 'Services' : 'Categories'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {sectionCount} categor{sectionCount === 1 ? 'y' : 'ies'} · {listingCount}+{' '}
                {isServicesBrowse ? 'services' : 'products'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isServicesBrowse ? (
                <Link href="/categories" className="text-sm font-medium text-primary hover:underline">
                  Products
                </Link>
              ) : (
                <Link href="/categories?type=services" className="text-sm font-medium text-primary hover:underline">
                  Services
                </Link>
              )}
              {!isServicesBrowse ? (
                <Link href="/featured" className="text-sm font-medium text-primary hover:underline">
                  Featured
                </Link>
              ) : null}
            </div>
          </div>

          {categoryNames.length > 0 ? (
            <div className="mb-3">
              <CategoryQuickNav categories={categoryNames} compact servicesMode={isServicesBrowse} />
            </div>
          ) : null}

          <CategoriesBrowseFeed
            key={isServicesBrowse ? 'services' : 'products'}
            initialSections={initialFeed.sections}
            initialHasMore={initialFeed.hasMore}
            initialPage={1}
            perCategory={CATEGORIES_PAGE_DEFAULT_PER_CATEGORY}
            servicesMode={isServicesBrowse}
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

  const [products, offerings, categoryNames, serviceCategoryNames] = await Promise.all([
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
    isServices ? getServiceBrowseCategoryNames() : Promise.resolve([] as string[]),
  ]);

  const quickNavCategories = isServices ? serviceCategoryNames : categoryNames;

  const feedItems: FeedProduct[] = isServices
    ? offerings.map(offeringSummaryToFeedProduct)
    : mergeFeaturedFeedItems(
        products.map((product) => ({ ...product, item_kind: 'product' as const })),
        offerings.map(offeringSummaryToFeedProduct),
        DRILL_DOWN_LIMIT,
      );

  const itemCount = feedItems.length;

  return (
    <section className="min-h-screen bg-background">
      <div className={'mx-auto max-w-[1500px] ' + productPageInsetClassName + ' pt-4 pb-8 md:pt-5 md:pb-10'}>
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border/50 pb-3 text-sm">
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" asChild>
            <Link href={isServices ? '/categories?type=services' : '/categories'}>
              <ArrowLeft className="h-3.5 w-3.5" />
              All
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate">{effectiveCategory}</span>
          {effectiveSubcategory ? (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium truncate">{effectiveSubcategory}</span>
            </>
          ) : null}
          <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
            {itemCount} listing{itemCount === 1 ? '' : 's'}
          </span>
        </div>

        {quickNavCategories.length > 0 ? (
          <div className="mb-3">
            <CategoryQuickNav
              categories={quickNavCategories}
              activeCategory={effectiveCategory}
              compact
              servicesMode={isServices}
            />
          </div>
        ) : null}

        {subcategories.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Badge variant={effectiveSubcategory ? 'outline' : 'default'} className="rounded-full h-7">
              <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>All</Link>
            </Badge>
            {subcategories.map((item) => (
              <Badge
                key={item}
                variant={effectiveSubcategory === item ? 'default' : 'outline'}
                className="rounded-full h-7"
              >
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
            ))}
          </div>
        ) : null}

        {feedItems.length > 0 ? (
          <div className={productGridClassName}>
            {feedItems.map((product, index) => (
              <CategoryProductCard
                key={`${product.item_kind ?? 'product'}-${product.id}`}
                product={product}
                priority={index < 12}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              {isServices ? (
                <Sparkles className="h-8 w-8 text-sky-600/50" />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground/40" />
              )}
              <p className="text-sm text-muted-foreground">No listings found</p>
              <Button variant="outline" size="sm" asChild>
                <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>
                  Reset
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}

import Link from 'next/link';
import { Package, Search, Sparkles, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import { Badge } from '@/components/ui/badge';
import { runSiteSearch } from '@/lib/site-search';
import {
  categorySuggestionHref,
  type CategorySuggestion,
  type RankedSearchItem,
  rankSearchItems,
} from '@/lib/site-search-utils';
import { createPageMetadata } from '@/lib/seo/metadata';
import { productGridClassName, productPageInsetClassName } from '@/lib/product-grid-layout';
import type { FeedProduct } from '@/lib/landing-data';

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function categoryTypeLabel(suggestion: CategorySuggestion) {
  if (suggestion.kind === 'service') {
    return suggestion.type === 'subcategory' ? 'Service type' : 'Service category';
  }
  if (suggestion.type === 'subSubcategory') return 'Product type';
  if (suggestion.type === 'subcategory') return 'Product subcategory';
  return 'Product category';
}

function searchItemToFeedProduct(item: RankedSearchItem): FeedProduct {
  if (item.kind === 'product') {
    return {
      id: item.id,
      vendor_id: null,
      name: item.name,
      description: '',
      category: item.category,
      subcategory: item.subcategory,
      sub_subcategory: item.subSubcategory,
      price: item.price,
      minimum_order: 1,
      unit: 'unit',
      images: item.image ? [item.image] : [],
      in_stock: item.inStock,
      is_featured: item.featured,
      item_kind: 'product',
      price_currency: item.currency,
    };
  }

  return {
    id: item.id,
    vendor_id: null,
    name: item.title,
    description: '',
    category: item.category,
    subcategory: item.subcategory,
    sub_subcategory: 'Service',
    price: item.rate,
    minimum_order: 1,
    unit: item.pricingType === 'hourly' ? 'hour' : 'service',
    images: item.image ? [item.image] : [],
    in_stock: true,
    is_featured: item.featured,
    item_kind: 'service',
    href: `/public/services/${item.id}`,
    price_currency: item.currency,
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = firstValue((await searchParams).q).trim();
  if (!query) {
    return createPageMetadata({
      title: 'Search — Products & Services',
      description: 'Search South Caravan for B2B products, professional services, and marketplace categories.',
      path: '/search',
    });
  }

  return createPageMetadata({
    title: `Search results for "${query}"`,
    description: `Find products, services, and categories matching "${query}" on South Caravan.`,
    path: `/search?q=${encodeURIComponent(query)}`,
    noIndex: true,
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = firstValue((await searchParams).q).trim();
  const results = query ? await runSiteSearch(query, { itemLimit: 48, categoryLimit: 16 }) : null;
  const rankedItems = results ? rankSearchItems(query, results.products, results.services, 48) : [];
  const productCategories = results?.categories.filter((item) => item.kind === 'product') ?? [];
  const serviceCategories = results?.categories.filter((item) => item.kind === 'service') ?? [];

  return (
    <section className="min-h-screen bg-background">
      <div className={'mx-auto max-w-[1500px] ' + productPageInsetClassName + ' pt-4 pb-8 md:pt-5 md:pb-10'}>
        <div className="mb-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {query ? `Results for "${query}"` : 'Search'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {query
                  ? `${rankedItems.length} listing${rankedItems.length === 1 ? '' : 's'} · ${results?.categories.length ?? 0} categor${(results?.categories.length ?? 0) === 1 ? 'y' : 'ies'}`
                  : 'Enter a search term in the header to find products, services, and categories.'}
              </p>
            </div>
          </div>
        </div>

        {!query ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Use the search bar above to look up individual listings or browse by category.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Listings</h2>
              {rankedItems.length > 0 ? (
                <div className={productGridClassName}>
                  {rankedItems.map((item, index) => (
                    <CategoryProductCard
                      key={`${item.kind}-${item.id}`}
                      product={searchItemToFeedProduct(item)}
                      priority={index < 6}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matching products or services.</p>
              )}
            </div>

            {results && results.categories.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Categories</h2>

                {productCategories.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Product categories</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {productCategories.map((suggestion, index) => (
                        <CategorySearchLink key={`product-cat-${index}`} suggestion={suggestion} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {serviceCategories.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Service categories</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {serviceCategories.map((suggestion, index) => (
                        <CategorySearchLink key={`service-cat-${index}`} suggestion={suggestion} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function CategorySearchLink({ suggestion }: { suggestion: CategorySuggestion }) {
  const Icon = suggestion.kind === 'service' ? Sparkles : Tag;

  return (
    <Link
      href={categorySuggestionHref(suggestion)}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/50"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
        {suggestion.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={suggestion.image} alt="" className="h-full w-full object-cover" />
        ) : suggestion.kind === 'service' ? (
          <Sparkles className="h-4 w-4 text-sky-600/70" />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground/70" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{suggestion.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {suggestion.context ? suggestion.context : categoryTypeLabel(suggestion)}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
        <Icon className="h-3 w-3" />
        {suggestion.kind === 'service' ? 'Service' : 'Product'}
      </Badge>
    </Link>
  );
}

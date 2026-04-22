import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Money } from '@/components/money';
import { Package, Sparkles, Star } from 'lucide-react';
import {
  getProductsByCategory,
  getServiceOfferingsByCategory,
} from '@/lib/landing-data';
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu';
import { DEFAULT_SERVICES_TAXONOMY } from '@/lib/services-taxonomy';
import { stripHtmlForPreview } from '@/lib/strip-html';

type CategoryQuery = {
  category?: string | string[];
  subcategory?: string | string[];
  type?: string | string[];
};

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

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<CategoryQuery>;
}) {
  const qp = await searchParams;
  const selectedCategory = decodeURIComponent(firstValue(qp.category)).trim();
  const selectedSubcategory = decodeURIComponent(firstValue(qp.subcategory)).trim();

  const productMenuSections = await getMarketplaceMenuSections();
  let isServices = firstValue(qp.type).toLowerCase() === 'services';

  if (!isServices && selectedCategory) {
    const inProduct = productMenuSections.some((s) => s.title === selectedCategory);
    const inService = DEFAULT_SERVICES_TAXONOMY.some((s) => s.title === selectedCategory);
    if (inService && !inProduct) isServices = true;
  }

  const menuSections = isServices ? DEFAULT_SERVICES_TAXONOMY : productMenuSections;
  const effectiveCategory = selectedCategory || menuSections[0]?.title || '';
  const activeSection = menuSections.find((s) => s.title === effectiveCategory) ?? menuSections[0];
  const subcategories = activeSection?.items ?? [];
  const effectiveSubcategory =
    selectedSubcategory && subcategories.includes(selectedSubcategory) ? selectedSubcategory : '';

  const products = isServices
    ? []
    : await getProductsByCategory({
        category: effectiveCategory || undefined,
        subcategory: effectiveSubcategory || undefined,
        limit: 200,
      });

  const offerings = isServices
    ? await getServiceOfferingsByCategory({
        category: effectiveCategory || undefined,
        subcategory: effectiveSubcategory || undefined,
        limit: 200,
      })
    : [];

  const itemCount = isServices ? offerings.length : products.length;
  const categoryLabel = isServices ? 'Service category' : 'Marketplace category';

  return (
    <section className="px-4 md:px-6 py-6 md:py-8 bg-background min-h-screen">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">{categoryLabel}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                {effectiveCategory || 'All categories'}
              </h1>
              {effectiveSubcategory ? (
                <p className="text-sm text-slate-600 mt-1">Showing items under {effectiveSubcategory}</p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Showing all items in this category</p>
              )}
            </div>
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="font-semibold text-slate-900">{itemCount}</span> item
              {itemCount === 1 ? '' : 's'}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={effectiveSubcategory ? 'outline' : 'default'} className="rounded-full">
              <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>All</Link>
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
        </div>

        {!isServices && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="block">
                <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow h-full py-0 gap-0">
                  <CardContent className="p-0">
                    {product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="aspect-square object-cover w-full bg-slate-50"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="aspect-square bg-slate-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <div className="p-3 space-y-2">
                      <p className="text-sm text-slate-900 line-clamp-2 min-h-10">{product.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {stripHtmlForPreview(product.description)}
                      </p>
                      <div className="flex items-baseline justify-between">
                        <p className="text-base font-bold text-slate-900">
                          <Money amountUSD={Number(product.price)} />
                        </p>
                        <span className="text-[11px] text-slate-500">
                          {product.minimum_order} {product.unit} min
                        </span>
                      </div>
                    </div>
                    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
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
        ) : null}

        {isServices && offerings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {offerings.map((o) => {
              const pricingType = String(o.pricing_type ?? 'fixed').toLowerCase() === 'hourly' ? 'hourly' : 'fixed';
              const currency = String(o.currency ?? 'USD').toUpperCase();
              return (
                <Link key={o.id} href={`/public/services/${o.id}`} className="block">
                  <Card className="border border-slate-200 shadow-none rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow h-full py-0 gap-0">
                    <CardContent className="p-0">
                      {o.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={o.images[0]}
                          alt={o.title}
                          className="aspect-square object-cover w-full bg-slate-50"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="aspect-square bg-slate-100 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-sky-600/80" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <div className="flex items-start gap-1.5 min-h-10">
                          <Badge variant="secondary" className="text-[10px] shrink-0 px-1.5 py-0 h-5">
                            Service
                          </Badge>
                          <p className="text-sm text-slate-900 line-clamp-2 flex-1">{o.title}</p>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {stripHtmlForPreview(o.description)}
                        </p>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-base font-bold text-slate-900">
                            <Money amount={Number(o.rate)} baseCurrency={currency} />
                          </p>
                          <span className="text-[11px] text-slate-500 text-right">
                            {pricingType === 'hourly' ? 'per hour' : 'fixed'}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[11px] text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{o.is_featured ? 'Spotlight' : 'Service provider'}</span>
                        </div>
                        <span className="text-xs font-medium text-sky-700">View service</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : null}

        {(isServices ? offerings.length === 0 : products.length === 0) ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="py-12 text-center space-y-3">
              {isServices ? (
                <Sparkles className="w-10 h-10 text-sky-600/50 mx-auto" />
              ) : (
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
              )}
              <p className="text-slate-600">No items found for this category selection.</p>
              <Button variant="outline" asChild>
                <Link href={categoriesQueryLink({ services: isServices, category: effectiveCategory })}>
                  Reset subcategory
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

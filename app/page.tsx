import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { CheckCircle2, Package, ShieldCheck, Truck } from 'lucide-react';
import ProductAdBannerSection from './landing/product-ad-banner-section';
import PopularCategories from './landing/popular-categories';
import {
  getLandingCategoryFeedSections,
  getFeaturedLandingProducts,
  getLandingProducts,
  getSponsoredProducts,
} from '@/lib/landing-data';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu';
import { CategoryInfiniteFeedClient } from '@/components/home/category-infinite-feed-client';
import { PostMyRfqButton } from '@/components/post-my-rfq-button';
import { createPageMetadata } from '@/lib/seo/metadata';
import { HomePageJsonLd } from '@/lib/seo/json-ld';
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords';
import { DEFAULT_DESCRIPTION, SITE_HOME_TITLE } from '@/lib/seo/site';

export const metadata = createPageMetadata({
  title: SITE_HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
  keywords: [
    ...KEYWORD_CATEGORIES.brand,
    ...KEYWORD_CATEGORIES.uganda,
    ...KEYWORD_CATEGORIES.b2b,
    ...KEYWORD_CATEGORIES.longTail,
  ],
});

export default async function HomePage() {
  const featuredProducts = await getFeaturedLandingProducts(60);
  const fallbackProducts = featuredProducts.length > 0 ? [] : await getLandingProducts(12);
  const heroProducts = (featuredProducts.length > 0 ? featuredProducts : fallbackProducts).slice(0, 5);
  const extraFeaturedProducts = featuredProducts.slice(5);
  const sponsoredItems = await getSponsoredProducts();
  const initialCategoryFeed = await getLandingCategoryFeedSections({ page: 0, pageSize: 3, perCategory: 4 });
  const menuSections = await getMarketplaceMenuSections();
  const popularCategories = menuSections.map((s) => s.title).filter(Boolean);

  const initialSections = initialCategoryFeed.sections;
  const initialHasMore = initialCategoryFeed.hasMore;

  return (
    <div className="bg-linear-to-b from-slate-50 via-sky-50/60 to-white">
      <HomePageJsonLd />
      <section className="px-3 sm:px-4 md:px-6 pt-6 sm:pt-10 md:pt-14 pb-6 sm:pb-8">
        <div className="max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge className="border-sky-200 bg-sky-100 text-sky-900">Verified suppliers</Badge>
                <Badge variant="secondary" className="bg-white/70">Fast RFQs</Badge>
                <Badge variant="secondary" className="bg-white/70">Secure checkout</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-slate-950 leading-tight">
                  Buy from trusted suppliers.
                  <span className="text-sky-900"> Ship with confidence.</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 max-w-xl">
                  A modern B2B marketplace to compare products, request quotes, and purchase from vetted vendors—without the back-and-forth.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button size="lg" className="rounded-full px-6" asChild>
                  <Link href="/categories">Shop products</Link>
                </Button>
                <PostMyRfqButton size="lg" variant="outline" className="rounded-full px-6 border-slate-300 bg-white" showArrow />
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/75 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-slate-900">Popular categories</p>
                  <Link href="/categories" className="text-sm font-medium text-sky-800 hover:text-sky-900">
                    Browse all
                  </Link>
                </div>
                <PopularCategories categories={popularCategories} />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">Featured picks</p>
                    <p className="text-xs text-slate-600">High-intent products from verified suppliers.</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link href="/categories">View marketplace</Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-slate-100">
                  <Link
                    href={heroProducts[0] ? `/product/${heroProducts[0].id}` : '/categories'}
                    className="group block border-b md:border-b-0 md:border-r border-slate-100"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 h-[230px] sm:h-[280px]">
                        {heroProducts[0]?.images?.[0] ? (
                          <Image
                            src={heroProducts[0].images[0]}
                            alt={heroProducts[0].name}
                            fill
                            priority
                            fetchPriority="high"
                            unoptimized
                            sizes="(min-width: 1024px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-base sm:text-lg font-semibold text-slate-950 line-clamp-1">
                          {heroProducts[0]?.name ?? 'Featured product'}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {heroProducts[0]
                            ? stripHtmlForPreview(heroProducts[0].description) || 'Top-rated product from verified suppliers.'
                            : 'Top-rated product from verified suppliers.'}
                        </p>
                        <div className="flex items-center justify-between gap-3 pt-1">
                          <Badge variant="outline" className="border-slate-300 bg-white">
                            {heroProducts[0]?.subcategory ?? heroProducts[0]?.category ?? 'Category'}
                          </Badge>
                          <p className="text-base font-semibold text-slate-950">
                            <Money amountUSD={Number(heroProducts[0]?.price ?? 0)} />
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {heroProducts.slice(1).map((product) => (
                      <Link key={product.id} href={`/product/${product.id}`} className="group block border-t sm:border-t-0 border-slate-100">
                        <div className="p-4 sm:p-5">
                          <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 h-[160px]">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                unoptimized
                                sizes="(min-width: 640px) 25vw, 100vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="mt-3 space-y-1.5">
                            <p className="text-sm font-semibold text-slate-950 line-clamp-1">{product.name}</p>
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="text-[11px] border-slate-300 bg-slate-50 max-w-[70%] truncate">
                                {product.subcategory || product.category}
                              </Badge>
                              <p className="text-sm font-semibold text-slate-950 whitespace-nowrap">
                                <Money amountUSD={Number(product.price)} />
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Verified suppliers',
                    desc: 'Vendors are reviewed so you can purchase with confidence.',
                  },
                  {
                    icon: Truck,
                    title: 'Reliable fulfillment',
                    desc: 'Clear MOQs, product details, and order tracking for teams.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'RFQ to checkout',
                    desc: 'Request quotes for custom needs or buy instantly.',
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <Card key={title} className="border-slate-200 bg-white shadow-sm rounded-2xl">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-900/5 text-sky-900 ring-1 ring-sky-900/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950">{title}</p>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductAdBannerSection items={sponsoredItems} />

      {extraFeaturedProducts.length > 0 && (
        <section className="px-3 sm:px-4 md:px-6 pb-6 sm:pb-10">
          <div className="max-w-[1500px] mx-auto">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <p className="text-lg font-semibold text-slate-950">More featured deals</p>
                <p className="text-sm text-slate-600">Fresh inventory and supplier specials.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full border-slate-300 bg-white" asChild>
                <Link href="/categories">Browse all</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {extraFeaturedProducts.slice(0, 12).map((product) => (
                <Link key={product.id} href={`/product/${product.id}`} className="block">
                  <Card className="border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white h-full overflow-hidden">
                    <CardContent className="p-3 sm:p-4 space-y-2">
                      <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 h-[120px] sm:h-[140px]">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 50vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="w-7 h-7 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <p className="font-semibold text-sm text-slate-950 line-clamp-1">{product.name}</p>
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className="text-[11px] border-slate-300 bg-slate-50 max-w-[70%] truncate"
                          title={product.subcategory || product.category}
                        >
                          {product.subcategory || product.category}
                        </Badge>
                        <p className="text-sm font-semibold text-slate-950 whitespace-nowrap">
                          <Money amountUSD={Number(product.price)} />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CategoryInfiniteFeedClient
        initialSections={initialSections}
        initialHasMore={initialHasMore}
        initialPage={1}
      />
    </div>
  );
}

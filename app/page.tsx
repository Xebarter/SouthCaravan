import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import {
  ArrowRight,
  Package,
} from 'lucide-react';
import ProductAdBannerSection from './landing/product-ad-banner-section';
import PopularCategories from './landing/popular-categories';
import {
  getLandingCategoryFeedSections,
  getLandingProducts,
  getSponsoredProducts,
} from '@/lib/landing-data';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { getMarketplaceMenuSections } from '@/lib/marketplace-menu';
import { CategoryInfiniteFeedClient } from '@/components/home/category-infinite-feed-client';

export default async function HomePage() {
  const products = await getLandingProducts();
  const heroProducts = products.slice(0, 5);
  const sponsoredItems = await getSponsoredProducts();
  const initialCategoryFeed = await getLandingCategoryFeedSections({ page: 0, pageSize: 3, perCategory: 4 });
  const menuSections = await getMarketplaceMenuSections();
  const popularCategories = menuSections.map((s) => s.title).filter(Boolean);

  const initialSections = initialCategoryFeed.sections;
  const initialHasMore = initialCategoryFeed.hasMore;

  return (
    <div className="bg-[#f3f5f7]">
      <ProductAdBannerSection items={sponsoredItems} />
      <section className="px-2 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-6 sm:pb-8 md:pt-6 md:pb-10">
        <div className="max-w-[1500px] mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <Badge className="bg-sky-100 text-sky-800 border-sky-200">
              Featured Marketplace Picks
            </Badge>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4">
              <Link href={heroProducts[0] ? `/product/${heroProducts[0].id}` : '/public/vendors'} className="lg:col-span-6 block">
                <Card className="border-slate-200 bg-gradient-to-br from-sky-50 via-white to-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                    {heroProducts[0]?.images?.[0] ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md">
                        <Image
                          src={heroProducts[0].images[0]}
                          alt={heroProducts[0].name}
                          fill
                          priority
                          fetchPriority="high"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-500" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-slate-900">{heroProducts[0]?.name ?? 'Featured Product'}</p>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {heroProducts[0]
                          ? stripHtmlForPreview(heroProducts[0].description) || 'Top-rated product from verified suppliers.'
                          : 'Top-rated product from verified suppliers.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-slate-300 bg-white/80">
                        {heroProducts[0]?.subcategory ?? heroProducts[0]?.category ?? 'Category'}
                      </Badge>
                      <p className="font-bold text-lg text-slate-900">
                        <Money amountUSD={Number(heroProducts[0]?.price ?? 0)} />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {heroProducts.slice(1).map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="block">
                    <Card className="border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all bg-white">
                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {product.images?.[0] ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              // Only the hero image should be priority on the homepage.
                              sizes="(min-width: 640px) 25vw, 100vw"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-md bg-slate-100 flex items-center justify-center">
                            <Package className="w-7 h-7 text-slate-500" />
                          </div>
                        )}
                        <p className="font-semibold text-sm text-slate-900 line-clamp-1">{product.name}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[11px] border-slate-300 bg-slate-50">{product.subcategory || product.category}</Badge>
                          <p className="text-sm font-bold text-slate-900">
                            <Money amountUSD={Number(product.price)} />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button size="lg" className="rounded-full px-5 sm:px-6" asChild>
              <Link href="/login">
                Post My RFQ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-5 sm:px-6 border-slate-300 bg-white" asChild>
              <Link href="/public/vendors">Explore Suppliers</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-2 sm:px-4 md:px-6 pb-6 sm:pb-7">
        <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 md:p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-sky-700" />
            <p className="text-sm font-semibold text-slate-900">Popular Marketplace Categories</p>
          </div>
          <PopularCategories categories={popularCategories} />
        </div>
      </section>

      <CategoryInfiniteFeedClient initialSections={initialSections} initialHasMore={initialHasMore} />
    </div>
  );
}

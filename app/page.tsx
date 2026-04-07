import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Package,
} from 'lucide-react';
import CategoryInfiniteFeed from './landing/category-infinite-feed';
import ProductAdBannerSection from './landing/product-ad-banner-section';
import {
  getLandingCategoryFeedSections,
  getLandingProducts,
  getSponsoredProducts,
} from '@/lib/landing-data';
import { stripHtmlForPreview } from '@/lib/strip-html';

const heroCategories = [
  'Agriculture & Food Products',
  'Processed Foods',
  'Minerals',
  'Textiles & Apparel',
  'Handicrafts',
  'Industrial Goods',
  'Technology',
  'Logistics Services',
];

const quickMarketStats = [
  { label: 'Verified Suppliers', value: '12,000+' },
  { label: 'Product Listings', value: '250,000+' },
  { label: 'Countries Served', value: '46' },
  { label: 'Avg. Fulfillment Rate', value: '98.4%' },
];

export default async function HomePage() {
  const products = await getLandingProducts();
  const heroProducts = products.slice(0, 5);
  const sponsoredItems = await getSponsoredProducts();
  const initialCategoryFeed = await getLandingCategoryFeedSections({ page: 0, pageSize: 3, perCategory: 4 });

  const criticalPreloadUrls = Array.from(
    new Set(
      [
        heroProducts[0]?.images?.[0],
        ...heroProducts.slice(1).map((p) => p.images?.[0]).filter(Boolean),
        ...sponsoredItems.map((i) => i.banner_image_url).filter(Boolean),
      ] as string[],
    ),
  ).filter(Boolean);

  const initialSections = initialCategoryFeed.sections;
  const initialHasMore = initialCategoryFeed.hasMore;

  return (
    <div className="bg-[#f3f5f7]">
      {criticalPreloadUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}

      <ProductAdBannerSection items={sponsoredItems} />
      <section className="px-4 md:px-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <div className="max-w-[1500px] mx-auto space-y-6">
          <div className="space-y-4">
            <Badge className="bg-sky-100 text-sky-800 border-sky-200">
              Featured Marketplace Picks
            </Badge>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <Link href={heroProducts[0] ? `/product/${heroProducts[0].id}` : '/public/vendors'} className="lg:col-span-6 block">
                <Card className="border-slate-200 bg-gradient-to-br from-sky-50 via-white to-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    {heroProducts[0]?.images?.[0] ? (
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md">
                        <Image
                          src={heroProducts[0].images[0]}
                          alt={heroProducts[0].name}
                          fill
                          priority
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
                      <p className="font-bold text-lg text-slate-900">${heroProducts[0]?.price.toFixed(2) ?? '0.00'}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {heroProducts.slice(1).map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="block">
                    <Card className="border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all bg-white">
                      <CardContent className="p-4 space-y-3">
                        {product.images?.[0] ? (
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              priority
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
                          <p className="text-sm font-bold text-slate-900">${product.price.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-6" asChild>
              <Link href="/login">
                Post My RFQ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-6 border-slate-300 bg-white" asChild>
              <Link href="/public/vendors">Explore Suppliers</Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickMarketStats.map((stat) => (
              <Card key={stat.label} className="border-slate-200 rounded-xl bg-white shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-7">
        <div className="max-w-[1500px] mx-auto bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-sky-700" />
            <p className="text-sm font-semibold text-slate-900">Popular Marketplace Categories</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {heroCategories.map((category) => (
              <Link
                key={category}
                href={`/categories?category=${encodeURIComponent(category)}`}
                className="px-3 py-2 rounded-full border border-slate-300 bg-slate-50 text-sm text-slate-700 hover:bg-slate-100 transition"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CategoryInfiniteFeed initialSections={initialSections} initialHasMore={initialHasMore} />
    </div>
  );
}

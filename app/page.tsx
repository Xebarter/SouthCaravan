import Link from 'next/link';
import {
  getLandingCategoryFeedSections,
  getFeaturedLandingProducts,
  getLandingProducts,
  getSponsoredProducts,
} from '@/lib/landing-data';
import { CategoryInfiniteFeedClient } from '@/components/home/category-infinite-feed-client';
import { FeaturedPicksCard } from '@/components/home/featured-picks-card';
import { CategoryProductCard } from '@/components/categories/category-product-card';
import { productGridClassName, productPageInsetClassName } from '@/lib/product-grid-layout';
import { createPageMetadata } from '@/lib/seo/metadata';
import { HomePageJsonLd } from '@/lib/seo/json-ld';
import { KEYWORD_CATEGORIES } from '@/lib/seo/keywords';
import { DEFAULT_DESCRIPTION, SITE_HOME_TITLE } from '@/lib/seo/site';
import ProductAdBannerSection from './landing/product-ad-banner-section';

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

  return (
    <div className="min-h-screen bg-background">
      <HomePageJsonLd />
      <section className={productPageInsetClassName + ' pt-3 pb-6 md:pt-4'}>
        <div className="mx-auto max-w-[1500px] space-y-3">
          <FeaturedPicksCard products={heroProducts} />

          <ProductAdBannerSection items={sponsoredItems} />

          {extraFeaturedProducts.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">More featured</p>
                <Link href="/featured" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className={productGridClassName}>
                {extraFeaturedProducts.slice(0, 12).map((product, index) => (
                  <CategoryProductCard
                    key={product.id}
                    product={{ ...product, item_kind: 'product' }}
                    priority={index < 6}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <CategoryInfiniteFeedClient
        initialSections={initialCategoryFeed.sections}
        initialHasMore={initialCategoryFeed.hasMore}
        initialPage={1}
      />
    </div>
  );
}

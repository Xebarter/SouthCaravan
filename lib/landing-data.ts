import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';

export type LandingProduct = {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sub_subcategory: string;
  price: number;
  minimum_order: number;
  unit: string;
  images: string[];
  in_stock: boolean;
  is_featured: boolean;
};

export type SponsoredProductSummary = {
  id: string;
  name: string;
  description: string;
  price: number;
  in_stock: boolean;
  images: string[];
  category: string;
  subcategory: string;
} | null;

export type SponsoredItem = {
  id: string;
  product_id: string;
  banner_image_url: string;
  headline: string;
  cta_label: string;
  sort_order: number;
  products: SponsoredProductSummary;
};

export type FeedProduct = {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sub_subcategory: string;
  price: number;
  minimum_order: number;
  unit: string;
  images: string[];
  in_stock: boolean;
  is_featured: boolean;
  /** ISO timestamp for mixed product/service sorting */
  created_at?: string;
  /** `service` cards link to `/public/services/:id` instead of `/product/:id` */
  item_kind?: 'product' | 'service';
  href?: string;
  /** When set (typically services), passed to `<Money baseCurrency={...} />` */
  price_currency?: string;
};

export type FeedSection = {
  category: string;
  products: FeedProduct[];
};

const DEFAULT_LANDING_LIMIT = 12;
const DEFAULT_SPONSORED_LIMIT = 12;
const DEFAULT_FEATURED_LIMIT = 5;

export const LANDING_CATEGORIES_MAX = 2000;
export const LANDING_FEED_MAX_PAGE_SIZE = 6;
export const LANDING_FEED_MAX_PER_CATEGORY = 6;

function isMissingServiceOfferingsTable(error: any) {
  const msg = String(error?.message ?? '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('service_offerings');
}

function serviceRowToFeedProduct(row: any): FeedProduct {
  const pricingType = String(row.pricing_type ?? 'fixed').toLowerCase() === 'hourly' ? 'hourly' : 'fixed';
  return {
    id: String(row.id),
    vendor_id: null,
    name: String(row.title ?? ''),
    description: String(row.description ?? ''),
    category: String(row.category ?? ''),
    subcategory: String(row.subcategory ?? ''),
    sub_subcategory: 'Service',
    price: Number(row.rate ?? 0),
    minimum_order: 1,
    unit: pricingType === 'hourly' ? 'hour' : 'service',
    images: [],
    in_stock: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    item_kind: 'service',
    href: `/public/services/${row.id}`,
    price_currency: String(row.currency ?? 'USD').toUpperCase(),
  };
}

function mergeFeaturedFeedItems(products: FeedProduct[], services: FeedProduct[], perCategory: number): FeedProduct[] {
  const combined = [...products, ...services];
  combined.sort((a, b) => {
    const af = a.is_featured ? 1 : 0;
    const bf = b.is_featured ? 1 : 0;
    if (bf !== af) return bf - af;
    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (bt !== at) return bt - at;
    return String(a.name).localeCompare(String(b.name));
  });
  return combined.slice(0, perCategory);
}

function parsePositiveInt(value: number | undefined, fallback: number, max: number) {
  if (!value) return fallback;
  const parsed = Math.floor(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function getLandingProducts(limit = DEFAULT_LANDING_LIMIT): Promise<LandingProduct[]> {
  const cacheKey = `landing-products:${limit}`;
  return getCached(cacheKey, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured',
      )
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
  });
}

export async function getFeaturedLandingProducts(limit = DEFAULT_FEATURED_LIMIT): Promise<LandingProduct[]> {
  const cacheKey = `landing-featured:${limit}`;
  return getCached(cacheKey, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured',
      )
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
  });
}

export async function getSponsoredProducts(limit = DEFAULT_SPONSORED_LIMIT): Promise<SponsoredItem[]> {
  const cacheKey = `landing-sponsored:${limit}`;
  return getCached(cacheKey, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('product_ads')
      .select(
        'id, product_id, banner_image_url, headline, cta_label, sort_order, products(id, name, description, price, in_stock, images, category, subcategory)',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    const items = (data ?? []).filter((row: any) => row.products && row.banner_image_url);
    return items as SponsoredItem[];
  });
}

export async function getLandingCategoryFeedSections(params: {
  page: number;
  pageSize: number;
  perCategory: number;
}): Promise<{ sections: FeedSection[]; hasMore: boolean; page: number }> {
  const page = Math.max(0, Math.floor(params.page || 0));
  const pageSize = parsePositiveInt(params.pageSize, 3, LANDING_FEED_MAX_PAGE_SIZE);
  const perCategory = parsePositiveInt(params.perCategory, 4, LANDING_FEED_MAX_PER_CATEGORY);

  const cacheKey = `landing-category-feed-v2:${page}:${pageSize}:${perCategory}`;
  return getCached(cacheKey, 30_000, async () => {
    // First, fetch unique categories. This is cached so we avoid doing it on every page load.
    const { data: categoriesData, error: categoryError } = await supabaseAdmin
      .from('products')
      .select('category')
      .order('category', { ascending: true })
      .limit(LANDING_CATEGORIES_MAX);

    if (categoryError) {
      console.error('[landing/category-feed categories]', categoryError.message);
      return { sections: [], hasMore: false, page };
    }

    const productCategories = Array.from(
      new Set((categoriesData ?? []).map((item: any) => item.category?.trim()).filter(Boolean)),
    );

    let serviceCategories: string[] = [];
    const { data: serviceCatRows, error: serviceCatErr } = await supabaseAdmin
      .from('service_offerings')
      .select('category')
      .eq('is_active', true)
      .limit(2000);

    if (serviceCatErr && !isMissingServiceOfferingsTable(serviceCatErr)) {
      console.error('[landing/category-feed service categories]', serviceCatErr.message);
    } else {
      serviceCategories = Array.from(
        new Set((serviceCatRows ?? []).map((r: any) => String(r.category ?? '').trim()).filter(Boolean)),
      );
    }

    const uniqueCategories = Array.from(new Set([...productCategories, ...serviceCategories])).sort((a, b) =>
      a.localeCompare(b),
    );

    const start = page * pageSize;
    const end = start + pageSize;
    const pageCategories = uniqueCategories.slice(start, end);

    const servicesByCategory = new Map<string, FeedProduct[]>();
    if (pageCategories.length > 0 && serviceCategories.length > 0) {
      const { data: serviceRows, error: servicesErr } = await supabaseAdmin
        .from('service_offerings')
        .select(
          'id,title,description,category,subcategory,pricing_type,rate,currency,is_active,is_featured,created_at',
        )
        .eq('is_active', true)
        .in('category', pageCategories)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (servicesErr && !isMissingServiceOfferingsTable(servicesErr)) {
        console.error('[landing/category-feed services]', servicesErr.message);
      } else {
        for (const row of serviceRows ?? []) {
          const cat = String((row as any).category ?? '').trim();
          if (!cat) continue;
          const item = serviceRowToFeedProduct(row);
          const list = servicesByCategory.get(cat) ?? [];
          list.push(item);
          servicesByCategory.set(cat, list);
        }
      }
    }

    const sections = await Promise.all(
      pageCategories.map(async (category) => {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select(
            'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured, created_at',
          )
          .eq('category', category)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(perCategory);

        if (error) {
          console.error('[landing/category-feed section]', category, error.message);
        }

        const filtered = await filterProductsByVerifiedVendor((data ?? []) as FeedProduct[]);
        const productsWithMeta = (filtered as FeedProduct[]).map((p) => ({
          ...p,
          item_kind: 'product' as const,
          created_at: (p as any).created_at,
        }));
        const serviceItems = servicesByCategory.get(category) ?? [];
        const merged = mergeFeaturedFeedItems(productsWithMeta, serviceItems, perCategory);
        return { category, products: merged };
      }),
    );

    return {
      sections: sections.filter((section) => section.products.length > 0),
      hasMore: end < uniqueCategories.length,
      page,
    };
  });
}

export async function getProductsByCategory(params: {
  category?: string;
  subcategory?: string;
  limit?: number;
}): Promise<LandingProduct[]> {
  const category = params.category?.trim();
  const subcategory = params.subcategory?.trim();
  const limit = parsePositiveInt(params.limit, 120, 300);
  const cacheKey = `category-products:${category ?? 'all'}:${subcategory ?? 'all'}:${limit}`;

  return getCached(cacheKey, 30_000, async () => {
    let query = supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured',
      )
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (subcategory) query = query.eq('subcategory', subcategory);

    const { data, error } = await query;
    if (error || !data) return [];
    return (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
  });
}


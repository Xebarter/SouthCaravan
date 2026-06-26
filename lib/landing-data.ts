import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';
import { normalizeOfferingImageUrls } from '@/lib/service-offering-images';
import { DEFAULT_MARKETPLACE_TAXONOMY } from '@/lib/default-marketplace-taxonomy';
import { DEFAULT_SERVICES_TAXONOMY } from '@/lib/services-taxonomy';
import { mapProductPriceCurrency } from '@/lib/product-currency';

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
  /** Catalog pricing currency for `<Money baseCurrency={...} />` */
  price_currency?: string;
};

/** Active service offering row for category browse (public). */
export type ServiceOfferingSummary = {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  pricing_type: string;
  rate: number;
  currency: string;
  is_featured: boolean;
  images: string[];
  is_active: boolean;
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
  currency?: string;
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
export const CATEGORIES_PAGE_MAX_PAGE_SIZE = 6;
export const CATEGORIES_PAGE_MAX_PER_CATEGORY = 12;
export const CATEGORIES_PAGE_DEFAULT_PAGE_SIZE = 4;
export const CATEGORIES_PAGE_DEFAULT_PER_CATEGORY = 12;

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
    images: normalizeOfferingImageUrls(row.images),
    in_stock: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
    item_kind: 'service',
    href: `/public/services/${row.id}`,
    price_currency: String(row.currency ?? 'USD').toUpperCase(),
  };
}

export function offeringSummaryToFeedProduct(row: ServiceOfferingSummary): FeedProduct {
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
    images: row.images,
    in_stock: Boolean(row.is_active),
    is_featured: Boolean(row.is_featured),
    item_kind: 'service',
    href: `/public/services/${row.id}`,
    price_currency: String(row.currency ?? 'USD').toUpperCase(),
  };
}

export function mergeFeaturedFeedItems(products: FeedProduct[], services: FeedProduct[], perCategory: number): FeedProduct[] {
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
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, currency, minimum_order, unit, images, in_stock, is_featured',
      )
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    const rows = (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
    return rows.map((row) => mapProductPriceCurrency(row as Record<string, unknown>)) as LandingProduct[];
  });
}

export async function getFeaturedLandingProducts(limit = DEFAULT_FEATURED_LIMIT): Promise<LandingProduct[]> {
  const cacheKey = `landing-featured:${limit}`;
  return getCached(cacheKey, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, currency, minimum_order, unit, images, in_stock, is_featured',
      )
      .eq('is_featured', true)
      .order('featured_sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    const rows = (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
    return rows.map((row) => mapProductPriceCurrency(row as Record<string, unknown>)) as LandingProduct[];
  });
}

export async function getSponsoredProducts(limit = DEFAULT_SPONSORED_LIMIT): Promise<SponsoredItem[]> {
  const cacheKey = `landing-sponsored:${limit}`;
  return getCached(cacheKey, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('product_ads')
      .select(
        'id, product_id, banner_image_url, headline, cta_label, sort_order, products(id, vendor_id, name, description, price, currency, in_stock, images, category, subcategory)',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    const rows = (data ?? []).filter((row: any) => row.products && row.banner_image_url);
    const nested = rows.map((row: any) => row.products).filter(Boolean);
    const allowedIds = new Set(
      (await filterProductsByVerifiedVendor(nested as { id: string; vendor_id?: string | null }[])).map((p) =>
        String(p.id),
      ),
    );
    const items = rows.filter((row: any) => allowedIds.has(String(row.products.id)));
    return items as SponsoredItem[];
  });
}

function getStaticMarketplaceCategoryNames(): string[] {
  const names = [
    ...DEFAULT_MARKETPLACE_TAXONOMY.map((section) => section.title),
    ...DEFAULT_SERVICES_TAXONOMY.map((section) => section.title),
  ];
  return Array.from(new Set(names.map((name) => name.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

async function fetchProductCategoryNamesFromTaxonomyTable(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_categories')
      .select('name')
      .eq('level', 1)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(LANDING_CATEGORIES_MAX);

    if (error || !data?.length) return [];

    return Array.from(
      new Set(data.map((row) => String(row.name ?? '').trim()).filter(Boolean)),
    );
  } catch {
    return [];
  }
}

async function fetchServiceCategoryNames(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('service_offerings')
      .select('category')
      .eq('is_active', true)
      .limit(2000);

    if (error) {
      if (!isMissingServiceOfferingsTable(error)) {
        console.warn('[marketplace service categories]', error.message);
      }
      return DEFAULT_SERVICES_TAXONOMY.map((section) => section.title);
    }

    const fromDb = Array.from(
      new Set((data ?? []).map((row) => String(row.category ?? '').trim()).filter(Boolean)),
    );

    return fromDb.length > 0
      ? fromDb
      : DEFAULT_SERVICES_TAXONOMY.map((section) => section.title);
  } catch {
    return DEFAULT_SERVICES_TAXONOMY.map((section) => section.title);
  }
}

async function fetchUniqueMarketplaceCategories(): Promise<string[]> {
  try {
    const { data: categoriesData, error: categoryError } = await supabaseAdmin
      .from('products')
      .select('category')
      .order('category', { ascending: true })
      .limit(LANDING_CATEGORIES_MAX);

    let productCategories: string[] = [];

    if (categoryError) {
      console.warn('[marketplace categories]', categoryError.message);
      productCategories = await fetchProductCategoryNamesFromTaxonomyTable();
      if (productCategories.length === 0) {
        productCategories = DEFAULT_MARKETPLACE_TAXONOMY.map((section) => section.title);
      }
    } else {
      productCategories = Array.from(
        new Set((categoriesData ?? []).map((item: any) => item.category?.trim()).filter(Boolean)),
      );
      if (productCategories.length === 0) {
        productCategories = await fetchProductCategoryNamesFromTaxonomyTable();
      }
    }

    const serviceCategories = await fetchServiceCategoryNames();

    const merged = Array.from(new Set([...productCategories, ...serviceCategories])).sort((a, b) =>
      a.localeCompare(b),
    );

    return merged.length > 0 ? merged : getStaticMarketplaceCategoryNames();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'fetch failed';
    console.warn('[marketplace categories]', message);

    const taxonomyCategories = await fetchProductCategoryNamesFromTaxonomyTable();
    if (taxonomyCategories.length > 0) {
      const serviceCategories = DEFAULT_SERVICES_TAXONOMY.map((section) => section.title);
      return Array.from(new Set([...taxonomyCategories, ...serviceCategories])).sort((a, b) =>
        a.localeCompare(b),
      );
    }

    return getStaticMarketplaceCategoryNames();
  }
}

export async function getMarketplaceCategoryNames(): Promise<string[]> {
  return getCached('marketplace-category-names-v2', 60_000, fetchUniqueMarketplaceCategories);
}

export async function getLandingCategoryFeedSections(params: {
  page: number;
  pageSize: number;
  perCategory: number;
  maxPageSize?: number;
  maxPerCategory?: number;
}): Promise<{ sections: FeedSection[]; hasMore: boolean; page: number }> {
  const page = Math.max(0, Math.floor(params.page || 0));
  const maxPageSize = params.maxPageSize ?? LANDING_FEED_MAX_PAGE_SIZE;
  const maxPerCategory = params.maxPerCategory ?? LANDING_FEED_MAX_PER_CATEGORY;
  const pageSize = parsePositiveInt(params.pageSize, 3, maxPageSize);
  const perCategory = parsePositiveInt(params.perCategory, 4, maxPerCategory);

  const cacheKey = `landing-category-feed-v2:${page}:${pageSize}:${perCategory}:${maxPageSize}:${maxPerCategory}`;
  return getCached(cacheKey, 30_000, async () => {
    const uniqueCategories = await fetchUniqueMarketplaceCategories();

    const start = page * pageSize;
    const end = start + pageSize;
    const pageCategories = uniqueCategories.slice(start, end);

    const servicesByCategory = new Map<string, FeedProduct[]>();
    if (pageCategories.length > 0) {
      const { data: serviceRows, error: servicesErr } = await supabaseAdmin
        .from('service_offerings')
        .select(
          'id,title,description,category,subcategory,pricing_type,rate,currency,is_active,is_featured,images,created_at',
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
            'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, currency, minimum_order, unit, images, in_stock, is_featured, created_at',
          )
          .eq('category', category)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(perCategory);

        if (error) {
          console.error('[landing/category-feed section]', category, error.message);
        }

        const filtered = await filterProductsByVerifiedVendor((data ?? []) as FeedProduct[]);
        const productsWithMeta = (filtered as FeedProduct[]).map((p) =>
          mapProductPriceCurrency({
            ...(p as Record<string, unknown>),
            item_kind: 'product' as const,
            created_at: (p as any).created_at,
          }) as FeedProduct,
        );
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

export async function getCategoriesPageFeedSections(params: {
  page: number;
  pageSize?: number;
  perCategory?: number;
}): Promise<{ sections: FeedSection[]; hasMore: boolean; page: number }> {
  return getLandingCategoryFeedSections({
    page: params.page,
    pageSize: params.pageSize ?? CATEGORIES_PAGE_DEFAULT_PAGE_SIZE,
    perCategory: params.perCategory ?? CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
    maxPageSize: CATEGORIES_PAGE_MAX_PAGE_SIZE,
    maxPerCategory: CATEGORIES_PAGE_MAX_PER_CATEGORY,
  });
}

async function fetchServiceBrowseCategoryNames(): Promise<string[]> {
  const taxonomyTitles = DEFAULT_SERVICES_TAXONOMY.map((section) => section.title);
  const taxonomySet = new Set(taxonomyTitles);

  const { data, error } = await supabaseAdmin
    .from('service_offerings')
    .select('category')
    .eq('is_active', true)
    .limit(LANDING_CATEGORIES_MAX);

  if (error && !isMissingServiceOfferingsTable(error)) {
    console.error('[service browse categories]', error.message);
    return taxonomyTitles;
  }

  const dbCategories = Array.from(
    new Set((data ?? []).map((row: any) => String(row.category ?? '').trim()).filter(Boolean)),
  ).filter((name) => !taxonomySet.has(name));

  dbCategories.sort((a, b) => a.localeCompare(b));
  return [...taxonomyTitles, ...dbCategories];
}

export async function getServiceBrowseCategoryNames(): Promise<string[]> {
  return getCached('service-browse-category-names-v1', 60_000, fetchServiceBrowseCategoryNames);
}

export async function getServicesPageFeedSections(params: {
  page: number;
  pageSize?: number;
  perCategory?: number;
}): Promise<{ sections: FeedSection[]; hasMore: boolean; page: number }> {
  const page = Math.max(0, Math.floor(params.page || 0));
  const pageSize = parsePositiveInt(params.pageSize, CATEGORIES_PAGE_DEFAULT_PAGE_SIZE, CATEGORIES_PAGE_MAX_PAGE_SIZE);
  const perCategory = parsePositiveInt(
    params.perCategory,
    CATEGORIES_PAGE_DEFAULT_PER_CATEGORY,
    CATEGORIES_PAGE_MAX_PER_CATEGORY,
  );

  const cacheKey = `services-category-feed-v1:${page}:${pageSize}:${perCategory}`;
  return getCached(cacheKey, 30_000, async () => {
    const uniqueCategories = await fetchServiceBrowseCategoryNames();
    const start = page * pageSize;
    const end = start + pageSize;
    const pageCategories = uniqueCategories.slice(start, end);

    const servicesByCategory = new Map<string, FeedProduct[]>();
    if (pageCategories.length > 0) {
      const { data: serviceRows, error: servicesErr } = await supabaseAdmin
        .from('service_offerings')
        .select(
          'id,title,description,category,subcategory,pricing_type,rate,currency,is_active,is_featured,images,created_at',
        )
        .eq('is_active', true)
        .in('category', pageCategories)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (servicesErr && !isMissingServiceOfferingsTable(servicesErr)) {
        console.error('[services/category-feed]', servicesErr.message);
      } else {
        for (const row of serviceRows ?? []) {
          const cat = String((row as any).category ?? '').trim();
          if (!cat) continue;
          const list = servicesByCategory.get(cat) ?? [];
          if (list.length >= perCategory) continue;
          list.push(serviceRowToFeedProduct(row));
          servicesByCategory.set(cat, list);
        }
      }
    }

    const sections = pageCategories
      .map((category) => ({
        category,
        products: servicesByCategory.get(category) ?? [],
      }))
      .filter((section) => section.products.length > 0);

    return {
      sections,
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
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, currency, minimum_order, unit, images, in_stock, is_featured',
      )
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (subcategory) query = query.eq('subcategory', subcategory);

    const { data, error } = await query;
    if (error || !data) return [];
    const rows = (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
    return rows.map((row) => mapProductPriceCurrency(row as Record<string, unknown>)) as LandingProduct[];
  });
}

export async function getServiceOfferingsByCategory(params: {
  category?: string;
  subcategory?: string;
  limit?: number;
}): Promise<ServiceOfferingSummary[]> {
  const category = params.category?.trim();
  const subcategory = params.subcategory?.trim();
  const limit = parsePositiveInt(params.limit, 120, 300);
  const cacheKey = `category-services:${category ?? 'all'}:${subcategory ?? 'all'}:${limit}`;

  return getCached(cacheKey, 30_000, async () => {
    let query = supabaseAdmin
      .from('service_offerings')
      .select(
        'id,title,description,category,subcategory,pricing_type,rate,currency,images,is_featured,is_active',
      )
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.eq('category', category);
    if (subcategory) query = query.eq('subcategory', subcategory);

    const { data, error } = await query;
    if (error) {
      if (isMissingServiceOfferingsTable(error)) return [];
      console.error('[getServiceOfferingsByCategory]', error.message);
      return [];
    }
    if (!data) return [];

    return (data as any[]).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      category: String(row.category ?? ''),
      subcategory: String(row.subcategory ?? ''),
      pricing_type: String(row.pricing_type ?? 'fixed'),
      rate: Number(row.rate ?? 0),
      currency: String(row.currency ?? 'USD'),
      is_featured: Boolean(row.is_featured),
      images: normalizeOfferingImageUrls(row.images),
      is_active: Boolean(row.is_active),
    }));
  });
}


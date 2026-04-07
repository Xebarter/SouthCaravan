import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';

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
};

export type FeedSection = {
  category: string;
  products: FeedProduct[];
};

const DEFAULT_LANDING_LIMIT = 12;
const DEFAULT_SPONSORED_LIMIT = 12;

export const LANDING_CATEGORIES_MAX = 2000;
export const LANDING_FEED_MAX_PAGE_SIZE = 6;
export const LANDING_FEED_MAX_PER_CATEGORY = 6;

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
    return data as LandingProduct[];
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

  const cacheKey = `landing-category-feed:${page}:${pageSize}:${perCategory}`;
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

    const uniqueCategories = Array.from(
      new Set((categoriesData ?? []).map((item: any) => item.category?.trim()).filter(Boolean)),
    );

    const start = page * pageSize;
    const end = start + pageSize;
    const pageCategories = uniqueCategories.slice(start, end);

    const sections = await Promise.all(
      pageCategories.map(async (category) => {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select(
            'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured',
          )
          .eq('category', category)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(perCategory);

        if (error) {
          console.error('[landing/category-feed section]', category, error.message);
          return { category, products: [] as FeedProduct[] };
        }

        return { category, products: (data ?? []) as FeedProduct[] };
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
    return data as LandingProduct[];
  });
}


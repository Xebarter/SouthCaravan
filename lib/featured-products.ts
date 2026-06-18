import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';
import type { LandingProduct } from '@/lib/landing-data';

export const FEATURED_PAGE_DEFAULT_PAGE_SIZE = 24;
export const FEATURED_PAGE_MAX_PAGE_SIZE = 48;

function parsePositiveInt(value: number | undefined, fallback: number, max: number) {
  if (!value) return fallback;
  const parsed = Math.floor(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function getFeaturedProductCategories(): Promise<string[]> {
  return getCached('featured-product-categories-v1', 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('category')
      .eq('is_featured', true)
      .order('category', { ascending: true })
      .limit(1000);

    if (error || !data) return [];

    return Array.from(
      new Set((data as { category?: string }[]).map((row) => row.category?.trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));
  });
}

export async function getFeaturedProductsPage(params: {
  page: number;
  pageSize?: number;
  category?: string;
}): Promise<{ products: LandingProduct[]; hasMore: boolean; page: number }> {
  const page = Math.max(0, Math.floor(params.page || 0));
  const pageSize = parsePositiveInt(params.pageSize, FEATURED_PAGE_DEFAULT_PAGE_SIZE, FEATURED_PAGE_MAX_PAGE_SIZE);
  const category = params.category?.trim();
  const cacheKey = `featured-products-page-v1:${page}:${pageSize}:${category ?? 'all'}`;

  return getCached(cacheKey, 30_000, async () => {
    const from = page * pageSize;

    let query = supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, is_featured, created_at',
      )
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    const { data, error } = await query.range(from, from + pageSize);

    if (error || !data) {
      console.error('[featured-products-page]', error?.message);
      return { products: [], hasMore: false, page };
    }

    const filtered = (await filterProductsByVerifiedVendor(data as LandingProduct[])) as LandingProduct[];
    const hasMore = filtered.length > pageSize;
    const products = filtered.slice(0, pageSize);

    return { products, hasMore, page };
  });
}

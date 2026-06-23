import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { clearAllCached } from '@/lib/memory-cache';

export type FeaturedProductRow = {
  id: string;
  vendor_id: string | null;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  images: string[];
  in_stock: boolean;
  is_featured: boolean;
  featured_sort_order: number;
  currency?: string;
  created_at: string;
};

export async function getNextFeaturedSortOrder(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('featured_sort_order')
    .eq('is_featured', true)
    .order('featured_sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getNextFeaturedSortOrder]', error.message);
    return 0;
  }

  const current = typeof data?.featured_sort_order === 'number' ? data.featured_sort_order : 0;
  return current + 10;
}

export async function listFeaturedProductsForAdmin(): Promise<FeaturedProductRow[]> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(
      'id, vendor_id, name, category, subcategory, price, currency, images, in_stock, is_featured, featured_sort_order, created_at',
    )
    .eq('is_featured', true)
    .order('featured_sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listFeaturedProductsForAdmin]', error.message);
    return [];
  }

  return (data ?? []) as FeaturedProductRow[];
}

export async function reorderFeaturedProducts(orderedIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(orderedIds.map((id) => String(id).trim()).filter(Boolean)));
  if (uniqueIds.length === 0) return;

  const updates = uniqueIds.map((id, index) =>
    supabaseAdmin.from('products').update({ featured_sort_order: index * 10 }).eq('id', id).eq('is_featured', true),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

export function invalidateFeaturedProductCaches() {
  clearAllCached();
  revalidatePath('/');
  revalidatePath('/featured');
  revalidatePath('/categories');
  revalidatePath('/admin/products/featured');
}

export async function ensureFeaturedSortOrderOnEnable(productId: string, currentlyFeatured: boolean) {
  if (currentlyFeatured) return null;

  const nextOrder = await getNextFeaturedSortOrder();
  const { error } = await supabaseAdmin
    .from('products')
    .update({ featured_sort_order: nextOrder })
    .eq('id', productId);

  if (error) {
    console.error('[ensureFeaturedSortOrderOnEnable]', error.message);
  }

  return nextOrder;
}

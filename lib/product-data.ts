import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';

export type ProductRecord = {
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
  specifications: Record<string, unknown> | null;
  created_at: string;
};

export type RelatedProductSummary = {
  id: string;
  name: string;
  price: number;
  unit: string;
  images: string[];
};

export async function getProductById(productId: string): Promise<ProductRecord | null> {
  const key = `product:${productId}`;
  return getCached(key, 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        'id, vendor_id, name, description, category, subcategory, sub_subcategory, price, minimum_order, unit, images, in_stock, specifications, created_at',
      )
      .eq('id', productId)
      .single();

    if (error || !data) return null;
    return data as ProductRecord;
  });
}

export async function getRelatedProducts(product: ProductRecord): Promise<RelatedProductSummary[]> {
  const key = `related:${product.id}`;
  return getCached(key, 60_000, async () => {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, name, price, unit, images')
      .eq('category', product.category)
      .neq('id', product.id)
      .order('created_at', { ascending: false })
      .limit(4);

    return (data ?? []) as RelatedProductSummary[];
  });
}


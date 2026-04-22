import { supabaseAdmin } from '@/lib/supabase-admin';
import { getCached } from '@/lib/memory-cache';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';

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
    const filtered = await filterProductsByVerifiedVendor([data as ProductRecord]);
    return filtered[0] ?? null;
  });
}

export async function getRelatedProducts(product: ProductRecord): Promise<RelatedProductSummary[]> {
  const key = `related:${product.id}`;
  return getCached(key, 60_000, async () => {
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, vendor_id, name, price, unit, images')
      .eq('category', product.category)
      .neq('id', product.id)
      .order('created_at', { ascending: false })
      .limit(8);

    const rows = (data ?? []) as Array<
      RelatedProductSummary & { vendor_id: string | null }
    >;
    const filtered = await filterProductsByVerifiedVendor(rows);
    return filtered.slice(0, 4).map(({ id, name, price, unit, images }) => ({
      id,
      name,
      price,
      unit,
      images,
    }));
  });
}


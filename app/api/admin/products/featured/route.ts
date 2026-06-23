import { NextRequest, NextResponse } from 'next/server';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import {
  invalidateFeaturedProductCaches,
  listFeaturedProductsForAdmin,
  reorderFeaturedProducts,
} from '@/lib/product-featured-order';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const products = await listFeaturedProductsForAdmin();
  return NextResponse.json({ products });
}

export async function PATCH(req: NextRequest) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);

  if (Array.isArray(body?.orderedIds) && body.orderedIds.length > 0) {
    try {
      await reorderFeaturedProducts(body.orderedIds);
      invalidateFeaturedProductCaches();
      const products = await listFeaturedProductsForAdmin();
      return NextResponse.json({ ok: true, products });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to reorder featured products';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const productId = typeof body?.id === 'string' ? body.id.trim() : '';
  if (!productId) {
    return NextResponse.json({ error: 'orderedIds or id is required' }, { status: 400 });
  }

  if (typeof body?.isFeatured === 'boolean') {
    const patch: Record<string, unknown> = { is_featured: body.isFeatured };

    if (body.isFeatured) {
      const { data: existing } = await supabaseAdmin
        .from('products')
        .select('is_featured, featured_sort_order')
        .eq('id', productId)
        .maybeSingle();

      if (!existing?.is_featured) {
        const { data: last } = await supabaseAdmin
          .from('products')
          .select('featured_sort_order')
          .eq('is_featured', true)
          .order('featured_sort_order', { ascending: false })
          .limit(1)
          .maybeSingle();

        const current =
          typeof last?.featured_sort_order === 'number' ? last.featured_sort_order : 0;
        patch.featured_sort_order = current + 10;
      }
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(patch)
      .eq('id', productId)
      .select(
        'id, vendor_id, name, category, subcategory, price, images, in_stock, is_featured, featured_sort_order, created_at',
      )
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    invalidateFeaturedProductCaches();
    const products = await listFeaturedProductsForAdmin();
    return NextResponse.json({ ok: true, product, products });
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}

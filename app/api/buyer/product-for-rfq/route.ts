import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { isUuid } from '@/lib/is-uuid';

export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const id = new URL(req.url).searchParams.get('id')?.trim() ?? '';
  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: 'Valid product id required' }, { status: 400 });
  }

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .select('id,name,price,minimum_order,unit,images,vendor_id,category,subcategory,in_stock')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[buyer/product-for-rfq]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const vid = product.vendor_id ? String(product.vendor_id).trim() : '';
  if (!vid || !isUuid(vid)) {
    return NextResponse.json({ error: 'This product cannot be quoted (no vendor).' }, { status: 400 });
  }

  return NextResponse.json({ product });
}

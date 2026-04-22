import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { productIsRfqRoutable } from '@/lib/platform-rfq-recipient';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';

export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  const limit = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get('limit')) || 12));

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id,name,price,minimum_order,unit,images,vendor_id,category,subcategory,in_stock')
    .ilike('name', `%${q}%`)
    .limit(limit);

  if (error) {
    console.error('[buyer/catalog-search]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const routable = (data ?? []).filter((p) => productIsRfqRoutable(p));
  const rows = await filterProductsByVerifiedVendor(routable as any[]);
  return NextResponse.json({ products: rows });
}

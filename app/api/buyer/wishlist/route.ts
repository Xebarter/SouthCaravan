import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: items, error } = await supabaseAdmin
    .from('wishlist_items')
    .select('*')
    .eq('buyer_id', auth.buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[buyer/wishlist GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: items ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const productId = asString((body as any).productId).trim();
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  const { data: item, error } = await supabaseAdmin
    .from('wishlist_items')
    .upsert({ buyer_id: auth.buyerId, product_id: productId }, { onConflict: 'buyer_id,product_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[buyer/wishlist POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const productId = asString(url.searchParams.get('productId')).trim();
  if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('wishlist_items')
    .delete()
    .eq('buyer_id', auth.buyerId)
    .eq('product_id', productId);

  if (error) {
    console.error('[buyer/wishlist DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


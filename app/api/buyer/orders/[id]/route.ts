import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    console.error('[buyer/orders/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: items, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('id', { ascending: true });

  if (itemsError) {
    console.error('[buyer/orders/[id] GET items]', itemsError);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const safeItems = items ?? [];
  const productIds = Array.from(
    new Set(
      safeItems
        .map((it: any) => (it?.product_id ? String(it.product_id) : ''))
        .filter((v: string) => Boolean(v)),
    ),
  );

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data: rows, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id,name,images,price,category,subcategory,sub_subcategory')
      .in('id', productIds);
    if (productsError) {
      console.error('[buyer/orders/[id] GET products]', productsError);
    } else {
      products = rows ?? [];
    }
  }

  return NextResponse.json({ order, items: safeItems, products });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Ownership check
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('orders')
    .select('id,status')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (existingError) {
    console.error('[buyer/orders/[id] PATCH lookup]', existingError);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const shippingAddress = asString((body as any).shippingAddress).trim();
  const notes = asString((body as any).notes).trim();
  const status = asString((body as any).status).trim();

  if (shippingAddress) patch.shipping_address = shippingAddress;
  if ((body as any).notes !== undefined) patch.notes = notes || null;

  // Buyer can only cancel (not arbitrarily change)
  if (status === 'cancelled') patch.status = 'cancelled';

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .update(patch)
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[buyer/orders/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Only allow deleting cancelled orders (safety)
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('orders')
    .select('id,status')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (existingError) {
    console.error('[buyer/orders/[id] DELETE lookup]', existingError);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'cancelled') {
    return NextResponse.json({ error: 'Only cancelled orders can be deleted' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('orders').delete().eq('id', id).eq('buyer_id', auth.buyerId);
  if (error) {
    console.error('[buyer/orders/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}


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

  const { data: quote, error } = await supabaseAdmin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    console.error('[buyer/quotes/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: items, error: itemsError } = await supabaseAdmin.from('quote_items').select('*').eq('quote_id', id);
  if (itemsError) {
    console.error('[buyer/quotes/[id] GET items]', itemsError);
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
      console.error('[buyer/quotes/[id] GET products]', productsError);
    } else {
      products = rows ?? [];
    }
  }

  return NextResponse.json({ quote, items: safeItems, products });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: quote, error: lookupError } = await supabaseAdmin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (lookupError) {
    console.error('[buyer/quotes/[id] PATCH lookup]', lookupError);
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const status = asString((body as any).status).trim();
  const allowed = new Set(['accepted', 'rejected']);
  if (!allowed.has(status)) {
    return NextResponse.json({ error: 'Only accepted/rejected updates allowed' }, { status: 400 });
  }
  if (quote.status !== 'pending') {
    return NextResponse.json({ error: 'Quote can no longer be modified' }, { status: 400 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('quotes')
    .update({ status })
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .select('*')
    .single();

  if (error) {
    console.error('[buyer/quotes/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quote: updated });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Allow deleting only pending quotes (safety)
  const { data: quote, error: lookupError } = await supabaseAdmin
    .from('quotes')
    .select('id,status')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (lookupError) {
    console.error('[buyer/quotes/[id] DELETE lookup]', lookupError);
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (quote.status !== 'pending') return NextResponse.json({ error: 'Only pending quotes can be deleted' }, { status: 400 });

  const { error } = await supabaseAdmin.from('quotes').delete().eq('id', id).eq('buyer_id', auth.buyerId);
  if (error) {
    console.error('[buyer/quotes/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


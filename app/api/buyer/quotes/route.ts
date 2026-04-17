import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = asString(url.searchParams.get('status')).trim();

  let query = supabaseAdmin.from('quotes').select('*').eq('buyer_id', auth.buyerId).order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);

  const { data: quotes, error } = await query;
  if (error) {
    console.error('[buyer/quotes GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ quotes: quotes ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const vendorUserId = asString((body as any).vendorUserId).trim();
  if (!vendorUserId) return NextResponse.json({ error: 'Missing vendorUserId' }, { status: 400 });

  const validUntil = (body as any).validUntil ?? null;
  const items = Array.isArray((body as any).items) ? (body as any).items : [];
  if (items.length === 0) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });

  const { data: quote, error: createError } = await supabaseAdmin
    .from('quotes')
    .insert({
      buyer_id: auth.buyerId,
      vendor_user_id: vendorUserId,
      status: 'pending',
      valid_until: validUntil,
      total_amount: 0,
    })
    .select('*')
    .single();

  if (createError) {
    console.error('[buyer/quotes POST create]', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const normalized = items.map((it: any) => {
    const quantity = Number(it?.quantity ?? 1);
    const unitPrice = Number(it?.unitPrice ?? 0);
    const subtotal = Number(it?.subtotal ?? quantity * unitPrice);
    const productId = it?.productId ?? null;
    return {
      quote_id: quote.id,
      product_id: productId,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    };
  });

  const { data: createdItems, error: itemsError } = await supabaseAdmin.from('quote_items').insert(normalized).select('*');
  if (itemsError) {
    console.error('[buyer/quotes POST items]', itemsError);
    await supabaseAdmin.from('quotes').delete().eq('id', quote.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const totalAmount = (createdItems ?? []).reduce((sum: number, row: any) => sum + Number(row.subtotal ?? 0), 0);
  const { data: updated, error: totalError } = await supabaseAdmin
    .from('quotes')
    .update({ total_amount: totalAmount })
    .eq('id', quote.id)
    .select('*')
    .single();

  if (totalError) {
    console.error('[buyer/quotes POST total]', totalError);
    return NextResponse.json({ quote, items: createdItems ?? [] });
  }

  return NextResponse.json({ quote: updated, items: createdItems ?? [] });
}


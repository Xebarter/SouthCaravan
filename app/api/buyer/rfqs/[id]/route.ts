import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { getPlatformRfqRecipientUserId } from '@/lib/platform-rfq-recipient';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: rfq, error } = await supabaseAdmin
    .from('rfq_requests')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    console.error('[buyer/rfqs/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: rfqItems, error: riErr } = await supabaseAdmin.from('rfq_items').select('*').eq('rfq_id', id);
  if (riErr) {
    console.error('[buyer/rfqs/[id] GET items]', riErr);
    return NextResponse.json({ error: riErr.message }, { status: 500 });
  }

  const { data: quotes, error: qErr } = await supabaseAdmin
    .from('quotes')
    .select('*')
    .eq('rfq_request_id', id)
    .order('created_at', { ascending: true });

  if (qErr) {
    console.error('[buyer/rfqs/[id] GET quotes]', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const quoteIds = (quotes ?? []).map((q) => q.id);
  let allQuoteItems: any[] = [];
  if (quoteIds.length > 0) {
    const { data: qi, error: qiErr } = await supabaseAdmin.from('quote_items').select('*').in('quote_id', quoteIds);
    if (qiErr) {
      console.error('[buyer/rfqs/[id] GET quote_items]', qiErr);
      return NextResponse.json({ error: qiErr.message }, { status: 500 });
    }
    allQuoteItems = qi ?? [];
  }

  const productIds = Array.from(
    new Set([
      ...(rfqItems ?? []).map((it: any) => it.product_id).filter(Boolean),
      ...allQuoteItems.map((it: any) => it.product_id).filter(Boolean),
    ].map(String)),
  );

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data: pRows, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id,name,images,price,category,subcategory,sub_subcategory,vendor_id')
      .in('id', productIds);
    if (pErr) {
      console.error('[buyer/rfqs/[id] GET products]', pErr);
    } else {
      products = pRows ?? [];
    }
  }

  const platformRecipient = await getPlatformRfqRecipientUserId();
  const platformId = platformRecipient.ok ? platformRecipient.userId : null;

  const vendorIds = Array.from(new Set((quotes ?? []).map((q) => String(q.vendor_user_id)).filter(Boolean)));
  let vendorMap: Record<string, { company_name: string; name: string; email: string }> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin.from('vendors').select('id,company_name,name,email').in('id', vendorIds);
    for (const v of vendors ?? []) {
      if (v?.id) {
        vendorMap[String(v.id)] = {
          company_name: String(v.company_name ?? ''),
          name: String(v.name ?? ''),
          email: String(v.email ?? ''),
        };
      }
    }
  }

  const itemsByQuote: Record<string, any[]> = {};
  for (const row of allQuoteItems) {
    const qid = String(row.quote_id);
    if (!itemsByQuote[qid]) itemsByQuote[qid] = [];
    itemsByQuote[qid]!.push(row);
  }

  const quotesDetailed = (quotes ?? []).map((q) => {
    const uid = String(q.vendor_user_id);
    const isPlatform = Boolean(platformId && uid === platformId);
    return {
      ...q,
      is_platform_quote: isPlatform,
      vendor: isPlatform
        ? { company_name: 'SouthCaravan', name: 'Platform listings', email: '' }
        : vendorMap[uid] ?? { company_name: '', name: '', email: '' },
      items: itemsByQuote[String(q.id)] ?? [],
    };
  });

  return NextResponse.json({
    rfq,
    rfq_items: rfqItems ?? [],
    quotes: quotesDetailed,
    products,
    platform_recipient_configured: platformRecipient.ok,
  });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: rfq, error: lErr } = await supabaseAdmin
    .from('rfq_requests')
    .select('id,status')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (lErr) {
    console.error('[buyer/rfqs/[id] DELETE lookup]', lErr);
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }
  if (!rfq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: accepted } = await supabaseAdmin
    .from('quotes')
    .select('id')
    .eq('rfq_request_id', id)
    .eq('status', 'accepted')
    .limit(1);

  if ((accepted ?? []).length > 0) {
    return NextResponse.json({ error: 'Cannot cancel an RFQ that already has an accepted quote.' }, { status: 400 });
  }

  const { error: dErr } = await supabaseAdmin.from('rfq_requests').delete().eq('id', id).eq('buyer_id', auth.buyerId);
  if (dErr) {
    console.error('[buyer/rfqs/[id] DELETE]', dErr);
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

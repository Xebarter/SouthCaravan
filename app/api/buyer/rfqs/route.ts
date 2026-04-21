import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { isUuid } from '@/lib/is-uuid';
import { getPlatformRfqRecipientUserId, productIsRfqRoutable } from '@/lib/platform-rfq-recipient';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

type IncomingItem = {
  productId?: unknown;
  quantity?: unknown;
  targetUnitPrice?: unknown;
  lineNotes?: unknown;
};

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: rfqs, error } = await supabaseAdmin
    .from('rfq_requests')
    .select('*')
    .eq('buyer_id', auth.buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[buyer/rfqs GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (rfqs ?? []).map((r) => r.id).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ rfqs: [] });
  }

  const { data: quotes, error: qErr } = await supabaseAdmin
    .from('quotes')
    .select('id,rfq_request_id,vendor_user_id,status,total_amount,responded_at,created_at')
    .in('rfq_request_id', ids);

  if (qErr) {
    console.error('[buyer/rfqs GET quotes]', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  const platformRecipient = await getPlatformRfqRecipientUserId();
  const platformId = platformRecipient.ok ? platformRecipient.userId : null;

  const vendorIds = Array.from(new Set((quotes ?? []).map((q) => String(q.vendor_user_id)).filter(Boolean)));
  let vendorMap: Record<string, { company_name: string; name: string }> = {};
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabaseAdmin
      .from('vendors')
      .select('id,company_name,name')
      .in('id', vendorIds);
    for (const v of vendors ?? []) {
      if (v?.id) {
        vendorMap[String(v.id)] = {
          company_name: String(v.company_name ?? ''),
          name: String(v.name ?? ''),
        };
      }
    }
  }

  const quotesByRfq: Record<string, typeof quotes> = {};
  for (const q of quotes ?? []) {
    const rid = q.rfq_request_id ? String(q.rfq_request_id) : '';
    if (!rid) continue;
    if (!quotesByRfq[rid]) quotesByRfq[rid] = [];
    quotesByRfq[rid]!.push(q);
  }

  const enriched = (rfqs ?? []).map((r) => {
    const qlist = quotesByRfq[String(r.id)] ?? [];
    const pendingVendor = qlist.filter((x) => x.status === 'pending').length;
    const awaiting = qlist.filter((x) => x.status === 'awaiting_buyer').length;
    const accepted = qlist.filter((x) => x.status === 'accepted').length;
    return {
      ...r,
      quotes_summary: {
        total: qlist.length,
        pending_vendor: pendingVendor,
        awaiting_buyer: awaiting,
        accepted,
      },
      quotes: qlist.map((q) => {
        const uid = String(q.vendor_user_id);
        const isPlatform = Boolean(platformId && uid === platformId);
        return {
          ...q,
          is_platform_quote: isPlatform,
          vendor: isPlatform
            ? { company_name: 'SouthCaravan', name: 'Platform listings' }
            : vendorMap[uid] ?? { company_name: '', name: '' },
        };
      }),
    };
  });

  return NextResponse.json({ rfqs: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = asString((body as any).title).trim();
  const notes = asString((body as any).notes).trim();
  const validUntilRaw = (body as any).validUntil ?? null;
  const validUntil =
    validUntilRaw === null || validUntilRaw === ''
      ? null
      : new Date(asString(validUntilRaw)).toISOString();

  const rawItems = Array.isArray((body as any).items) ? ((body as any).items as IncomingItem[]) : [];
  if (rawItems.length === 0) {
    return NextResponse.json({ error: 'Add at least one catalog line item' }, { status: 400 });
  }

  const normalized = rawItems
    .map((it) => {
      const productId = asString(it.productId).trim();
      const quantity = Number(it.quantity ?? 1);
      const target = it.targetUnitPrice;
      const targetUnitPrice =
        target === null || target === undefined || target === '' ? null : Number(target);
      const lineNotes = asString(it.lineNotes).trim();
      return {
        productId,
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0,
        targetUnitPrice: targetUnitPrice !== null && Number.isFinite(targetUnitPrice) ? targetUnitPrice : null,
        lineNotes,
      };
    })
    .filter((it) => it.productId && isUuid(it.productId) && it.quantity > 0);

  if (normalized.length === 0) {
    return NextResponse.json({ error: 'Each item needs a valid product and quantity' }, { status: 400 });
  }

  const productIds = Array.from(new Set(normalized.map((i) => i.productId)));
  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id,vendor_id,name,price,minimum_order')
    .in('id', productIds);

  if (pErr) {
    console.error('[buyer/rfqs POST products]', pErr);
    return NextResponse.json({ error: pErr.message }, { status: 500 });
  }

  const productById: Record<string, (typeof products)[number]> = {};
  for (const p of products ?? []) {
    if (p?.id) productById[String(p.id)] = p;
  }

  for (const id of productIds) {
    const p = productById[id];
    if (!p) return NextResponse.json({ error: `Unknown product: ${id}` }, { status: 400 });
    if (!productIsRfqRoutable(p)) {
      return NextResponse.json(
        { error: `Product "${p.name}" cannot be quoted (invalid seller reference).` },
        { status: 400 },
      );
    }
  }

  let platformRecipientId: string | null = null;

  const defaultTitle =
    title ||
    (() => {
      const first = productById[normalized[0]!.productId]?.name ?? 'RFQ';
      const extra = normalized.length - 1;
      return extra > 0 ? `${first} + ${extra} more` : String(first);
    })();

  const { data: rfq, error: rfqErr } = await supabaseAdmin
    .from('rfq_requests')
    .insert({
      buyer_id: auth.buyerId,
      title: defaultTitle,
      notes,
      status: 'open',
      valid_until: validUntil,
    })
    .select('*')
    .single();

  if (rfqErr || !rfq) {
    console.error('[buyer/rfqs POST rfq]', rfqErr);
    return NextResponse.json({ error: rfqErr?.message ?? 'Failed to create RFQ' }, { status: 500 });
  }

  const rfqItemRows = normalized.map((it) => ({
    rfq_id: rfq.id,
    product_id: it.productId,
    quantity: it.quantity,
    buyer_target_unit_price: it.targetUnitPrice,
    line_notes: it.lineNotes,
  }));

  const { error: itemsErr } = await supabaseAdmin.from('rfq_items').insert(rfqItemRows);
  if (itemsErr) {
    console.error('[buyer/rfqs POST rfq_items]', itemsErr);
    await supabaseAdmin.from('rfq_requests').delete().eq('id', rfq.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  type Group = { vendorUserId: string; lines: typeof normalized };
  const groups = new Map<string, Group>();
  for (const it of normalized) {
    const p = productById[it.productId]!;
    const vidRaw = p.vendor_id ? String(p.vendor_id).trim() : '';
    const isVendorSku = Boolean(vidRaw && isUuid(vidRaw));
    let recipientUserId: string;
    if (isVendorSku) {
      recipientUserId = vidRaw;
    } else {
      if (!platformRecipientId) {
        const resolved = await getPlatformRfqRecipientUserId();
        if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 503 });
        platformRecipientId = resolved.userId;
      }
      recipientUserId = platformRecipientId;
    }
    const groupKey = isVendorSku ? `v:${vidRaw}` : 'platform';
    if (!groups.has(groupKey)) groups.set(groupKey, { vendorUserId: recipientUserId, lines: [] });
    groups.get(groupKey)!.lines.push(it);
  }

  const createdQuotes: { quote: any; items: any[] }[] = [];

  for (const { vendorUserId, lines } of groups.values()) {
    const { data: quote, error: cErr } = await supabaseAdmin
      .from('quotes')
      .insert({
        buyer_id: auth.buyerId,
        vendor_user_id: vendorUserId,
        rfq_request_id: rfq.id,
        status: 'pending',
        valid_until: validUntil,
        total_amount: 0,
        vendor_message: '',
      })
      .select('*')
      .single();

    if (cErr || !quote) {
      console.error('[buyer/rfqs POST quote]', cErr);
      await supabaseAdmin.from('rfq_requests').delete().eq('id', rfq.id);
      return NextResponse.json({ error: cErr?.message ?? 'Failed to create vendor quote' }, { status: 500 });
    }

    const quoteItemRows = lines.map((it) => {
      const p = productById[it.productId]!;
      const list = Number(p.price ?? 0);
      const unit = it.targetUnitPrice !== null && it.targetUnitPrice !== undefined ? it.targetUnitPrice : list;
      const safeUnit = Number.isFinite(unit) ? unit : list;
      const qty = it.quantity;
      const subtotal = qty * safeUnit;
      return {
        quote_id: quote.id,
        product_id: it.productId,
        quantity: qty,
        unit_price: safeUnit,
        subtotal,
      };
    });

    const { data: qItems, error: qiErr } = await supabaseAdmin.from('quote_items').insert(quoteItemRows).select('*');
    if (qiErr) {
      console.error('[buyer/rfqs POST quote_items]', qiErr);
      await supabaseAdmin.from('rfq_requests').delete().eq('id', rfq.id);
      return NextResponse.json({ error: qiErr.message }, { status: 500 });
    }

    const totalAmount = (qItems ?? []).reduce((s, row: any) => s + Number(row.subtotal ?? 0), 0);
    const { data: updated, error: uErr } = await supabaseAdmin
      .from('quotes')
      .update({ total_amount: totalAmount })
      .eq('id', quote.id)
      .select('*')
      .single();

    if (uErr) {
      console.error('[buyer/rfqs POST quote total]', uErr);
    }

    createdQuotes.push({ quote: updated ?? quote, items: qItems ?? [] });
  }

  return NextResponse.json({ rfq, quotes: createdQuotes });
}

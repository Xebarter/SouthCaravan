import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';
import { getVendorVerificationStatus } from '@/lib/vendor-verification-status'

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const verification = await getVendorVerificationStatus(auth.vendorId)
  if (!verification.isVerified) {
    return NextResponse.json({ error: 'Vendor account pending verification' }, { status: 403 })
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: quote, error } = await supabaseAdmin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('vendor_user_id', auth.vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendor/quotes/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: items, error: iErr } = await supabaseAdmin.from('quote_items').select('*').eq('quote_id', id);
  if (iErr) {
    console.error('[vendor/quotes/[id] GET items]', iErr);
    return NextResponse.json({ error: iErr.message }, { status: 500 });
  }

  const safeItems = items ?? [];
  const productIds = Array.from(
    new Set(safeItems.map((it: any) => (it?.product_id ? String(it.product_id) : '')).filter(Boolean)),
  );

  let products: any[] = [];
  if (productIds.length > 0) {
    const { data: rows, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id,name,images,price,category,subcategory,minimum_order,unit,vendor_id')
      .in('id', productIds);
    if (pErr) {
      console.error('[vendor/quotes/[id] GET products]', pErr);
    } else {
      products = rows ?? [];
    }
  }

  let rfq: any = null;
  if (quote.rfq_request_id) {
    const { data: r } = await supabaseAdmin.from('rfq_requests').select('*').eq('id', quote.rfq_request_id).maybeSingle();
    rfq = r ?? null;
    if (r) {
      const { data: rItems } = await supabaseAdmin.from('rfq_items').select('*').eq('rfq_id', r.id);
      rfq = { ...r, items: rItems ?? [] };
    }
  }

  return NextResponse.json({ quote, items: safeItems, products, rfq });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const verification = await getVendorVerificationStatus(auth.vendorId)
  if (!verification.isVerified) {
    return NextResponse.json({ error: 'Vendor account pending verification' }, { status: 403 })
  }

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: quote, error: lErr } = await supabaseAdmin
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('vendor_user_id', auth.vendorId)
    .maybeSingle();

  if (lErr) {
    console.error('[vendor/quotes/[id] PATCH lookup]', lErr);
    return NextResponse.json({ error: lErr.message }, { status: 500 });
  }
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (quote.status !== 'pending') {
    return NextResponse.json({ error: 'This quote can no longer be edited.' }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const vendorMessage = asString((body as any).vendorMessage);
  const submit = Boolean((body as any).submit);
  const lineItems = Array.isArray((body as any).lineItems) ? (body as any).lineItems : [];

  const { data: existingItems, error: eiErr } = await supabaseAdmin.from('quote_items').select('*').eq('quote_id', id);
  if (eiErr) {
    console.error('[vendor/quotes/[id] PATCH items load]', eiErr);
    return NextResponse.json({ error: eiErr.message }, { status: 500 });
  }

  const productIds = Array.from(
    new Set(
      (existingItems ?? [])
        .map((row: any) => (row.product_id ? String(row.product_id) : ''))
        .filter(Boolean),
    ),
  );
  if (productIds.length > 0) {
    const { data: owned, error: oErr } = await supabaseAdmin
      .from('products')
      .select('id,vendor_id')
      .in('id', productIds);
    if (oErr) {
      console.error('[vendor/quotes/[id] PATCH products]', oErr);
      return NextResponse.json({ error: oErr.message }, { status: 500 });
    }
    for (const p of owned ?? []) {
      const vid = p.vendor_id ? String(p.vendor_id).trim() : '';
      if (vid !== auth.vendorId) {
        return NextResponse.json({ error: 'Quote contains a product you do not sell.' }, { status: 403 });
      }
    }
  }

  const byId = new Map<string, any>((existingItems ?? []).map((row: any) => [String(row.id), row]));

  if (lineItems.length > 0) {
    for (const raw of lineItems) {
      const itemId = asString(raw?.id).trim();
      if (!itemId || !byId.has(itemId)) {
        return NextResponse.json({ error: 'Invalid line item id' }, { status: 400 });
      }
      const unitPrice = Number(raw?.unitPrice);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: 'Each line needs a valid unit price' }, { status: 400 });
      }
    }

    const priceById = new Map<string, number>();
    for (const raw of lineItems) {
      priceById.set(asString(raw?.id).trim(), Number(raw?.unitPrice));
    }

    for (const row of existingItems ?? []) {
      const itemId = String(row.id);
      const nextPrice = priceById.has(itemId) ? priceById.get(itemId)! : Number(row.unit_price ?? 0);
      const qty = Number(row.quantity ?? 1);
      const subtotal = qty * nextPrice;
      const { error: uErr } = await supabaseAdmin
        .from('quote_items')
        .update({ unit_price: nextPrice, subtotal })
        .eq('id', itemId)
        .eq('quote_id', id);
      if (uErr) {
        console.error('[vendor/quotes/[id] PATCH item]', uErr);
        return NextResponse.json({ error: uErr.message }, { status: 500 });
      }
    }
  }

  const { data: refreshedItems, error: rErr } = await supabaseAdmin.from('quote_items').select('*').eq('quote_id', id);
  if (rErr) {
    console.error('[vendor/quotes/[id] PATCH refresh]', rErr);
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  const totalAmount = (refreshedItems ?? []).reduce((s, row: any) => s + Number(row.subtotal ?? 0), 0);

  const patch: Record<string, unknown> = {
    total_amount: totalAmount,
    vendor_message: vendorMessage,
  };

  if (submit) {
    patch.status = 'awaiting_buyer';
    patch.responded_at = new Date().toISOString();
  }

  const { data: updated, error: qErr } = await supabaseAdmin
    .from('quotes')
    .update(patch)
    .eq('id', id)
    .eq('vendor_user_id', auth.vendorId)
    .select('*')
    .single();

  if (qErr) {
    console.error('[vendor/quotes/[id] PATCH quote]', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  return NextResponse.json({ quote: updated, items: refreshedItems ?? [] });
}

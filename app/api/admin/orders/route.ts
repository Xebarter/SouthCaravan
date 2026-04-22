import { NextResponse } from 'next/server';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

function coerceStatus(input: unknown): OrderStatus {
  const s = String(input ?? '').toLowerCase();
  if (s === 'pending' || s === 'confirmed' || s === 'shipped' || s === 'delivered' || s === 'cancelled') return s;
  return 'pending';
}

function asUuidOrNull(input: unknown): string | null {
  const s = String(input ?? '').trim();
  return s ? s : null;
}

export async function GET(req: Request) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { searchParams } = new URL(req.url);
  const statusParam = String(searchParams.get('status') ?? '').trim().toLowerCase();
  const status = statusParam && statusParam !== 'all' ? coerceStatus(statusParam) : null;

  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? 50) || 50));
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabaseAdmin
    .from('orders')
    .select('id,buyer_id,vendor_user_id,status,total_amount,created_at,updated_at,estimated_delivery,order_items(count)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) q = q.eq('status', status);

  const { data: orders, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = Array.isArray(orders) ? orders : [];
  const buyerIds = Array.from(new Set(rows.map((o: any) => String(o.buyer_id ?? '')).filter(Boolean)));
  const vendorIds = Array.from(new Set(rows.map((o: any) => String(o.vendor_user_id ?? '')).filter(Boolean)));

  const [{ data: customers }, { data: vendors }] = await Promise.all([
    buyerIds.length
      ? supabaseAdmin.from('customers').select('id,name,email').in('id', buyerIds)
      : Promise.resolve({ data: [] as any[] }),
    vendorIds.length
      ? supabaseAdmin.from('vendors').select('id,company_name,email,name').in('id', vendorIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const buyerById = new Map<string, any>();
  for (const c of Array.isArray(customers) ? customers : []) {
    if (c?.id) buyerById.set(String(c.id), c);
  }
  const vendorById = new Map<string, any>();
  for (const v of Array.isArray(vendors) ? vendors : []) {
    if (v?.id) vendorById.set(String(v.id), v);
  }

  const shaped = rows.map((o: any) => {
    const itemsCount =
      Array.isArray(o.order_items) && o.order_items.length > 0 ? Number(o.order_items[0]?.count ?? 0) : 0;
    return {
      id: String(o.id),
      buyer_id: String(o.buyer_id),
      vendor_user_id: o.vendor_user_id ? String(o.vendor_user_id) : null,
      status: String(o.status),
      total_amount: Number(o.total_amount ?? 0),
      created_at: o.created_at ?? null,
      updated_at: o.updated_at ?? null,
      estimated_delivery: o.estimated_delivery ?? null,
      items_count: itemsCount,
      buyer: buyerById.get(String(o.buyer_id)) ?? null,
      vendor: o.vendor_user_id ? vendorById.get(String(o.vendor_user_id)) ?? null : null,
    };
  });

  return NextResponse.json({ orders: shaped, page, pageSize, total: count ?? null });
}

export async function POST(req: Request) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);
  const buyerId = asUuidOrNull(body?.buyerId);
  const vendorUserId = asUuidOrNull(body?.vendorUserId);
  const status = coerceStatus(body?.status);
  const shippingAddress = String(body?.shippingAddress ?? '').trim();
  const notes = body?.notes != null ? String(body.notes) : null;
  const estimatedDelivery = body?.estimatedDelivery ? String(body.estimatedDelivery) : null;

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!buyerId) return NextResponse.json({ error: 'buyerId is required' }, { status: 400 });
  if (!shippingAddress) return NextResponse.json({ error: 'shippingAddress is required' }, { status: 400 });
  if (items.length === 0) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });

  const normalizedItems = items.map((it: any) => {
    const productId = asUuidOrNull(it?.productId);
    const quantity = Math.max(1, Number(it?.quantity ?? 1) || 1);
    const unitPrice = Number(it?.unitPrice ?? 0) || 0;
    return { productId, quantity, unitPrice, subtotal: quantity * unitPrice };
  });
  if (normalizedItems.some((it) => !it.productId)) {
    return NextResponse.json({ error: 'Each item requires productId' }, { status: 400 });
  }

  const totalAmount = normalizedItems.reduce((s, it) => s + it.subtotal, 0);

  const { data: order, error: createErr } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: buyerId,
      vendor_user_id: vendorUserId,
      status,
      total_amount: totalAmount,
      shipping_address: shippingAddress,
      notes,
      estimated_delivery: estimatedDelivery,
    })
    .select('id')
    .single();

  if (createErr || !order?.id) {
    return NextResponse.json({ error: createErr?.message ?? 'Failed to create order' }, { status: 500 });
  }

  const orderId = String(order.id);
  const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(
    normalizedItems.map((it) => ({
      order_id: orderId,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      subtotal: it.subtotal,
    })),
  );

  if (itemsErr) {
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: orderId });
}


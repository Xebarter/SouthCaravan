import { NextResponse } from 'next/server';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

function coerceStatus(input: unknown): OrderStatus | null {
  const s = String(input ?? '').toLowerCase();
  if (s === 'pending' || s === 'confirmed' || s === 'shipped' || s === 'delivered' || s === 'cancelled') return s;
  return null;
}

function asUuidOrNull(input: unknown): string | null {
  const s = String(input ?? '').trim();
  return s ? s : null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { id } = await ctx.params;
  const orderId = String(id ?? '').trim();
  if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id,buyer_id,vendor_user_id,status,total_amount,shipping_address,notes,estimated_delivery,created_at,updated_at')
    .eq('id', orderId)
    .single();
  if (error || !order) return NextResponse.json({ error: error?.message ?? 'Order not found' }, { status: 404 });

  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('id,product_id,quantity,unit_price,subtotal')
    .eq('order_id', orderId)
    .order('id', { ascending: true });

  const buyerId = String((order as any).buyer_id);
  const vendorId = order.vendor_user_id ? String(order.vendor_user_id) : null;

  const [{ data: buyer }, { data: vendor }] = await Promise.all([
    supabaseAdmin.from('customers').select('id,name,email').eq('id', buyerId).maybeSingle(),
    vendorId ? supabaseAdmin.from('vendors').select('id,company_name,email,name').eq('id', vendorId).maybeSingle() : Promise.resolve({ data: null as any }),
  ]);

  const productIds = Array.from(
    new Set((Array.isArray(items) ? items : []).map((it: any) => String(it.product_id ?? '')).filter(Boolean)),
  );
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('products').select('id,name,images,unit,price').in('id', productIds)
    : { data: [] as any[] };

  const productsById: Record<string, any> = {};
  for (const p of Array.isArray(products) ? products : []) {
    if (p?.id) productsById[String(p.id)] = p;
  }

  return NextResponse.json({
    order,
    items: Array.isArray(items) ? items : [],
    buyer: buyer ?? null,
    vendor: vendor ?? null,
    products: Array.isArray(products) ? products : [],
    productsById,
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { id } = await ctx.params;
  const orderId = String(id ?? '').trim();
  if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const patch: Record<string, any> = {};

  const status = coerceStatus(body?.status);
  if (status) patch.status = status;
  if (typeof body?.shippingAddress === 'string') patch.shipping_address = body.shippingAddress.trim();
  if (body?.notes !== undefined) patch.notes = body.notes == null ? null : String(body.notes);
  if (body?.estimatedDelivery !== undefined) patch.estimated_delivery = body.estimatedDelivery ? String(body.estimatedDelivery) : null;
  if (body?.vendorUserId !== undefined) patch.vendor_user_id = asUuidOrNull(body.vendorUserId);

  const items = Array.isArray(body?.items) ? body.items : null;
  const replaceItems = items !== null;

  let totalAmount: number | null = null;
  let normalizedItems:
    | { productId: string; quantity: number; unitPrice: number; subtotal: number }[]
    | null = null;

  if (replaceItems) {
    if (items.length === 0) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    normalizedItems = items.map((it: any) => {
      const productId = asUuidOrNull(it?.productId);
      const quantity = Math.max(1, Number(it?.quantity ?? 1) || 1);
      const unitPrice = Number(it?.unitPrice ?? 0) || 0;
      return { productId: productId || '', quantity, unitPrice, subtotal: quantity * unitPrice };
    });
    if (normalizedItems.some((it) => !it.productId)) {
      return NextResponse.json({ error: 'Each item requires productId' }, { status: 400 });
    }
    totalAmount = normalizedItems.reduce((s, it) => s + it.subtotal, 0);
    patch.total_amount = totalAmount;
  }

  const { error: updErr } = await supabaseAdmin.from('orders').update(patch).eq('id', orderId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (replaceItems && normalizedItems) {
    const { error: delErr } = await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    const { error: insErr } = await supabaseAdmin.from('order_items').insert(
      normalizedItems.map((it) => ({
        order_id: orderId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        subtotal: it.subtotal,
      })),
    );
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { id } = await ctx.params;
  const orderId = String(id ?? '').trim();
  if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

  const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}


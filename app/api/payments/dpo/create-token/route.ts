import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { dpoCreateToken, dpoBuildCheckoutUrl, getDpoConfig } from '@/lib/dpo';
import { checkoutTotals, type CheckoutLineItem } from '@/lib/checkout-session';

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Validate line items
  const rawItems = b.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'items is required and must be non-empty' }, { status: 400 });
  }

  const items = rawItems as CheckoutLineItem[];
  const discount = typeof b.discount === 'number' && b.discount > 0 ? b.discount : 0;
  const { subtotal, shipping, tax, total } = checkoutTotals(items, discount);
  void subtotal; // used in totals only

  // Shipping address
  const shippingAddress = typeof b.shippingAddress === 'string' ? b.shippingAddress.trim() : '';
  if (!shippingAddress) {
    return NextResponse.json({ error: 'shippingAddress is required' }, { status: 400 });
  }

  const customerFirstName = typeof b.customerFirstName === 'string' ? b.customerFirstName.trim() : '';
  const customerLastName = typeof b.customerLastName === 'string' ? b.customerLastName.trim() : '';
  const customerEmail =
    typeof b.customerEmail === 'string' ? b.customerEmail.trim() : auth.email;

  void shipping;
  void tax;

  // ------------------------------------------------------------------
  // 1. Create a pending order in the DB (payment_status = 'pending')
  // ------------------------------------------------------------------
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      buyer_id: auth.buyerId,
      vendor_user_id: null,
      status: 'pending',
      payment_status: 'pending',
      shipping_address: shippingAddress,
      total_amount: parseFloat(total.toFixed(2)),
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[dpo/create-token] order insert error:', orderError);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  const orderId = order.id as string;

  // Insert order items
  const orderItems = items.map((item) => ({
    order_id: orderId,
    product_id: item.id ?? null,
    quantity: item.quantity,
    unit_price: parseFloat(item.price.toFixed(2)),
    subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
  }));

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems);
  if (itemsError) {
    console.error('[dpo/create-token] order_items insert error:', itemsError);
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 });
  }

  // ------------------------------------------------------------------
  // 2. Call DPO createToken
  // ------------------------------------------------------------------
  let dpoConfig: ReturnType<typeof getDpoConfig>;
  try {
    dpoConfig = getDpoConfig();
  } catch (e) {
    console.error('[dpo/create-token] config error:', e);
    return NextResponse.json({ error: 'Payment provider not configured' }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? `https://${req.headers.get('host')}`;
  const redirectUrl = `${baseUrl}/checkout/payment-return`;
  const backUrl = `${baseUrl}/api/payments/dpo/callback`;

  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const description = `SouthCaravan order – ${itemCount} item${itemCount === 1 ? '' : 's'}`;

  let transToken: string;
  let transRef: string;
  try {
    const dpoResult = await dpoCreateToken({
      companyToken: dpoConfig.companyToken,
      serviceType: dpoConfig.serviceType,
      amount: total.toFixed(2),
      currency: dpoConfig.currency,
      companyRef: orderId,
      redirectUrl,
      backUrl,
      customerFirstName: customerFirstName || undefined,
      customerLastName: customerLastName || undefined,
      customerEmail: customerEmail || undefined,
      description,
    });
    transToken = dpoResult.transToken;
    transRef = dpoResult.transRef;
  } catch (e) {
    console.error('[dpo/create-token] DPO API error:', e);
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'DPO request failed' },
      { status: 502 },
    );
  }

  // ------------------------------------------------------------------
  // 3. Persist DPO tokens on the order
  // ------------------------------------------------------------------
  await supabaseAdmin
    .from('orders')
    .update({ dpo_trans_token: transToken, dpo_trans_ref: transRef })
    .eq('id', orderId);

  return NextResponse.json({
    orderId,
    transToken,
    checkoutUrl: dpoBuildCheckoutUrl(transToken),
  });
}

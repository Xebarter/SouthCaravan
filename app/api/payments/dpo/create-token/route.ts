import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { dpoCreateToken, dpoBuildCheckoutUrl, getDpoConfig } from '@/lib/dpo';
import { checkoutTotals, type CheckoutLineItem } from '@/lib/checkout-session';

/** Return true if a string looks like a UUID. */
function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/**
 * Try to resolve a vendor_user_id for the order.
 * products.vendor_id is stored as text; if it is a UUID it IS the vendor's auth.users id.
 * Falls back to the buyer's own id so the NOT-NULL constraint is never violated.
 */
async function resolveVendorUserId(
  items: CheckoutLineItem[],
  fallback: string,
): Promise<string> {
  const productId = items[0]?.id;
  if (productId) {
    const { data } = await supabaseAdmin
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .maybeSingle();
    if (data?.vendor_id && isUuid(data.vendor_id)) {
      return data.vendor_id;
    }
  }
  return fallback;
}

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
  const { total } = checkoutTotals(items, discount);

  const shippingAddress = typeof b.shippingAddress === 'string' ? b.shippingAddress.trim() : '';
  if (!shippingAddress) {
    return NextResponse.json({ error: 'shippingAddress is required' }, { status: 400 });
  }

  const customerFirstName = typeof b.customerFirstName === 'string' ? b.customerFirstName.trim() : '';
  const customerLastName = typeof b.customerLastName === 'string' ? b.customerLastName.trim() : '';
  const customerEmail =
    typeof b.customerEmail === 'string' ? b.customerEmail.trim() : auth.email;

  // ------------------------------------------------------------------
  // 1. Resolve vendor_user_id (required NOT NULL in existing schema).
  //    If the payments-dpo.sql migration has been run this column is
  //    nullable and we can pass null instead. Either way we need a value.
  // ------------------------------------------------------------------
  const vendorUserId = await resolveVendorUserId(items, auth.buyerId);

  // ------------------------------------------------------------------
  // 2. Create a pending order.
  //    We attempt the insert with payment_status first (post-migration).
  //    If that column doesn't exist yet we fall back to without it.
  // ------------------------------------------------------------------
  let orderId: string;

  const baseInsert = {
    buyer_id: auth.buyerId,
    vendor_user_id: vendorUserId,
    status: 'pending' as const,
    shipping_address: shippingAddress,
    total_amount: parseFloat(total.toFixed(2)),
  };

  // Try post-migration insert (includes payment_status column).
  const { data: orderFull, error: errorFull } = await supabaseAdmin
    .from('orders')
    .insert({ ...baseInsert, payment_status: 'pending' })
    .select('id')
    .single();

  if (errorFull) {
    // "column does not exist" or "Could not find the 'payment_status' column" → retry without it.
    const isColMissing =
      errorFull.code === '42703' ||
      errorFull.message?.toLowerCase().includes('payment_status');

    if (isColMissing) {
      const { data: orderBasic, error: errorBasic } = await supabaseAdmin
        .from('orders')
        .insert(baseInsert)
        .select('id')
        .single();

      if (errorBasic || !orderBasic) {
        console.error('[dpo/create-token] order insert (basic) error:', errorBasic);
        return NextResponse.json(
          { error: 'Failed to create order', detail: errorBasic?.message },
          { status: 500 },
        );
      }
      orderId = orderBasic.id as string;
    } else {
      console.error('[dpo/create-token] order insert error:', errorFull);
      return NextResponse.json(
        { error: 'Failed to create order', detail: errorFull.message },
        { status: 500 },
      );
    }
  } else if (!orderFull) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  } else {
    orderId = orderFull.id as string;
  }

  // ------------------------------------------------------------------
  // 3. Insert order items
  // ------------------------------------------------------------------
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
    return NextResponse.json(
      { error: 'Failed to save order items', detail: itemsError.message },
      { status: 500 },
    );
  }

  // ------------------------------------------------------------------
  // 4. Call DPO createToken
  // ------------------------------------------------------------------
  let dpoConfig: ReturnType<typeof getDpoConfig>;
  try {
    dpoConfig = getDpoConfig();
  } catch (e) {
    console.error('[dpo/create-token] config error:', e);
    await supabaseAdmin.from('orders').delete().eq('id', orderId);
    return NextResponse.json({ error: 'Payment provider not configured' }, { status: 503 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    `https://${req.headers.get('host')}`;
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
  // 5. Persist DPO tokens on the order (best-effort; new columns may
  //    not exist yet if the migration hasn't been run).
  // ------------------------------------------------------------------
  await supabaseAdmin
    .from('orders')
    .update({ dpo_trans_token: transToken, dpo_trans_ref: transRef })
    .eq('id', orderId)
    .then(({ error }) => {
      if (error) {
        // Silently skip if columns don't exist yet — token is still
        // available in the JSON response for verification.
        console.warn('[dpo/create-token] could not save DPO tokens (migration pending?):', error.message);
      }
    });

  return NextResponse.json({
    orderId,
    transToken,
    checkoutUrl: dpoBuildCheckoutUrl(transToken),
  });
}

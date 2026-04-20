import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { dpoVerifyToken, getDpoConfig } from '@/lib/dpo';

/**
 * GET /api/payments/dpo/verify?token={transToken}&orderId={orderId}
 *
 * Called by the payment-return page after DPO redirects the customer back.
 * Verifies the payment with DPO and updates the order status accordingly.
 *
 * `orderId` is the CompanyRef DPO echoes back in the redirect — used as a
 * fallback lookup when the dpo_trans_token column doesn't exist yet
 * (i.e. before the payments-dpo.sql migration has been run).
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const transToken = searchParams.get('token')?.trim();
  const orderIdParam = searchParams.get('orderId')?.trim();

  if (!transToken) {
    return NextResponse.json({ error: 'token query param is required' }, { status: 400 });
  }

  // ------------------------------------------------------------------
  // Look up the order. Try dpo_trans_token first (post-migration).
  // Fall back to orderId param if the column doesn't exist yet.
  // ------------------------------------------------------------------
  let order: { id: string; status: string; payment_status?: string } | null = null;

  const { data: orderByToken, error: tokenLookupError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('dpo_trans_token', transToken)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (tokenLookupError) {
    const isColMissing =
      tokenLookupError.code === '42703' ||
      tokenLookupError.message?.toLowerCase().includes('dpo_trans_token');

    if (isColMissing && orderIdParam) {
      // Migration not yet run — look up by orderId (CompanyRef from DPO redirect).
      const { data: orderById, error: idLookupError } = await supabaseAdmin
        .from('orders')
        .select('id, status')
        .eq('id', orderIdParam)
        .eq('buyer_id', auth.buyerId)
        .maybeSingle();

      if (idLookupError) {
        console.error('[dpo/verify] order lookup by id error:', idLookupError);
        return NextResponse.json({ error: 'Order lookup failed' }, { status: 500 });
      }
      order = orderById;
    } else {
      console.error('[dpo/verify] order lookup error:', tokenLookupError);
      return NextResponse.json({ error: 'Order lookup failed' }, { status: 500 });
    }
  } else {
    order = orderByToken;
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found for this token' }, { status: 404 });
  }

  // Already confirmed — idempotent return
  if (order.payment_status === 'paid' || order.status === 'confirmed') {
    return NextResponse.json({ orderId: order.id, paid: true, alreadyConfirmed: true });
  }

  let dpoConfig: ReturnType<typeof getDpoConfig>;
  try {
    dpoConfig = getDpoConfig();
  } catch (e) {
    console.error('[dpo/verify] config error:', e);
    return NextResponse.json({ error: 'Payment provider not configured' }, { status: 503 });
  }

  let verifyResult: Awaited<ReturnType<typeof dpoVerifyToken>>;
  try {
    verifyResult = await dpoVerifyToken(dpoConfig.companyToken, transToken);
  } catch (e) {
    console.error('[dpo/verify] DPO verifyToken error:', e);
    return NextResponse.json({ error: 'DPO verification request failed' }, { status: 502 });
  }

  const paid = verifyResult.result === '000';

  // Update order — gracefully skip fields that don't exist yet (pre-migration).
  const updatePayload: Record<string, unknown> = {};
  if (paid) updatePayload.status = 'confirmed';

  // payment_status is a new column; the update will silently fail if it's absent.
  try {
    await supabaseAdmin
      .from('orders')
      .update({ ...updatePayload, payment_status: paid ? 'paid' : 'failed' })
      .eq('id', order.id);
  } catch {
    // Column may not exist — update just the status.
    if (Object.keys(updatePayload).length > 0) {
      await supabaseAdmin.from('orders').update(updatePayload).eq('id', order.id);
    }
  }

  // Supabase client returns errors rather than throwing, so handle that too.
  const { error: updateError } = await supabaseAdmin
    .from('orders')
    .update(updatePayload)
    .eq('id', order.id);

  if (updateError) {
    console.warn('[dpo/verify] order update warning:', updateError.message);
  }

  return NextResponse.json({
    orderId: order.id,
    paid,
    result: verifyResult.result,
    resultExplanation: verifyResult.resultExplanation,
    customerName: verifyResult.customerName,
    transactionAmount: verifyResult.transactionAmount,
  });
}

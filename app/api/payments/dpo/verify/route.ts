import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { dpoVerifyToken, getDpoConfig } from '@/lib/dpo';

/**
 * GET /api/payments/dpo/verify?token={transToken}
 *
 * Called by the payment-return page after DPO redirects the customer back.
 * Verifies the payment with DPO and updates the order status accordingly.
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const transToken = searchParams.get('token')?.trim();

  if (!transToken) {
    return NextResponse.json({ error: 'token query param is required' }, { status: 400 });
  }

  // Look up the order by DPO token (must belong to this buyer)
  const { data: order, error: lookupError } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status, total_amount')
    .eq('dpo_trans_token', transToken)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (lookupError) {
    console.error('[dpo/verify] order lookup error:', lookupError);
    return NextResponse.json({ error: 'Order lookup failed' }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: 'Order not found for this token' }, { status: 404 });
  }

  // Already confirmed — idempotent return
  if (order.payment_status === 'paid') {
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
  const newPaymentStatus = paid ? 'paid' : 'failed';
  const newOrderStatus = paid ? 'confirmed' : 'pending';

  await supabaseAdmin
    .from('orders')
    .update({
      payment_status: newPaymentStatus,
      ...(paid ? { status: newOrderStatus } : {}),
    })
    .eq('id', order.id);

  return NextResponse.json({
    orderId: order.id,
    paid,
    result: verifyResult.result,
    resultExplanation: verifyResult.resultExplanation,
    customerName: verifyResult.customerName,
    transactionAmount: verifyResult.transactionAmount,
  });
}

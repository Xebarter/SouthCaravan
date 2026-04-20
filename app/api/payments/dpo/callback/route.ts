import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { dpoVerifyToken, getDpoConfig } from '@/lib/dpo';

/**
 * POST /api/payments/dpo/callback
 *
 * Server-to-server BackURL callback from DPO Pay.
 * DPO posts form-encoded or query-param data here after payment completion.
 * Must return HTTP 200.
 *
 * Note: This endpoint is unauthenticated (DPO calls it directly),
 * so we verify the transaction with DPO before trusting it.
 */
export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest): Promise<NextResponse> {
  try {
    // DPO sends params either as query string or form body.
    const url = new URL(req.url);
    let params: URLSearchParams = url.searchParams;

    const contentType = req.headers.get('content-type') ?? '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      params = new URLSearchParams(text);
    }

    const transToken =
      params.get('TransactionToken') ?? params.get('TransID') ?? '';
    const companyRef = params.get('CompanyRef') ?? '';

    if (!transToken || !companyRef) {
      console.warn('[dpo/callback] missing TransactionToken or CompanyRef');
      return new NextResponse('OK', { status: 200 });
    }

    // Look up the order by company ref (order UUID)
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status, dpo_trans_token')
      .eq('id', companyRef)
      .maybeSingle();

    if (!order) {
      console.warn('[dpo/callback] order not found for CompanyRef:', companyRef);
      return new NextResponse('OK', { status: 200 });
    }

    // Skip if already processed
    if (order.payment_status === 'paid') {
      return new NextResponse('OK', { status: 200 });
    }

    let dpoConfig: ReturnType<typeof getDpoConfig>;
    try {
      dpoConfig = getDpoConfig();
    } catch {
      console.error('[dpo/callback] DPO not configured');
      return new NextResponse('OK', { status: 200 });
    }

    const verifyResult = await dpoVerifyToken(dpoConfig.companyToken, transToken);
    const paid = verifyResult.result === '000';

    await supabaseAdmin
      .from('orders')
      .update({
        payment_status: paid ? 'paid' : 'failed',
        ...(paid ? { status: 'confirmed' } : {}),
      })
      .eq('id', order.id);

    console.log(
      `[dpo/callback] order ${order.id} — result ${verifyResult.result} (${verifyResult.resultExplanation})`,
    );
  } catch (e) {
    console.error('[dpo/callback] error:', e);
  }

  return new NextResponse('OK', { status: 200 });
}

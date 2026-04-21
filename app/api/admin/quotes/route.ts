import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import { getPlatformRfqRecipientUserId } from '@/lib/platform-rfq-recipient';

export async function GET(req: NextRequest) {
  const auth = await getAuthedAdmin();
  if (!auth.ok) return auth.response;

  const platform = await getPlatformRfqRecipientUserId();
  if (!platform.ok) {
    return NextResponse.json({ quotes: [], setup_error: platform.error });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status')?.trim() ?? '';

  let q = supabaseAdmin
    .from('quotes')
    .select('id,buyer_id,vendor_user_id,rfq_request_id,status,total_amount,valid_until,created_at,updated_at,responded_at,vendor_message')
    .eq('vendor_user_id', platform.userId)
    .not('rfq_request_id', 'is', null)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    q = q.eq('status', status);
  }

  const { data: quotes, error } = await q;
  if (error) {
    console.error('[admin/quotes GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rfqIds = Array.from(
    new Set((quotes ?? []).map((row) => row.rfq_request_id).filter(Boolean).map(String)),
  );

  let rfqMap: Record<string, { title: string; notes: string }> = {};
  if (rfqIds.length > 0) {
    const { data: rfqs } = await supabaseAdmin.from('rfq_requests').select('id,title,notes').in('id', rfqIds);
    for (const r of rfqs ?? []) {
      if (r?.id) rfqMap[String(r.id)] = { title: String(r.title ?? ''), notes: String(r.notes ?? '') };
    }
  }

  const enriched = (quotes ?? []).map((row) => ({
    ...row,
    rfq: row.rfq_request_id ? rfqMap[String(row.rfq_request_id)] ?? null : null,
  }));

  return NextResponse.json({ quotes: enriched });
}

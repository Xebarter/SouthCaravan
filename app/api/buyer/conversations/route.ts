import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('buyer_id', auth.buyerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[buyer/conversations GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: conversations ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const vendorUserId = asString((body as any).vendorUserId).trim();
  if (!vendorUserId) return NextResponse.json({ error: 'Missing vendorUserId' }, { status: 400 });

  const { data: conv, error } = await supabaseAdmin
    .from('conversations')
    .upsert({ buyer_id: auth.buyerId, vendor_user_id: vendorUserId }, { onConflict: 'buyer_id,vendor_user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[buyer/conversations POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: conv });
}


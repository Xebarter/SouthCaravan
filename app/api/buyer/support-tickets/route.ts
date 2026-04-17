import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: tickets, error } = await supabaseAdmin
    .from('support_tickets')
    .select('*')
    .eq('buyer_id', auth.buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[buyer/support-tickets GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickets: tickets ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const subject = asString((body as any).subject).trim();
  const message = asString((body as any).message).trim();
  if (!subject || !message) {
    return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 });
  }

  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .insert({ buyer_id: auth.buyerId, subject, message, status: 'open' })
    .select('*')
    .single();

  if (error) {
    console.error('[buyer/support-tickets POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket });
}


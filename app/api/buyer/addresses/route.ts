import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function asBool(v: unknown) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: addresses, error } = await supabaseAdmin
    .from('customer_addresses')
    .select('*')
    .eq('buyer_id', auth.buyerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[buyer/addresses GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: addresses ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload: any = {
    buyer_id: auth.buyerId,
    label: asString((body as any).label).trim() || 'Address',
    name: asString((body as any).name).trim(),
    phone: asString((body as any).phone).trim(),
    line1: asString((body as any).line1).trim(),
    line2: asString((body as any).line2).trim(),
    city: asString((body as any).city).trim(),
    state: asString((body as any).state).trim(),
    zip_code: asString((body as any).zipCode).trim(),
    country: asString((body as any).country).trim(),
    is_default: asBool((body as any).isDefault),
  };

  if (!payload.line1 || !payload.city || !payload.country) {
    return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
  }

  // If making default, unset existing defaults
  if (payload.is_default) {
    await supabaseAdmin.from('customer_addresses').update({ is_default: false }).eq('buyer_id', auth.buyerId);
  }

  const { data: created, error } = await supabaseAdmin.from('customer_addresses').insert(payload).select('*').single();
  if (error) {
    console.error('[buyer/addresses POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ address: created });
}


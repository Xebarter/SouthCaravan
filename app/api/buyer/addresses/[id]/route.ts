import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function asBool(v: unknown) {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: any = {
    label: asString((body as any).label).trim(),
    name: asString((body as any).name).trim(),
    phone: asString((body as any).phone).trim(),
    line1: asString((body as any).line1).trim(),
    line2: asString((body as any).line2).trim(),
    city: asString((body as any).city).trim(),
    state: asString((body as any).state).trim(),
    zip_code: asString((body as any).zipCode).trim(),
    country: asString((body as any).country).trim(),
  };

  // Remove empty keys (so PATCH doesn't blank fields unintentionally)
  for (const k of Object.keys(patch)) {
    if (patch[k] === '') delete patch[k];
  }

  const makeDefault = (body as any).isDefault !== undefined ? asBool((body as any).isDefault) : undefined;
  if (makeDefault === true) {
    await supabaseAdmin.from('customer_addresses').update({ is_default: false }).eq('buyer_id', auth.buyerId);
    patch.is_default = true;
  } else if (makeDefault === false) {
    patch.is_default = false;
  }

  const { data: address, error } = await supabaseAdmin
    .from('customer_addresses')
    .update(patch)
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[buyer/addresses/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!address) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ address });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseAdmin.from('customer_addresses').delete().eq('id', id).eq('buyer_id', auth.buyerId);
  if (error) {
    console.error('[buyer/addresses/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


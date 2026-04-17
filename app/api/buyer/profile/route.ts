import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  // Base record in `customers` (exists for auth + phone gating)
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('id', auth.buyerId)
    .maybeSingle();

  if (customerError) {
    console.error('[buyer/profile GET customers]', customerError);
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  const ensureCustomer =
    customer ??
    (
      await supabaseAdmin
        .from('customers')
        .insert({
          id: auth.buyerId,
          email: auth.email,
          name: auth.name,
          phone: null,
        })
        .select('*')
        .single()
    ).data;

  // Optional extended profile (created on demand)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('customer_profiles')
    .select('*')
    .eq('user_id', auth.buyerId)
    .maybeSingle();

  if (profileError) {
    // If table doesn't exist yet, keep the API usable.
    if ((profileError as any)?.code !== '42P01') {
      console.error('[buyer/profile GET customer_profiles]', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    customer: ensureCustomer ?? null,
    profile: profile ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = asString((body as any).name).trim();
  const phone = asString((body as any).phone).trim();
  const email = asString((body as any).email).trim();

  // Update `customers` (limited fields)
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .upsert(
      {
        id: auth.buyerId,
        email: email || auth.email,
        name: name || auth.name,
        phone: phone || null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (customerError) {
    console.error('[buyer/profile PATCH customers]', customerError);
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  // Patch extended profile if table exists
  const patch: Record<string, unknown> = {
    user_id: auth.buyerId,
    company_name: asString((body as any).companyName).trim(),
    address: asString((body as any).address).trim(),
    city: asString((body as any).city).trim(),
    state: asString((body as any).state).trim(),
    zip_code: asString((body as any).zipCode).trim(),
    country: asString((body as any).country).trim(),
    tax_id: asString((body as any).taxId).trim(),
    notes: asString((body as any).notes).trim(),
  };

  // Never allow API to change ownership/audit fields
  delete (patch as any).created_at;
  delete (patch as any).updated_at;

  let profile: any = null;
  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from('customer_profiles')
    .upsert(patch, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (profileError) {
    if ((profileError as any)?.code !== '42P01') {
      console.error('[buyer/profile PATCH customer_profiles]', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  } else {
    profile = updatedProfile ?? null;
  }

  return NextResponse.json({ customer, profile });
}


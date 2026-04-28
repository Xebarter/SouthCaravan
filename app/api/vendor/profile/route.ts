import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const { data: profile, error } = await supabaseAdmin
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', auth.vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendor/profile GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (profile) return NextResponse.json({ profile });

  // Create a sane default profile on first access.
  const { data: created, error: createError } = await supabaseAdmin
    .from('vendor_profiles')
    .insert({
      user_id: auth.vendorId,
      company_name: auth.name || 'Vendor',
      public_email: auth.email,
      contact_email: auth.email,
    })
    .select('*')
    .single();

  if (createError) {
    console.error('[vendor/profile GET create]', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: created });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  // Allow clearing fields (empty string) by setting them explicitly when provided.
  if ('companyName' in (body as any)) patch.company_name = asString((body as any).companyName).trim();

  if ('description' in (body as any)) patch.description = asString((body as any).description).trim();

  if ('publicEmail' in (body as any)) patch.public_email = asString((body as any).publicEmail).trim();

  if ('contactEmail' in (body as any)) patch.contact_email = asString((body as any).contactEmail).trim();

  if ('phone' in (body as any)) patch.phone = asString((body as any).phone).trim();

  if ('website' in (body as any)) patch.website = asString((body as any).website).trim();

  if ('address' in (body as any)) patch.address = asString((body as any).address).trim();

  if ('city' in (body as any)) patch.city = asString((body as any).city).trim();

  if ('state' in (body as any)) patch.state = asString((body as any).state).trim();

  if ('zipCode' in (body as any)) patch.zip_code = asString((body as any).zipCode).trim();

  if ('country' in (body as any)) patch.country = asString((body as any).country).trim();

  if ('logoUrl' in (body as any)) patch.logo_url = asString((body as any).logoUrl).trim();

  const publicProfileEnabledRaw = (body as any).publicProfileEnabled;
  if (typeof publicProfileEnabledRaw === 'boolean') patch.public_profile_enabled = publicProfileEnabledRaw;

  const publicProfileRaw = (body as any).publicProfile;
  if (publicProfileRaw != null) {
    if (typeof publicProfileRaw !== 'object' || Array.isArray(publicProfileRaw)) {
      return NextResponse.json({ error: 'publicProfile must be an object' }, { status: 422 });
    }
    patch.public_profile = publicProfileRaw;
  }

  // Never allow changing ownership from the API.
  delete (patch as any).user_id;
  delete (patch as any).created_at;
  delete (patch as any).updated_at;

  // Upsert so settings can be saved even if the profile row doesn't exist yet.
  const { data: profile, error } = await supabaseAdmin
    .from('vendor_profiles')
    .upsert({ user_id: auth.vendorId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[vendor/profile PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}


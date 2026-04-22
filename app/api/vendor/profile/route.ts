import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasVendorAccess(user: any) {
  const meta = user?.app_metadata ?? {};
  if (meta.role === 'vendor') return true;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.includes('vendor');
}

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string; email: string; name: string; company?: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasVendorAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Vendor role required' }, { status: 403 }) };
  }

  const email = typeof data.user.email === 'string' ? data.user.email : '';
  const meta = data.user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (email ? email.split('@')[0] : 'Vendor');
  const company = typeof meta.company === 'string' ? meta.company : undefined;

  return { ok: true, vendorId: data.user.id, email, name, company };
}

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  const auth = await getAuthedVendorId();
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
      company_name: auth.company || auth.name || 'Vendor',
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
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  const companyName = asString((body as any).companyName).trim();
  if (companyName) patch.company_name = companyName;

  const description = asString((body as any).description).trim();
  if (description) patch.description = description;

  const publicEmail = asString((body as any).publicEmail).trim();
  if (publicEmail) patch.public_email = publicEmail;

  const contactEmail = asString((body as any).contactEmail).trim();
  if (contactEmail) patch.contact_email = contactEmail;

  const phone = asString((body as any).phone).trim();
  patch.phone = phone;

  const website = asString((body as any).website).trim();
  patch.website = website;

  const address = asString((body as any).address).trim();
  patch.address = address;

  const city = asString((body as any).city).trim();
  patch.city = city;

  const state = asString((body as any).state).trim();
  patch.state = state;

  const zipCode = asString((body as any).zipCode).trim();
  patch.zip_code = zipCode;

  const country = asString((body as any).country).trim();
  patch.country = country;

  const logoUrl = asString((body as any).logoUrl).trim();
  patch.logo_url = logoUrl;

  // Never allow changing ownership from the API.
  delete (patch as any).user_id;
  delete (patch as any).created_at;
  delete (patch as any).updated_at;

  const { data: profile, error } = await supabaseAdmin
    .from('vendor_profiles')
    .update(patch)
    .eq('user_id', auth.vendorId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[vendor/profile PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ profile });
}


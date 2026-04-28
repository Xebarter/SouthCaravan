import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/is-uuid';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const vendorUserId = asString(id).trim();
  if (!vendorUserId || !isUuid(vendorUserId)) {
    return NextResponse.json({ error: 'Invalid vendor id' }, { status: 400 });
  }

  const [{ data: profile, error: profileError }, { data: images, error: imagesError }] = await Promise.all([
    supabaseAdmin
      .from('vendor_profiles')
      .select(
        'user_id,company_name,description,public_email,phone,website,address,city,state,zip_code,country,logo_url,public_profile_enabled,public_profile',
      )
      .eq('user_id', vendorUserId)
      .maybeSingle(),
    supabaseAdmin
      .from('vendor_profile_showcase_images')
      .select('id,url,kind,caption,sort_order,created_at')
      .eq('user_id', vendorUserId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
  ]);

  if (profileError) {
    console.error('[public/vendor GET] profile', profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (imagesError) {
    console.error('[public/vendor GET] images', imagesError);
    return NextResponse.json({ error: imagesError.message }, { status: 500 });
  }

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (profile.public_profile_enabled !== true) {
    return NextResponse.json({ error: 'Profile not public' }, { status: 404 });
  }

  // Only return explicitly public-safe fields.
  const safeProfile = {
    user_id: profile.user_id,
    company_name: profile.company_name,
    description: profile.description,
    public_email: profile.public_email,
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    zip_code: profile.zip_code,
    country: profile.country,
    logo_url: profile.logo_url,
    public_profile: profile.public_profile ?? {},
  };

  return NextResponse.json({ profile: safeProfile, images: images ?? [] });
}


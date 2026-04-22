import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { isUuid } from '@/lib/is-uuid';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const vendorUserId = asString(url.searchParams.get('vendorUserId')).trim();
  if (!vendorUserId || !isUuid(vendorUserId)) {
    return NextResponse.json({ error: 'Missing or invalid vendorUserId' }, { status: 400 });
  }

  // Try vendor directory tables first.
  const [{ data: vendor }, { data: profile }] = await Promise.all([
    supabaseAdmin.from('vendors').select('id,company_name,name,email').eq('id', vendorUserId).maybeSingle(),
    supabaseAdmin.from('vendor_profiles').select('user_id,phone,public_email,company_name').eq('user_id', vendorUserId).maybeSingle(),
  ]);

  const displayName =
    (profile?.company_name?.trim() ||
      vendor?.company_name?.trim() ||
      vendor?.name?.trim() ||
      (vendor?.email ? String(vendor.email).split('@')[0] : '') ||
      `Vendor ${vendorUserId.slice(-6)}`) as string;

  const phone = typeof profile?.phone === 'string' && profile.phone.trim() ? profile.phone.trim() : null;

  // Platform/admin inbox: optionally expose a stable support phone.
  const supportPhone =
    phone ||
    (process.env.PLATFORM_SUPPORT_PHONE && process.env.PLATFORM_SUPPORT_PHONE.trim()
      ? process.env.PLATFORM_SUPPORT_PHONE.trim()
      : null);

  return NextResponse.json({
    vendorUserId,
    displayName,
    phone: supportPhone,
  });
}


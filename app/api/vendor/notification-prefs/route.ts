import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';

function coerceBool(v: unknown, fallback: boolean) {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return fallback;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

export async function GET() {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const { data: prefs, error } = await supabaseAdmin
    .from('vendor_notification_prefs')
    .select('*')
    .eq('user_id', auth.vendorId)
    .maybeSingle();

  if (error) {
    console.error('[vendor/notification-prefs GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (prefs) return NextResponse.json({ prefs });

  const { data: created, error: createError } = await supabaseAdmin
    .from('vendor_notification_prefs')
    .insert({
      user_id: auth.vendorId,
      orders: true,
      quotes: true,
      messages: true,
      marketing: false,
      email: auth.email,
    })
    .select('*')
    .single();

  if (createError) {
    console.error('[vendor/notification-prefs GET create]', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ prefs: created });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch = {
    user_id: auth.vendorId,
    orders: coerceBool((body as any).orders, true),
    quotes: coerceBool((body as any).quotes, true),
    messages: coerceBool((body as any).messages, true),
    marketing: coerceBool((body as any).marketing, false),
    email: typeof (body as any).email === 'string' ? (body as any).email : auth.email,
  };

  // Upsert so first-time vendors can save without a prior GET.
  const { data: prefs, error } = await supabaseAdmin
    .from('vendor_notification_prefs')
    .upsert(patch, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[vendor/notification-prefs PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prefs });
}


import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function coerceBool(v: unknown, fallback: boolean) {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return fallback;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: prefs, error } = await supabaseAdmin
    .from('customer_notification_prefs')
    .select('*')
    .eq('user_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/notification-prefs GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (prefs) return NextResponse.json({ prefs });

  const { data: created, error: createError } = await supabaseAdmin
    .from('customer_notification_prefs')
    .insert({
      user_id: auth.buyerId,
      email: auth.email,
      order_updates: true,
      new_products: true,
      vendor_messages: true,
      promo: false,
      newsletter: true,
    })
    .select('*')
    .single();

  if (createError) {
    if ((createError as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/notification-prefs GET create]', createError);
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  return NextResponse.json({ prefs: created });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch = {
    email: typeof (body as any).email === 'string' ? (body as any).email : auth.email,
    order_updates: coerceBool((body as any).orderUpdates, true),
    new_products: coerceBool((body as any).newProducts, true),
    vendor_messages: coerceBool((body as any).vendorMessages, true),
    promo: coerceBool((body as any).promo, false),
    newsletter: coerceBool((body as any).newsletter, true),
  };

  const { data: prefs, error } = await supabaseAdmin
    .from('customer_notification_prefs')
    .upsert({ user_id: auth.buyerId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/notification-prefs PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prefs: prefs ?? null });
}


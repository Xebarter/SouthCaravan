import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function asBool(v: unknown, fallback: boolean) {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return fallback;
  const s = String(v).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

type CustomerPreferencesRow = {
  user_id: string;
  currency_preference: string;
  language: string;
  time_zone: string;
  allow_analytics: boolean;
  personalized_recommendations: boolean;
};

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { data: prefs, error } = await supabaseAdmin
    .from('customer_preferences')
    .select('*')
    .eq('user_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/preferences GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (prefs) return NextResponse.json({ prefs });

  const { data: created, error: createError } = await supabaseAdmin
    .from('customer_preferences')
    .insert({
      user_id: auth.buyerId,
      currency_preference: 'AUTO',
      language: 'en',
      time_zone: 'UTC',
      allow_analytics: true,
      personalized_recommendations: true,
    } satisfies CustomerPreferencesRow)
    .select('*')
    .single();

  if (createError) {
    if ((createError as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/preferences GET create]', createError);
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

  const currencyPreference = asString((body as any).currencyPreference).trim().toUpperCase() || 'AUTO';
  const language = asString((body as any).language).trim() || 'en';
  const timeZone = asString((body as any).timeZone).trim() || 'UTC';

  const patch = {
    currency_preference: currencyPreference,
    language,
    time_zone: timeZone,
    allow_analytics: asBool((body as any).allowAnalytics, true),
    personalized_recommendations: asBool((body as any).personalizedRecommendations, true),
  };

  const { data: prefs, error } = await supabaseAdmin
    .from('customer_preferences')
    .upsert({ user_id: auth.buyerId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .maybeSingle();

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json({ prefs: null });
    }
    console.error('[buyer/preferences PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prefs: prefs ?? null });
}


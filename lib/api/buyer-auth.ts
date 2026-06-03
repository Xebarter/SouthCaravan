import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function ensureBuyerProfile(user: {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}) {
  const email = user.email;
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    email.split('@')[0] ||
    'Buyer';

  await supabaseAdmin
    .from('customers')
    .upsert({ id: user.id, email, name }, { onConflict: 'id' });

  await supabaseAdmin
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'buyer' }, { onConflict: 'user_id,role' });
}

export async function getAuthedBuyer(): Promise<
  | { ok: true; buyerId: string; email: string; name: string; company?: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id || !data.user.email) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    await ensureBuyerProfile({
      id: data.user.id,
      email: data.user.email,
      user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Could not prepare buyer profile';
    return { ok: false, response: NextResponse.json({ error: message }, { status: 500 }) };
  }

  const email = data.user.email;
  const meta = data.user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (email ? email.split('@')[0] : 'Buyer');
  const company = typeof meta.company === 'string' ? meta.company : undefined;

  return { ok: true, buyerId: data.user.id, email, name, company };
}


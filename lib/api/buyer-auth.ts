import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

function hasBuyerAccess(user: any) {
  const meta = user?.app_metadata ?? {};
  if (meta.role === 'buyer') return true;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.includes('buyer');
}

export async function getAuthedBuyer(): Promise<
  | { ok: true; buyerId: string; email: string; name: string; company?: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasBuyerAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Buyer role required' }, { status: 403 }) };
  }

  const email = typeof data.user.email === 'string' ? data.user.email : '';
  const meta = data.user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (email ? email.split('@')[0] : 'Buyer');
  const company = typeof meta.company === 'string' ? meta.company : undefined;

  return { ok: true, buyerId: data.user.id, email, name, company };
}


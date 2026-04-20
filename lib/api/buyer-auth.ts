import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasBuyerAccessFromJwt(user: any): boolean {
  // Check app_metadata (set by admin/service role)
  const appMeta = user?.app_metadata ?? {};
  if (appMeta.role === 'buyer') return true;
  const appRoles = Array.isArray(appMeta.roles) ? appMeta.roles : [];
  if (appRoles.includes('buyer')) return true;

  // Check user_metadata.role (set during client-side signUp via auth-context.tsx)
  const userMeta = user?.user_metadata ?? {};
  if (userMeta.role === 'buyer') return true;

  return false;
}

async function hasBuyerAccessFromDb(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'buyer')
    .maybeSingle();
  return data !== null;
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

  // Check JWT claims first (fast), then fall back to the user_roles table.
  const hasAccess =
    hasBuyerAccessFromJwt(data.user) || (await hasBuyerAccessFromDb(data.user.id));

  if (!hasAccess) {
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


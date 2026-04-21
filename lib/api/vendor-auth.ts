import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasVendorAccessFromJwt(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  const appMeta = user?.app_metadata ?? {};
  if (appMeta.role === 'vendor') return true;
  const appRoles = Array.isArray(appMeta.roles) ? appMeta.roles : [];
  if (appRoles.includes('vendor')) return true;
  const userMeta = user?.user_metadata ?? {};
  if (userMeta.role === 'vendor') return true;
  return false;
}

async function hasVendorAccessFromDb(userId: string): Promise<boolean> {
  const { data: row } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'vendor')
    .maybeSingle();
  if (row) return true;

  const { data: ok, error } = await supabaseAdmin.rpc('user_has_portal_role', {
    p_user_id: userId,
    p_portal: 'vendor',
  });
  if (error) return false;
  return Boolean(ok);
}

export async function getAuthedVendor(): Promise<
  | { ok: true; vendorId: string; email: string; name: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const hasAccess = hasVendorAccessFromJwt(data.user) || (await hasVendorAccessFromDb(data.user.id));
  if (!hasAccess) {
    return { ok: false, response: NextResponse.json({ error: 'Vendor role required' }, { status: 403 }) };
  }

  const email = typeof data.user.email === 'string' ? data.user.email : '';
  const meta = data.user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.company === 'string' && meta.company) ||
    (email ? email.split('@')[0] : 'Vendor');

  return { ok: true, vendorId: data.user.id, email, name };
}

import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasAdminAccessFromJwt(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }): boolean {
  const appMeta = user?.app_metadata ?? {};
  if (appMeta.role === 'admin') return true;
  const appRoles = Array.isArray(appMeta.roles) ? appMeta.roles : [];
  if (appRoles.includes('admin')) return true;
  const userMeta = user?.user_metadata ?? {};
  if (userMeta.role === 'admin') return true;
  return false;
}

async function hasAdminAccessFromDb(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return data !== null;
}

export async function getAuthedAdmin(): Promise<
  | { ok: true; adminId: string; email: string; name: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const hasAccess = hasAdminAccessFromJwt(data.user) || (await hasAdminAccessFromDb(data.user.id));
  if (!hasAccess) {
    return { ok: false, response: NextResponse.json({ error: 'Admin role required' }, { status: 403 }) };
  }

  const email = typeof data.user.email === 'string' ? data.user.email : '';
  const meta = data.user.user_metadata ?? {};
  const name =
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (email ? email.split('@')[0] : 'Admin');

  return { ok: true, adminId: data.user.id, email, name };
}

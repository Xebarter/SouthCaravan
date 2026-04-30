import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';

export async function getAuthedVendor(): Promise<
  | { ok: true; vendorId: string; email: string; name: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
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

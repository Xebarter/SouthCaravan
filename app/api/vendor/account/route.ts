import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';

async function deleteStorageFolder(bucket: string, prefix: string) {
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) return;
    const files = (data ?? []).filter((x) => x && typeof x.name === 'string' && x.name);
    if (files.length === 0) return;
    const paths = files.map((f) => `${prefix}/${f.name}`.replace(/\/{2,}/g, '/'));
    await supabaseAdmin.storage.from(bucket).remove(paths);
  } catch {
    // best-effort cleanup
  }
}

export async function DELETE() {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const vendorId = auth.vendorId;

  try {
    // Cleanup storage (best-effort).
    await deleteStorageFolder('vendor-showcase', vendorId);
    await deleteStorageFolder('vendor-logos', vendorId);

    // Best-effort cleanup of vendor-owned data (browser writes are blocked by RLS).
    await supabaseAdmin.from('vendor_profile_showcase_images').delete().eq('user_id', vendorId);
    await supabaseAdmin.from('products').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('orders').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('quotes').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('conversations').delete().eq('vendor_id', vendorId);
    await supabaseAdmin.from('messages').delete().eq('recipient_id', vendorId);
    await supabaseAdmin.from('messages').delete().eq('sender_id', vendorId);
    await supabaseAdmin.from('vendor_notification_prefs').delete().eq('user_id', vendorId);
    await supabaseAdmin.from('vendor_profiles').delete().eq('user_id', vendorId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(vendorId);
    if (error) {
      console.error('[vendor/account DELETE] deleteUser', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[vendor/account DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}


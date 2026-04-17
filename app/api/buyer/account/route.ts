import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

export async function DELETE() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const buyerId = auth.buyerId;

  try {
    // Best-effort cleanup of buyer-owned data (tables are created with RLS blocked,
    // so we must use the service role admin client).
    await supabaseAdmin.from('orders').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('quotes').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('conversations').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('messages').delete().eq('recipient_id', buyerId);
    await supabaseAdmin.from('messages').delete().eq('sender_id', buyerId);
    await supabaseAdmin.from('wishlist_items').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('customer_addresses').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('support_tickets').delete().eq('buyer_id', buyerId);
    await supabaseAdmin.from('customer_notification_prefs').delete().eq('user_id', buyerId);
    await supabaseAdmin.from('customer_profiles').delete().eq('user_id', buyerId);
    await supabaseAdmin.from('customer_preferences').delete().eq('user_id', buyerId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(buyerId);
    if (error) {
      console.error('[buyer/account DELETE] deleteUser', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[buyer/account DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}


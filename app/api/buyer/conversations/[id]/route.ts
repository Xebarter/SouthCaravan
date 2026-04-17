import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: conv, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (error) {
    console.error('[buyer/conversations/[id] GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('[buyer/conversations/[id] GET messages]', messagesError);
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: conv, messages: messages ?? [] });
}


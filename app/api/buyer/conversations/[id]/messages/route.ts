import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function GET() {
  // This route expects `conversationId` query param.
  return NextResponse.json({ error: 'Use /api/buyer/conversations/{id}/messages' }, { status: 400 });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

  const { data: conv, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (convError) {
    console.error('[buyer/messages POST conv lookup]', convError);
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const content = asString((body as any).content).trim();
  if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

  const recipientId = conv.vendor_user_id;
  const { data: msg, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: auth.buyerId,
      recipient_id: recipientId,
      content,
      read: false,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[buyer/messages POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bump conversation updated_at
  await supabaseAdmin.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', id);

  return NextResponse.json({ message: msg });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Mark messages as read for this buyer in this conversation.
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });

  const { data: conv, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .maybeSingle();

  if (convError) {
    console.error('[buyer/messages PUT conv lookup]', convError);
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const read = Boolean((body as any).read ?? true);

  const { error } = await supabaseAdmin
    .from('messages')
    .update({ read })
    .eq('conversation_id', id)
    .eq('recipient_id', auth.buyerId);

  if (error) {
    console.error('[buyer/messages PUT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


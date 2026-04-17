import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const subject = asString((body as any).subject).trim();
  const message = asString((body as any).message).trim();
  const status = asString((body as any).status).trim();

  if (subject) patch.subject = subject;
  if (message) patch.message = message;
  if (status) patch.status = status;

  const { data: ticket, error } = await supabaseAdmin
    .from('support_tickets')
    .update(patch)
    .eq('id', id)
    .eq('buyer_id', auth.buyerId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[buyer/support-tickets/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ticket });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabaseAdmin.from('support_tickets').delete().eq('id', id).eq('buyer_id', auth.buyerId);
  if (error) {
    console.error('[buyer/support-tickets/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}


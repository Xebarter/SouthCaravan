import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/admin/messages/[id] — fetch full message and mark as read */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Not found' },   { status: 404 });

  // Auto-mark as read when opened
  if (data.status === 'new') {
    await supabaseAdmin
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', id);
    data.status = 'read';
  }

  return NextResponse.json({ message: data });
}

/** PATCH /api/admin/messages/[id] — update status / priority / admin_notes */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body: Record<string, unknown> = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if (typeof body.status      === 'string') patch.status      = body.status;
  if (typeof body.priority    === 'string') patch.priority    = body.priority;
  if (typeof body.admin_notes === 'string') patch.admin_notes = body.admin_notes.trim() || null;
  if (body.status === 'replied' && !patch.replied_at) patch.replied_at = new Date().toISOString();

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('contact_messages')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/messages/[id] PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}

/** DELETE /api/admin/messages/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from('contact_messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[admin/messages/[id] DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

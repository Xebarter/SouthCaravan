import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** GET /api/admin/messages — list contact messages */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const subject  = searchParams.get('subject');
  const priority = searchParams.get('priority');
  const search   = searchParams.get('search')?.trim();
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
  const offset   = (page - 1) * limit;

  let query = supabaseAdmin
    .from('contact_messages')
    .select('id, name, email, phone, company, subject, message, status, priority, admin_notes, replied_at, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status)   query = query.eq('status', status);
  if (subject)  query = query.eq('subject', subject);
  if (priority) query = query.eq('priority', priority);
  if (search)   query = query.textSearch('search_vector', search, { type: 'websearch' });

  const { data: messages, error, count } = await query;

  if (error) {
    console.error('[admin/messages GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Unread count for badge
  const { count: unread } = await supabaseAdmin
    .from('contact_messages')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');

  return NextResponse.json({ messages: messages ?? [], total: count ?? 0, unread: unread ?? 0, page, limit });
}

/** PATCH /api/admin/messages — bulk or single update (body: { ids, status?, priority?, admin_notes? }) */
export async function PATCH(req: NextRequest) {
  const body: Record<string, unknown> = await req.json().catch(() => ({}));

  // Single update uses body.id; bulk uses body.ids array
  const ids: string[] = body.ids
    ? (Array.isArray(body.ids) ? body.ids : [body.ids as string])
    : body.id ? [body.id as string] : [];

  if (!ids.length) return NextResponse.json({ error: 'id or ids required' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.status       === 'string') patch.status       = body.status;
  if (typeof body.priority     === 'string') patch.priority     = body.priority;
  if (typeof body.admin_notes  === 'string') patch.admin_notes  = body.admin_notes.trim() || null;
  if (body.status === 'replied' && !patch.replied_at) patch.replied_at = new Date().toISOString();

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('contact_messages')
    .update(patch)
    .in('id', ids);

  if (error) {
    console.error('[admin/messages PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: ids.length });
}

/** DELETE /api/admin/messages?id=xxx  or  ?ids=a,b,c */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id  = searchParams.get('id');
  const ids = searchParams.get('ids')?.split(',').filter(Boolean);
  const targets = ids?.length ? ids : id ? [id] : [];

  if (!targets.length) return NextResponse.json({ error: 'id or ids required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('contact_messages').delete().in('id', targets);
  if (error) {
    console.error('[admin/messages DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: targets.length });
}

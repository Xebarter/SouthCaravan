import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const postId = searchParams.get('post_id');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('blog_comments')
    .select('*, post:blog_posts(id, title, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') query = query.eq('status', status);
  if (postId) query = query.eq('post_id', postId);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comments: data ?? [], total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = (body.id as string | undefined)?.trim();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const validStatuses = ['pending', 'approved', 'rejected', 'spam'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('blog_comments').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

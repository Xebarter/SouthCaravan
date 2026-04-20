import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const postId = (body.post_id as string | undefined)?.trim();
  const sessionId = (body.session_id as string | undefined)?.trim();
  const reaction = (body.reaction as string | undefined) ?? 'like';

  if (!postId || !sessionId) {
    return NextResponse.json({ error: 'post_id and session_id are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('blog_toggle_reaction', {
    p_post_id: postId,
    p_session_id: sessionId,
    p_reaction: reaction,
  });

  if (error) {
    console.error('[blog/react POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

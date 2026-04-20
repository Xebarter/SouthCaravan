import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const postId = new URL(req.url).searchParams.get('post_id');
  if (!postId) return NextResponse.json({ error: 'post_id is required' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .select('id, author_name, author_avatar, content, like_count, created_at, parent_id')
    .eq('post_id', postId)
    .eq('status', 'approved')
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch replies
  const topLevelIds = (data ?? []).map((c) => c.id);
  let replies: typeof data = [];
  if (topLevelIds.length > 0) {
    const { data: replyData } = await supabaseAdmin
      .from('blog_comments')
      .select('id, author_name, author_avatar, content, like_count, created_at, parent_id')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .in('parent_id', topLevelIds)
      .order('created_at', { ascending: true });
    replies = replyData ?? [];
  }

  const threaded = (data ?? []).map((comment) => ({
    ...comment,
    replies: replies.filter((r) => r.parent_id === comment.id),
  }));

  return NextResponse.json({ comments: threaded });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const postId = (body.post_id as string | undefined)?.trim();
  const authorName = (body.author_name as string | undefined)?.trim();
  const authorEmail = (body.author_email as string | undefined)?.trim();
  const content = (body.content as string | undefined)?.trim();
  const parentId = (body.parent_id as string | undefined)?.trim() || null;

  if (!postId) return NextResponse.json({ error: 'post_id is required' }, { status: 422 });
  if (!authorName) return NextResponse.json({ error: 'author_name is required' }, { status: 422 });
  if (!content || content.length < 2) return NextResponse.json({ error: 'content too short' }, { status: 422 });
  if (content.length > 2000) return NextResponse.json({ error: 'content too long (max 2000 chars)' }, { status: 422 });

  // Verify post allows comments
  const { data: post } = await supabaseAdmin
    .from('blog_posts')
    .select('allow_comments, status')
    .eq('id', postId)
    .single();

  if (!post || post.status !== 'published') {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  if (!post.allow_comments) {
    return NextResponse.json({ error: 'Comments are disabled for this post' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('blog_comments')
    .insert({
      post_id: postId,
      parent_id: parentId,
      author_name: authorName,
      author_email: authorEmail || null,
      content,
      status: 'pending',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: req.headers.get('user-agent') ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data, message: 'Your comment is awaiting moderation.' }, { status: 201 });
}

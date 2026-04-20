import { supabaseAdmin } from '@/lib/supabase-admin';
import { PostEditor } from '@/components/blog/post-editor';
import { notFound } from 'next/navigation';

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug, color),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `)
    .eq('id', id)
    .single();

  if (error || !post) notFound();

  const normalized = {
    ...post,
    tags: (post.tags ?? []).map((t: { tag: unknown }) => t.tag),
  };

  return <PostEditor mode="edit" post={normalized} />;
}
